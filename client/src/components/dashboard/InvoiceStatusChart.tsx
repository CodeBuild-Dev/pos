import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";

const customersByMonth = [
  { month: 'Jan', customers: 145 },
  { month: 'Feb', customers: 178 },
  { month: 'Mar', customers: 156 },
  { month: 'Apr', customers: 198 },
  { month: 'May', customers: 212 },
  { month: 'Jun', customers: 245 },
  { month: 'Jul', customers: 267 },
];

export function CustomersByMonthChart() {
  const totalCustomers = customersByMonth.reduce((sum, item) => sum + item.customers, 0);
  const latestGrowth = ((customersByMonth[6].customers - customersByMonth[5].customers) / customersByMonth[5].customers * 100).toFixed(1);

  return (
    <Card className="group relative overflow-hidden border-0 bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:shadow-xl hover:shadow-black/10">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-60" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">Customers by Month</CardTitle>
            <p className="text-sm text-muted-foreground">New customer acquisitions</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">+{latestGrowth}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={customersByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200, 80%, 55%)" />
                  <stop offset="100%" stopColor="hsl(168, 76%, 42%)" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                dx={-10}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border-0 bg-slate-900 px-4 py-3 shadow-xl">
                        <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
                        <p className="text-lg font-bold text-white">
                          {payload[0].value} customers
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 8 }}
              />
              <Bar 
                dataKey="customers" 
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
