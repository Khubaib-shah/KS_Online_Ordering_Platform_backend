import { Request, Response } from 'express';
import { tableService } from './table.service';
import { createTableSchema, updateTableSchema } from './table.validation';
import { sendSuccess, sendError } from '../../lib/api-response';

export const tableController = {
  async createTable(req: Request, res: Response) {
    if (!req.user?.tenantId) {
      return sendError(res, 403, 'FORBIDDEN', 'Tenant ID is missing');
    }
    const data = createTableSchema.parse(req.body);
    const table = await tableService.createTable(req.user.tenantId, data);
    sendSuccess(res, table, 201);
  },

  async getTables(req: Request, res: Response) {
    const branchId = req.query.branchId as string;
    if (!branchId) {
      return sendError(res, 400, 'BAD_REQUEST', 'branchId query parameter is required');
    }
    if (!req.user?.tenantId) {
      return sendError(res, 403, 'FORBIDDEN', 'Tenant ID is missing');
    }
    const tables = await tableService.getTablesByBranch(req.user.tenantId, branchId);
    sendSuccess(res, tables);
  },

  async updateTable(req: Request, res: Response) {
    if (!req.user?.tenantId) {
      return sendError(res, 403, 'FORBIDDEN', 'Tenant ID is missing');
    }
    const data = updateTableSchema.parse(req.body);
    const table = await tableService.updateTable(req.user.tenantId, req.params.id as string, data);
    sendSuccess(res, table);
  },

  async deleteTable(req: Request, res: Response) {
    if (!req.user?.tenantId) {
      return sendError(res, 403, 'FORBIDDEN', 'Tenant ID is missing');
    }
    await tableService.deleteTable(req.user.tenantId, req.params.id as string);
    sendSuccess(res, { deleted: true });
  },
};
