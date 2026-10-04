import "server-only";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ApiScope } from "@/lib/access";
import { principalFromUser } from "./policy";

/** Auth.js persistence, with a separate namespace for every session operation. */
export function scopedPrismaAdapter(
  db: PrismaClient,
  scope: ApiScope,
): Adapter {
  const adapter = PrismaAdapter(db);
  return {
    ...adapter,
    // Provider profile fields never set activation, phone, staff or permissions.
    async createUser(data) {
      return db.user.create({
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
        },
      }) as Promise<AdapterUser>;
    },
    async updateUser(data) {
      return db.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          image: data.image,
        },
      }) as Promise<AdapterUser>;
    },
    async createSession(data) {
      const user = await db.user.findUnique({
        where: { id: data.userId },
        include: { staff: true },
      });
      if (!principalFromUser(user, scope))
        throw new Error("Account cannot access this workspace.");
      return db.session.create({
        data: {
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
          scope,
        },
      });
    },
    async getSessionAndUser(sessionToken) {
      const record = await db.session.findFirst({
        where: { sessionToken, scope, expires: { gt: new Date() } },
        include: { user: { include: { staff: true } } },
      });
      if (!record || !principalFromUser(record.user, scope)) return null;
      const { user, ...session } = record;
      // Auth.js requires email, but OAuth providers without email are not enabled here.
      if (!user.email) return null;
      return {
        session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
        },
      } satisfies { session: AdapterSession; user: AdapterUser };
    },
    async updateSession(data) {
      const record = await db.session.findFirst({
        where: {
          sessionToken: data.sessionToken,
          scope,
          expires: { gt: new Date() },
        },
        include: { user: { include: { staff: true } } },
      });
      if (!record || !principalFromUser(record.user, scope)) return null;
      // A refresh may change expiry only, never owner, token or scope.
      const result = await db.session.updateMany({
        where: { id: record.id, scope },
        data: data.expires ? { expires: data.expires } : {},
      });
      if (!result.count) return null;
      return {
        sessionToken: record.sessionToken,
        userId: record.userId,
        expires: data.expires ?? record.expires,
      };
    },
    async deleteSession(sessionToken) {
      await db.session.deleteMany({ where: { sessionToken, scope } });
    },
    async createVerificationToken(data) {
      return db.verificationToken
        .create({
          data: { ...data, identifier: `${scope}:${data.identifier}` },
        })
        .then((record) => ({ ...record, identifier: data.identifier }));
    },
    async useVerificationToken({ identifier, token }) {
      // deleteMany is atomic and makes replay/cross-scope attempts harmless.
      const scopedIdentifier = `${scope}:${identifier}`;
      return db.$transaction(async (tx) => {
        const record = await tx.verificationToken.findUnique({
          where: { identifier_token: { identifier: scopedIdentifier, token } },
        });
        if (!record) return null;
        const removed = await tx.verificationToken.deleteMany({
          where: { identifier: scopedIdentifier, token },
        });
        return removed.count ? { ...record, identifier } : null;
      });
    },
  };
}
