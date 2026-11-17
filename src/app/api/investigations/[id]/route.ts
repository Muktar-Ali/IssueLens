import { handleGetInvestigation } from "./handler";
import {
  getAuthorizedSession,
  unauthenticatedApiResponse,
} from "@/lib/auth-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAuthorizedSession())) return unauthenticatedApiResponse();
  const { id } = await params;
  return handleGetInvestigation(id);
}
