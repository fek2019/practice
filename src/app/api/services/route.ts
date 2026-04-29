import { NextRequest } from "next/server";
import { getRepository } from "@/server/repositories";
import { handleRouteError, jsonCreated, jsonOk } from "@/server/http";
import { requireSession } from "@/server/security/session";
import { parseServiceFilters, parseServiceInput, readJsonObject } from "@/server/validation";

export async function GET(request: NextRequest) {
  try {
    const filters = parseServiceFilters(request.nextUrl.searchParams);
    return jsonOk(await getRepository().listServices(filters));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSession(request, ["admin"]);
    const body = await readJsonObject(request);
    const input = parseServiceInput(body);
    return jsonCreated(await getRepository().createService(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
