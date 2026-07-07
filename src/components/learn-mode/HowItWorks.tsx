import { Binary, Clock, GitBranch, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How This Works</CardTitle>
        <Binary className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent className="grid grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="space-y-4 text-sm leading-relaxed text-muted">
          <Lesson icon={GitBranch} title="Priority queues">
            Patients are ordered by a composite comparator: higher severity wins, and ties go to the earlier arrival timestamp. A binary heap keeps insertion and extraction at O(log n).
          </Lesson>
          <Lesson icon={Clock} title="Escalation">
            Waiting is not passive. If a patient waits past a threshold, severity rises and the heap is rebuilt so the new urgency changes the next doctor assignment.
          </Lesson>
          <Lesson icon={Waves} title="Poisson arrivals">
            Emergency arrivals are independent events around an average rate. A Poisson model creates quiet periods and sudden bursts, which is closer to real operations than flat random spacing.
          </Lesson>
        </div>
        <div className="rounded-xl border border-line bg-command p-6">
          <div className="mx-auto grid max-w-xs gap-4 text-center font-mono text-xs">
            <div className="rounded bg-critical px-4 py-2 text-command">CRITICAL t=07</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded bg-serious px-4 py-2 text-command">SERIOUS t=02</div>
              <div className="rounded bg-moderate px-4 py-2 text-command">MODERATE t=01</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded bg-mild px-2 py-2 text-command">MILD</div>
              <div className="rounded bg-moderate px-2 py-2 text-command">MOD</div>
              <div className="rounded bg-mild px-2 py-2 text-command">MILD</div>
              <div className="rounded bg-serious px-2 py-2 text-command">SER</div>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-muted">Mini heap diagram: parent nodes outrank their children by urgency and arrival time.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Lesson({ icon: Icon, title, children }: { icon: typeof Binary; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-elevated p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold text-ink">
        <Icon className="h-4 w-4 text-accent" />
        {title}
      </h3>
      <p>{children}</p>
    </section>
  );
}
