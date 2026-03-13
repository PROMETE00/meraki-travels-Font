// types.d.ts
export type SearchCriteria = {
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  pax: number;
};

export type ResultItem = {
  id: string;
  type: 'vuelo'|'hotel'|'tour'|'actividad';
  title: string;
  price: number;
  meta?: Record<string, unknown>;
};
