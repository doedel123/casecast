import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const db = getDb();
        const [user] = await db
          .select()
          .from(schema.users)
          .where(sql`lower(${schema.users.email}) = ${email}`)
          .limit(1);
        if (!user) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: "user" | "admin" }).role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
      }
      return session;
    },
  },
});

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
