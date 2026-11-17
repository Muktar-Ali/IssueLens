import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAuthorizedSession } from "@/lib/user-access-policy";

export async function getAuthorizedSession() {
  const session = await auth();
  return isAuthorizedSession(session) ? session : null;
}

export function unauthenticatedApiResponse() {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHENTICATED",
        message: "Sign in with an approved GitHub account to use IssueLens",
      },
    },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
