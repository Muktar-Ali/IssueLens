import { handleCreateInvestigation } from "./handler";

export function POST(request: Request) {
  return handleCreateInvestigation(request);
}
