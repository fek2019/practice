import { NextRequest } from "next/server";
import { handleRouteError, jsonCreated, jsonOk } from "@/server/http";
import { getRepository } from "@/server/repositories";
import { requireSession } from "@/server/security/session";
import { parseMasterInput, readJsonObject } from "@/server/validation";

export async function GET(request: NextRequest) {
  try {
    const onlyAvailable = request.nextUrl.searchParams.get("available") === "true";
    return jsonOk(await getRepository().listMasters(onlyAvailable));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSession(request, ["admin"]);
    const body = await readJsonObject(request);
    return jsonCreated(await getRepository().createMaster(parseMasterInput(body)));
  } catch (error) {
    return handleRouteError(error);
  }
}
