import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";

const readOptionalJson = async (request: NextRequest) => {
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }
  const value = JSON.parse(text) as unknown;
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
};

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    return jsonOk(await getRepository().listUserNotifications(session.userId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await readOptionalJson(request);
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
      : undefined;

    await getRepository().markNotificationsRead(session.userId, ids);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
