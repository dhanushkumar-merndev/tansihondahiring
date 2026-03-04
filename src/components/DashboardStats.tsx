"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseLeadDate(raw: string): Date | null {
  if (!raw) return null;
  // Normalize: remove non-breaking spaces, collapse whitespace, trim
  const cleaned = raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // No $ anchor — tolerates trailing whitespace or invisible chars from Sheets
  const m = cleaned.match(
    /^(\d{1,2})-(\w{3})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)/i,
  );
  if (m) {
    let [, d, mon, y, h, min, ap] = m;
    let hh = parseInt(h);
    if (ap.toLowerCase() === "pm" && hh !== 12) hh += 12;
    if (ap.toLowerCase() === "am" && hh === 12) hh = 0;
    return new Date(
      parseInt(y),
      MONTHS[mon.toLowerCase()] ?? 0,
      parseInt(d),
      hh,
      parseInt(min),
    );
  }
  const d2 = new Date(raw);
  return isNaN(d2.getTime()) ? null : d2;
}

// ISO key for sorting: "2026-02-27" — lexicographic sort = chronological
function toISOKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Display label: "27 Feb"
function toDisplayLabel(isoKey: string): string {
  const [y, mo, d] = isoKey.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

// Decimal label: "27/02/2026"
function toFullDecimalDate(isoKey: string): string {
  const [y, mo, d] = isoKey.split("-").map(Number);
  if (!y || !mo || !d) return isoKey;
  const day = String(d).padStart(2, "0");
  const month = String(mo).padStart(2, "0");
  return `${day}/${month}/${y}`;
}

const CustomCalendar = ({
  startDate,
  endDate,
  min,
  max,
  onRangeChange,
  onClose,
}: {
  startDate: string;
  endDate: string;
  min?: string | null;
  max?: string | null;
  onRangeChange: (start: string, end: string) => void;
  onClose: () => void;
}) => {
  const [viewDate, setViewDate] = React.useState(() => {
    if (startDate) return new Date(startDate);
    if (min) return new Date(min);
    return new Date();
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isInRange = (dISO: string) => {
    if (!startDate || !endDate) return false;
    return dISO > startDate && dISO < endDate;
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dISO = toISOKey(d);
    if (min && dISO < min) return true;
    if (max && dISO > max) return true;
    return false;
  };

  const handleSelect = (day: number) => {
    if (isDisabled(day)) return;
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dISO = toISOKey(d);

    // Deselection logic
    if (dISO === startDate) {
      onRangeChange(endDate || "", "");
      return;
    }
    if (dISO === endDate) {
      onRangeChange(startDate, "");
      return;
    }

    if (!startDate) {
      onRangeChange(dISO, "");
    } else if (!endDate) {
      if (dISO < startDate) {
        onRangeChange(dISO, startDate);
      } else {
        onRangeChange(startDate, dISO);
      }
    } else {
      // Both exist: smart update based on proximity or boundary
      if (dISO < startDate) {
        onRangeChange(dISO, endDate);
      } else if (dISO > endDate) {
        onRangeChange(startDate, dISO);
      } else {
        // Inside range: find nearest boundary to update
        const distToStart = Math.abs(
          new Date(dISO).getTime() - new Date(startDate).getTime(),
        );
        const distToEnd = Math.abs(
          new Date(dISO).getTime() - new Date(endDate).getTime(),
        );
        if (distToStart < distToEnd) {
          onRangeChange(dISO, endDate);
        } else {
          onRangeChange(startDate, dISO);
        }
      }
    }
  };

  const changeMonth = (offset: number) => {
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1),
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        boxShadow: "0 20px 48px -12px rgba(0,0,0,0.15)",
        padding: "24px",
        width: 320,
        animation: "calendarAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <style>{`
        @keyframes calendarAppear { from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.95); } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        .day-btn { position: relative; z-index: 1; height: 38px; width: 38px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #475569; border: none; background: transparent; cursor: pointer; border-radius: 50%; transition: all 0.2s; }
        .day-btn:disabled { color: #f1f5f9; cursor: not-allowed; }
        .day-btn:hover:not(:disabled) { background: #fef2f2; color: #ef4444; }
        .day-btn.selected { background: #ef4444 !important; color: #fff !important; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .day-range { position: absolute; inset: 4px -2px; background: #fef2f2; z-index: -1; }
        .day-range.start { border-top-left-radius: 50%; border-bottom-left-radius: 50%; left: 4px; }
        .day-range.end { border-top-right-radius: 50%; border-bottom-right-radius: 50%; right: 4px; }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            changeMonth(-1);
          }}
          style={{
            border: "none",
            background: "#f8fafc",
            borderRadius: 10,
            padding: 6,
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <h4
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 900,
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {months[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            changeMonth(1);
          }}
          style={{
            border: "none",
            background: "#f8fafc",
            borderRadius: 10,
            padding: 6,
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px 0",
        }}
      >
        {days.map((d) => (
          <div
            key={d}
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "#94a3b8",
              textAlign: "center",
              paddingBottom: 12,
            }}
          >
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}
        {currentMonthDays.map((d) => {
          const dt = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
          const dISO = toISOKey(dt);
          const disabled = isDisabled(d);
          const isStart = dISO === startDate;
          const isEnd = dISO === endDate;
          const inRange = isInRange(dISO);

          return (
            <div
              key={d}
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {inRange && (
                <div
                  className={`day-range ${isStart ? "start" : ""} ${isEnd ? "end" : ""}`}
                />
              )}
              <button
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(d);
                }}
                className={`day-btn ${isStart || isEnd ? "selected" : ""}`}
              >
                {d}
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            border: "none",
            background: "#ef4444",
            color: "#fff",
            borderRadius: 10,
            padding: "8px 20px",
            fontSize: 11,
            fontWeight: 900,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

interface StatsProps {
  total: number;
  pending: number;
  rejected: number;
  inprocess: number;
  rawLeads: any[];
}

type FilterType = "7d" | "30d" | "90d" | "all";
type CategoryType =
  | "all"
  | "new"
  | "called"
  | "rejected"
  | "interested"
  | "inprocess";
type ChartType = "line" | "bar";

const SERIES: { key: CategoryType; label: string; color: string }[] = [
  { key: "new", label: "New", color: "#ef4444" },
  { key: "rejected", label: "Rejected", color: "#f59e0b" },
  { key: "interested", label: "Interested", color: "#10b981" },
  { key: "inprocess", label: "In Process", color: "#b910a0ff" },
];

const DashboardStats: React.FC<StatsProps> = ({
  total,
  pending,
  rejected,
  inprocess,
  rawLeads,
}) => {
  const [filter, setFilter] = React.useState<FilterType>("30d");
  const [category, setCategory] = React.useState<CategoryType>("all");
  const [chartType, setChartType] = React.useState<ChartType>("line");
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [exportFrom, setExportFrom] = React.useState("");
  const [exportTo, setExportTo] = React.useState("");

  const [activePicker, setActivePicker] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Close active picker if clicking outside
      if (
        activePicker &&
        !(e.target as HTMLElement).closest(".custom-date-container")
      ) {
        setActivePicker(false);
      }
      if (!(e.target as HTMLElement).closest(".dropdown-root")) {
        setCategoryOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dateRange = React.useMemo(() => {
    if (!rawLeads.length) return { min: null, max: null };
    const dates = rawLeads
      .map((l) => parseLeadDate(l.created_time))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (!dates.length) return { min: null, max: null };
    return {
      min: dates[0],
      max: dates[dates.length - 1],
      minISO: toISOKey(dates[0]),
      maxISO: toISOKey(dates[dates.length - 1]),
    };
  }, [rawLeads]);

  const handleExport = () => {
    if (!exportFrom || !exportTo) return;

    const fromDate = new Date(exportFrom);
    const toDate = new Date(exportTo);
    toDate.setHours(23, 59, 59, 999);

    const filteredLeads = rawLeads.filter((lead) => {
      const d = parseLeadDate(lead.created_time);
      return d && d >= fromDate && d <= toDate;
    });

    const headers = ["created_time", "position", "full_name", "phone", "email"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map((lead) =>
        headers
          .map((h) => {
            let val = lead[h] || "";
            if (h === "created_time") {
              const d = parseLeadDate(val);
              if (d) val = toFullDecimalDate(toISOKey(d));
            }
            return `"${val.toString().replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const nowTime = new Date();
    const timeStr =
      nowTime.getHours().toString().padStart(2, "0") +
      nowTime.getMinutes().toString().padStart(2, "0") +
      nowTime.getSeconds().toString().padStart(2, "0");

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leads_export_${exportFrom}_to_${exportTo}_${timeStr}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const chartData = React.useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;
    if (filter === "7d") cutoff = new Date(now.getTime() - 7 * 86400000);
    if (filter === "30d") cutoff = new Date(now.getTime() - 30 * 86400000);
    if (filter === "90d") cutoff = new Date(now.getTime() - 90 * 86400000);

    // Key by ISO string — safe to sort lexicographically
    const dayMap: Record<
      string,
      {
        new: number;
        called: number;
        rejected: number;
        interested: number;
        inprocess: number;
      }
    > = {};

    rawLeads.forEach((lead) => {
      const dc = parseLeadDate(lead.created_time);
      const du = lead.updated_time ? parseLeadDate(lead.updated_time) : null;

      // 1. Handle NEW series (ALWAYS uses created_time)
      if (dc && (!cutoff || dc >= cutoff)) {
        const key = toISOKey(dc);
        if (!dayMap[key])
          dayMap[key] = {
            new: 0,
            called: 0,
            rejected: 0,
            interested: 0,
            inprocess: 0,
          };
        dayMap[key].new++;
      }

      // 2. Handle status-based series (ONLY uses updated_time)
      // These represent active changes made by the user
      if (du && (!cutoff || du >= cutoff)) {
        const key = toISOKey(du);
        if (!dayMap[key])
          dayMap[key] = {
            new: 0,
            called: 0,
            rejected: 0,
            interested: 0,
            inprocess: 0,
          };

        if (lead.status === "Called") dayMap[key].called++;
        if (lead.status === "Rejected") dayMap[key].rejected++;
        if (lead.interested === "Yes") dayMap[key].interested++;
        if (lead.inprocess === "Yes") dayMap[key].inprocess++;
      }
    });

    if (cutoff) {
      const totalDays = Math.ceil(
        (now.getTime() - cutoff.getTime()) / 86400000,
      );
      const result: any[] = [];
      for (let i = totalDays; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const isoKey = toISOKey(d);
        result.push({
          date: toDisplayLabel(isoKey),
          ...(dayMap[isoKey] || {
            new: 0,
            called: 0,
            rejected: 0,
            interested: 0,
            inprocess: 0,
          }),
        });
      }
      return result;
    }

    // 'all' — sort by ISO key (YYYY-MM-DD sorts correctly as string)
    return Object.entries(dayMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([isoKey, counts]) => ({ date: toDisplayLabel(isoKey), ...counts }));
  }, [rawLeads, filter]);

  const stats = [
    {
      label: "New Applications",
      value: total,
      accent: "#ef4444",
      iconPath:
        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      label: "Awaiting Call",
      value: pending,
      accent: "#f59e0b",
      iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Rejected",
      value: rejected,
      accent: "#ef4444",
      iconPath:
        "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "In Process",
      value: inprocess,
      accent: "#9333ea",
      iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "All Time", value: "all" },
  ];
  const categoryOptions: { label: string; value: CategoryType }[] = [
    { label: "All Lines", value: "all" },
    { label: "New Application", value: "new" },
    { label: "Rejected", value: "rejected" },
    { label: "Interested", value: "interested" },
    { label: "In Process", value: "inprocess" },
  ];

  const activeSeries =
    category === "all" ? SERIES : SERIES.filter((s) => s.key === category);
  const tickInterval =
    filter === "7d"
      ? 0
      : filter === "30d"
        ? 4
        : filter === "90d"
          ? 9
          : "preserveStartEnd";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "10px 16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          outline: "none",
        }}
      >
        <p
          style={{
            color: "#94a3b8",
            fontSize: 10,
            fontWeight: 700,
            marginBottom: 6,
            fontFamily: "monospace",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>
        {payload.map((p: any) => (
          <div
            key={p.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: p.color,
              }}
            />
            <span
              style={{
                color: "#64748b",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "monospace",
                textTransform: "uppercase",
              }}
            >
              {p.dataKey}
            </span>
            <span
              style={{
                color: p.color,
                fontSize: 16,
                fontWeight: 900,
                fontFamily: "monospace",
                marginLeft: 4,
              }}
            >
              {p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const triggerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 9,
    fontWeight: 900,
    color: "#334155",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    outline: "none",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  };
  const menuStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 50,
    minWidth: 130,
    overflow: "hidden",
  };
  const menuItemStyle = (active: boolean): React.CSSProperties => ({
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "9px 14px",
    border: "none",
    cursor: "pointer",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    transition: "all 0.1s ease",
    background: active ? "#fef2f2" : "transparent",
    color: active ? "#ef4444" : "#475569",
    outline: "none",
  });

  return (
    <div style={{ fontFamily: "'DM Mono', 'IBM Plex Mono', monospace" }}>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
        }
        .chart-controls {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }
        .dropdown-root { position: relative; display: inline-block; }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .chart-controls {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>

      {/* Stats Row */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              cursor: "default",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                `0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px ${stat.accent}33`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 1px 8px rgba(0,0,0,0.06)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 900,
                  color: "#94a3b8",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  lineHeight: 1.3,
                }}
              >
                {stat.label}
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: stat.accent + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: 6,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke={stat.accent}
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                  style={{ outline: "none" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={stat.iconPath}
                  />
                </svg>
              </div>
            </div>
            <span
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </span>
            <div
              style={{
                height: 2,
                borderRadius: 99,
                background: `linear-gradient(90deg, ${stat.accent}, transparent)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Chart Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 20,
          padding: "18px 20px",
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div className="chart-header">
          {/* Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {activeSeries.map((s) => (
              <span
                key={s.key}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: s.color,
                    display: "inline-block",
                    boxShadow: `0 0 5px ${s.color}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 900,
                    color: s.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {s.label}
                </span>
              </span>
            ))}
          </div>

          <div className="chart-controls">
            {/* Line / Bar icon toggle */}
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 8,
                padding: 3,
                border: "1px solid #e2e8f0",
              }}
            >
              {[
                {
                  type: "line" as ChartType,
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 17l6-6 4 4 8-8"
                      />
                    </svg>
                  ),
                },
                {
                  type: "bar" as ChartType,
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24">
                      <rect
                        x="3"
                        y="12"
                        width="4"
                        height="9"
                        rx="1"
                        fill="currentColor"
                      />
                      <rect
                        x="10"
                        y="7"
                        width="4"
                        height="14"
                        rx="1"
                        fill="currentColor"
                      />
                      <rect
                        x="17"
                        y="3"
                        width="4"
                        height="18"
                        rx="1"
                        fill="currentColor"
                      />
                    </svg>
                  ),
                },
              ].map(({ type, icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  title={type === "line" ? "Line chart" : "Bar chart"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 26,
                    background: chartType === type ? "#ffffff" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: chartType === type ? "#ef4444" : "#94a3b8",
                    outline: "none",
                    transition: "all 0.15s ease",
                    boxShadow:
                      chartType === type ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <div className="dropdown-root">
              <button
                style={triggerStyle}
                onClick={() => {
                  setCategoryOpen((v) => !v);
                  setFilterOpen(false);
                }}
              >
                {categoryOptions.find((c) => c.value === category)?.label}
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {categoryOpen && (
                <div style={menuStyle}>
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      style={menuItemStyle(category === opt.value)}
                      onClick={() => {
                        setCategory(opt.value);
                        setCategoryOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date filter dropdown */}
            <div className="dropdown-root">
              <button
                style={triggerStyle}
                onClick={() => {
                  setFilterOpen((v) => !v);
                  setCategoryOpen(false);
                }}
              >
                {filterOptions.find((f) => f.value === filter)?.label}
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {filterOpen && (
                <div style={menuStyle}>
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      style={menuItemStyle(filter === opt.value)}
                      onClick={() => {
                        setFilter(opt.value);
                        setFilterOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Trigger */}
            <button
              style={{
                ...triggerStyle,
                padding: "5px 8px",
                color: "#ef4444",
                borderColor: "#ef4444",
              }}
              onClick={() => {
                if (dateRange.minISO && dateRange.maxISO) {
                  setExportFrom(dateRange.minISO);
                  setExportTo(dateRange.maxISO);
                }
                setShowExportModal(true);
              }}
              title="Export Leads"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div
          style={{
            width: "100%",
            height: 220,
            minHeight: 220,
            overflow: "hidden",
          }}
        >
          <ResponsiveContainer width="100%" height={220} minWidth={100}>
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: "monospace",
                  }}
                  dy={8}
                  interval={tickInterval as any}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f8fafc" }}
                />
                {activeSeries.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    fill={s.color}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: "monospace",
                  }}
                  dy={8}
                  interval={tickInterval as any}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#e2e8f0",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                {activeSeries.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: s.color,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                      style: { outline: "none" },
                    }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 450,
              borderRadius: 28,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
              animation: "modalScale 0.2s ease-out",
            }}
          >
            <style>{`
              @keyframes modalScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
              .date-input {
                width: 100%; padding: 12px 16px; border-radius: 12px;
                border: 2px solid #f1f5f9; font-size: 14px; font-weight: 700;
                color: #334155; transition: all 0.2s ease;
                outline: none; background: #f8fafc;
              }
              .date-input:focus { border-color: #ef4444; background: #fff; box-shadow: 0 0 0 4px #ef444415; }
              .date-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; display: block; }
              .custom-date-container { position: relative; width: 100%; cursor: pointer; }
              .custom-date-display { 
                position: absolute; inset: 0; padding: 12px 18px; 
                background: #fff; border: 2px solid #f1f5f9; 
                border-radius: 16px; font-size: 14px; font-weight: 800; 
                color: #1e293b; pointer-events: none; display: flex; 
                align-items: center; justify-content: space-between; z-index: 10;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              }
              .custom-date-container:hover .custom-date-display { 
                border-color: #e2e8f0; background: #f8fafc;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              }
              .date-input:focus + .custom-date-display { 
                border-color: #ef4444; background: #fff;
                box-shadow: 0 0 0 4px #ef444415, 0 8px 16px -4px rgba(239, 68, 68, 0.1);
              }
              .date-input { 
                opacity: 0; position: absolute; inset: 0; z-index: 20; 
                cursor: pointer; width: 100%; height: 100%;
              }
            `}</style>

            <div
              style={{
                padding: "24px 30px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  Export Leads
                </h2>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    margin: "4px 0 0",
                    textTransform: "uppercase",
                  }}
                >
                  Select date range to download CSV
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  border: "none",
                  background: "#f8fafc",
                  color: "#94a3b8",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "30px" }}>
              <div style={{ marginBottom: 30 }}>
                <label className="date-label">Date Range</label>
                <div
                  className="custom-date-container"
                  style={{ height: 56 }}
                  onClick={() => setActivePicker(!activePicker)}
                >
                  <div
                    className="custom-date-display"
                    style={{
                      borderColor: activePicker ? "#ef4444" : "#f1f5f9",
                      borderRadius: 16,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>
                      {exportFrom ? toFullDecimalDate(exportFrom) : "From"} —{" "}
                      {exportTo ? toFullDecimalDate(exportTo) : "To"}
                    </span>
                    <Calendar
                      size={18}
                      color={activePicker ? "#ef4444" : "#94a3b8"}
                      strokeWidth={2.5}
                      style={{ opacity: 0.8 }}
                    />
                  </div>
                  {activePicker && (
                    <CustomCalendar
                      startDate={exportFrom}
                      endDate={exportTo}
                      min={dateRange.minISO}
                      max={dateRange.maxISO}
                      onRangeChange={(start, end) => {
                        setExportFrom(start);
                        setExportTo(end);
                      }}
                      onClose={() => setActivePicker(false)}
                    />
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "#fef2f2",
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  gap: 14,
                  marginBottom: 30,
                  border: "1px solid #fee2e2",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#fff",
                    border: "1px solid #fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={18} color="#ef4444" strokeWidth={2.5} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#991b1b",
                      margin: 0,
                    }}
                  >
                    Available Range
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#ef4444",
                      margin: "2px 0 0",
                    }}
                  >
                    {dateRange.min
                      ? toFullDecimalDate(toISOKey(dateRange.min))
                      : "N/A"}{" "}
                    —{" "}
                    {dateRange.max
                      ? toFullDecimalDate(toISOKey(dateRange.max))
                      : "N/A"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleExport}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 16,
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.4)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <Download size={16} />
                Generate CSV Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
