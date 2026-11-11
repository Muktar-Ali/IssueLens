import { handleAnalyzeInvestigation } from "./handler";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleAnalyzeInvestigation(id);
}
