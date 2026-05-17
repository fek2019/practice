import { NextRequest } from "next/server";
import { notFound } from "@/server/errors";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { optionalString, readJsonObject } from "@/server/validation";

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const user = await getRepository().getUserById(session.userId);
    if (!user) {
      throw notFound("Пользователь не найден");
    }
    return jsonOk(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await readJsonObject(request);
    return jsonOk(
      await getRepository().updateUser(session.userId, {
        name: optionalString(body, "name"),
        phone: optionalString(body, "phone"),
        email: optionalString(body, "email")
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
