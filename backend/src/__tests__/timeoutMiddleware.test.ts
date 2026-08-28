import { Request, Response, NextFunction } from 'express';
import { timeoutMiddleware } from '../middleware/timeout';

describe('Timeout Middleware Tests', () => {
  let mockRequest: Partial<Request> & {
    setTimeout: jest.Mock<void, [number, () => void]>;
  };
  let mockResponse: Partial<Response> & {
    setTimeout: jest.Mock<void, [number, () => void]>;
    headersSent: boolean;
  };
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = {
      setTimeout: jest.fn(),
    };
    mockResponse = {
      headersSent: false,
      setTimeout: jest.fn(),
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  const runMiddleware = (timeoutMs?: number): void => {
    const middleware = timeoutMiddleware(timeoutMs);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);
  };

  it('sets request and response timeouts and calls next', () => {
    runMiddleware(2500);

    expect(mockRequest.setTimeout).toHaveBeenCalledWith(2500, expect.any(Function));
    expect(mockResponse.setTimeout).toHaveBeenCalledWith(2500, expect.any(Function));
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('uses 10 seconds as the default timeout', () => {
    runMiddleware();

    expect(mockRequest.setTimeout).toHaveBeenCalledWith(10000, expect.any(Function));
    expect(mockResponse.setTimeout).toHaveBeenCalledWith(10000, expect.any(Function));
  });

  it('returns a 408 request timeout payload when the request timer fires before headers are sent', () => {
    runMiddleware(100);

    const requestTimeoutCallback = mockRequest.setTimeout.mock.calls[0][1];
    requestTimeoutCallback();

    expect(statusMock).toHaveBeenCalledWith(408);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Request timeout',
      code: 'REQUEST_TIMEOUT',
    });
  });

  it('returns a 408 response timeout payload when the response timer fires before headers are sent', () => {
    runMiddleware(100);

    const responseTimeoutCallback = mockResponse.setTimeout.mock.calls[0][1];
    responseTimeoutCallback();

    expect(statusMock).toHaveBeenCalledWith(408);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Response timeout',
      code: 'RESPONSE_TIMEOUT',
    });
  });

  it('does not write a request timeout response after headers have already been sent', () => {
    mockResponse.headersSent = true;
    runMiddleware(100);

    const requestTimeoutCallback = mockRequest.setTimeout.mock.calls[0][1];
    requestTimeoutCallback();

    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('does not write a response timeout response after headers have already been sent', () => {
    mockResponse.headersSent = true;
    runMiddleware(100);

    const responseTimeoutCallback = mockResponse.setTimeout.mock.calls[0][1];
    responseTimeoutCallback();

    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });
});
