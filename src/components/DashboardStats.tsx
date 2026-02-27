import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface StatsProps {
  total: number;
  pending: number;
  called: number;
  rejected: number;
  rawLeads: any[];
}

type FilterType = '7d' | '30d' | '90d' | 'all';
type ChartType = 'area' | 'bar';

const DashboardStats: React.FC<StatsProps> = ({ total, pending, called, rejected, rawLeads }) => {
  const [filter, setFilter] = React.useState<FilterType>('30d');
  const [chartType, setChartType] = React.useState<ChartType>('area');

  const chartData = React.useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;

    if (filter === '7d') cutoff = new Date(now.getTime() - 7 * 86400000);
    else if (filter === '30d') cutoff = new Date(now.getTime() - 30 * 86400000);
    else if (filter === '90d') cutoff = new Date(now.getTime() - 90 * 86400000);

    const filtered = rawLeads.filter(lead => {
      if (!lead.created_time || !cutoff) return true;
      return new Date(lead.created_time) >= cutoff;
    });

    // Build a map with ALL dates in range filled (no gaps)
    const counts: Record<string, number> = {};
    filtered.forEach(lead => {
      const d = lead.created_time ? new Date(lead.created_time) : null;
      if (!d) return;
      const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      counts[key] = (counts[key] || 0) + 1;
    });

    // Fill in all days in the range so X-axis is continuous
    if (cutoff) {
      const days = Math.ceil((now.getTime() - cutoff.getTime()) / 86400000);
      const allDates: string[] = [];
      for (let i = days; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        allDates.push(key);
      }
      return allDates.map(date => ({ date, count: counts[date] || 0 }));
    }

    // 'all' — sort chronologically
    const sorted = Object.entries(counts).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });
    return sorted.map(([date, count]) => ({ date, count }));
  }, [rawLeads, filter]);

  const filters: { label: string; value: FilterType }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
  ];

  const stats = [
    {
      label: 'New Applications',
      value: total,
      accent: '#ef4444',
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      label: 'Awaiting Call',
      value: pending,
      accent: '#ef4444',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Called',
      value: called,
      accent: '#ef4444',
      iconPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    },
    {
      label: 'Rejected',
      value: rejected,
      accent: '#ef4444',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '8px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          outline: 'none',
        }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 3, fontFamily: 'monospace' }}>{label}</p>
          <p style={{ color: '#ef4444', fontSize: 18, fontWeight: 900, fontFamily: 'monospace' }}>{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Tick interval for X axis — show every Nth label to avoid overlap
  const tickInterval = filter === '7d' ? 0 : filter === '30d' ? 4 : filter === '90d' ? 9 : 'preserveStartEnd';

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
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
        }
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
            justify-content: space-between;
          }
        }
      `}</style>

      {/* Stats Row */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
              cursor: 'default',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              outline: 'none',
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
              <div style={{
                width: 26, height: 26,
                borderRadius: 8,
                background: stat.accent + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 6,
              }}>
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
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: '18px 20px',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
      }}>
        {/* Chart Header */}
        <div className="chart-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#334155', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Lead Acquisition Trend
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 4, letterSpacing: '0.04em', paddingLeft: 15 }}>
              Application volume · {chartData.reduce((s, d) => s + d.count, 0)} total
            </p>
          </div>

          <div className="chart-controls">
            {/* Chart type toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
              {(['area', 'bar'] as ChartType[]).map(ct => (
                <button
                  key={ct}
                  onClick={() => setChartType(ct)}
                  style={{
                    background: chartType === ct ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 11px',
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 900,
                    color: chartType === ct ? '#0f172a' : '#94a3b8',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: chartType === ct ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {ct}
                </button>
              ))}
            </div>

            {/* Date filters */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
              {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  style={{
                    background: filter === f.value ? '#ef4444' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 11px',
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 900,
                    color: filter === f.value ? '#fff' : '#475569',
                    letterSpacing: '0.08em',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: filter === f.value ? '0 2px 8px #ef444466' : 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: '100%', height: 200, minHeight: 200, overflow: 'hidden', marginLeft: -8 }}>
          <ResponsiveContainer width="100%" height={200} minWidth={100}>
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'monospace' }}
                  dy={8}
                  interval={tickInterval}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#redGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2, style: { outline: 'none' } }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800, fontFamily: 'monospace' }}
                  dy={8}
                  interval={tickInterval}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ef444411' }} />
                <Bar
                  dataKey="count"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;