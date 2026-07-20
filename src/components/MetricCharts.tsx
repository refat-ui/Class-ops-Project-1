import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";
import { DashboardStats } from "../types";
import { AlertTriangle, CheckCircle, TrendingUp, BarChart2 } from "lucide-react";

interface MetricChartsProps {
  stats: DashboardStats;
  isCompact?: boolean;
}

export default function MetricCharts({ stats, isCompact = false }: MetricChartsProps) {
  // Prep column metrics data for the chart
  const columnChartData = stats.columnMetrics.map(col => ({
    name: col.name,
    "Completed (%)": col.percentage,
    "Pending (%)": 100 - col.percentage,
    filled: col.filledCount,
    empty: col.emptyCount,
    total: col.totalCount
  }));

  // Prep day metrics data for the trend chart
  const trendChartData = stats.dayMetrics.map(day => ({
    date: day.date,
    Total: day.total,
    Complete: day.complete,
    Incomplete: day.incomplete,
    "Completeness Rate (%)": day.completenessRate
  }));

  // Custom colors
  const colors = {
    complete: "#10b981", // emerald-500
    pending: "#f43f5e",   // rose-500
    total: "#6366f1",     // indigo-500
    grid: "#1e293b"       // slate-800
  };

  return (
    <div className={`grid ${isCompact ? "grid-cols-1 gap-4" : "grid-cols-1 lg:grid-cols-12 gap-6"}`} id="dashboard-charts-container">
      {/* Chart 1: Key Columns Completeness Index */}
      <div className={`${isCompact ? "" : "lg:col-span-4"} bg-slate-900/30 backdrop-blur-xs rounded-2xl border border-slate-800 shadow-2xl flex flex-col ${isCompact ? "p-3" : "p-4 sm:p-6"}`} id="column-completeness-chart-card">
        <div className={`flex items-center justify-between ${isCompact ? "mb-3" : "mb-6"}`}>
          <div>
            <h4 className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-white flex items-center gap-2`}>
              <BarChart2 className={isCompact ? "w-3.5 h-3.5 text-indigo-400" : "w-4 h-4 text-indigo-400"} />
              Key Columns Completeness Index
            </h4>
            <p className={`${isCompact ? "text-[10px]" : "text-xs"} text-slate-400 mt-0.5`}>
              Field completeness rate across the 6 monitored operational columns
            </p>
          </div>
        </div>

        <div className={`${isCompact ? "h-[180px]" : "h-[300px]"} w-full mt-auto`} id="column-bar-chart">
          {columnChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isCompact ? 180 : 300}>
              <BarChart
                data={columnChartData}
                margin={isCompact ? { top: 5, right: 5, left: -25, bottom: 5 } : { top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: isCompact ? 8 : 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(tick) => {
                    // Truncate long labels for mobile/grid display
                    if (isCompact) {
                      if (tick.length > 8) return tick.slice(0, 6) + "..";
                    } else if (tick.length > 15) return tick.slice(0, 12) + "...";
                    return tick;
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: isCompact ? 8 : 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(30, 41, 59, 0.3)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-2.5 rounded-lg shadow-2xl border border-slate-800 text-[11px] space-y-1">
                          <p className="font-semibold text-slate-200">{data.name}</p>
                          <div className="h-px bg-slate-800 my-1" />
                          <p className="flex justify-between gap-4">
                            <span>Filled Rows:</span>
                            <span className="font-bold text-emerald-400">{data.filled} / {data.total} ({data["Completed (%)"]}%)</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span>Empty/Pending:</span>
                            <span className="font-bold text-rose-400">{data.empty} ({data["Pending (%)"]}%)</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Completed (%)" stackId="a" fill={colors.complete} radius={[0, 0, 0, 0]}>
                  {columnChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry["Completed (%)"] > 80 ? colors.complete : entry["Completed (%)"] > 50 ? "#fbbf24" : colors.pending} />
                  ))}
                </Bar>
                <Bar dataKey="Pending (%)" stackId="a" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No chart data available
            </div>
          )}
        </div>

        {/* Dynamic Warning Indicator if any column is highly incomplete */}
        <div className={`mt-3 p-2.5 bg-amber-950/20 rounded-xl border border-amber-900/40 flex items-start gap-2 text-slate-300 ${isCompact ? "text-[10px]" : "text-xs"}`}>
          <AlertTriangle className={`${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} text-amber-500 shrink-0 mt-0.5`} />
          <div>
            <span className="font-semibold text-amber-200">Operational Oversight:</span>
            <ul className="list-disc list-inside mt-0.5 text-amber-400/85 space-y-0.5 font-medium">
              {stats.columnMetrics
                .filter(col => col.percentage < 100)
                .slice(0, 1)
                .map((col, i) => (
                  <li key={i}>
                    <span className="font-medium text-amber-300">{col.name}</span> is <span className="font-bold text-amber-200">{col.percentage}%</span> complete ({col.emptyCount} missing).
                  </li>
                ))}
              {stats.columnMetrics.filter(col => col.percentage < 100).length === 0 && (
                <li>All columns are 100% complete!</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Chart 2: Day-Wise Operational Compliance Trend */}
      <div className={`${isCompact ? "" : "lg:col-span-8"} bg-slate-900/30 backdrop-blur-xs rounded-2xl border border-slate-800 shadow-2xl flex flex-col ${isCompact ? "p-3" : "p-4 sm:p-6"}`} id="day-wise-trend-chart-card">
        <div className={`flex items-center justify-between ${isCompact ? "mb-3" : "mb-6"}`}>
          <div>
            <h4 className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-white flex items-center gap-2`}>
              <TrendingUp className={isCompact ? "w-3.5 h-3.5 text-indigo-400" : "w-4 h-4 text-indigo-400"} />
              Day-Wise Compliance Trend
            </h4>
            <p className={`${isCompact ? "text-[10px]" : "text-xs"} text-slate-400 mt-0.5`}>
              Daily content production volume vs. completeness rates
            </p>
          </div>
        </div>

        <div className={`${isCompact ? "h-[180px]" : "h-[300px]"} w-full mt-auto`} id="trend-area-chart">
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isCompact ? 180 : 300}>
              <AreaChart
                data={trendChartData}
                margin={isCompact ? { top: 5, right: 5, left: -25, bottom: 5 } : { top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.total} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={colors.total} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.complete} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={colors.complete} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: isCompact ? 8 : 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#94a3b8", fontSize: isCompact ? 8 : 10 }}
                  axisLine={false}
                  tickLine={false}
                  label={isCompact ? undefined : { value: "Total Content (Qty)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10, offset: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: "#10b981", fontSize: isCompact ? 8 : 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                  label={isCompact ? undefined : { value: "Completeness Rate (%)", angle: 90, position: "insideRight", fill: "#10b981", fontSize: 10, offset: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-2.5 rounded-lg shadow-2xl border border-slate-800 text-[11px] space-y-1">
                          <p className="font-semibold text-slate-200">{data.date}</p>
                          <div className="h-px bg-slate-800 my-1" />
                          <p className="flex justify-between gap-4">
                            <span>Total Ops:</span>
                            <span className="font-bold text-slate-100">{data.Total}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span>Compliant:</span>
                            <span className="font-bold text-emerald-400">{data.Complete}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span>Completeness:</span>
                            <span className="font-semibold text-emerald-300">{data["Completeness Rate (%)"]}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: isCompact ? 8 : 10, fill: "#cbd5e1" }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="Total"
                  stroke={colors.total}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  strokeWidth={1.5}
                  name="Volume"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="Completeness Rate (%)"
                  stroke={colors.complete}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                  strokeWidth={1.5}
                  name="Compl. Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No trend data available
            </div>
          )}
        </div>

        {/* Date Wise Quick Overview Badge */}
        <div className={`mt-3 p-2.5 bg-indigo-950/20 rounded-xl border border-indigo-900/40 flex items-center justify-between text-slate-300 ${isCompact ? "text-[10px]" : "text-xs"}`}>
          <div className="flex items-center gap-1.5">
            <CheckCircle className={`${isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} text-indigo-400`} />
            <span>Monitored Days: <strong className="font-bold text-indigo-200">{stats.dayMetrics.length}</strong></span>
          </div>
          <span className="text-[8px] bg-indigo-950/50 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
