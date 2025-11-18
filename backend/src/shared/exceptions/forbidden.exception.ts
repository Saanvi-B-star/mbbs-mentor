import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Forbidden Exception
 * Thrown when user doesn't have permission to access a resource
 */
export class ForbiddenException extends BaseException {
  statusCode = HTTP_STATUS.FORBIDDEN;
  status = 'fail';

  constructor(message: string = 'Access forbidden', code?: string) {
    super(message, code);
  }
}
