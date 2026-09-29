import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "student" | "faculty" | "admin" | null;
      department?: string | null;
      institute?: string | null;
      isProfileComplete: boolean;
      createdAt?: string | null;
    };
  }
}
