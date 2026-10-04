import { readMedia } from "@/server/http/media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return readMedia(request, (await params).id);
}
