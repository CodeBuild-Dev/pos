import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { formatPKR, toPaisa, toRupees } from "@shoppos/shared";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
  Banknote,
  Percent,
  User,
  Phone,
  X,
  ScanBarcode,
  Loader2,
} from "lucide-react";

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number; // paise
    stock: number;
    sku: string;
    barcode?: string | null;
    category?: { name: string } | null;
  };
  quantity: number;
}

const Billing = () => {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const { data: products = [], isLoading } = trpc.product.list.useQuery({});
  const { data: categories = [] } = trpc.category.list.useQuery();

  const createSaleMutation = trpc.sale.create.useMutation({
    onSuccess: () => {
      toast({ title: "Sale Completed!", description: `Total: ${formatPKR(total)} via Cash` });
      setCart([]);
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
      // Refresh product stock
      utils.product.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    },
  });

  // Find customer by phone for linking sale
  const { data: customerResults } = trpc.customer.list.useQuery(
    { search: customerPhone },
    { enabled: customerPhone.length >= 3 },
  );

  const handleBarcodeScan = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      const product = products.find(
        (p) =>
          p.barcode === trimmed ||
          p.sku.toLowerCase() === trimmed.toLowerCase()
      );
      if (product) {
        addToCart(product);
        toast({ title: "Product scanned", description: `${product.name} added to cart.` });
      } else {
        toast({
          title: "Product not found",
          description: `No product matches barcode "${trimmed}".`,
          variant: "destructive",
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products]
  );

  // Detect USB barcode scanner attach/detach
  useEffect(() => {
    const handleConnect = (e: USBConnectionEvent) => {
      const name = e.device?.productName || "Barcode Scanner";
      toast({ title: "Scanner Connected", description: `${name} is ready to use.` });
    };
    const handleDisconnect = (e: USBConnectionEvent) => {
      const name = e.device?.productName || "Barcode Scanner";
      toast({ title: "Scanner Disconnected", description: `${name} was removed.`, variant: "destructive" });
    };

    if (navigator.usb) {
      navigator.usb.addEventListener("connect", handleConnect);
      navigator.usb.addEventListener("disconnect", handleDisconnect);
    }

    const handleHIDConnect = (e: HIDConnectionEvent) => {
      const name = e.device?.productName || "Barcode Scanner";
      toast({ title: "Scanner Connected", description: `${name} is ready to use.` });
    };
    const handleHIDDisconnect = (e: HIDConnectionEvent) => {
      const name = e.device?.productName || "Barcode Scanner";
      toast({ title: "Scanner Disconnected", description: `${name} was removed.`, variant: "destructive" });
    };

    if (navigator.hid) {
      navigator.hid.addEventListener("connect", handleHIDConnect);
      navigator.hid.addEventListener("disconnect", handleHIDDisconnect);
    }

    return () => {
      if (navigator.usb) {
        navigator.usb.removeEventListener("connect", handleConnect);
        navigator.usb.removeEventListener("disconnect", handleDisconnect);
      }
      if (navigator.hid) {
        navigator.hid.removeEventListener("connect", handleHIDConnect);
        navigator.hid.removeEventListener("disconnect", handleHIDDisconnect);
      }
    };
  }, [toast]);

  // Physical barcode scanner support
  const scanBuffer = useRef("");
  const scanTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter" && scanBuffer.current.length > 3) {
        e.preventDefault();
        handleBarcodeScan(scanBuffer.current);
        scanBuffer.current = "";
        return;
      }

      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        clearTimeout(scanTimeout.current);
        scanTimeout.current = setTimeout(() => {
          scanBuffer.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(scanTimeout.current);
    };
  }, [handleBarcodeScan]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const addToCart = (product: typeof products[number]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: "Stock limit reached", description: `Only ${product.stock} available.`, variant: "destructive" });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stock === 0) {
        toast({ title: "Out of stock", description: `${product.name} is out of stock.`, variant: "destructive" });
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // All in paise
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discount) / 100);
  const total = subtotal - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to the cart before checkout.", variant: "destructive" });
      return;
    }

    // Find customer by phone match
    const matchedCustomer = customerResults?.find(
      (c) => c.phone === customerPhone
    );

    createSaleMutation.mutate({
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      discount: discountAmount,
      paymentMethod: "Cash",
      customerId: matchedCustomer?.id,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Receipt className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">New Sale</h1>
            <p className="text-muted-foreground">Create a new bill for your customer</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Product Selection - Left Side */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-background/50 backdrop-blur-sm border-border/50"
              onClick={() => setShowScanner(true)}
              title="Scan barcode"
            >
              <ScanBarcode className="h-4 w-4" />
            </Button>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`group relative cursor-pointer overflow-hidden border-0 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  product.stock === 0 ? "opacity-50" : ""
                } bg-gradient-to-br from-card via-card to-muted/20`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase tracking-wider font-semibold"
                    >
                      {product.category?.name ?? "Unknown"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold text-primary">{formatPKR(product.price)}</span>
                    <span
                      className={`text-xs font-medium ${
                        product.stock < product.lowStockThreshold ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>
                  {/* Add overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
                      <Plus className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart - Right Side */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4 border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card via-card to-muted/20 overflow-hidden">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <CardHeader className="relative pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Cart
                {cart.length > 0 && (
                  <Badge className="ml-auto bg-primary/10 text-primary border-0">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Customer name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background/50 border-border/50"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Phone number (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="pl-9 h-9 text-sm bg-background/50 border-border/50"
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Cart is empty</p>
                    <p className="text-xs">Click products to add</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPKR(item.product.price)} x {item.quantity} = {formatPKR(item.product.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount */}
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Discount %"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.min(100, Number(e.target.value)))}
                  className="pl-9 h-9 text-sm bg-background/50 border-border/50"
                />
              </div>

              {/* Payment Method */}
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
                <Banknote className="h-4 w-4 text-primary" />
                <span className="font-medium">Cash in Hand</span>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-gradient-to-br from-muted/80 via-muted/50 to-transparent p-4 border border-border/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPKR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Discount ({discount}%)</span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-2 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-primary">{formatPKR(total)}</span>
                </div>
              </div>

              {/* Checkout */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCart([]);
                    setDiscount(0);
                  }}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button
                  className="flex-[2] bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || createSaleMutation.isPending}
                >
                  {createSaleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4 mr-1" />
                  )}
                  Checkout {formatPKR(total)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default Billing;
