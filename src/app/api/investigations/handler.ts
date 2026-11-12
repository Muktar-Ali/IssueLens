import { NextResponse } from "next/server";
import { z } from "zod";
import { GitHubIssueFetchError } from "@/lib/github";
import {
  createInvestigation,
  InvalidGitHubIssueUrlError,
  type CreateInvestigationResult,
} from "@/lib/investigations";
import { RepositoryPolicyError } from "@/lib/repository-policy";

const requestSchema = z
  .object({
    issueUrl: z.string().trim().min(1),
  })
  .strict();

type CreateInvestigationFunction = (issueUrl: string) => Promise<CreateInvestigationResult>;

export async function handleCreateInvestigation(
  request: Request,
  create: CreateInvestigationFunction = createInvestigation,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "The request body must be valid JSON", 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_REQUEST",
      "The request body must contain only a non-empty issueUrl string",
      400,
    );
  }

  try {
    const investigation = await create(parsed.data.issueUrl);
    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidGitHubIssueUrlError) {
      return errorResponse("INVALID_ISSUE_URL", error.message, 422);
    }
    if (error instanceof RepositoryPolicyError) {
      return errorResponse(error.code, error.message, error.httpStatus);
    }
    if (error instanceof GitHubIssueFetchError) {
      return errorResponse("GITHUB_ISSUE_FETCH_FAILED", error.message, error.httpStatus);
    }

    console.error("Failed to create investigation", error);
    return errorResponse("INTERNAL_ERROR", "IssueLens could not create the investigation", 500);
  }
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
