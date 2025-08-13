import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "OWNER" | "DINER" | null;
  }
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: "OWNER" | "DINER" | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "OWNER" | "DINER" | null;
  }
}
