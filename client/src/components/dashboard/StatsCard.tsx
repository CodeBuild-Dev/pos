import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  DollarSign,
};

const gradientMap: Record<string, string> = {
  Users: "from-teal-500/20 via-teal-500/10 to-transparent",
  UserCheck: "from-blue-500/20 via-blue-500/10 to-transparent",
  DollarSign: "from-emerald-500/20 via-emerald-500/10 to-transparent",
};

const iconBgMap: Record<string, string> = {
  Users: "bg-gradient-to-br from-teal-500 to-teal-600",
  UserCheck: "bg-gradient-to-br from-blue-500 to-blue-600",
  DollarSign: "bg-gradient-to-br from-emerald-500 to-emerald-600",
};

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const Icon = iconMap[icon] || Users;
  const isPositive = change >= 0;
  const gradient = gradientMap[icon] || gradientMap.Users;
  const iconBg = iconBgMap[icon] || iconBgMap.Users;

  return (
    <Card className="group relative overflow-hidden border-0 bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
      
      {/* Decorative circle */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPositive 
                  ? "bg-emerald-500/10 text-emerald-600" 
                  : "bg-red-500/10 text-red-600"
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}{change}%
              </div>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
