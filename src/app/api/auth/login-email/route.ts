import { NextRequest } from "next/server";
import { loginWithEmail } from "@/server/auth-service";
import { handleRouteError, jsonOk } from "@/server/http";
import { readJsonObject, requireString } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonOk(
      await loginWithEmail(
        requireString(body, "email", "email"),
        requireString(body, "password", "пароль")
      )
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
