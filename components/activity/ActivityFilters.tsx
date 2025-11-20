'use client';

import { Download, RefreshCw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { ActivityAction, Severity } from '@/types';
import { cn } from '@/lib/utils';

export type ActivityFilterState = {
  search: string;
  actor: string;
  action: string;
  entityType: string;
  severity: string;
  status: 'all' | 'success' | 'error';
  role: 'all' | 'admin' | 'creator';
  tags: string;
  dateRange?: DateRange;
};

interface ActivityFiltersProps {
  filters: ActivityFilterState;
  onChange: (next: Partial<ActivityFilterState>) => void;
  onReset: () => void;
  onExport: (format: 'csv') => void | Promise<void>;
  isExporting?: boolean;
  className?: string;
}

const entityOptions = [
  { label: 'All entities', value: 'all' },
  { label: 'Users', value: 'user' },
  { label: 'Organizations', value: 'organization' },
  { label: 'Projects', value: 'project' },
  { label: 'Posts', value: 'post' },
  { label: 'Metrics', value: 'metrics' },
  { label: 'Invitations', value: 'invitation' },
  { label: 'Notifications', value: 'notification' },
];

const severityOptions: { label: string; value: string }[] = [
  { label: 'All severities', value: 'all' },
  { label: 'Info', value: Severity.INFO },
  { label: 'Warning', value: Severity.WARNING },
  { label: 'Error', value: Severity.ERROR },
  { label: 'Critical', value: Severity.CRITICAL },
];

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function ActivityFilters({
  filters,
  onChange,
  onReset,
  onExport,
  isExporting,
  className,
}: ActivityFiltersProps) {
  return (
    <Card className={cn('bg-white shadow-xl rounded-2xl', className)}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-2xl font-serif font-normal tracking-tight">
          Filter Activity
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-zinc-600 hover:text-zinc-900"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isExporting}
                className="rounded-lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={isExporting}
                onClick={() => onExport('csv')}
              >
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search description, entity, tags..."
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actor">Actor</Label>
            <Input
              id="actor"
              placeholder="Filter by admin or creator"
              value={filters.actor}
              onChange={(event) => onChange({ actor: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) => onChange({ role: value as ActivityFilterState['role'] })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="creator">Creators</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={filters.action}
              onValueChange={(value) => onChange({ action: value })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">All actions</SelectItem>
                {Object.values(ActivityAction).map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Entity</Label>
            <Select
              value={filters.entityType}
              onValueChange={(value) => onChange({ entityType: value })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                {entityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select
              value={filters.severity}
              onValueChange={(value) => onChange({ severity: value })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onChange({ status: value as ActivityFilterState['status'] })
              }
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="All outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="error">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma separated tags"
              value={filters.tags}
              onChange={(event) => onChange({ tags: event.target.value })}
            />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Date range</Label>
          <DateRangePicker
            date={filters.dateRange}
            onDateChange={(range) => onChange({ dateRange: range })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

