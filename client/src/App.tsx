import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import NotFound from "@/pages/not-found";
import Reportes from "@/pages/Reportes";
import Inventory from "@/pages/Inventory";
import Purchases from "@/pages/Purchases";
import CreatePurchase from "@/pages/CreatePurchase";
import WorkOrders from "@/pages/WorkOrders";
import CounterSales from "@/pages/CounterSales";
import Login from "@/pages/Login";
import Clients from "@/pages/Clients";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({
  component: Component,
  adminOnly = false
}: {
  component: () => JSX.Element;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Si la ruta es solo para admin y el usuario no es admin
  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";
  if (adminOnly && !isAdmin) {
    return <Redirect to="/work-orders" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={() => <Redirect to="/login" />} />
      </Switch>
    );
  }

  // Redirigir la ruta raíz según el rol
  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";
  const defaultRoute = isAdmin ? "/reportes" : "/work-orders";

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 lg:ml-72 p-6 md:p-8 overflow-y-auto">
        <Switch>
          <Route path="/" component={() => <Redirect to={defaultRoute} />} />
          <Route path="/login" component={() => <Redirect to={defaultRoute} />} />
          <Route path="/reportes" component={() => <ProtectedRoute component={Reportes} adminOnly />} />
          <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
          <Route path="/purchases" component={() => <ProtectedRoute component={Purchases} adminOnly />} />
          <Route path="/purchases/create" component={() => <ProtectedRoute component={CreatePurchase} adminOnly />} />
          <Route path="/work-orders" component={() => <ProtectedRoute component={WorkOrders} />} />
          <Route path="/counter-sales" component={() => <ProtectedRoute component={CounterSales} />} />
          <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
