import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ data }, init);

export const jsonCreated = <T>(data: T) => jsonOk(data, { status: 201 });

export const handleRouteError = (error: unknown) => {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code ?? "API_ERROR"
        }
      },
      { status: error.status }
    );
  }

  console.error("[API]", error);
  return NextResponse.json(
    {
      error: {
        message: "Внутренняя ошибка сервера",
        code: "INTERNAL_SERVER_ERROR"
      }
    },
    { status: 500 }
  );
};
