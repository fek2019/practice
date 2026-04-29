import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";

export async function GET(request: NextRequest) {
  try {
    requireSession(request, ["admin"]);
    return jsonOk(await getRepository().getAdminStats());
  } catch (error) {
    return handleRouteError(error);
  }
}
