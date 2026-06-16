import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // 1. Find the user and fetch their organizations/memberships
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: {
                organization: true
              }
            }
          }
        });

        // 2. Verify user exists and has a password
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        // 3. Verify the password asynchronously using 'await'
        const isPasswordValid = await verifyPassword(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // 4. Return the user object (mapped to next-auth Session)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          memberships: user.memberships.map((membership) => ({
            id: membership.id,
            role: membership.role,
            organization: {
              id: membership.organization.id,
              name: membership.organization.name,
              slug: membership.organization.slug
            }
          }))
        };
      }
    })
  ],
  callbacks: {
    // Save user details to the token when they log in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.memberships = user.memberships || [];
      }
      return token;
    },
    // Expose token details to the session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.memberships = token.memberships;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
};
