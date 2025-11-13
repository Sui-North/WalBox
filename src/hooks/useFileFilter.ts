import { useState, useMemo } from 'react';
import { FileMetadata } from '@/services/files';
import { getFileCategory } from '@/components/FileIcon';

interface FilterState {
  search: string;
  type: string[];
  visibility: string[];
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
}

export function useFileFilter(files: FileMetadata[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: [],
    visibility: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((file) =>
        file.file_id.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.type.length > 0) {
      result = result.filter((file) => {
        const category = getFileCategory(file.file_id, '');
        return filters.type.includes(category);
      });
    }

    // Visibility filter
    if (filters.visibility.length > 0) {
      result = result.filter((file) =>
        filters.visibility.includes(file.visibility)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.file_id.localeCompare(b.file_id);
          break;
        case 'date':
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'size':
          comparison = a.walrus_object_hash.length - b.walrus_object_hash.length;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, filters]);

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const clearSearch = () => {
    setFilters((prev) => ({ ...prev, search: '' }));
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: [],
      visibility: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  return {
    filters,
    filteredFiles,
    setSearch,
    clearSearch,
    updateFilters,
    clearFilters,
    hasActiveFilters: filters.search || filters.type.length > 0 || filters.visibility.length > 0,
  };
}
