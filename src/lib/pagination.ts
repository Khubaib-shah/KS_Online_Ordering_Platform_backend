// ─── Pagination Utility ─────────────────────────────────────────────

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 1000;

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: { page?: string | number; limit?: string | number }): PaginationParams {
  let page = Number(query.page) || DEFAULT_PAGE;
  let limit = Number(query.limit) || DEFAULT_LIMIT;

  if (page < 1) page = 1;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
