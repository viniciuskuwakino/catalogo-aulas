export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  const lastPage = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

  return {
    data,
    meta: {
      total,
      page,
      limit,
      lastPage,
    },
  };
}
