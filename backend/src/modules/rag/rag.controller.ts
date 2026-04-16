/**
 * RAG Controller
 * Handles HTTP requests for the vectorless RAG module
 */

import { Request, Response, NextFunction } from 'express';
import { ragService } from './rag.service';
import { HTTP_STATUS } from '@/shared/constants';
import { QueryRagRequest } from './rag.types';

class RagController {
  /**
   * POST /api/v1/rag/query
   * Student queries the RAG index
   */
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.body as QueryRagRequest;
      const result = await ragService.queryRag(query);
      res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/rag/build-index
   * Triggers index rebuild.
   * TODO: Re-restrict to ADMIN / SUPER_ADMIN once testing is complete.
   * Currently allows any authenticated user for testing purposes.
   */
  async buildIndex(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Uncomment below to re-enforce admin-only access
      // const user = req.user;
      // const userRole = user?.role;
      // if (!user || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      //   res.status(HTTP_STATUS.FORBIDDEN).json({
      //     success: false,
      //     message: 'Only admins can trigger index builds',
      //   });
      //   return;
      // }
      const result = await ragService.buildIndex();
      res.status(HTTP_STATUS.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rag/stats
   * Get index statistics
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ragService.getIndexStats();
      res.status(HTTP_STATUS.OK).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const ragController = new RagController();
