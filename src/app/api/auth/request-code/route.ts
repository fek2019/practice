import { NextRequest } from "next/server";
import { requestPhoneCode } from "@/server/auth-service";
import { handleRouteError, jsonOk } from "@/server/http";
import { readJsonObject, requireString } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonOk(await requestPhoneCode(requireString(body, "phone", "телефон")));
  } catch (error) {
    return handleRouteError(error);
  }
}
