import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Validation Exception
 * Thrown when input validation fails
 */
export class ValidationException extends BaseException {
  statusCode = HTTP_STATUS.BAD_REQUEST;
  status = 'fail';

  constructor(message: string = 'Validation failed', code?: string, details?: any) {
    super(message, code, details);
  }
}
