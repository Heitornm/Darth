classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full justify-center",
        month: "space-y-3 w-full max-w-sm mx-auto",
        
        // month_caption agora agrupa os elementos em linha
        month_caption: "flex justify-between items-center mb-4 px-2 relative w-full",
        caption_label: "text-sm font-bold uppercase tracking-wider order-2 mx-auto",
        
        // nav contém os botões e agora dita o alinhamento deles
        nav: "flex items-center gap-1 absolute inset-x-0 top-0 justify-between w-full pointer-events-none", 
        
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-background p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-background p-0 opacity-50 hover:opacity-100 pointer-events-auto"
        ),
        
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between w-full",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.75rem] py-1 text-center",
        week: "flex w-full mt-1 justify-between",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-9"
        ),
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