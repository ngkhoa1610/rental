import { uploadMedia } from "@/server/http/media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return uploadMedia(request, undefined, "product");
}
