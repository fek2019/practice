import { NextRequest } from "next/server";
import { unauthorized } from "@/server/errors";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRequestSession } from "@/server/security/session";

export async function GET(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      throw unauthorized();
    }
    return jsonOk(session);
  } catch (error) {
    return handleRouteError(error);
  }
}
