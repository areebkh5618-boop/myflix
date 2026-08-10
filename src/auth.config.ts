import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.name = user.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name as string;
      }

      return session;
    },
  },

  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export default authConfig;