import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCompletedInvestigation,
  type SavedInvestigationDetail,
} from "@/lib/investigation-history";

type GetInvestigationFunction = (id: string) => Promise<SavedInvestigationDetail | null>;

export async function handleGetInvestigation(
  id: string,
  getInvestigation: GetInvestigationFunction = getCompletedInvestigation,
) {
  if (!z.uuid().safeParse(id).success) {
    return errorResponse("INVALID_INVESTIGATION_ID", "The investigation ID must be a UUID", 400);
  }

  try {
    const investigation = await getInvestigation(id);
    if (!investigation) {
      return errorResponse(
        "INVESTIGATION_NOT_FOUND",
        "The completed investigation was not found",
        404,
      );
    }

    return NextResponse.json({ investigation });
  } catch (error) {
    console.error("Failed to load investigation", error);
    return errorResponse("INTERNAL_ERROR", "IssueLens could not load the investigation", 500);
  }
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
