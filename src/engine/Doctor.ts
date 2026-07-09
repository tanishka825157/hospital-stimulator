import type { Patient } from "@/engine/Patient";
import { severityWeight } from "@/engine/Patient";

/**
 * DoctorStatus extended with manual override states.
 * - "Idle"       — available for assignment (engine-managed)
 * - "Treating"   — currently treating a patient assigned by admin
 * - "On Break"   — manually marked unavailable by admin
 * - "In Surgery" — manually marked unavailable by admin
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
   * The engine never auto-assigns doctors; this flag is used by the UI to
   * distinguish an intentional unavailable state from an idle doctor.
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
