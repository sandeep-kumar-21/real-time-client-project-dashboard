export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    statusCode: number,
    message: string,
    code: string = "INTERNAL_ERROR",
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, codeOrDetails?: any, code?: string) {
    if (typeof codeOrDetails === "string" && !code) {
      return new ApiError(400, message, codeOrDetails);
    }
    return new ApiError(400, message, code || "BAD_REQUEST", codeOrDetails);
  }

  static unauthorized(message: string = "Unauthorized access", code: string = "UNAUTHORIZED") {
    return new ApiError(401, message, code);
  }

  static forbidden(message: string = "Forbidden access", code: string = "FORBIDDEN") {
    return new ApiError(403, message, code);
  }

  static notFound(message: string = "Resource not found", code: string = "NOT_FOUND") {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code: string = "CONFLICT") {
    return new ApiError(409, message, code);
  }

  static internal(message: string = "Internal server error") {
    return new ApiError(500, message, "INTERNAL_SERVER_ERROR", undefined, false);
  }
}
