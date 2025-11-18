import { BaseException } from './base.exception';
import { HTTP_STATUS } from '../constants';

/**
 * Not Found Exception
 * Thrown when a requested resource is not found
 */
export class NotFoundException extends BaseException {
  statusCode = HTTP_STATUS.NOT_FOUND;
  status = 'fail';

  constructor(message: string = 'Resource not found', code?: string) {
    super(message, code);
  }
}
