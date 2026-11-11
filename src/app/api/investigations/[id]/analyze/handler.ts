import { NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeInvestigation,
  InvestigationAnalysisFailedError,
  InvestigationNotFoundError,
  InvestigationNotQueuedError,
  type AnalyzeInvestigationResult,
} from "@/lib/investigation-analysis";

type AnalyzeFunction = (id: string) => Promise<AnalyzeInvestigationResult>;

export async function handleAnalyzeInvestigation(
  id: string,
  analyze: AnalyzeFunction = analyzeInvestigation,
) {
  if (!z.uuid().safeParse(id).success) {
    return errorResponse("INVALID_INVESTIGATION_ID", "The investigation ID must be a UUID", 400);
  }

  try {
    const investigation = await analyze(id);
    return NextResponse.json({ investigation });
  } catch (error) {
    if (error instanceof InvestigationNotFoundError) {
      return errorResponse("INVESTIGATION_NOT_FOUND", error.message, 404);
    }
    if (error instanceof InvestigationNotQueuedError) {
      return errorResponse("INVESTIGATION_NOT_QUEUED", error.message, 409);
    }
    if (error instanceof InvestigationAnalysisFailedError) {
      return errorResponse("ANALYSIS_FAILED", error.message, 502);
    }

    console.error("Failed to analyze investigation", error);
    return errorResponse("INTERNAL_ERROR", "IssueLens could not analyze the investigation", 500);
  }
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
