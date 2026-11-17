import { handleCreateInvestigation, handleListInvestigations } from "./handler";
import {
  getAuthorizedSession,
  unauthenticatedApiResponse,
} from "@/lib/auth-access";

export async function GET() {
  if (!(await getAuthorizedSession())) return unauthenticatedApiResponse();
  return handleListInvestigations();
}

export async function POST(request: Request) {
  if (!(await getAuthorizedSession())) return unauthenticatedApiResponse();
  return handleCreateInvestigation(request);
}
