import { Request, Response, NextFunction } from 'express';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate news query parameters
 */
export const validateNewsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { platforms, startTime, endTime, limit, offset } = req.query;

  try {
    // Validate limit
    if (limit !== undefined) {
      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Limit must be a number between 1 and 100');
      }
    }

    // Validate offset
    if (offset !== undefined) {
      const offsetNum = parseInt(offset as string, 10);
      if (isNaN(offsetNum) || offsetNum < 0) {
        throw new ValidationError('Offset must be a non-negative number');
      }
    }

    // Validate startTime
    if (startTime !== undefined && typeof startTime === 'string') {
      const date = new Date(startTime);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid startTime format');
      }
    }

    // Validate endTime
    if (endTime !== undefined && typeof endTime === 'string') {
      const date = new Date(endTime);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid endTime format');
      }
    }

    // Validate time range
    if (startTime && endTime) {
      const start = new Date(startTime as string);
      const end = new Date(endTime as string);
      if (start > end) {
        throw new ValidationError('startTime must be before endTime');
      }
    }

    // Validate platforms
    if (platforms !== undefined) {
      if (typeof platforms === 'string') {
        const platformArray = platforms.split(',').map(p => p.trim());
        if (platformArray.some(p => p.length === 0)) {
          throw new ValidationError('Platform IDs cannot be empty');
        }
      } else if (!Array.isArray(platforms)) {
        throw new ValidationError('Platforms must be a string or array');
      }
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    } else {
      next(error);
    }
  }
};

/**
 * Validate platform query parameters
 */
export const validatePlatformQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { enabled } = req.query;

  try {
    // Validate enabled parameter
    if (enabled !== undefined && enabled !== 'true' && enabled !== 'false') {
      throw new ValidationError('Enabled must be "true" or "false"');
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    } else {
      next(error);
    }
  }
};

/**
 * Validate platform ID parameter
 */
export const validatePlatformId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new ValidationError('Platform ID is required and must be a non-empty string');
    }

    // Validate ID format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new ValidationError('Platform ID must contain only alphanumeric characters, hyphens, and underscores');
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    } else {
      next(error);
    }
  }
};

/**
 * Validate platform body for creation
 */
export const validatePlatformBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ValidationError('Request body is required');
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR',
      });
    } else {
      next(error);
    }
  }
};
