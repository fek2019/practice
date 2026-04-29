import { NextRequest } from "next/server";
import { switchDemoRole } from "@/server/auth-service";
import { handleRouteError, jsonOk } from "@/server/http";
import { parseRole, readJsonObject } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonOk(await switchDemoRole(parseRole(body)));
  } catch (error) {
    return handleRouteError(error);
  }
}
