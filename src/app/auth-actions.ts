"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/" });
}

export async function signOutOfIssueLens() {
  await signOut({ redirectTo: "/" });
}
