import { NextRequest } from "next/server";
import { notFound } from "@/server/errors";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { parseServicePatch, readJsonObject } from "@/server/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const service = await getRepository().getServiceById(id);
    if (!service) {
      throw notFound("Услуга не найдена");
    }
    return jsonOk(service);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    requireSession(request, ["admin"]);
    const { id } = await context.params;
    const body = await readJsonObject(request);
    return jsonOk(await getRepository().updateService(id, parseServicePatch(body)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    requireSession(request, ["admin"]);
    const { id } = await context.params;
    await getRepository().deleteService(id);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
