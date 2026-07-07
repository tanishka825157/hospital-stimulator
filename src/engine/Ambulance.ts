export type AmbulanceStatus = "Idle" | "Dispatched" | "En Route" | "Returning";

export interface Ambulance {
  id: string;
  status: AmbulanceStatus;
  progress: number;
  remainingTicks: number;
  totalTicks: number;
}

export function createAmbulances(count: number): Ambulance[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `AMB-${index + 1}`,
    status: "Idle",
    progress: 0,
    remainingTicks: 0,
    totalTicks: 0
  }));
}
