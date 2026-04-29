export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string, code?: string) => new ApiError(400, message, code);
export const unauthorized = (message = "Требуется авторизация") => new ApiError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "Недостаточно прав") => new ApiError(403, message, "FORBIDDEN");
export const notFound = (message = "Запись не найдена") => new ApiError(404, message, "NOT_FOUND");
export const conflict = (message: string) => new ApiError(409, message, "CONFLICT");
