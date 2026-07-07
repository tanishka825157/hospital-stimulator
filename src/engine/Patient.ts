export type Severity = "CRITICAL" | "SERIOUS" | "MODERATE" | "MILD";

export const severityWeight: Record<Severity, number> = {
  CRITICAL: 4,
  SERIOUS: 3,
  MODERATE: 2,
  MILD: 1
};

export const severityColor: Record<Severity, string> = {
  CRITICAL: "#EF4444",
  SERIOUS: "#F97316",
  MODERATE: "#EAB308",
  MILD: "#22C55E"
};

export interface Patient {
  id: string;
  name: string;
  age: number;
  symptom: string;
  severity: Severity;
  originalSeverity: Severity;
  arrivalTick: number;
  escalatedAt?: number;
  source: "Walk-in" | "Ambulance";
}

const firstNames = ["Ava", "Noah", "Maya", "Liam", "Iris", "Omar", "Nina", "Leo", "Priya", "Ethan", "Sofia", "Arjun"];
const lastNames = ["Patel", "Morgan", "Singh", "Reed", "Chen", "Wilson", "Khan", "Brooks", "Iyer", "Garcia", "Shah", "Nolan"];

const symptoms: Array<{ label: string; severity: Severity }> = [
  { label: "cardiac arrest", severity: "CRITICAL" },
  { label: "major trauma", severity: "CRITICAL" },
  { label: "stroke symptoms", severity: "CRITICAL" },
  { label: "severe asthma attack", severity: "SERIOUS" },
  { label: "compound fracture", severity: "SERIOUS" },
  { label: "high fever with confusion", severity: "SERIOUS" },
  { label: "abdominal pain", severity: "MODERATE" },
  { label: "migraine with vomiting", severity: "MODERATE" },
  { label: "minor burn", severity: "MODERATE" },
  { label: "sprained ankle", severity: "MILD" },
  { label: "low-grade fever", severity: "MILD" },
  { label: "small laceration", severity: "MILD" }
];

export function patientComparator(a: Patient, b: Patient) {
  const severityDelta = severityWeight[b.severity] - severityWeight[a.severity];
  if (severityDelta !== 0) return severityDelta;
  return a.arrivalTick - b.arrivalTick;
}

export function generatePatient(tick: number, source: Patient["source"] = "Walk-in"): Patient {
  const picked = symptoms[Math.floor(Math.random() * symptoms.length)];
  const severity = source === "Ambulance" && Math.random() < 0.45 ? "CRITICAL" : picked.severity;
  const symptom = severity === picked.severity ? picked.label : "ambulance trauma alert";
  return {
    id: `P-${tick}-${Math.random().toString(16).slice(2, 8)}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    age: 6 + Math.floor(Math.random() * 86),
    symptom,
    severity,
    originalSeverity: severity,
    arrivalTick: tick,
    source
  };
}

export function escalatePatient(patient: Patient, tick: number): Patient {
  const next: Record<Exclude<Severity, "CRITICAL">, Severity> = {
    MILD: "MODERATE",
    MODERATE: "SERIOUS",
    SERIOUS: "CRITICAL"
  };
  if (patient.severity === "CRITICAL") return patient;
  return { ...patient, severity: next[patient.severity], escalatedAt: tick };
}
