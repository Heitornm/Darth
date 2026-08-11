declare module 'date-fns' {
  export function format(date: Date | string | number, pattern: string, options?: any): string;
  export function parseISO(dateStr: string): Date;
  export function isValid(date: any): boolean;
}

declare module 'date-fns/locale' {
  export const ptBR: any;
}