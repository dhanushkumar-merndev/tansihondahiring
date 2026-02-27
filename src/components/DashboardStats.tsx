'use client';

import React from 'react';
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
} from 'recharts';

const MONTHS: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
};

function parseLeadDate(raw: string): Date | null {
  if (!raw) return null;
  // Normalize: remove non-breaking spaces, collapse whitespace, trim
  const cleaned = raw.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  // No $ anchor — tolerates trailing whitespace or invisible chars from Sheets
  const m = cleaned.match(
    /^(\d{1,2})-(\w{3})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)/i
  );
  if (m) {
    let [, d, mon, y, h, min, ap] = m;
    let hh = parseInt(h);
    if (ap.toLowerCase() === 'pm' && hh !== 12) hh += 12;
    if (ap.toLowerCase() === 'am' && hh === 12) hh = 0;
    return new Date(parseInt(y), MONTHS[mon.toLowerCase()] ?? 0, parseInt(d), hh, parseInt(min));
  }
  const d2 = new Date(raw);
  return isNaN(d2.getTime()) ? null : d2;
}

// ISO key for sorting: "2026-02-27" — lexicographic sort = chronological
function toISOKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Display label: "27 Feb"
function toDisplayLabel(isoKey: string): string {
  const [y, mo, d] = isoKey.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

interface StatsProps {
  total: number;
  pending: number;
  called: number;
  rejected: number;
  rawLeads: any[];
}

type FilterType = '7d' | '30d' | '90d' | 'all';
type CategoryType = 'all' | 'new' | 'called' | 'rejected' | 'interested';
type ChartType = 'line' | 'bar';

const SERIES: { key: CategoryType; label: string; color: string }[] = [
  { key: 'new',        label: 'New',       color: '#ef4444' },
  { key: 'called',     label: 'Called',    color: '#0ea5e9' },
  { key: 'rejected',   label: 'Rejected',  color: '#f59e0b' },
  { key: 'interested', label: 'Interested',color: '#10b981' },
];

const DashboardStats: React.FC<StatsProps> = ({ total, pending, called, rejected, rawLeads }) => {
  const [filter, setFilter] = React.useState<FilterType>('30d');
  const [category, setCategory] = React.useState<CategoryType>('all');
  const [chartType, setChartType] = React.useState<ChartType>('line');
  const [categoryOpen, setCategoryOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.dropdown-root')) {
        setCategoryOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const chartData = React.useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;
    if (filter === '7d')  cutoff = new Date(now.getTime() - 7  * 86400000);
    if (filter === '30d') cutoff = new Date(now.getTime() - 30 * 86400000);
    if (filter === '90d') cutoff = new Date(now.getTime() - 90 * 86400000);

    // Key by ISO string — safe to sort lexicographically
    const dayMap: Record<string, { new: number; called: number; rejected: number; interested: number }> = {};

    rawLeads.forEach(lead => {
      const d = parseLeadDate(lead.created_time);
      if (!d) return;
      if (cutoff && d < cutoff) return;

      const key = toISOKey(d);
      if (!dayMap[key]) dayMap[key] = { new: 0, called: 0, rejected: 0, interested: 0 };
      dayMap[key].new++;
      if (lead.status === 'Called')   dayMap[key].called++;
      if (lead.status === 'Rejected') dayMap[key].rejected++;
      if (lead.interested === 'Yes')  dayMap[key].interested++;
    });

    if (cutoff) {
      const totalDays = Math.ceil((now.getTime() - cutoff.getTime()) / 86400000);
      const result: any[] = [];
      for (let i = totalDays; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const isoKey = toISOKey(d);
        result.push({
          date: toDisplayLabel(isoKey),
          ...(dayMap[isoKey] || { new: 0, called: 0, rejected: 0, interested: 0 }),
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
      label: 'New Applications', value: total, accent: '#ef4444',
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      label: 'Awaiting Call', value: pending, accent: '#f59e0b',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Called', value: called, accent: '#0ea5e9',
      iconPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    },
    {
      label: 'Rejected', value: rejected, accent: '#ef4444',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: '7 Days',   value: '7d'  },
    { label: '30 Days',  value: '30d' },
    { label: '90 Days',  value: '90d' },
    { label: 'All Time', value: 'all' },
  ];
  const categoryOptions: { label: string; value: CategoryType }[] = [
    { label: 'All Lines',  value: 'all'        },
    { label: 'New Apps',   value: 'new'        },
    { label: 'Called',     value: 'called'     },
    { label: 'Rejected',   value: 'rejected'   },
    { label: 'Interested', value: 'interested' },
  ];

  const activeSeries = category === 'all' ? SERIES : SERIES.filter(s => s.key === category);
  const tickInterval = filter === '7d' ? 0 : filter === '30d' ? 4 : filter === '90d' ? 9 : 'preserveStartEnd';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', outline: 'none' }}>
        <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 6, fontFamily: 'monospace', textTransform: 'uppercase' }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase' }}>{p.dataKey}</span>
            <span style={{ color: p.color, fontSize: 16, fontWeight: 900, fontFamily: 'monospace', marginLeft: 4 }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const triggerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 8, cursor: 'pointer', fontSize: 9, fontWeight: 900,
    color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase',
    outline: 'none', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
  };
  const menuStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 'calc(100% + 4px)',
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 130,
    overflow: 'hidden',
  };
  const menuItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 14px', border: 'none', cursor: 'pointer',
    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
    textTransform: 'uppercase', transition: 'all 0.1s ease',
    background: active ? '#fef2f2' : 'transparent',
    color: active ? '#ef4444' : '#475569',
    outline: 'none',
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
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
              padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)', cursor: 'default',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease', outline: 'none',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px ${stat.accent}33`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                {stat.label}
              </span>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: stat.accent + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6 }}>
                <svg width="13" height="13" fill="none" stroke={stat.accent} strokeWidth="2.5" viewBox="0 0 24 24" style={{ outline: 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.iconPath} />
                </svg>
              </div>
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {stat.value}
            </span>
            <div style={{ height: 2, borderRadius: 99, background: `linear-gradient(90deg, ${stat.accent}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Chart Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '18px 20px', boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>

        <div className="chart-header">
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeSeries.map(s => (
              <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block', boxShadow: `0 0 5px ${s.color}` }} />
                <span style={{ fontSize: 8, fontWeight: 900, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              </span>
            ))}
          </div>

          <div className="chart-controls">
            {/* Line / Bar icon toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
              {([
                {
                  type: 'line' as ChartType,
                  icon: (
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                    </svg>
                  ),
                },
                {
                  type: 'bar' as ChartType,
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24">
                      <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor"/>
                      <rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor"/>
                      <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor"/>
                    </svg>
                  ),
                },
              ]).map(({ type, icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  title={type === 'line' ? 'Line chart' : 'Bar chart'}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 26,
                    background: chartType === type ? '#ffffff' : 'transparent',
                    border: 'none', borderRadius: 6, cursor: 'pointer',
                    color: chartType === type ? '#ef4444' : '#94a3b8',
                    outline: 'none', transition: 'all 0.15s ease',
                    boxShadow: chartType === type ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <div className="dropdown-root">
              <button style={triggerStyle} onClick={() => { setCategoryOpen(v => !v); setFilterOpen(false); }}>
                {categoryOptions.find(c => c.value === category)?.label}
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {categoryOpen && (
                <div style={menuStyle}>
                  {categoryOptions.map(opt => (
                    <button key={opt.value} style={menuItemStyle(category === opt.value)}
                      onClick={() => { setCategory(opt.value); setCategoryOpen(false); }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date filter dropdown */}
            <div className="dropdown-root">
              <button style={triggerStyle} onClick={() => { setFilterOpen(v => !v); setCategoryOpen(false); }}>
                {filterOptions.find(f => f.value === filter)?.label}
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {filterOpen && (
                <div style={menuStyle}>
                  {filterOptions.map(opt => (
                    <button key={opt.value} style={menuItemStyle(filter === opt.value)}
                      onClick={() => { setFilter(opt.value); setFilterOpen(false); }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: 220, minHeight: 220, overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height={220} minWidth={100}>
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'monospace' }}
                  dy={8} interval={tickInterval as any} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                {activeSeries.map(s => (
                  <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[3,3,0,0]} maxBarSize={28} />
                ))}
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'monospace' }}
                  dy={8} interval={tickInterval as any} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                {activeSeries.map(s => (
                  <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color}
                    strokeWidth={2.5} dot={false}
                    activeDot={{ r: 5, fill: s.color, stroke: '#ffffff', strokeWidth: 2, style: { outline: 'none' } }} />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;