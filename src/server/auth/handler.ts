import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { ApiScope } from "@/lib/access";
import { ApiError } from "@/lib/api/contracts";
import { getDatabase } from "@/server/db/client";
import { errorResponse } from "@/server/http/handler";
import {
  hashSessionToken,
  rateLimit,
  readJson,
  serverOrigin,
  tokenCookie,
  verifyOrigin,
} from "@/server/http/security";
import {
  credentialEmail,
  hashPassword,
  loginPassword,
  newPassword,
  verifyPassword,
} from "./password";
import { authBoundary, principalFromUser } from "./policy";

const loginInput = z.strictObject({
  email: credentialEmail,
  password: loginPassword,
});
const registerInput = z.strictObject({
  name: z.string().trim().min(1).max(100),
  email: credentialEmail,
  password: newPassword,
});

export async function handleAuth(
  scope: ApiScope,
  request: Request,
  database?: PrismaClient,
): Promise<Response> {
  try {
    const pathname = new URL(request.url).pathname;
    const secure = process.env.NODE_ENV === "production";
    const basePath = authBoundary(scope, secure).basePath;
    const registering =
      scope === "customer" && pathname === `${basePath}/register`;
    if (!registering && pathname !== `${basePath}/login`)
      throw new ApiError("NOT_FOUND", "Endpoint not found.");
    if (request.method !== "POST")
      return new Response(null, {
        status: 405,
        headers: { Allow: "POST", "Cache-Control": "no-store" },
      });
    if (
      !process.env.AUTH_SECRET ||
      (!database && !process.env.DATABASE_URL) ||
      (secure && !serverOrigin().startsWith("https://"))
    ) {
      throw new ApiError(
        "POLICY_REQUIRED",
        "Authentication is not configured.",
      );
    }
    verifyOrigin(request);

    const db = database ?? getDatabase();
    const now = new Date();
    const context = {
      principal: null,
      scope,
      now,
      requestId: crypto.randomUUID(),
    };
    await rateLimit(db, request, context, "auth.credentials");
    const rawInput = await readJson(request);
    const parsed = registering
      ? registerInput.safeParse(rawInput)
      : loginInput.safeParse(rawInput);
    if (!parsed.success)
      throw new ApiError(
        "VALIDATION",
        "Check the account fields and try again.",
      );
    const { email, password } = parsed.data;
    await rateLimit(db, request, context, "auth.account", email);

    const maxAge = scope === "admin" ? 8 * 3600 : 7 * 24 * 3600;
    const token = randomBytes(32).toString("base64url");
    const session = {
      sessionToken: hashSessionToken(token),
      expires: new Date(now.getTime() + maxAge * 1000),
      scope,
    };
    if ("name" in parsed.data && typeof parsed.data.name === "string") {
      const passwordHash = await hashPassword(password);
      try {
        await db.user.create({
          data: {
            email,
            name: parsed.data.name,
            passwordHash,
            sessions: { create: session },
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ApiError("CONFLICT", "This email is already registered.");
        }
        throw error;
      }
    } else {
      const user = await db.user.findUnique({
        where: { email },
        include: { staff: true },
      });
      const valid = await verifyPassword(password, user?.passwordHash);
      if (!valid || !user || !principalFromUser(user, scope))
        throw new ApiError("UNAUTHENTICATED", "Invalid email or password.");
      if (scope === "admin" && user.staff) {
        const staffVersion = user.staff.version;
        await db.$transaction(async (tx) => {
          // Write-lock the same row used by revocation before issuing a session.
          const staff = await tx.staffProfile.updateMany({
            where: { userId: user.id, active: true, version: staffVersion },
            data: { active: true },
          });
          if (!staff.count)
            throw new ApiError("UNAUTHENTICATED", "Invalid email or password.");
          await tx.session.create({ data: { ...session, userId: user.id } });
        });
      } else {
        await db.session.create({ data: { ...session, userId: user.id } });
      }
    }
    return Response.json(
      { ok: true },
      {
        status: registering ? 201 : 200,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Set-Cookie": `${tokenCookie(scope)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`,
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
