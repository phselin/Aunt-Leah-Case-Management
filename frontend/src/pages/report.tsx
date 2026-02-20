import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { palette } from "../theme/palette";

type BarDatum = { label: string; value: number };

const API_BASE = (import.meta as ImportMeta).env?.VITE_API_BASE_URL || "http://localhost:8000";

// We need >= max(milestones) colors otherwise it causes issues 
// for programs with no. of pie colors + 1 = no of milestones in program
// maybe there is a better way to do it (for later)
const PIE_COLORS = [
  palette.bubblegumPink,
  palette.mutedTeal,
  palette.crimsonViolet,
  palette.warmBronze,
  palette.dustyBlue
] as const;

function collapseToTopNWithOther(data: BarDatum[], maxSlices: number): BarDatum[] {
  if (maxSlices < 2) return data;
  const sorted = [...data].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  if (sorted.length <= maxSlices) return sorted;
  const keep = sorted.slice(0, maxSlices - 1);
  const other = sorted.slice(maxSlices - 1).reduce((sum, d) => sum + d.value, 0);
  return [...keep, { label: "Other", value: other }];
}

function BarList({
  data,
  color = palette.bubblegumPink,
  emptyLabel = "No data",
}: {
  data: BarDatum[];
  color?: string;
  emptyLabel?: string;
}) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  if (data.length === 0) return <div className="reportEmptyState">{emptyLabel}</div>;

  return (
    <div className="reportBarList">
      {data.map((d) => (
        <div key={d.label} className="reportBarRow">
          <div className="reportBarLabel" title={d.label}>
            {d.label}
          </div>
          <div className="reportBarTrack" aria-hidden="true">
            <div
              className="reportBarFill"
              style={{
                width: `${max ? (d.value / max) * 100 : 0}%`,
                background: color,
              }}
            />
          </div>
          <div className="reportBarValue">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function PieChart({
  data,
  emptyLabel = "No data",
}: {
  data: BarDatum[];
  emptyLabel?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!data.length || total <= 0) return <div className="reportEmptyState">{emptyLabel}</div>;

  const size = 172;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;

  const toPoint = (angleRad: number) => ({
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  });

  // Start at 12 o'clock.
  const slices = data
    .reduce<{ angle: number; out: Array<BarDatum & { color: string; path: string }> }>(
      (acc, d, idx) => {
        const a0 = acc.angle;
        const frac = d.value / total;
        const a1 = a0 + frac * Math.PI * 2;
        const p0 = toPoint(a0);
        const p1 = toPoint(a1);
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const color = PIE_COLORS[idx % PIE_COLORS.length];
        const path = `M ${cx} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
        return { angle: a1, out: [...acc.out, { ...d, color, path }] };
      },
      { angle: -Math.PI / 2, out: [] }
    )
    .out;

  return (
    <div className="reportPieLayout">
      <svg className="reportPieSvg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="white" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="12" fontWeight="900" fill="#222">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6b6b6b">
          counts
        </text>
      </svg>

      <div className="reportLegend">
        {slices.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <div key={s.label} className="reportLegendRow">
              <span className="reportLegendSwatch" aria-hidden="true" style={{ background: s.color }} />
              <div className="reportLegendText" title={s.label}>
                {s.label}
              </div>
              <div className="reportLegendValue">
                {s.value} ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type StatsResponse = {
  clients?: Record<string, number>;
  [program: string]: any;
};

function formatMilestone(program: string, milestone: string): string {
  if (program === "Drug Rehabilitation" && /^\d+$/.test(milestone)) return `${milestone} days`;
  if (program === "Housing" || program === "Employment") {
    return milestone
      .split(/[\s_-]+/g)
      .filter(Boolean)
      .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
      .join(" ");
  }
  return milestone;
}

function milestoneDataForProgram(stats: StatsResponse, program: string): BarDatum[] {
  const raw = stats?.[program]?.general;
  if (!raw) return [];
  const entries = Object.entries(raw).map(([label, value]) => ({ label, value: Number(value) || 0 }));
  const order: string[] = stats?.[program]?.order;
  if (order?.length) {
    const idx = new Map(order.map((k, i) => [k, i]));
    return entries
      .sort((a, b) => (idx.get(a.label) ?? 999) - (idx.get(b.label) ?? 999))
      .filter((d) => d.value > 0)
      .map((d) => ({ ...d, label: formatMilestone(program, d.label) }));
  }
  return entries
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .map((d) => ({ ...d, label: formatMilestone(program, d.label) }));
}

const Report = () => {
  const [stats, setStats] = useState<StatsResponse>({});
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const statsRes = await axios.get(`${API_BASE}/stats`, {withCredentials: true});

        if (!cancelled) {
          setStats(statsRes.data && typeof statsRes.data === "object" ? (statsRes.data as StatsResponse) : {});
        }
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response) {
          setErrMsg(err.response.data?.detail || "Failed to load report");
        } else {
          setErrMsg("Unable to connect to server");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalClients = stats?.clients?.total || 0;

  const clientsPerProgramData = useMemo(() => {
    if (!stats?.clients) return [];
    const arr = Object.entries(stats.clients)
      .filter(([key]) => key !== "total")
      .map(([label, value]) => ({ label, value: Number(value) }));
    arr.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    return arr;
  }, [stats]);

  const programOptions = useMemo(() => {
    const fromStats = Object.keys(stats || {}).filter(k => k !== "clients");
    return ["All", ...fromStats.sort((a, b) => a.localeCompare(b))];
  }, [stats]);

  const visiblePrograms = useMemo(() => {
    const all = programOptions.filter((p) => p !== "All");
    if (selectedProgram === "All") return all;
    return all.includes(selectedProgram) ? [selectedProgram] : [];
  }, [programOptions, selectedProgram]);

  const clientsInScope = useMemo(() => {
    if (selectedProgram === "All") return totalClients;
    return stats?.clients?.[selectedProgram] || 0;
  }, [stats, selectedProgram, totalClients]);

  const selectedMilestones = useMemo(() => {
    if (selectedProgram === "All") return [];
    return milestoneDataForProgram(stats, selectedProgram);
  }, [selectedProgram, stats]);

  const selectedMilestonesPie = useMemo(() => collapseToTopNWithOther(selectedMilestones, 7), [selectedMilestones]);

  const summary = useMemo(() => {
    if (selectedProgram === "All") {
      const programCount = visiblePrograms.length;
      const milestoneBuckets = visiblePrograms.reduce((sum, p) => sum + milestoneDataForProgram(stats, p).length, 0);
      return { label: "All programs", programCount, milestoneBuckets, topLabel: "" };
    }
    const ms = selectedMilestones;
    const top = [...ms].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))[0];
    return {
      label: selectedProgram,
      programCount: 1,
      milestoneBuckets: ms.length,
      topLabel: top ? `${top.label} (${top.value})` : "—",
    };
  }, [selectedMilestones, selectedProgram, stats, visiblePrograms]);

  return (
    <div className="reportPage">
      <div className="reportHeaderRow">
        <div>
          <h1 className="reportTitle">Goal Progress</h1>
        </div>

        <div className="reportControls">
          <label className="reportLabel" htmlFor="program-filter">
            Filter by program
          </label>
          <select
            className="reportSelect"
            id="program-filter"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            disabled={loading || programOptions.length <= 1}
          >
            {programOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errMsg ? (
        <div className="reportErrorBox" role="alert">
          {errMsg}
        </div>
      ) : null}

      <div className="reportStatsGrid">
        <div className="reportCard reportStatCard">
          <div className="reportStatLabel">Scope</div>
          <div className="reportStatValue">{loading ? "…" : summary.label}</div>
        </div>
        <div className="reportCard reportStatCard">
          <div className="reportStatLabel">Total clients</div>
          <div className="reportStatValue">{loading ? "…" : totalClients}</div>
        </div>
        <div className="reportCard reportStatCard">
          <div className="reportStatLabel">
            {selectedProgram === "All" ? "Total programs" : "Program clients"}
          </div>
          <div className="reportStatValue">
            {loading 
              ? "…" 
              : selectedProgram === "All" 
                ? summary.programCount 
                : clientsInScope}
          </div>
        </div>
        <div className="reportCard reportStatCard">
          <div className="reportStatLabel">Milestone buckets</div>
          <div className="reportStatValue">{loading ? "…" : summary.milestoneBuckets}</div>
        </div>
      </div>

      <div className="reportChartsGrid">
        {selectedProgram === "All" ? (
          <div className="reportCard reportChartCard">
            <div className="reportCardTitle">Clients per program</div>
            <div className="reportCardHint">Enrollment counts based on clients’ programs</div>
            {loading ? (
              <div className="reportEmptyState">Loading…</div>
            ) : (
              <BarList data={clientsPerProgramData} color={palette.bubblegumPink} emptyLabel="No client data" />
            )}
          </div>
        ) : null}

        {selectedProgram === "All" ? (
          visiblePrograms.map((program) => {
            const data = milestoneDataForProgram(stats, program);
            return (
              <div key={program} className="reportCard reportChartCard">
                <div className="reportCardTitle">{program}</div>
                <div className="reportCardHint">Clients per milestone (distinct per milestone)</div>
                {loading ? (
                  <div className="reportEmptyState">Loading…</div>
                ) : (
                  <BarList data={data} color={palette.mutedTeal} emptyLabel="No milestone data" />
                )}
              </div>
            );
          })
        ) : (
          <>
            <div className="reportCard reportChartCard">
              <div className="reportCardTitle">{selectedProgram} milestones</div>
              <div className="reportCardHint">Clients per milestone (distinct per milestone)</div>
              {loading ? (
                <div className="reportEmptyState">Loading…</div>
              ) : (
                <BarList data={selectedMilestones} color={palette.mutedTeal} emptyLabel="No milestone data" />
              )}
            </div>

            <div className="reportCard reportChartCard">
              <div className="reportCardTitle">{selectedProgram} distribution</div>
              <div className="reportCardHint">Milestone share (collapsed to top slices)</div>
              {loading ? (
                <div className="reportEmptyState">Loading…</div>
              ) : (
                <PieChart data={selectedMilestonesPie} emptyLabel="No milestone data" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Report;
