"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-center"
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
      className={cn("p-4 bg-background", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3 w-full",
        // month_caption agora é o container flex que alinha botões e texto no centro
        month_caption: "flex justify-center pt-1 relative items-center mb-2 gap-4",
        // caption_label é o texto do mês/ano
        caption_label: "text-xs font-bold uppercase tracking-wider",
        
        // nav contém os botões. Removi o absolute para eles seguirem o fluxo do flex
        nav: "flex items-center gap-1", 
        
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 z-10"
        ),
        
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.65rem] py-1 text-center",
        week: "flex w-full mt-0.5 justify-between",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md w-8"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-xs"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground font-bold border border-accent-foreground/20",
        outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
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

export { Calendar }