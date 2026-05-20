import { NextRequest } from "next/server";
import { registerWithEmail } from "@/server/auth-service";
import { handleRouteError, jsonOk } from "@/server/http";
import { readJsonObject, requireString } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonOk(
      await registerWithEmail(
        requireString(body, "email", "email"),
        requireString(body, "password", "пароль"),
        requireString(body, "code", "код")
      )
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
