import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Products from "./pages/Products";
import SalesHistory from "./pages/SalesHistory";
import POSCustomers from "./pages/POSCustomers";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";

const App = () => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Never retry auth errors — the refresh interceptor already handles it
          if (error instanceof TRPCClientError) {
            const code = error.data?.code ?? error.shape?.data?.code;
            if (code === 'UNAUTHORIZED' || error.data?.httpStatus === 401) return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  }));
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={
                    <AuthGuard>
                      <DashboardLayout><Dashboard /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <AuthGuard>
                      <DashboardLayout><Billing /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <AuthGuard>
                      <DashboardLayout><Products /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <AuthGuard>
                      <DashboardLayout><SalesHistory /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <AuthGuard>
                      <DashboardLayout><POSCustomers /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <DashboardLayout><Profile /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <AuthGuard>
                      <DashboardLayout><Staff /></DashboardLayout>
                    </AuthGuard>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  );
};

export default App;
