// filename: src/components/DatePicker.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

type DatePickerProps = {
  date: Date | null;
  onChange: (d: Date | null) => void;
  label?: string;
};

export function DatePicker({ date, onChange, label = 'Sign Date' }: DatePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={(d) => onChange(d ?? null)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
