import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const palette = {
  crimsonViolet: "#4d1e31",
  mutedTeal: "#93a48d",
  bubblegumPink: "#bf606e",
  brightSnow: "#f7f8f7",
  white: "#ffffff",
} as const;

type Program = {
  _id: string;
  name: string;
};

type BarDatum = { label: string; value: number };

const API_BASE = (import.meta as ImportMeta).env?.VITE_API_BASE_URL || "http://localhost:8000";

const PIE_COLORS = [
  palette.bubblegumPink,
  palette.mutedTeal,
  palette.crimsonViolet,
  "#7a9cc6",
  "#f0b35f",
  "#7bbf9a",
  "#c08bb3",
  "#9aa0a6",
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
  if (data.length === 0) return <EmptyState>{emptyLabel}</EmptyState>;

  return (
    <BarListWrap>
      {data.map((d) => (
        <BarRow key={d.label}>
          <BarLabel title={d.label}>{d.label}</BarLabel>
          <BarTrack aria-hidden="true">
            <BarFill $w={max ? (d.value / max) * 100 : 0} $c={color} />
          </BarTrack>
          <BarValue>{d.value}</BarValue>
        </BarRow>
      ))}
    </BarListWrap>
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
  if (!data.length || total <= 0) return <EmptyState>{emptyLabel}</EmptyState>;

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
    <PieLayout>
      <PieSvg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Pie chart">
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
      </PieSvg>

      <Legend>
        {slices.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <LegendRow key={s.label}>
              <LegendSwatch aria-hidden="true" style={{ background: s.color }} />
              <LegendText title={s.label}>{s.label}</LegendText>
              <LegendValue>
                {s.value} ({pct}%)
              </LegendValue>
            </LegendRow>
          );
        })}
      </Legend>
    </PieLayout>
  );
}

type StatsResponse = Record<string, { general?: Record<string, number> }>;

const MILESTONE_ORDER: Record<string, string[]> = {
  Housing: ["homeless", "shelter", "transitional"],
  Education: ["F", "D", "C", "B", "A"],
  Employment: ["unemployed", "search", "interview", "hired", "stable"],
  "Drug Rehabilitation": ["7", "15", "30", "90", "180", "360"],
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
  const order = MILESTONE_ORDER[program];
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
  const [programs, setPrograms] = useState<Program[]>([]);
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
        const [statsRes, progRes] = await Promise.all([
          axios.get(`${API_BASE}/stats`, { withCredentials: true }),
          axios.get(`${API_BASE}/programs`, { withCredentials: true }),
        ]);

        const progData = Array.isArray(progRes.data) ? progRes.data : progRes.data?.programs;

        if (!cancelled) {
          setPrograms(Array.isArray(progData) ? (progData as Program[]) : []);
          setStats(statsRes.data && typeof statsRes.data === "object" ? (statsRes.data as StatsResponse) : {});
        }
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response) {
          setErrMsg(err.response.data?.detail || "Failed to load demographics");
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

  const programOptions = useMemo(() => {
    const fromApi = programs.map((p) => p.name).filter(Boolean);
    const fromStats = Object.keys(stats || {});
    return ["All", ...Array.from(new Set([...fromApi, ...fromStats])).sort((a, b) => a.localeCompare(b))];
  }, [programs, stats]);

  const visiblePrograms = useMemo(() => {
    const all = programOptions.filter((p) => p !== "All");
    if (selectedProgram === "All") return all;
    return all.includes(selectedProgram) ? [selectedProgram] : [];
  }, [programOptions, selectedProgram]);

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
    <Page>
      <HeaderRow>
        <div>
          <Title>Goal Progress</Title>
          <SubTitle>Milestone counts by program from current goal data.</SubTitle>
        </div>

        <Controls>
          <Label htmlFor="program-filter">Filter by program</Label>
          <Select
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
          </Select>
        </Controls>
      </HeaderRow>

      {errMsg ? <ErrorBox role="alert">{errMsg}</ErrorBox> : null}

      <Grid>
        <StatCard>
          <StatLabel>Scope</StatLabel>
          <StatValue>{loading ? "…" : summary.label}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Programs</StatLabel>
          <StatValue>{loading ? "…" : summary.programCount}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Milestone buckets</StatLabel>
          <StatValue>{loading ? "…" : summary.milestoneBuckets}</StatValue>
        </StatCard>
      </Grid>

      <Charts>
        {selectedProgram === "All" ? (
          visiblePrograms.map((program) => {
            const data = milestoneDataForProgram(stats, program);
            return (
              <ChartCard key={program}>
                <CardTitle>{program}</CardTitle>
                <CardHint>Clients per milestone (distinct per milestone)</CardHint>
                {loading ? (
                  <EmptyState>Loading…</EmptyState>
                ) : (
                  <BarList data={data} color={palette.mutedTeal} emptyLabel="No milestone data" />
                )}
              </ChartCard>
            );
          })
        ) : (
          <>
            <ChartCard>
              <CardTitle>{selectedProgram} milestones</CardTitle>
              <CardHint>Clients per milestone (distinct per milestone)</CardHint>
              {loading ? (
                <EmptyState>Loading…</EmptyState>
              ) : (
                <BarList data={selectedMilestones} color={palette.mutedTeal} emptyLabel="No milestone data" />
              )}
            </ChartCard>

            <ChartCard>
              <CardTitle>{selectedProgram} distribution</CardTitle>
              <CardHint>Milestone share (collapsed to top slices)</CardHint>
              {loading ? <EmptyState>Loading…</EmptyState> : <PieChart data={selectedMilestonesPie} emptyLabel="No milestone data" />}
            </ChartCard>
          </>
        )}
      </Charts>
    </Page>
  );
};

export default Report;

const Page = styled.div`
  padding: 24px;
  background: ${palette.brightSnow};
  min-height: calc(100vh - 70px);
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  max-width: 1120px;
  margin: 0 auto 16px auto;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 34px;
  letter-spacing: -0.02em;
  color: ${palette.crimsonViolet};
`;

const SubTitle = styled.p`
  margin: 6px 0 0 0;
  color: #5a5a5a;
  font-size: 14px;
`;

const Controls = styled.div`
  display: grid;
  gap: 6px;
  min-width: 260px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #5a5a5a;
`;

const Select = styled.select`
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e2e2e2;
  background: white;
  padding: 0 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  outline: none;
`;

const ErrorBox = styled.div`
  max-width: 1120px;
  margin: 0 auto 14px auto;
  background: #fff3f4;
  border: 1px solid #ffd0d6;
  color: #7a0b1e;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
`;

const Grid = styled.div`
  max-width: 1120px;
  margin: 0 auto 18px auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 14px 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: #6b6b6b;
`;

const StatValue = styled.div`
  margin-top: 8px;
  font-size: 30px;
  font-weight: 900;
  color: #222;
`;

const Charts = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 14px 14px 12px 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`;

const CardTitle = styled.div`
  font-weight: 900;
  color: #2b2b2b;
  font-size: 14px;
`;

const CardHint = styled.div`
  margin-top: 4px;
  color: #6b6b6b;
  font-size: 12px;
`;

const EmptyState = styled.div`
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed #e2e2e2;
  color: #6b6b6b;
  font-size: 13px;
`;

const BarListWrap = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 10px;
`;

const BarRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr 44px;
  align-items: center;
  gap: 10px;
`;

const BarLabel = styled.div`
  font-size: 12px;
  color: #2b2b2b;
  font-weight: 700;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const BarTrack = styled.div`
  height: 10px;
  border-radius: 999px;
  background: #f0f0f0;
  overflow: hidden;
`;

const BarFill = styled.div<{ $w: number; $c: string }>`
  height: 100%;
  width: ${(p) => p.$w}%;
  background: ${(p) => p.$c};
  border-radius: 999px;
`;

const BarValue = styled.div`
  font-size: 12px;
  color: #2b2b2b;
  font-weight: 900;
  text-align: right;
`;

const PieLayout = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const PieSvg = styled.svg`
  width: 180px;
  height: 180px;
  display: block;
  margin: 0 auto;
`;

const Legend = styled.div`
  display: grid;
  gap: 8px;
`;

const LegendRow = styled.div`
  display: grid;
  grid-template-columns: 12px 1fr auto;
  gap: 8px;
  align-items: center;
`;

const LegendSwatch = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 4px;
`;

const LegendText = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #2b2b2b;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const LegendValue = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: #2b2b2b;
  text-align: right;
`;
