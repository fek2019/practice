import { NextRequest } from "next/server";
import { loginWithPhone } from "@/server/auth-service";
import { handleRouteError, jsonOk } from "@/server/http";
import { readJsonObject, requireString } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonOk(
      await loginWithPhone(
        requireString(body, "phone", "телефон"),
        requireString(body, "code", "код")
      )
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
