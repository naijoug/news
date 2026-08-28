import { NextFunction, Request, Response } from 'express';
import {
  validateNewsQuery,
  validatePlatformBody,
  validatePlatformId,
  validatePlatformQuery,
} from '../middleware/validation';

type MockResponse = Partial<Response> & {
  status: jest.Mock;
  json: jest.Mock;
};

describe('Validation Middleware Tests', () => {
  let mockResponse: MockResponse;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  const runNewsQuery = (query: Request['query']): void => {
    validateNewsQuery({ query } as Request, mockResponse as Response, mockNext);
  };

  const runPlatformQuery = (query: Request['query']): void => {
    validatePlatformQuery({ query } as Request, mockResponse as Response, mockNext);
  };

  const runPlatformId = (id?: string): void => {
    validatePlatformId(
      { params: { id } } as unknown as Request,
      mockResponse as Response,
      mockNext
    );
  };

  const runPlatformBody = (body: unknown): void => {
    validatePlatformBody({ body } as Request, mockResponse as Response, mockNext);
  };

  const expectValidationError = (message: string): void => {
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
    });
  };

  describe('validateNewsQuery', () => {
    it('allows valid pagination, time range, and string platforms', () => {
      runNewsQuery({
        limit: '25',
        offset: '0',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-02T00:00:00.000Z',
        platforms: 'weibo, zhihu',
      });

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('allows array platform query values from Express query parsing', () => {
      runNewsQuery({ platforms: ['weibo', 'zhihu'] });

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it.each([
      [{ limit: '0' }, 'Limit must be a number between 1 and 100'],
      [{ limit: '101' }, 'Limit must be a number between 1 and 100'],
      [{ limit: 'abc' }, 'Limit must be a number between 1 and 100'],
      [{ offset: '-1' }, 'Offset must be a non-negative number'],
      [{ offset: 'abc' }, 'Offset must be a non-negative number'],
      [{ startTime: 'not-a-date' }, 'Invalid startTime format'],
      [{ endTime: 'not-a-date' }, 'Invalid endTime format'],
      [
        { startTime: '2024-02-01T00:00:00.000Z', endTime: '2024-01-01T00:00:00.000Z' },
        'startTime must be before endTime',
      ],
      [{ platforms: 'weibo,,zhihu' }, 'Platform IDs cannot be empty'],
      [{ platforms: { id: 'weibo' } }, 'Platforms must be a string or array'],
    ])('rejects invalid news query %#', (query, message) => {
      runNewsQuery(query as Request['query']);

      expectValidationError(message);
    });
  });

  describe('validatePlatformQuery', () => {
    it.each(['true', 'false', undefined])('allows enabled=%s', enabled => {
      runPlatformQuery(enabled === undefined ? {} : { enabled });

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('rejects invalid enabled values', () => {
      runPlatformQuery({ enabled: 'yes' });

      expectValidationError('Enabled must be "true" or "false"');
    });
  });

  describe('validatePlatformId', () => {
    it.each(['weibo', 'zhihu-daily', 'hacker_news_1'])('allows valid id %s', id => {
      runPlatformId(id);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it.each([undefined, '', '   '])('rejects missing or blank id %#', id => {
      runPlatformId(id);

      expectValidationError('Platform ID is required and must be a non-empty string');
    });

    it.each(['weibo.cn', 'zhihu/daily', 'hello world'])('rejects invalid id characters %s', id => {
      runPlatformId(id);

      expectValidationError(
        'Platform ID must contain only alphanumeric characters, hyphens, and underscores'
      );
    });
  });

  describe('validatePlatformBody', () => {
    it('allows a non-empty request body', () => {
      runPlatformBody({ id: 'weibo' });

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it.each([undefined, null, {}])('rejects empty body %#', body => {
      runPlatformBody(body);

      expectValidationError('Request body is required');
    });
  });
});
