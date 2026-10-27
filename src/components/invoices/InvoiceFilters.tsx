import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS, type DisplayStatus } from '@/lib/invoice';

export type StatusFilter = DisplayStatus | 'all';

interface InvoiceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
}

export function InvoiceFilters({ searchQuery, onSearchChange, statusFilter, onStatusChange }: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ieškoti pagal pirkėją ar numerį..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as StatusFilter)}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Visos būsenos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Visos būsenos</SelectItem>
          {(Object.keys(STATUS_LABELS) as DisplayStatus[]).map((status) => (
            <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
