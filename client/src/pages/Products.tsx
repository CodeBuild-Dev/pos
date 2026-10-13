import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatPKR, toPaisa, toRupees } from "@shoppos/shared";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  CircleDollarSign,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
  FolderPlus,
  Loader2,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const CATEGORY_STYLES: Record<string, { badge: string; avatar: string }> = {
  Books: {
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    avatar: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  Copies: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
    avatar: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  Stationery: {
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    avatar: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  "Art Supplies": {
    badge: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
    avatar: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  Office: {
    badge: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
    avatar: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
};

const UNITS = ["piece", "pack", "set", "box"] as const;

const emptyForm = { name: "", categoryId: "", price: "", stock: "", sku: "", barcode: "", unit: "piece" };

const Products = () => {
  const utils = trpc.useUtils();

  // --- API data ---
  const { data: products = [], isLoading } = trpc.product.list.useQuery({});
  const { data: categories = [] } = trpc.category.list.useQuery();

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      setShowAddDialog(false);
      setForm(emptyForm);
      toast.success("Product added successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      setShowEditDialog(false);
      toast.success("Product updated successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const deactivateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      setShowDeleteDialog(false);
      toast.success(`"${selectedProduct?.name}" deleted`);
    },
    onError: (err) => toast.error(err.message),
  });

  const createCategoryMutation = trpc.category.create.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
      setNewCategoryName("");
      setNewCategoryPrefix("");
      setShowCategoryDialog(false);
      toast.success("Category created");
    },
    onError: (err) => toast.error(err.message),
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[number] | null>(null);

  // Form state
  const [form, setForm] = useState(emptyForm);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPrefix, setNewCategoryPrefix] = useState("");

  // --- Derived data ---
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock < p.lowStockThreshold).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && p.stock < p.lowStockThreshold) ||
        (stockFilter === "in-stock" && p.stock >= p.lowStockThreshold);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(safePage * ITEMS_PER_PAGE, filtered.length);

  const updateFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  // --- Handlers ---
  const openAdd = () => {
    setForm(emptyForm);
    setShowAddDialog(true);
  };

  const openEdit = (p: typeof products[number]) => {
    setSelectedProduct(p);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      price: String(toRupees(p.price)),
      stock: String(p.stock),
      sku: p.sku,
      barcode: p.barcode || "",
      unit: p.unit,
    });
    setShowEditDialog(true);
  };

  const openDelete = (p: typeof products[number]) => {
    setSelectedProduct(p);
    setShowDeleteDialog(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      categoryId: form.categoryId,
      price: toPaisa(Number(form.price)),
      stock: Number(form.stock),
      sku: form.sku,
      barcode: form.barcode || undefined,
      unit: form.unit as typeof UNITS[number],
      lowStockThreshold: 20,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    updateMutation.mutate({
      id: selectedProduct.id,
      name: form.name,
      categoryId: form.categoryId,
      price: toPaisa(Number(form.price)),
      stock: Number(form.stock),
      barcode: form.barcode || null,
      unit: form.unit as typeof UNITS[number],
    });
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    deactivateMutation.mutate({ id: selectedProduct.id, isActive: false });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    const prefix = newCategoryPrefix.trim().toUpperCase();
    if (!trimmed || !prefix) return;
    createCategoryMutation.mutate({ name: trimmed, skuPrefix: prefix });
  };

  // --- Stock helpers ---
  const stockColor = (stock: number) =>
    stock < 20 ? "bg-red-500" : stock <= 50 ? "bg-yellow-500" : "bg-green-500";
  const stockTrackColor = (stock: number) =>
    stock < 20 ? "bg-red-500/20" : stock <= 50 ? "bg-yellow-500/20" : "bg-green-500/20";
  const stockPercent = (stock: number) => Math.min(100, (stock / 500) * 100);

  const getCategoryName = (p: typeof products[number]) =>
    p.category?.name ?? "Unknown";

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your inventory and products</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-[11px] text-muted-foreground">{totalStock.toLocaleString()} units in stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
              <p className="text-[11px] text-muted-foreground">Below threshold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-11 w-11 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPKR(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Inventory Value</p>
              <p className="text-[11px] text-muted-foreground">At retail price</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => updateFilter(setCategoryFilter, v)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
            <Separator className="my-1" />
            <button
              onClick={(e) => { e.preventDefault(); setShowCategoryDialog(true); }}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent outline-none"
            >
              <FolderPlus className="mr-2 h-3.5 w-3.5" />
              Create Category
            </button>
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(v) => updateFilter(setStockFilter, v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filters */}
      {(categoryFilter !== "all" || stockFilter !== "all" || search) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setSearch(""); setPage(1); }}>
              Search: "{search}" ×
            </Badge>
          )}
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setCategoryFilter("all"); setPage(1); }}>
              {categories.find((c) => c.id === categoryFilter)?.name} ×
            </Badge>
          )}
          {stockFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setStockFilter("all"); setPage(1); }}>
              {stockFilter === "low" ? "Low Stock" : "In Stock"} ×
            </Badge>
          )}
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setStockFilter("all"); setPage(1); }}
            className="text-xs text-destructive hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <PackageOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">No products found</p>
                        <p className="text-sm text-muted-foreground/70">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const catName = getCategoryName(product);
                  const catStyle = CATEGORY_STYLES[catName];
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${catStyle?.avatar || "bg-muted text-muted-foreground"}`}
                          >
                            {catName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {product.sku}
                              {product.barcode && <span className="ml-2 text-muted-foreground/60">| {product.barcode}</span>}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={catStyle?.badge || "border-border"}>
                          {catName}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-semibold">{formatPKR(product.price)}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          {product.stock < product.lowStockThreshold && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          )}
                          <div className="flex-1">
                            <span
                              className={`text-sm font-medium ${
                                product.stock < product.lowStockThreshold ? "text-red-500" : ""
                              }`}
                            >
                              {product.stock}
                            </span>
                            <div className={`mt-1 h-1.5 w-full rounded-full ${stockTrackColor(product.stock)}`}>
                              <div
                                className={`h-full rounded-full transition-all ${stockColor(product.stock)}`}
                                style={{ width: `${stockPercent(product.stock)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground text-sm">{product.unit}</TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(product)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDelete(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {showingFrom}-{showingTo} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Add Product Dialog ===== */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new product to your catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Notebook - 200 Pages"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <button
                      onClick={(e) => { e.preventDefault(); setShowCategoryDialog(true); }}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent outline-none"
                    >
                      <FolderPlus className="mr-2 h-3.5 w-3.5" />
                      Create Category
                    </button>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (Rs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. NB-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="e.g. 8901234560010"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Product Dialog ===== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update {selectedProduct?.name}'s details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <button
                      onClick={(e) => { e.preventDefault(); setShowCategoryDialog(true); }}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent outline-none"
                    >
                      <FolderPlus className="mr-2 h-3.5 w-3.5" />
                      Create Category
                    </button>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (Rs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} disabled className="opacity-60" />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="e.g. 8901234560010"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{selectedProduct?.name}"</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Create Category Dialog ===== */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new product category to your store.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Electronics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>SKU Prefix</Label>
              <Input
                value={newCategoryPrefix}
                onChange={(e) => setNewCategoryPrefix(e.target.value)}
                placeholder="e.g. EL"
                maxLength={10}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Existing categories</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Badge key={cat.id} variant="outline" className={CATEGORY_STYLES[cat.name]?.badge || "border-border"}>
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
