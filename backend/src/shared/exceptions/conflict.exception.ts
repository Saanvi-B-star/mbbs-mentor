import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Conflict Exception
 * Thrown when there's a conflict with existing data (e.g., duplicate email)
 */
export class ConflictException extends BaseException {
  statusCode = HTTP_STATUS.CONFLICT;
  status = 'fail';

  constructor(message: string = 'Resource conflict', code?: string) {
    super(message, code);
  }
}
