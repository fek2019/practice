import { NextRequest } from "next/server";
import { handleRouteError, jsonCreated } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { readJsonObject, requireString } from "@/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const quickRequest = await getRepository().createQuickRequest({
      clientName: requireString(body, "clientName", "имя"),
      clientPhone: requireString(body, "clientPhone", "телефон"),
      serviceName: requireString(body, "serviceName", "услуга")
    });
    return jsonCreated(quickRequest);
  } catch (error) {
    return handleRouteError(error);
  }
}
