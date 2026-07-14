import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, notFoundHandler } from '../middleware/errorHandler';
import { ValidationError } from '../middleware/validation';

describe('Error Handler Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      path: '/test',
      method: 'GET',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const expectLoggedError = (name: string, message: string) => {
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Error]',
      expect.objectContaining({
        name,
        message,
        path: '/test',
        method: 'GET',
      })
    );
  };

  describe('errorHandler', () => {
    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
      });
      expectLoggedError('ValidationError', 'Invalid input');
    });

    it('should handle AppError with custom status code', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Not found',
        code: 'NOT_FOUND',
      });
      expectLoggedError('AppError', 'Not found');
    });

    it('should handle database errors', () => {
      const error = new Error('SQLITE_ERROR: database is locked');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database error occurred',
        code: 'DATABASE_ERROR',
      });
      expectLoggedError('Error', 'SQLITE_ERROR: database is locked');
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      });
      expectLoggedError('Error', 'Something went wrong');
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for non-existent routes', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Route GET /test not found',
        code: 'NOT_FOUND',
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
