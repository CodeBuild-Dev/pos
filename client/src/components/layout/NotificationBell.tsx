import { Bell, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

export function NotificationBell() {
  const navigate = useNavigate();
  const { data: lowStockProducts = [] } = trpc.dashboard.lowStockProducts.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });

  const count = lowStockProducts.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {count > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {count} alert{count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Package className="h-8 w-8" />
              <p className="text-sm">All products well stocked</p>
            </div>
          ) : (
            lowStockProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate("/products")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category?.name} — only <span className="font-semibold text-destructive">{product.stock}</span> left
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
