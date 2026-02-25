// ──────────────────────────────────────────────────────────────────────────────
// CYLive — NextAuth.js Configuration
// Email/Password + Google OAuth + Apple OAuth
// Prisma adapter with extended session (device info, role, tier)
// ──────────────────────────────────────────────────────────────────────────────

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { loginSchema } from "@/schemas";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      role: string;
      tier: string;
      verified: boolean;
    };
  }

  interface User {
    username: string;
    displayName: string;
    role: string;
    tier: string;
    verified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    displayName: string;
    role: string;
    tier: string;
    verified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login",
  },
  providers: [
    // ── Email/Password ──────────────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error(parsed.error.errors[0].message);
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Check soft delete
        if (user.deletedAt) {
          throw new Error("Account has been deactivated");
        }

        // Verify password
        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          tier: user.tier,
          verified: user.verified,
        };
      },
    }),

    // ── Google OAuth ────────────────────────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // ── Apple OAuth ─────────────────────────────────────────────────────
    ...(process.env.APPLE_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_SECRET!,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.displayName = user.displayName;
        token.role = user.role;
        token.tier = user.tier;
        token.verified = user.verified;
      }

      // Update session on trigger
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.displayName = token.displayName;
        session.user.role = token.role;
        session.user.tier = token.tier;
        session.user.verified = token.verified;
      }
      return session;
    },

    async signIn({ user, account }) {
      // For OAuth providers, create username from email if new user
      if (account?.provider !== "credentials" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          // Auto-generate username from email
          const baseUsername = user.email
            .split("@")[0]
            .replace(/[^a-zA-Z0-9_]/g, "_");
          let username = baseUsername;
          let counter = 1;

          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }

          await prisma.user.create({
            data: {
              email: user.email,
              username,
              displayName: user.name || username,
              avatarUrl: user.image,
              role: "VIEWER",
              tier: "FREE",
            },
          });
        }
      }

      return true;
    },
  },
};

export default authOptions;
