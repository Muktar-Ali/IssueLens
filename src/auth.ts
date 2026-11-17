import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isGitHubUserAllowed } from "@/lib/user-access-policy";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: "read:user" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    signIn({ profile }) {
      const githubId = getProfileValue(profile, "id");
      return isGitHubUserAllowed(githubId);
    },
    jwt({ token, profile }) {
      if (profile) {
        token.githubId = getProfileValue(profile, "id") ?? undefined;
        token.githubLogin = getProfileValue(profile, "login") ?? undefined;
        token.email = undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.user.githubId = typeof token.githubId === "string" ? token.githubId : "";
      session.user.githubLogin =
        typeof token.githubLogin === "string" ? token.githubLogin : "";
      Reflect.deleteProperty(session.user, "email");
      return session;
    },
  },
});

function getProfileValue(profile: unknown, key: "id" | "login") {
  if (typeof profile !== "object" || profile === null || !(key in profile)) return null;
  const value = profile[key as keyof typeof profile];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}
