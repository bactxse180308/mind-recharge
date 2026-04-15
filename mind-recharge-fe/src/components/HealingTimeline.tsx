import { useQuery } from "@tanstack/react-query";
import { healingApi } from "@/services/healingApi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus, Flame } from "lucide-react";
import type { HealingTrend, TimelineDataPoint } from "@/types/healing";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: TimelineDataPoint = payload[0].payload;
    const moodEmoji: Record<string, string> = {
      awesome: "🌟",
      good: "😊",
      okay: "😐",
      bad: "😔",
      terrible: "💔"
    };
    const emoji = moodEmoji[data.moodLabel] || "✨";

    return (
      <div className="bg-background/95 backdrop-blur-md border border-border/20 p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium tracking-wider">{data.date}</p>
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <span className="text-base">{emoji}</span>
          <span className="text-primary tracking-wide">Score: {data.score}/6</span>
        </p>
        {data.message && (
          <p className="text-xs text-muted-foreground/80 italic mt-2.5 max-w-[200px] leading-relaxed border-t border-border/10 pt-2">
            "{data.message}"
          </p>
        )}
      </div>
    );
  }
  return null;
};

const TrendIcon = ({ trend }: { trend: HealingTrend }) => {
  if (trend === 'IMPROVING') return <TrendingUp className="text-emerald-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" size={16} />;
  if (trend === 'DECLINING') return <TrendingDown className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" size={16} />;
  return <Minus className="text-slate-400" size={16} />;
};

export const HealingTimeline = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["healing-timeline"],
    queryFn: () => healingApi.getTimeline(),
  });

  if (isLoading) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center healing-card mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/20 breathing" />
      </div>
    );
  }

  const result = data?.data;
  if (!result || result.timeline.length === 0) return null;

  return (
    <div className="healing-card p-5 mb-8 fade-in-slow">
      <div className="flex items-center justify-between mb-8">
         <div>
           <h2 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
              Bản đồ cảm xúc
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/80"></span>
              </span>
           </h2>
           <div className="flex items-center gap-2.5 mt-2">
             <div className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 rounded-full border border-border/10">
               <TrendIcon trend={result.trend} />
               <span className="text-[11px] text-foreground/80 font-medium">Xu hướng</span>
             </div>
             <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
               <Flame className="text-amber-500" size={14} />
               <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold tracking-wide">{result.streak} Ngày</span>
             </div>
           </div>
         </div>
         <div className="text-right">
           <p className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Trung bình</p>
           <p className="text-3xl font-light text-primary tracking-tighter">{result.avgScore.toFixed(1)}</p>
         </div>
      </div>

      <div className="h-[220px] w-full mb-8 relative left-[-10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={result.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/10" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => val.split("-").slice(1).join("/")}
              className="text-[10px] fill-muted-foreground/40"
              dy={10}
            />
            <YAxis 
              domain={[0, 6]} 
              axisLine={false} 
              tickLine={false}
              className="text-[10px] fill-muted-foreground/40"
              tickCount={7}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(167, 139, 250, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#a78bfa" 
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--background)", stroke: "#a78bfa", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#a78bfa", stroke: "var(--background)", strokeWidth: 2, className: "healing-glow" }}
              animationDuration={2000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-border/5 pt-5">
        <p className="text-[10px] text-muted-foreground/50 mb-3 px-1 tracking-wide uppercase">Cột mốc kiên cường</p>
        <div className="flex flex-wrap gap-2.5">
          {result.milestones.map((ms) => (
             <div 
               key={ms.day} 
               className={`flex items-center gap-1.5 text-[10px] px-3.5 py-1.5 rounded-full transition-all duration-700 border ${
                 ms.achieved 
                 ? "bg-primary/10 text-primary border-primary/20 font-medium shadow-[0_0_12px_rgba(167,139,250,0.15)]" 
                 : "bg-background border-border/10 text-muted-foreground/30"
               }`}
             >
               {ms.achieved ? <span className="text-[8px]">✨</span> : null}
               {ms.day} Ngày
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};
