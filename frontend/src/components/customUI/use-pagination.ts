import { useState, useMemo, useEffect } from "react";

export interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface UsePaginationReturn<T> {
  pagination: PaginationState;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { pageSize = 10, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [totalItems, setTotalItems] = useState(data.length);

  // Update totalItems when data changes
  useEffect(() => {
    setTotalItems(data.length);
  }, [data.length]);

  // Calculate pagination state
  const pagination = useMemo((): PaginationState => {
    const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = Math.min(startIndex + currentPageSize, totalItems);

    return {
      currentPage,
      pageSize: currentPageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
    };
  }, [currentPage, currentPageSize, totalItems]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    return data.slice(pagination.startIndex, pagination.endIndex);
  }, [data, pagination.startIndex, pagination.endIndex]);

  // Navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const setPageSize = (size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const updateTotalItems = (total: number) => {
    setTotalItems(total);
    // Reset to first page if current page is beyond new total
    const newTotalPages = Math.max(1, Math.ceil(total / currentPageSize));
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  };

  return {
    pagination,
    paginatedData,
    setCurrentPage,
    setPageSize,
    setTotalItems: updateTotalItems,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: currentPage < pagination.totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
