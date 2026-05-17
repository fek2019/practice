import { NextRequest } from "next/server";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { handleRouteError, jsonCreated, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { readJsonObject, requireString } from "@/server/validation";

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request, ["client"]);
    return jsonOk(await getRepository().listReviewsByClient(session.userId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireSession(request, ["client"]);
    const body = await readJsonObject(request);
    const appointmentId = requireString(body, "appointmentId", "заявка");
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw badRequest("Оценка должна быть от 1 до 5");
    }
    const text = requireString(body, "text", "отзыв");
    const appointment = await getRepository().getAppointmentById(appointmentId);
    if (!appointment) {
      throw notFound("Заявка не найдена");
    }
    if (appointment.clientEmail !== session.email && appointment.clientPhone !== session.phone) {
      throw forbidden();
    }
    if (!["ready", "done"].includes(appointment.status)) {
      throw badRequest("Отзыв можно оставить только после готовности заказа");
    }
    return jsonCreated(
      await getRepository().createReview({
        appointmentId,
        masterId: appointment.masterId,
        clientUserId: session.userId,
        rating,
        text
      })
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
