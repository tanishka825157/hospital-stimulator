import type { Patient } from "@/engine/Patient";
import { severityWeight } from "@/engine/Patient";

/**
 * DoctorStatus extended with manual override states.
 * - "Idle"       — available for assignment (engine-managed)
 * - "Treating"   — currently treating a patient (engine-managed)
 * - "On Break"   — manually marked by admin; engine skips assignment
 * - "In Surgery" — manually marked by admin; engine skips assignment
 */
export type DoctorStatus = "Idle" | "Treating" | "On Break" | "In Surgery";

export interface Doctor {
  id: string;
  name: string;
  status: DoctorStatus;
  patient?: Patient;
  startedAt?: number;
  treatmentTicks: number;
  remainingTicks: number;
  treatedCount: number;
  /**
   * When true, admin has manually overridden this doctor's status.
   * The engine's assignDoctors() and advanceDoctors() loops skip doctors
   * with manualOverride=true so the override persists until admin clears it.
   */
  manualOverride?: boolean;
}

export function createDoctors(count: number): Doctor[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `D-${index + 1}`,
    name: `Dr. ${["Rao", "Lee", "Carter", "Mehta", "Stone", "Kim", "Rivera", "Ali"][index % 8]}`,
    status: "Idle",
    treatmentTicks: 0,
    remainingTicks: 0,
    treatedCount: 0,
  }));
}

export function treatmentDuration(patient: Patient) {
  return 10 + severityWeight[patient.severity] * 7 + Math.floor(Math.random() * 9);
}
