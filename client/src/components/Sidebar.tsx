import { Link, useLocation } from "wouter";
// Agregamos 'Users' y 'TrendingUp' a los imports de lucide-react
import { Package, ShoppingCart, ClipboardList, Wrench, Menu, LogOut, User, LayoutDashboard, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "./ui/badge";

// Links con roles permitidos
const allLinks = [
  { href: "/reportes", label: "Reportes", icon: LayoutDashboard, roles: ["ADMIN"] },
  { href: "/inventory", label: "Inventario", icon: Package, roles: ["ADMIN", "WORKER"] },
  { href: "/purchases", label: "Proveedores", icon: ShoppingCart, roles: ["ADMIN"] },
  { href: "/work-orders", label: "Órdenes de Trabajo", icon: ClipboardList, roles: ["ADMIN", "WORKER"] },
  { href: "/counter-sales", label: "Ventas Mostrador", icon: TrendingUp, roles: ["ADMIN", "WORKER"] },
  { href: "/clients", label: "Clientes", icon: Users, roles: ["ADMIN", "WORKER"] },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  
  // Filtrar links según el rol del usuario
  const userRole = (user?.role === "administrador" || user?.role === "ADMIN") ? "ADMIN" : "WORKER";
  const links = allLinks.filter(link => 
    link.roles.includes(userRole)
  );
  
  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-wider">FRENOS<span className="text-primary"> AGUILERA</span></h1>
          <p className="text-xs text-slate-400 font-body">Sistema de Gestión</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 font-body">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <div
              key={link.href}
              onClick={() => {
                setOpen(false);
                setLocation(link.href);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 cursor-pointer",
                isActive 
                  ? "bg-primary text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-white")} />
              <span className="font-medium">{link.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* Accesos Rápidos - Solo para Trabajadores */}
        {userRole === "WORKER" && (
          <div className="space-y-2 mb-2">
            <button
              onClick={() => {
                setOpen(false);
                setLocation('/work-orders?action=new');
              }}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Nueva Orden</span>
              </div>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                setLocation('/counter-sales?action=new');
              }}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Venta Mesón</span>
              </div>
            </button>
          </div>
        )}

        {/* User Info */}
        <div className="bg-slate-800/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.nombre}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.rut}</p>
            </div>
          </div>
          <Badge 
            variant={(user?.role === "ADMIN" || user?.role === "administrador") ? "default" : "secondary"}
            className="mt-2 text-[10px] px-2 py-0.5 w-full justify-center"
          >
            {(user?.role === "ADMIN" || user?.role === "administrador") ? "Administrador" : "Trabajador"}
          </Badge>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md bg-white">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden lg:block w-72 h-screen fixed left-0 top-0 overflow-y-auto">
        <NavContent />
      </aside>
    </>
  );
}