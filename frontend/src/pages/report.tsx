import axios from "axios";
import { useEffect, useMemo, useState } from "react";

import api from "../api";
import { palette } from "../theme/palette";

type BarDatum = { label: string; value: number };

const CATEGORY_BAR_COLORS = [
  palette.forestGreen,
  palette.deepRed,
  palette.brightPeriwinkle,
  palette.tangerineOrange,
  palette.seafoamGreen,
] as const;

const PIE_COLORS = [
  palette.bubblegumPink,
  palette.seafoamGreen,
  palette.deepRed,
  palette.tangerineOrange,
  palette.mintGreen,
] as const;

function collapseToTopNWithOther(
  data: BarDatum[],
  maxSlices: number,
): BarDatum[] {
  if (maxSlices < 2) return data;
  const sorted = [...data].sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label),
  );
  if (sorted.length <= maxSlices) return sorted;
  const keep = sorted.slice(0, maxSlices - 1);
  const other = sorted
    .slice(maxSlices - 1)
    .reduce((sum, d) => sum + d.value, 0);
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
  if (data.length === 0)
    return <div className="reportEmptyState">{emptyLabel}</div>;

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
  if (!data.length || total <= 0)
    return <div className="reportEmptyState">{emptyLabel}</div>;

  const size = 172;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;

  const toPoint = (angleRad: number) => ({
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  });

  const slices = data.reduce<{
    angle: number;
    out: Array<BarDatum & { color: string; path: string }>;
  }>(
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
    { angle: -Math.PI / 2, out: [] },
  ).out;

  return (
    <div className="reportPieLayout">
      <svg
        className="reportPieSvg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Pie chart"
      >
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="white" />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize="12"
          fontWeight="900"
          fill="#222"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#6b6b6b"
        >
          counts
        </text>
      </svg>

      <div className="reportLegend">
        {slices.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <div key={s.label} className="reportLegendRow">
              <span
                className="reportLegendSwatch"
                aria-hidden="true"
                style={{ background: s.color }}
              />
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

type MilestoneCountRow = { milestone: string; value: number };

type ProgramGoalStats = Record<string, MilestoneCountRow[]>;

type KpiPayload = {
  totalParticipants?: number;
  participantsHoused?: number;
  housedWithin3MonthsPercent?: number | null;
  housedWithin3MonthsDenominator?: number;
  housedWithin12MonthsPercent?: number | null;
  housedWithin12MonthsDenominator?: number;
  mealsOrGroceriesProvided?: number | null;
  mealsOrGroceriesAvailable?: boolean;
  highSchoolGraduatePercent?: number | null;
  highSchoolGraduateReportingCount?: number;
  educationPlanPercent?: number | null;
  educationPlanEligibleCount?: number;
  employmentPlacements?: number;
  averageAgeYears?: number | null;
  ageDistribution?: { label: string; count: number }[];
  participantsWithAgeCount?: number;
  youthProgressPercent?: number | null;
  youthProgressEligibleCount?: number;
  giveBackPercent?: number | null;
  belongPercent?: number | null;
  recommendPercent?: number | null;
  outcomesSurveyAvailable?: boolean;
};

type StatsResponse = {
  clients?: Record<string, number>;
  kpis?: KpiPayload;
} & Record<
  string,
  ProgramGoalStats | Record<string, number> | KpiPayload | undefined
>;

function formatMilestone(program: string, milestone: string): string {
  if (program === "Drug Rehabilitation" && /^\d+$/.test(milestone))
    return `${milestone} days`;
  if (program === "Housing" || program === "Employment") {
    return milestone
      .split(/[\s_-]+/g)
      .filter(Boolean)
      .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1))
      .join(" ");
  }
  return milestone;
}

function humanizeMilestoneTreeKey(treeType: string): string {
  return treeType
    .split(/[\s_-]+/g)
    .filter(Boolean)
    .map((p) => p.slice(0, 1).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

const ALL_MILESTONE_CATEGORIES = "__all__" as const;

function getProgramGoalStats(
  stats: StatsResponse,
  program: string,
): ProgramGoalStats | null {
  const p = stats[program];
  if (!p || typeof p !== "object") return null;
  return p as ProgramGoalStats;
}

function treeKeysForProgram(programStats: ProgramGoalStats | null): string[] {
  if (!programStats) return [];
  return Object.keys(programStats)
    .filter((k) => Array.isArray(programStats[k]))
    .sort((a, b) => {
      if (a === "general") return -1;
      if (b === "general") return 1;
      return a.localeCompare(b);
    });
}

function barsForCategory(
  program: string,
  raw: MilestoneCountRow[] | undefined,
): BarDatum[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      label: formatMilestone(program, String(item.milestone)),
      value: Number(item.value) || 0,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

type MilestoneCategorySection = {
  key: string;
  title: string;
  data: BarDatum[];
};

function groupedMilestoneSections(
  stats: StatsResponse,
  program: string,
): MilestoneCategorySection[] {
  const programStats = getProgramGoalStats(stats, program);
  if (!programStats) return [];
  const sections: MilestoneCategorySection[] = [];
  for (const key of treeKeysForProgram(programStats)) {
    const raw = programStats[key] as MilestoneCountRow[];
    const data = barsForCategory(program, raw);
    if (data.length > 0) {
      sections.push({ key, title: humanizeMilestoneTreeKey(key), data });
    }
  }
  return sections;
}

function flatMilestonesForProgram(
  stats: StatsResponse,
  program: string,
  category: typeof ALL_MILESTONE_CATEGORIES | string,
): BarDatum[] {
  const programStats = getProgramGoalStats(stats, program);
  if (!programStats) return [];

  if (category !== ALL_MILESTONE_CATEGORIES) {
    return barsForCategory(
      program,
      programStats[category] as MilestoneCountRow[],
    );
  }

  const sections = groupedMilestoneSections(stats, program);
  if (sections.length === 0) return [];
  if (sections.length === 1) return sections[0].data;

  const merged: BarDatum[] = [];
  for (const s of sections) {
    for (const d of s.data) {
      merged.push({ label: `${s.title}: ${d.label}`, value: d.value });
    }
  }
  return merged.sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label),
  );
}

function countMilestoneBuckets(
  stats: StatsResponse,
  program: string,
  category: typeof ALL_MILESTONE_CATEGORIES | string,
): number {
  if (category !== ALL_MILESTONE_CATEGORIES) {
    return flatMilestonesForProgram(stats, program, category).length;
  }
  return groupedMilestoneSections(stats, program).reduce(
    (sum, s) => sum + s.data.length,
    0,
  );
}

function formatPercent(value: number | null | undefined, empty = "—"): string {
  if (value === null || value === undefined) return empty;
  return `${value}%`;
}

function formatNumber(value: number | null | undefined, empty = "—"): string {
  if (value === null || value === undefined) return empty;
  return String(value);
}

function KpiTile({
  title,
  value,
  hint,
  foot,
}: {
  title: string;
  value: string;
  hint?: string;
  foot?: string;
}) {
  return (
    <div className="reportKpiTile">
      <div className="reportKpiTileTitle">{title}</div>
      <div className="reportKpiTileValue">{value}</div>
      {hint ? <div className="reportKpiTileHint">{hint}</div> : null}
      {foot ? <div className="reportKpiTileFoot">{foot}</div> : null}
    </div>
  );
}

const Report = () => {
  const [stats, setStats] = useState<StatsResponse>({});
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ALL_MILESTONE_CATEGORIES,
  );
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        const statsRes = await api.get(`/stats`);

        if (!cancelled) {
          setStats(
            statsRes.data && typeof statsRes.data === "object"
              ? (statsRes.data as StatsResponse)
              : {},
          );
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

  useEffect(() => {
    setSelectedCategory(ALL_MILESTONE_CATEGORIES);
  }, [selectedProgram]);

  const categoryKeys = useMemo(() => {
    if (selectedProgram === "All") return [];
    return treeKeysForProgram(getProgramGoalStats(stats, selectedProgram));
  }, [stats, selectedProgram]);

  useEffect(() => {
    if (selectedProgram === "All") return;
    if (
      selectedCategory !== ALL_MILESTONE_CATEGORIES &&
      categoryKeys.length > 0 &&
      !categoryKeys.includes(selectedCategory)
    ) {
      setSelectedCategory(ALL_MILESTONE_CATEGORIES);
    }
  }, [selectedProgram, selectedCategory, categoryKeys]);

  const kpis = stats.kpis;

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
    const fromStats = Object.keys(stats || {}).filter(
      (k) => k !== "clients" && k !== "kpis",
    );
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
    return flatMilestonesForProgram(stats, selectedProgram, selectedCategory);
  }, [selectedProgram, selectedCategory, stats]);

  const selectedMilestonesPie = useMemo(
    () => collapseToTopNWithOther(selectedMilestones, 7),
    [selectedMilestones],
  );

  const singleProgramSections = useMemo(() => {
    if (selectedProgram === "All") return [];
    return groupedMilestoneSections(stats, selectedProgram);
  }, [selectedProgram, stats]);

  const summary = useMemo(() => {
    if (selectedProgram === "All") {
      const programCount = visiblePrograms.length;
      const milestoneBuckets = visiblePrograms.reduce(
        (sum, p) =>
          sum + countMilestoneBuckets(stats, p, ALL_MILESTONE_CATEGORIES),
        0,
      );
      return {
        label: "All programs",
        programCount,
        milestoneBuckets,
        topLabel: "",
      };
    }
    const ms = selectedMilestones;
    const top = [...ms].sort(
      (a, b) => b.value - a.value || a.label.localeCompare(b.label),
    )[0];
    return {
      label: selectedProgram,
      programCount: 1,
      milestoneBuckets: countMilestoneBuckets(
        stats,
        selectedProgram,
        selectedCategory,
      ),
      topLabel: top ? `${top.label} (${top.value})` : "—",
    };
  }, [
    selectedMilestones,
    selectedProgram,
    selectedCategory,
    stats,
    visiblePrograms,
  ]);

  const ageBarData: BarDatum[] = useMemo(() => {
    const dist = kpis?.ageDistribution;
    if (!dist?.length) return [];
    return dist.map((d) => ({ label: d.label, value: d.count }));
  }, [kpis?.ageDistribution]);

  return (
    <div className="reportPage">
      <div className="reportHeaderRow">
        <div>
          <h1 className="reportTitle">Impact report</h1>
          <p className="reportSubTitle">
            Organization KPIs derived from participant records. Milestone charts
            reflect program progress in the system.
          </p>
        </div>

        <div className="reportControlsRow">
          <div className="reportControls">
            <label className="reportLabel" htmlFor="program-filter">
              Program
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

          {selectedProgram !== "All" ? (
            <div className="reportControls">
              <label
                className="reportLabel"
                htmlFor="milestone-category-filter"
              >
                Milestone category
              </label>
              <select
                className="reportSelect"
                id="milestone-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={loading || categoryKeys.length === 0}
              >
                <option value={ALL_MILESTONE_CATEGORIES}>All categories</option>
                {categoryKeys.map((key) => (
                  <option key={key} value={key}>
                    {humanizeMilestoneTreeKey(key)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </div>

      {errMsg ? (
        <div className="reportErrorBox" role="alert">
          {errMsg}
        </div>
      ) : null}

      <section className="reportKpiSection" aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="reportSectionTitle">
          Key performance indicators
        </h2>

        <div className="reportKpiGrid">
          <KpiTile
            title="Total participants"
            value={loading ? "…" : formatNumber(kpis?.totalParticipants, "0")}
            hint="All client records in the system."
          />
          <KpiTile
            title="Participants housed"
            value={loading ? "…" : formatNumber(kpis?.participantsHoused)}
            hint="Housing program milestone (transitional / permanent) or stable housing status on file."
          />
          <KpiTile
            title="Housed within 3 months of program start"
            value={
              loading ? "…" : formatPercent(kpis?.housedWithin3MonthsPercent)
            }
            foot={
              !loading && kpis?.housedWithin3MonthsDenominator != null
                ? `Based on ${kpis.housedWithin3MonthsDenominator} Housing enrollments with start and update dates.`
                : undefined
            }
          />
          <KpiTile
            title="Housed within 12 months of program start"
            value={
              loading ? "…" : formatPercent(kpis?.housedWithin12MonthsPercent)
            }
            foot={
              !loading && kpis?.housedWithin12MonthsDenominator != null
                ? `Based on ${kpis.housedWithin12MonthsDenominator} Housing enrollments with start and update dates.`
                : undefined
            }
          />
          <KpiTile
            title="Meals / bags of groceries"
            value={
              loading
                ? "…"
                : kpis?.mealsOrGroceriesAvailable
                  ? formatNumber(kpis?.mealsOrGroceriesProvided)
                  : "Not tracked"
            }
            hint="Service counts are not stored in this database yet."
          />
          <KpiTile
            title="High school completion (intake)"
            value={
              loading ? "…" : formatPercent(kpis?.highSchoolGraduatePercent)
            }
            foot={
              !loading && kpis?.highSchoolGraduateReportingCount != null
                ? `${kpis.highSchoolGraduateReportingCount} participants answered the high school question.`
                : undefined
            }
          />
          <KpiTile
            title="Education plan (proxy)"
            value={loading ? "…" : formatPercent(kpis?.educationPlanPercent)}
            hint="Enrolled in school, education referral, or Education program."
            foot={
              !loading && kpis?.educationPlanEligibleCount != null
                ? `Eligible denominator: ${kpis.educationPlanEligibleCount} participants with intake or programs.`
                : undefined
            }
          />
          <KpiTile
            title="Employment placements"
            value={loading ? "…" : formatNumber(kpis?.employmentPlacements)}
            hint="Employment program milestone hired or stable."
          />
          <KpiTile
            title="Average age"
            value={
              loading
                ? "…"
                : kpis?.averageAgeYears != null
                  ? `${kpis.averageAgeYears} yrs`
                  : "—"
            }
            foot={
              !loading && kpis?.participantsWithAgeCount != null
                ? `From ${kpis.participantsWithAgeCount} participants with a date of birth.`
                : undefined
            }
          />
          <KpiTile
            title="Youth (under 25) with program progress"
            value={loading ? "…" : formatPercent(kpis?.youthProgressPercent)}
            hint="At least one milestone past the starting step in an enrolled program."
            foot={
              !loading && kpis?.youthProgressEligibleCount != null
                ? `${kpis.youthProgressEligibleCount} youth with program enrollment.`
                : undefined
            }
          />
          <KpiTile
            title="Participants who “give back”"
            value={
              loading
                ? "…"
                : kpis?.outcomesSurveyAvailable
                  ? formatPercent(kpis?.giveBackPercent)
                  : "Not tracked"
            }
            hint="Requires outcome survey fields on client records."
          />
          <KpiTile
            title="Feel they “belong” at Aunt Leah’s"
            value={
              loading
                ? "…"
                : kpis?.outcomesSurveyAvailable
                  ? formatPercent(kpis?.belongPercent)
                  : "Not tracked"
            }
            hint="Requires outcome survey fields on client records."
          />
          <KpiTile
            title="Would recommend Aunt Leah’s"
            value={
              loading
                ? "…"
                : kpis?.outcomesSurveyAvailable
                  ? formatPercent(kpis?.recommendPercent)
                  : "Not tracked"
            }
            hint="Requires outcome survey fields on client records."
          />
        </div>

        <div className="reportCard reportChartCard reportKpiAgeCard">
          <div className="reportCardTitle">Age distribution</div>
          <div className="reportCardHint">
            Participants with a date of birth on file
          </div>
          {loading ? (
            <div className="reportEmptyState">Loading…</div>
          ) : (
            <BarList
              data={ageBarData}
              color={palette.forestGreen}
              emptyLabel="No age data"
            />
          )}
        </div>
      </section>

      <section
        className="reportMilestoneSection"
        aria-labelledby="milestone-heading"
      >
        <h2 id="milestone-heading" className="reportSectionTitle">
          Program milestones
        </h2>

        <div className="reportStatsGrid">
          <div className="reportCard reportStatCard">
            <div className="reportStatLabel">Scope</div>
            <div className="reportStatValue">
              {loading ? "…" : summary.label}
            </div>
          </div>
          <div className="reportCard reportStatCard">
            <div className="reportStatLabel">Total clients</div>
            <div className="reportStatValue">
              {loading ? "…" : totalClients}
            </div>
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
            <div className="reportStatValue">
              {loading ? "…" : summary.milestoneBuckets}
            </div>
          </div>
        </div>
        {selectedProgram === "All" ? (
          <div className="reportCard reportChartCard reportClientPerProgram">
            <div className="reportCardTitle">Clients per program</div>
            <div className="reportCardHint">
              Enrollment counts based on clients’ programs
            </div>
            {loading ? (
              <div className="reportEmptyState">Loading…</div>
            ) : (
              <BarList
                data={clientsPerProgramData}
                color={palette.bubblegumPink}
                emptyLabel="No client data"
              />
            )}
          </div>
        ) : null}
        <div className="reportChartsGrid">
          {selectedProgram === "All" ? (
            visiblePrograms.map((program) => {
              const sections = groupedMilestoneSections(stats, program);
              return (
                <div key={program} className="reportCard reportChartCard">
                  <div className="reportCardTitle">{program}</div>
                  <div className="reportCardHint">
                    Clients per milestone, grouped by category
                  </div>
                  {loading ? (
                    <div className="reportEmptyState">Loading…</div>
                  ) : sections.length === 0 ? (
                    <div className="reportEmptyState">No milestone data</div>
                  ) : (
                    sections.map((sec, secIdx) => (
                      <div
                        key={sec.key}
                        className="reportMilestoneCategoryBlock"
                      >
                        <div className="reportMilestoneCategoryTitle">
                          {sec.title}
                        </div>
                        <BarList
                          data={sec.data}
                          color={
                            CATEGORY_BAR_COLORS[
                              secIdx % CATEGORY_BAR_COLORS.length
                            ]
                          }
                          emptyLabel="No data in this category"
                        />
                      </div>
                    ))
                  )}
                </div>
              );
            })
          ) : (
            <>
              <div className="reportCard reportChartCard">
                <div className="reportCardTitle">
                  {selectedProgram} milestones
                </div>
                <div className="reportCardHint">
                  {selectedCategory === ALL_MILESTONE_CATEGORIES
                    ? "Clients per milestone, grouped by category"
                    : `Clients per milestone — ${humanizeMilestoneTreeKey(selectedCategory)}`}
                </div>
                {loading ? (
                  <div className="reportEmptyState">Loading…</div>
                ) : selectedCategory === ALL_MILESTONE_CATEGORIES ? (
                  singleProgramSections.length === 0 ? (
                    <div className="reportEmptyState">No milestone data</div>
                  ) : (
                    singleProgramSections.map((sec, secIdx) => (
                      <div
                        key={sec.key}
                        className="reportMilestoneCategoryBlock"
                      >
                        <div className="reportMilestoneCategoryTitle">
                          {sec.title}
                        </div>
                        <BarList
                          data={sec.data}
                          color={
                            CATEGORY_BAR_COLORS[
                              secIdx % CATEGORY_BAR_COLORS.length
                            ]
                          }
                          emptyLabel="No data in this category"
                        />
                      </div>
                    ))
                  )
                ) : (
                  <BarList
                    data={selectedMilestones}
                    color={
                      CATEGORY_BAR_COLORS[
                        Math.max(0, categoryKeys.indexOf(selectedCategory)) %
                          CATEGORY_BAR_COLORS.length
                      ]
                    }
                    emptyLabel="No milestone data"
                  />
                )}
              </div>

              <div className="reportCard reportChartCard">
                <div className="reportCardTitle">
                  {selectedProgram} distribution
                </div>
                <div className="reportCardHint">
                  {selectedCategory === ALL_MILESTONE_CATEGORIES
                    ? "Share across milestones per category"
                    : `Share across milestones — ${humanizeMilestoneTreeKey(selectedCategory)}`}
                </div>
                {loading ? (
                  <div className="reportEmptyState">Loading…</div>
                ) : selectedCategory === ALL_MILESTONE_CATEGORIES ? (
                  singleProgramSections.length === 0 ? (
                    <div className="reportEmptyState">No milestone data</div>
                  ) : (
                    singleProgramSections.map((sec) => (
                      <div
                        key={`pie-${sec.key}`}
                        className="reportMilestoneCategoryBlock"
                      >
                        <div className="reportMilestoneCategoryTitle">
                          {sec.title}
                        </div>
                        <PieChart
                          data={collapseToTopNWithOther(sec.data, 7)}
                          emptyLabel="No milestone data"
                        />
                      </div>
                    ))
                  )
                ) : (
                  <PieChart
                    data={selectedMilestonesPie}
                    emptyLabel="No milestone data"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Report;
