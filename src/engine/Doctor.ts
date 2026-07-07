import type { Patient } from "@/engine/Patient";
import { severityWeight } from "@/engine/Patient";

export type DoctorStatus = "Idle" | "Treating";

export interface Doctor {
  id: string;
  name: string;
  status: DoctorStatus;
  patient?: Patient;
  startedAt?: number;
  treatmentTicks: number;
  remainingTicks: number;
  treatedCount: number;
}

export function createDoctors(count: number): Doctor[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `D-${index + 1}`,
    name: `Dr. ${["Rao", "Lee", "Carter", "Mehta", "Stone", "Kim", "Rivera", "Ali"][index % 8]}`,
    status: "Idle",
    treatmentTicks: 0,
    remainingTicks: 0,
    treatedCount: 0
  }));
}

export function treatmentDuration(patient: Patient) {
  return 10 + severityWeight[patient.severity] * 7 + Math.floor(Math.random() * 9);
}
