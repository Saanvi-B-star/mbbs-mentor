import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Bad Request Exception
 * Thrown when the request is malformed or invalid
 */
export class BadRequestException extends BaseException {
  statusCode = HTTP_STATUS.BAD_REQUEST;
  status = 'fail';

  constructor(message: string = 'Bad request', code?: string, details?: any) {
    super(message, code, details);
  }
}
