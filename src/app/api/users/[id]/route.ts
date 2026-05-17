import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { optionalString, parseRole, readJsonObject } from "@/server/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    requireSession(request, ["admin"]);
    const body = await readJsonObject(request);
    const { id } = await context.params;
    return jsonOk(
      await getRepository().updateUser(id, {
        role: body.role !== undefined ? parseRole(body) : undefined,
        linkedMasterId: optionalString(body, "linkedMasterId"),
        isBanned: typeof body.isBanned === "boolean" ? body.isBanned : undefined
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    requireSession(request, ["admin"]);
    const { id } = await context.params;
    await getRepository().deleteUser(id);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
