import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  filters: {
    type: string[];
    visibility: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFilterChange: (filters: any) => void;
  placeholder?: string;
}

const fileTypes = [
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
  { value: 'archive', label: 'Archives' },
  { value: 'code', label: 'Code' },
  { value: 'other', label: 'Other' },
];

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' },
  { value: 'size', label: 'Size' },
];

export function SearchBar({
  value,
  onChange,
  onClear,
  filters,
  onFilterChange,
  placeholder = 'Search files...',
}: SearchBarProps) {
  const activeFiltersCount = 
    filters.type.length + 
    filters.visibility.length + 
    (filters.sortBy !== 'date' ? 1 : 0);

  return (
    <div className="flex gap-2 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10 glass-effect border-primary/20 focus:border-primary/40"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2 glass-effect border-primary/20 hover:border-primary/40 relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass-effect border-primary/20">
          {/* File Type Filter */}
          <DropdownMenuLabel>File Type</DropdownMenuLabel>
          {fileTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type.value}
              checked={filters.type.includes(type.value)}
              onCheckedChange={(checked) => {
                const newTypes = checked
                  ? [...filters.type, type.value]
                  : filters.type.filter((t) => t !== type.value);
                onFilterChange({ ...filters, type: newTypes });
              }}
            >
              {type.label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          {/* Visibility Filter */}
          <DropdownMenuLabel>Visibility</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.visibility.includes('public')}
            onCheckedChange={(checked) => {
              const newVis = checked
                ? [...filters.visibility, 'public']
                : filters.visibility.filter((v) => v !== 'public');
              onFilterChange({ ...filters, visibility: newVis });
            }}
          >
            Public
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.visibility.includes('private')}
            onCheckedChange={(checked) => {
              const newVis = checked
                ? [...filters.visibility, 'private']
                : filters.visibility.filter((v) => v !== 'private');
              onFilterChange({ ...filters, visibility: newVis });
            }}
          >
            Private
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          {/* Sort Options */}
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange({ ...filters, sortBy: option.value })}
              className={filters.sortBy === option.value ? 'bg-primary/10' : ''}
            >
              {option.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {/* Sort Order */}
          <DropdownMenuItem
            onClick={() => 
              onFilterChange({ 
                ...filters, 
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
              })
            }
          >
            {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Clear Filters */}
          <DropdownMenuItem
            onClick={() => 
              onFilterChange({ 
                type: [], 
                visibility: [], 
                sortBy: 'date', 
                sortOrder: 'desc' 
              })
            }
            className="text-destructive"
          >
            Clear All Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
