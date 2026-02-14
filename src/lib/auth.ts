import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        if (!user.password) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          role: user.role,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          if (existingUser.role !== "ADMIN" && existingUser.role !== "SUB_ADMIN") {
            return false;
          }
          if (!existingUser.googleId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                image: user.image,
                name: existingUser.name || user.name,
              },
            });
          }
          return true;
        }

        return false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
          token.picture = dbUser.image || user.image;
        }
      } else if (user) {
        (token as any).role = (user as any).role;
        (token as any).id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role;
        (session.user as any).id = (token as any).id;
        if (token.picture) {
          (session.user as any).image = token.picture;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
