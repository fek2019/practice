import { NextRequest } from "next/server";
import { badRequest } from "@/server/errors";
import { handleRouteError, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");
    const masterId = request.nextUrl.searchParams.get("masterId");

    if (!date) {
      throw badRequest("Дата обязательна");
    }

    return jsonOk(await getRepository().getAvailableSlots(date, masterId));
  } catch (error) {
    return handleRouteError(error);
  }
}
