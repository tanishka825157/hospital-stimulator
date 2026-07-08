import type { Patient } from "@/engine/Patient";

export interface ICUBed {
  id: string;
  patient?: Patient;
  remainingTicks: number;
  /**
   * When true, admin has marked this bed as under maintenance.
   * The engine treats maintenance beds as unavailable (same as occupied).
   * Maintenance beds are shown with a distinct visual state in the UI.
   */
  maintenance?: boolean;
}

export function createICUBeds(count: number): ICUBed[] {
  return Array.from({ length: count }, (_, index) => ({ id: `ICU-${index + 1}`, remainingTicks: 0 }));
}

export function icuDuration() {
  return 34 + Math.floor(Math.random() * 34);
}
