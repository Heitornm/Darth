<Calendar
  mode="single"
  selected={selectedDate}
  onSelect={(d: Date | undefined) => {
    if (d && !isBefore(startOfDay(d), startOfDay(new Date())) && !isDayFull(d)) {
      setSelectedDate(d);
    }
  }}
  locale={ptBR}
  className="w-full"
  disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || isDayFull(date)}
  modifiers={{
    full: (date) => isDayFull(date) && !isBefore(startOfDay(date), startOfDay(new Date())),
    available: (date) => !isDayFull(date) && !isBefore(startOfDay(date), startOfDay(new Date()))
  }}
  modifiersClassNames={{
    // Adicionado !opacity-100 e cursor-not-allowed para sobrepor o comportamento disabled nativo
    full: "!bg-destructive !text-destructive-foreground !opacity-100 font-bold cursor-not-allowed rounded-md",
    available: "bg-green-500/10 text-green-500 font-bold rounded-md"
  }}
/>