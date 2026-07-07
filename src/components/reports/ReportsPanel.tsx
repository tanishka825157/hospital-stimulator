import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { severityColor, type Severity } from "@/engine/Patient";
import { palette } from "@/lib/palette";
import { useSimulationStore } from "@/store/useSimulationStore";

export function ReportsPanel() {
  const { metrics, stats, queue, doctors, icuBeds, actions } = useSimulationStore();
  
  const waitData = (Object.keys(stats.averageWaitBySeverity) as Severity[]).map((severity) => ({ 
    severity, 
    wait: stats.averageWaitBySeverity[severity], 
    fill: severityColor[severity] 
  }));
  
  const statusData = [
    { name: "Treated", value: stats.treated, fill: "var(--color-accent)" },
    { name: "Waiting", value: queue.length, fill: "var(--color-muted)" },
    { name: "Escalated", value: stats.escalated, fill: severityColor.CRITICAL }
  ];
  
  const utilization = [
    { 
      name: "Doctors", 
      value: Math.round((doctors.filter((doctor) => doctor.status === "Treating").length / Math.max(1, doctors.length)) * 100), 
      fill: "var(--color-accent)" 
    },
    { 
      name: "ICU", 
      value: Math.round((icuBeds.filter((bed) => bed.patient).length / Math.max(1, icuBeds.length)) * 100), 
      fill: "var(--color-muted)" 
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <Button variant="secondary" size="sm" onClick={actions.downloadReport}>
          <Download className="h-4 w-4" />
          Report
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6">
        <ChartBox title="Average Wait by Severity">
          <BarChart data={waitData}>
            <CartesianGrid stroke={palette.border} strokeOpacity={0.1} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="severity" stroke={palette.muted} tick={{ fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
            <YAxis stroke={palette.muted} tick={{ fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={tooltipStyle} 
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: "var(--color-elevated)", opacity: 0.3 }} 
            />
            <Bar dataKey="wait" radius={[4, 4, 0, 0]}>
              {waitData.map((entry) => <Cell key={entry.severity} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ChartBox>
        <ChartBox title="Queue Length Over Time">
          <LineChart data={metrics}>
            <CartesianGrid stroke={palette.border} strokeOpacity={0.1} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="tick" stroke={palette.muted} tick={{ fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
            <YAxis stroke={palette.muted} tick={{ fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={tooltipStyle} 
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ stroke: "var(--color-accent)", strokeOpacity: 0.25 }} 
            />
            <Line dataKey="queueLength" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartBox>
        <ChartBox title="Utilization">
          <RadialBarChart innerRadius="35%" outerRadius="90%" data={utilization} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" background={{ fill: "var(--color-elevated)", opacity: 0.4 }} />
            <Tooltip 
              contentStyle={tooltipStyle} 
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
            />
          </RadialBarChart>
        </ChartBox>
        <ChartBox title="Outcomes">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
              {statusData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
            </Pie>
            <Tooltip 
              contentStyle={tooltipStyle} 
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
            />
          </PieChart>
        </ChartBox>
        <div className="col-span-2 rounded-xl border border-line/60 bg-elevated/20 px-4 py-3 text-xs text-muted flex items-center justify-between">
          <span>Peak load occurred at <span className="font-mono text-accent font-semibold">t+{stats.peakLoadTick}s</span></span>
          <div className="flex gap-4">
            <span>Treated: <span className="font-mono text-ink font-semibold">{stats.treated}</span></span>
            <span>Escalated: <span className="font-mono text-critical font-semibold">{stats.escalated}</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "var(--color-panel)",
  border: "1px solid var(--color-line)",
  borderRadius: "12px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)"
};

const tooltipItemStyle = {
  color: "var(--color-ink)",
  fontSize: "11px",
  fontWeight: 600,
  padding: "2px 0"
};

const tooltipLabelStyle = {
  color: "var(--color-muted)",
  fontSize: "9px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "4px"
};

function ChartBox({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="h-64 rounded-xl border border-line bg-command/40 p-4">
      <h3 className="mb-3 text-xs uppercase tracking-wider font-semibold text-muted">{title}</h3>
      <ResponsiveContainer width="100%" height="86%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
