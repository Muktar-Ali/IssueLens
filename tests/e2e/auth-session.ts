import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

export const TEST_AUTH_SECRET = "issuelens-e2e-secret-that-is-long-enough-for-jwt-tests";
export const TEST_GITHUB_USER_ID = "123456789";
const SESSION_COOKIE_NAME = "authjs.session-token";

export async function addAuthorizedSession(context: BrowserContext) {
  const value = await encode({
    secret: TEST_AUTH_SECRET,
    salt: SESSION_COOKIE_NAME,
    maxAge: 60 * 60,
    token: {
      sub: TEST_GITHUB_USER_ID,
      name: "IssueLens Tester",
      picture: null,
      githubId: TEST_GITHUB_USER_ID,
      githubLogin: "issuelens-tester",
    },
  });

  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value,
      url: "http://localhost:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1_000) + 60 * 60,
    },
  ]);
}
