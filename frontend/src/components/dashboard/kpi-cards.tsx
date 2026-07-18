import { KPI } from "@/interfaces/dashboard";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function KpiCards({ data }: { data: KPI[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data.map((kpi, index) => (
        <div key={index} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{kpi.title}</h3>
            {kpi.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
            {kpi.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
            {kpi.trend === 'neutral' && <Minus className="w-4 h-4 text-zinc-400" />}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight">{kpi.value}</span>
            {kpi.change !== 0 && (
              <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
