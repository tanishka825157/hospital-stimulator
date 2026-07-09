import type { Patient, Severity } from "@/engine/Patient";

export type SimEventType =
  | "patient-arrived"
  | "patient-escalated"
  | "patient-discharged"
  | "severity-overridden"
  | "doctor-started"
  | "doctor-finished"
  | "doctor-status"
  | "icu-admitted"
  | "icu-released"
  | "bed-status"
  | "ambulance-dispatched"
  | "ambulance-arrived"
  | "ambulance-returned"
  | "crisis";

export interface SimEvent {
  id: string;
  tick: number;
  type: SimEventType;
  message: string;
  patient?: Patient;
  severity?: Severity;
}

export class EventLog {
  private events: SimEvent[] = [];

  add(event: Omit<SimEvent, "id">) {
    const next = { ...event, id: `E-${event.tick}-${this.events.length}` };
    this.events = [next, ...this.events].slice(0, 180);
    return next;
  }

  all() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}
