import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChartPeriod } from "@shoppos/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  Banknote,
  Smartphone,
  CircleDollarSign,
  CalendarDays,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatPKR } from "@shoppos/shared";

const JazzCashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <text x="12" y="16.5" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">J</text>
  </svg>
);

const COLORS = ["hsl(168, 76%, 42%)", "hsl(200, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(250, 80%, 60%)", "hsl(0, 84%, 60%)"];

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: "1d", label: "Daily" },
  { value: "3d", label: "3 Day" },
  { value: "7d", label: "Weekly" },
  { value: "30d", label: "Monthly" },
  { value: "1y", label: "Last Year" },
];

function PeriodFilter({ value, onChange }: { value: ChartPeriod; onChange: (v: ChartPeriod) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ChartPeriod)}>
      <SelectTrigger className="w-[130px] h-8 text-xs font-medium border-0 bg-gradient-to-r from-primary/10 to-primary/5 text-primary hover:from-primary/15 hover:to-primary/10 transition-all rounded-lg gap-1.5 shadow-sm">
        <CalendarDays className="h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl shadow-xl border-border/50">
        {PERIOD_OPTIONS.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-xs rounded-lg cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const Dashboard = () => {
  const [salesPeriod, setSalesPeriod] = useState<ChartPeriod>("7d");
  const [categoryPeriod, setCategoryPeriod] = useState<ChartPeriod>("7d");

  const { data: dashStats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: salesOverTime = [] } = trpc.dashboard.salesOverTime.useQuery({ period: salesPeriod });
  const { data: categorySales = [] } = trpc.dashboard.categorySales.useQuery({ period: categoryPeriod });
  const { data: recentTxns = [] } = trpc.dashboard.recentTransactions.useQuery({ limit: 4 });
  const { data: lowStockProducts = [] } = trpc.dashboard.lowStockProducts.useQuery();

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Today's Revenue",
      value: formatPKR(dashStats?.todayRevenue ?? 0),
      sub: `${dashStats?.todayTransactions ?? 0} transactions today`,
      icon: CircleDollarSign,
      color: "text-primary",
    },
    {
      title: "Total Sales",
      value: String(dashStats?.totalSales ?? 0),
      sub: `${dashStats?.todayTransactions ?? 0} today`,
      icon: ShoppingCart,
      color: "text-primary",
    },
    {
      title: "Total Revenue",
      value: formatPKR(dashStats?.totalRevenue ?? 0),
      sub: `${formatPKR(dashStats?.weeklyRevenue ?? 0)} this week`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Total Products",
      value: String(dashStats?.totalProducts ?? 0),
      sub: `${dashStats?.lowStockCount ?? 0} low stock`,
      icon: Package,
      color: (dashStats?.lowStockCount ?? 0) > 0 ? "text-destructive" : "text-primary",
    },
  ];

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your store overview at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/20 animate-fade-in hover:-translate-y-0.5 transition-transform"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-xl" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.title}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Over Time Chart */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card via-card to-muted/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Sales Overview
              </CardTitle>
              <PeriodFilter value={salesPeriod} onChange={setSalesPeriod} />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `Rs. ${v / 100000}k`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222, 84%, 5%)",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [formatPKR(value), "Sales"]}
                />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(168, 76%, 42%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <Bar dataKey="sales" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card via-card to-muted/20 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Sales by Category
              </CardTitle>
              <PeriodFilter value={categoryPeriod} onChange={setCategoryPeriod} />
            </div>
          </CardHeader>
          <CardContent>
            {categorySales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No sales data for this period</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={categorySales} dataKey="sales" nameKey="category" cx="50%" cy="50%" innerRadius={45} outerRadius={80} strokeWidth={2}>
                      {categorySales.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(222, 84%, 5%)", border: "none", borderRadius: "12px", color: "#fff" }}
                      formatter={(value: number) => [formatPKR(value), "Sales"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categorySales.map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 text-muted-foreground">{cat.category}</span>
                      <span className="font-semibold">{formatPKR(cat.sales)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <Card className="lg:col-span-2 border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card via-card to-muted/20 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">ID</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Time</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Payment</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTxns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTxns.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs font-semibold">{sale.transactionId}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {sale.customerName || <span className="text-muted-foreground">Walk-in</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatTime(sale.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 text-xs">
                          {sale.paymentMethod === "Cash" && <Banknote className="h-3 w-3" />}
                          {sale.paymentMethod === "JazzCash" && <JazzCashIcon className="h-3 w-3" />}
                          {sale.paymentMethod === "UPI" && <Smartphone className="h-3 w-3" />}
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatPKR(sale.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card via-card to-muted/20 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All products are well stocked</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category?.name ?? "Unknown"}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {product.stock} left
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
