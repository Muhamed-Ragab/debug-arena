export class ActionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ActionError";
  }
}

export class NotFoundError extends ActionError {
  readonly status = 404;
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ActionError {
  readonly status = 409;
  readonly code = "CONFLICT";
  readonly statusCode = 409;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ConflictError";
  }
}
