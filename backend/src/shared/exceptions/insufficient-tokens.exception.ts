import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Insufficient Tokens Exception
 * Thrown when user doesn't have enough tokens for an operation
 */
export class InsufficientTokensException extends BaseException {
  statusCode = HTTP_STATUS.FORBIDDEN;
  status = 'fail';

  constructor(
    message: string = 'Insufficient token balance',
    code?: string,
    details?: { required: number; current: number }
  ) {
    super(message, code, details);
  }
}
