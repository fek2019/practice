import { NextRequest } from "next/server";
import { badRequest, forbidden } from "@/server/errors";
import { handleRouteError, jsonCreated, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { parseCreateAppointment, readJsonObject } from "@/server/validation";

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const scope = request.nextUrl.searchParams.get("scope") ?? "client";
    const repository = getRepository();

    if (scope === "all") {
      if (session.role !== "admin") {
        throw forbidden();
      }
      return jsonOk(await repository.listAllAppointments());
    }

    if (scope === "master") {
      const masterId = request.nextUrl.searchParams.get("masterId") ?? session.linkedMasterId;
      if (!masterId) {
        throw badRequest("masterId обязателен");
      }
      if (session.role !== "admin" && (session.role !== "master" || session.linkedMasterId !== masterId)) {
        throw forbidden();
      }
      return jsonOk(await repository.listMasterAppointments(masterId));
    }

    return jsonOk(
      await repository.listClientAppointments({
        phone: session.phone,
        email: session.email
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    return jsonCreated(await getRepository().createAppointment(parseCreateAppointment(body)));
  } catch (error) {
    return handleRouteError(error);
  }
}
