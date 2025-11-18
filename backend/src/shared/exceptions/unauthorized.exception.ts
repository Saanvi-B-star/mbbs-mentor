import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Unauthorized Exception
 * Thrown when authentication fails or token is invalid/expired
 */
export class UnauthorizedException extends BaseException {
  statusCode = HTTP_STATUS.UNAUTHORIZED;
  status = 'fail';

  constructor(message: string = 'Unauthorized access', code?: string) {
    super(message, code);
  }
}
