import { handleRentalRequest } from "@/server/http/handler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleRentalRequest(request, (await params).path);
}
export { handle as GET, handle as POST, handle as PATCH };
