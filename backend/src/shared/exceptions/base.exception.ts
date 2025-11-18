/**
 * Base Exception Class
 * All custom exceptions should extend this class
 */
export abstract class BaseException extends Error {
  abstract statusCode: number;
  abstract status: string;
  public code?: string;
  public details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      status: this.status,
      details: this.details,
    };
  }
}
