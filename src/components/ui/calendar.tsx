"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      className={cn("p-4 bg-background rounded-md max-w-sm mx-auto w-full", className)}
      classNames={{
        months: "flex flex-col space-y-4 w-full",
        month: "space-y-3 w-full",
        
        // REESTRUTURADO: Alinha os botões e o mês em linha flex comum, segurando as setas nas bordas do calendário
        month_caption: "flex items-center justify-between h-7 relative w-full px-1 mb-2",
        caption_label: "text-sm font-bold uppercase tracking-wider text-center flex-1",
        
        // Elemento auxiliar do react-day-picker
        nav: "flex items-center", 
        
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between w-full",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.75rem] py-1 text-center",
        week: "flex w-full mt-1 justify-between",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-9",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-xs transition-all"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground font-bold border border-accent-foreground/20",
        outside: "day-outside text-muted-foreground/40 pointer-events-none",
        disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        dropdowns: "flex gap-1 items-center justify-center",
        dropdown: "text-[10px] p-1 bg-background border rounded-md cursor-pointer hover:bg-muted transition-colors font-bold",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

// Garante compatibilidade tanto com import { Calendar } quanto com import Calendar
export { Calendar }
export default Calendar