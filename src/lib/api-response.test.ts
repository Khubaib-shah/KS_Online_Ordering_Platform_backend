import { sendSuccess, sendError } from './api-response';
import { Response } from 'express';

describe('api-response', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('sendSuccess should format success payload properly', () => {
    const data = { id: 1, name: 'Test' };
    sendSuccess(mockRes as Response, data);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data,
    });
  });

  it('sendError should format error payload properly', () => {
    sendError(mockRes as Response, 400, 'BAD_REQUEST', 'Invalid input');

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
      },
    });
  });
});
