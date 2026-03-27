import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { USERS } from "./mock-data";
import type { UserRole } from "./types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = USERS.find(
          (u) => u.email === email && u.password === password
        );
        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role as UserRole;
        token.teamId = (user as any).teamId as string | null;
        token.avatar = (user as any).avatar as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role as UserRole;
        (session.user as any).teamId = token.teamId as string | null;
        (session.user as any).avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
