import type { SearchCriteria } from "@/features/search/types";

export function normalizeAirportCode(value: string): string {
  return value.trim().toUpperCase().slice(0, 3);
}

export function validateSearchCriteria(criteria: SearchCriteria): string | null {
  const from = criteria.from.trim();
  const to = criteria.to.trim();

  if (!from && !to) {
    return "Ingresa al menos origen o destino para buscar.";
  }

  if (from && from.length < 3) {
    return "El origen debe tener al menos 3 caracteres.";
  }

  if (to && to.length < 3) {
    return "El destino debe tener al menos 3 caracteres.";
  }

  if (criteria.dateFrom && criteria.dateTo && criteria.dateTo < criteria.dateFrom) {
    return "La fecha de regreso no puede ser anterior a la de salida.";
  }

  if (criteria.pax < 1) {
    return "Debe viajar al menos 1 pasajero.";
  }

  return null;
}

export function buildSearchParams(criteria: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();

  if (criteria.from.trim()) {
    params.set("from", normalizeAirportCode(criteria.from));
  }

  if (criteria.to.trim()) {
    params.set("to", normalizeAirportCode(criteria.to));
  }

  if (criteria.dateFrom) {
    params.set("dateFrom", criteria.dateFrom);
  }

  if (criteria.dateTo) {
    params.set("dateTo", criteria.dateTo);
  }

  params.set("pax", String(criteria.pax || 1));
  return params;
}
