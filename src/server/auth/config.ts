import "server-only";
import type { NextAuthConfig } from "next-auth";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ApiScope } from "@/lib/access";
import { scopedPrismaAdapter } from "./scoped-adapter";
import { authBoundary, authRedirect, principalFromUser } from "./policy";

export function createAuthConfig(
  db: PrismaClient,
  scope: ApiScope,
  providers: NextAuthConfig["providers"],
  secret: string,
): NextAuthConfig {
  return {
    ...authBoundary(scope, process.env.NODE_ENV === "production"),
    adapter: scopedPrismaAdapter(db, scope),
    providers,
    // handler pins callbacks to APP_ORIGIN before trusting request URL.
    trustHost: true,
    secret,
    session: { strategy: "database" },
    callbacks: {
      async signIn({ user, account }) {
        // Existing account identity comes from DB; email match alone never grants admin.
        const identity = account
          ? await db.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              include: { user: { include: { staff: true } } },
            })
          : null;
        if (scope === "admin")
          return Boolean(principalFromUser(identity?.user ?? null, scope));
        if (identity) return Boolean(principalFromUser(identity.user, scope));
        if (!user.email) return false;
        const existing = await db.user.findUnique({
          where: { email: user.email },
          include: { staff: true },
        });
        return existing ? Boolean(principalFromUser(existing, scope)) : true;
      },
      async session({ session, user }) {
        const identity = await db.user.findUnique({
          where: { id: user.id },
          include: { staff: true },
        });
        const principal = principalFromUser(identity, scope);
        if (!principal) throw new Error("Session access has been revoked.");
        return {
          ...session,
          user: { ...session.user, id: principal.userId },
          scope,
          permissions: [...principal.permissions],
        };
      },
      redirect: ({ url, baseUrl }) => authRedirect(url, baseUrl, scope),
    },
    // Do not emit provider tokens, profiles or database details to application logs.
    logger: {
      error() {
        console.error("Authentication request failed.");
      },
    },
  };
}
