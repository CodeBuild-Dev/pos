import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatPKR } from "@shoppos/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Eye,
  Banknote,
  Smartphone,
  CircleDollarSign,
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const Receipt = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/>
  </svg>
);

const JazzCashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <text x="12" y="16.5" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">J</text>
  </svg>
);

const paymentMethods = ["All", "Cash", "JazzCash", "UPI"] as const;

const paymentIcon = (method: string) => {
  switch (method) {
    case "Cash": return <Banknote className="h-3.5 w-3.5" />;
    case "JazzCash": return <JazzCashIcon className="h-3.5 w-3.5" />;
    case "UPI": return <Smartphone className="h-3.5 w-3.5" />;
    default: return null;
  }
};

const paymentBadgeClass = (method: string) => {
  switch (method) {
    case "Cash": return "border-green-500/30 bg-green-500/10 text-green-600";
    case "JazzCash": return "border-red-500/30 bg-red-500/10 text-red-600";
    case "UPI": return "border-purple-500/30 bg-purple-500/10 text-purple-600";
    default: return "";
  }
};

const SalesHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data: salesList = [], isLoading } = trpc.sale.list.useQuery({
    search: searchQuery || undefined,
    paymentMethod: paymentFilter !== "All" ? paymentFilter as "Cash" | "JazzCash" | "UPI" : undefined,
  });

  const { data: saleDetail } = trpc.sale.getById.useQuery(
    { id: selectedSaleId! },
    { enabled: !!selectedSaleId },
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(salesList.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSales = salesList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showingFrom = salesList.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + ITEMS_PER_PAGE, salesList.length);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
  const handlePaymentFilter = (value: string) => {
    setPaymentFilter(value);
    setCurrentPage(1);
  };

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todaySales = salesList.filter((s) => s.createdAt && new Date(s.createdAt).toISOString().split("T")[0] === today);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalRevenue = salesList.reduce((sum, s) => sum + s.total, 0);
  const avgTransaction = salesList.length > 0 ? Math.round(totalRevenue / salesList.length) : 0;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-PK", { year: "numeric", month: "2-digit", day: "2-digit" });
  };
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View all past transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPKR(todayTotal)}</p>
              <p className="text-xs text-muted-foreground">Today's Sales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPKR(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPKR(avgTransaction)}</p>
              <p className="text-xs text-muted-foreground">Avg Transaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or customer..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {paymentMethods.map((method) => (
            <Button
              key={method}
              variant={paymentFilter === method ? "default" : "outline"}
              size="sm"
              onClick={() => handlePaymentFilter(method)}
              className="h-8 text-xs"
            >
              {method !== "All" && paymentIcon(method)}
              <span className={method !== "All" ? "ml-1" : ""}>{method}</span>
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" disabled>
          <CalendarDays className="h-3.5 w-3.5" />
          Date Filter
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Transaction ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Date & Time</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Payment</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Discount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Total</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs font-semibold">{sale.transactionId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{formatDate(sale.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(sale.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sale.customerName ? (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {getInitials(sale.customerName)}
                          </div>
                          <span className="font-medium">{sale.customerName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            W
                          </div>
                          <span className="text-muted-foreground text-sm">Walk-in</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 text-xs ${paymentBadgeClass(sale.paymentMethod)}`}>
                        {paymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.discount > 0 ? (
                        <span className="text-sm text-destructive">-{formatPKR(sale.discount)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-primary">{formatPKR(sale.total)}</TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedSaleId(sale.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                              <Receipt className="h-5 w-5 text-primary" />
                              {sale.transactionId}
                            </SheetTitle>
                          </SheetHeader>
                          <div className="mt-6 space-y-4">
                            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-medium">{formatDate(sale.createdAt)} {formatTime(sale.createdAt)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Customer</span>
                                <span className="font-medium">{sale.customerName || "Walk-in"}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Payment</span>
                                <Badge variant="outline" className={`gap-1 text-xs ${paymentBadgeClass(sale.paymentMethod)}`}>
                                  {paymentIcon(sale.paymentMethod)}
                                  {sale.paymentMethod}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items</h4>
                              {saleDetail?.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center rounded-lg bg-muted/30 p-3">
                                  <div>
                                    <p className="text-sm font-medium">{item.product?.name ?? "Unknown"}</p>
                                    <p className="text-xs text-muted-foreground">{formatPKR(item.unitPrice)} x {item.quantity}</p>
                                  </div>
                                  <span className="font-semibold text-sm">{formatPKR(item.total)}</span>
                                </div>
                              )) ?? (
                                <p className="text-sm text-muted-foreground">Loading items...</p>
                              )}
                            </div>

                            <div className="rounded-xl bg-muted/50 p-4 border border-border/50 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPKR(sale.subtotal)}</span>
                              </div>
                              {sale.discount > 0 && (
                                <div className="flex justify-between text-sm text-destructive">
                                  <span>Discount</span>
                                  <span>-{formatPKR(sale.discount)}</span>
                                </div>
                              )}
                              <div className="border-t pt-2 flex justify-between">
                                <span className="font-bold">Total</span>
                                <span className="font-bold text-primary text-lg">{formatPKR(sale.total)}</span>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {salesList.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {showingFrom}-{showingTo} of {salesList.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
