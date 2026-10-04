import type { NextRequest } from "next/server";
import { handleAuth } from "@/server/auth/handler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = (request: NextRequest) => handleAuth("customer", request);
export const POST = (request: NextRequest) => handleAuth("customer", request);
