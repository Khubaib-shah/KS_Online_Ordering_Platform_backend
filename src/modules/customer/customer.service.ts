// ─── Customer Service ───────────────────────────────────────────────

import { customerRepository } from './customer.repository';
import { NotFoundError } from '../../lib/errors';

export const customerService = {
  async list(tenantId: string, filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return customerRepository.list(tenantId, filters, skip, limit);
  },

  async getById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new NotFoundError('Customer', id);
    return customer;
  },
};
