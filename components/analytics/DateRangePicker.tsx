'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

const presets = [
  {
    label: 'Last 7 days',
    value: '7d',
    getDates: () => ({
      from: addDays(new Date(), -7),
      to: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getDates: () => ({
      from: addDays(new Date(), -30),
      to: new Date(),
    }),
  },
  {
    label: 'Last 90 days',
    value: '90d',
    getDates: () => ({
      from: addDays(new Date(), -90),
      to: new Date(),
    }),
  },
  {
    label: 'Last 6 months',
    value: '6m',
    getDates: () => ({
      from: addDays(new Date(), -180),
      to: new Date(),
    }),
  },
  {
    label: 'Last year',
    value: '1y',
    getDates: () => ({
      from: addDays(new Date(), -365),
      to: new Date(),
    }),
  },
  {
    label: 'All time',
    value: 'all',
    getDates: () => ({
      from: new Date(2024, 0, 1), // Start from Jan 1, 2024
      to: new Date(),
    }),
  },
  {
    label: 'Custom range',
    value: 'custom',
    getDates: () => ({
      from: addDays(new Date(), -30),
      to: new Date(),
    }),
  },
];

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState('30d');
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = presets.find((p) => p.value === value);
    if (preset && value !== 'custom') {
      onDateChange(preset.getDates());
    }
  };

  // Update selectedPreset when date changes externally
  React.useEffect(() => {
    if (!date?.from || !date?.to) {
      return;
    }

    // Check which preset matches the current date range
    const matchingPreset = presets.find((preset) => {
      if (preset.value === 'custom') return false;
      const presetDates = preset.getDates();
      const isSameRange = 
        Math.abs(date.from!.getTime() - presetDates.from.getTime()) < 60000 && // Within 1 minute
        Math.abs(date.to!.getTime() - presetDates.to.getTime()) < 60000;
      return isSameRange;
    });

    if (matchingPreset) {
      setSelectedPreset(matchingPreset.value);
    } else {
      setSelectedPreset('custom');
    }
  }, [date]);

  return (
    <div className={cn('flex gap-2', className)}>
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent position="popper" align="start" sideOffset={4}>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="end" 
          side="bottom"
          sideOffset={4}
          avoidCollisions={true}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate: DateRange | undefined) => {
              onDateChange(newDate);
              setSelectedPreset('custom');
            }}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateChange(undefined);
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!date?.from || !date?.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
