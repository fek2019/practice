import { NextRequest } from "next/server";
import { notFound } from "@/server/errors";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { parseMasterPatch, readJsonObject } from "@/server/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const master = await getRepository().getMasterById(id);
    if (!master) {
      throw notFound("Мастер не найден");
    }
    return jsonOk(master);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    requireSession(request, ["admin"]);
    const { id } = await context.params;
    const body = await readJsonObject(request);
    return jsonOk(await getRepository().updateMaster(id, parseMasterPatch(body)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    requireSession(request, ["admin"]);
    const { id } = await context.params;
    await getRepository().deleteMaster(id);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
