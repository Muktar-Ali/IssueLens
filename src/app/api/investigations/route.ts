import { handleCreateInvestigation, handleListInvestigations } from "./handler";

export function GET() {
  return handleListInvestigations();
}

export function POST(request: Request) {
  return handleCreateInvestigation(request);
}
