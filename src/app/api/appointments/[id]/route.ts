import { NextRequest } from "next/server";
import { forbidden, notFound } from "@/server/errors";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { parseAppointmentStatus, readJsonObject } from "@/server/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = requireSession(request, ["master", "admin"]);
    const { id } = await context.params;
    const repository = getRepository();
    const appointment = await repository.getAppointmentById(id);

    if (!appointment) {
      throw notFound("Заявка не найдена");
    }

    if (session.role === "master" && session.linkedMasterId !== appointment.masterId) {
      throw forbidden();
    }

    const body = await readJsonObject(request);
    return jsonOk(await repository.updateAppointmentStatus(id, parseAppointmentStatus(body)));
  } catch (error) {
    return handleRouteError(error);
  }
}
