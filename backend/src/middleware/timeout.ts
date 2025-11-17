import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware
 * Sets a timeout for all requests
 */
export const timeoutMiddleware = (timeoutMs: number = 10000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Set timeout
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
        });
      }
    });

    // Set response timeout
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Response timeout',
          code: 'RESPONSE_TIMEOUT',
        });
      }
    });

    next();
  };
};
