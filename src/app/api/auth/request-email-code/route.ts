import { NextRequest } from "next/server";
import { requestEmailCode } from "@/server/auth-service";
import { handleRouteError, jsonOk } from "@/server/http";
import { readJsonObject, requireString } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonOk(await requestEmailCode(requireString(body, "email", "email")));
  } catch (error) {
    return handleRouteError(error);
  }
}
