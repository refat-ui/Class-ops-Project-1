import { Database, CheckCircle2, AlertTriangle, Percent } from "lucide-react";
import { DashboardStats } from "../types";

interface StatsOverviewProps {
  stats: DashboardStats;
  isCompact?: boolean;
}

export default function StatsOverview({ stats, isCompact = false }: StatsOverviewProps) {
  const cards = [
    {
      title: "Total Records",
      value: stats.totalRecords.toLocaleString(),
      sub: "Total educational items tracked",
      icon: Database,
      textColor: "text-slate-100",
      bgColor: "bg-slate-900/40",
      borderColor: "border-slate-850",
      iconColor: "text-slate-400",
      indicatorColor: "bg-indigo-600"
    },
    {
      title: "Compliant",
      value: stats.completeRecords.toLocaleString(),
      sub: "6 required columns completed",
      icon: CheckCircle2,
      textColor: "text-emerald-400",
      bgColor: "bg-slate-900/40",
      borderColor: "border-slate-850",
      iconColor: "text-emerald-400",
      indicatorColor: "bg-emerald-500"
    },
    {
      title: "Pending Action",
      value: stats.incompleteRecords.toLocaleString(),
      sub: "Has missing key columns",
      icon: AlertTriangle,
      textColor: "text-rose-400",
      bgColor: "bg-slate-900/40",
      borderColor: "border-slate-850",
      iconColor: "text-rose-400",
      indicatorColor: "bg-rose-500"
    },
    {
      title: "Overall Accuracy",
      value: `${stats.overallCompleteness}%`,
      sub: "Average target completion",
      icon: Percent,
      textColor: "text-indigo-400",
      bgColor: "bg-slate-900/40",
      borderColor: "border-slate-850",
      iconColor: "text-indigo-400",
      indicatorColor: "bg-indigo-500"
    }
  ];

  return (
    <div className={`grid ${isCompact ? "grid-cols-2 gap-2.5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"}`} id="stats-overview-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            id={`stats-card-${idx}`}
            className={`relative overflow-hidden rounded-xl border ${card.bgColor} ${card.borderColor} flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-slate-700 ${
              isCompact ? "p-2.5" : "p-4 sm:p-5 hover:-translate-y-0.5"
            }`}
          >
            {/* Top Indicator Accent Bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${card.indicatorColor}`} />

            <div className="flex items-start justify-between gap-1">
              <div className={isCompact ? "space-y-0.5" : "space-y-1.5"}>
                <span className={`font-bold text-slate-500 tracking-wider uppercase block ${isCompact ? "text-[8px]" : "text-[10px]"}`}>
                  {card.title}
                </span>
                <h3 className={`font-bold tracking-tight font-sans ${card.textColor} ${isCompact ? "text-lg leading-tight" : "text-3xl"}`}>
                  {card.value}
                </h3>
              </div>
              <div className={`rounded-lg bg-slate-950/60 border border-slate-800/80 ${card.iconColor} shrink-0 ${isCompact ? "p-1.5" : "p-2.5"}`}>
                <Icon className={isCompact ? "w-3.5 h-3.5" : "w-5 h-5"} />
              </div>
            </div>

            <div className={`border-t border-slate-850 ${isCompact ? "mt-2 pt-1" : "mt-4 pt-3"}`}>
              <p className={`text-slate-400 flex items-center gap-1 leading-normal ${isCompact ? "text-[9px]" : "text-xs"}`}>
                {card.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
