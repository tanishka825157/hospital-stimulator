import type { Patient } from "@/engine/Patient";

export interface ICUBed {
  id: string;
  patient?: Patient;
  remainingTicks: number;
}

export function createICUBeds(count: number): ICUBed[] {
  return Array.from({ length: count }, (_, index) => ({ id: `ICU-${index + 1}`, remainingTicks: 0 }));
}

export function icuDuration() {
  return 34 + Math.floor(Math.random() * 34);
}
