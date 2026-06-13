export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function createPagination(input: {
  page?: number | undefined;
  pageSize?: number | undefined;
}): PaginationInput {
  return {
    page: Math.max(1, input.page ?? 1),
    pageSize: Math.min(100, Math.max(1, input.pageSize ?? 20)),
  };
}

export function createPaginationMeta(input: PaginationInput, total: number): PaginationMeta {
  return {
    ...input,
    total,
    totalPages: Math.ceil(total / input.pageSize),
  };
}
