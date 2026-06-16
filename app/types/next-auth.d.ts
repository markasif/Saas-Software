import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      memberships: {
        id: string;
        role: string;
        organization: {
          id: string;
          name: string;
          slug: string;
        };
      }[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    memberships?: {
      id: string;
      role: string;
      organization: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    memberships: {
      id: string;
      role: string;
      organization: {
        id: string;
        name: string;
        slug: string;
      };
    }[];
  }
}
