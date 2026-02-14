import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.REPLIT_DEPLOYMENT_URL)
    return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN)
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://0.0.0.0:5000";
}

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
        try {
          const email = user.email;
          if (!email) return false;

          let existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            const MAIN_ADMIN_EMAIL = "manojk38904@gmail.com";
            if (email.toLowerCase() === MAIN_ADMIN_EMAIL) {
              existingUser = await prisma.user.create({
                data: {
                  email,
                  name: user.name || "Admin",
                  role: "ADMIN",
                  password: "",
                  googleId: account.providerAccountId,
                  image: user.image,
                },
              });
              return true;
            }
            return false;
          }

          if (existingUser.role !== "ADMIN" && existingUser.role !== "SUB_ADMIN") {
            return false;
          }

          if (!existingUser.googleId || existingUser.googleId !== account.providerAccountId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                image: user.image || existingUser.image,
                name: existingUser.name || user.name,
              },
            });
          }
          return true;
        } catch (error) {
          console.error("Google signIn error:", error);
          return false;
        }
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
