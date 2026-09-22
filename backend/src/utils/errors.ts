export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict occurred") {
    super(409, "CONFLICT", message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request payload") {
    super(400, "BAD_REQUEST", message);
  }
}

export class NotImplementedError extends AppError {
  constructor(code = "NOT_IMPLEMENTED", message = "This feature is not implemented yet.") {
    super(501, code, message);
  }
}
