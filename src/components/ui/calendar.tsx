import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-portfolio-bg-dark text-portfolio-text-primary", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-portfolio-text-primary",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-portfolio-border text-portfolio-text-secondary hover:text-portfolio-text-primary hover:bg-portfolio-bg-primary"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-portfolio-text-secondary rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-portfolio-accent-mauve/20 [&:has([aria-selected])]:bg-portfolio-accent-mauve/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-portfolio-text-primary hover:bg-portfolio-bg-primary hover:text-portfolio-text-primary"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-portfolio-accent-mauve text-portfolio-bg-dark hover:bg-portfolio-accent-mauve hover:text-portfolio-bg-dark focus:bg-portfolio-accent-mauve focus:text-portfolio-bg-dark",
        day_today: "bg-portfolio-bg-primary text-portfolio-text-primary border border-portfolio-accent-mauve/50",
        day_outside:
          "day-outside text-portfolio-text-secondary opacity-50 aria-selected:bg-portfolio-accent-mauve/30 aria-selected:text-portfolio-text-secondary aria-selected:opacity-30",
        day_disabled: "text-portfolio-text-secondary opacity-50",
        day_range_middle:
          "aria-selected:bg-portfolio-accent-mauve/20 aria-selected:text-portfolio-text-primary",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      } as any}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
