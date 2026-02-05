import { Link, useLocation } from "wouter";
import { Package, ShoppingCart, ClipboardList, Wrench, Menu, LogOut, User, Edit2, LayoutDashboard, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

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
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ rut: "", nombre: "" });
  const { user, logout } = useAuth();
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  
  // Filtrar links según el rol del usuario
  const userRole = (user?.role === "administrador" || user?.role === "ADMIN") ? "ADMIN" : "WORKER";
  const links = allLinks.filter(link => 
    link.roles.includes(userRole)
  );

  const handleOpenEditProfile = () => {
    setEditForm({ rut: user?.rut || "", nombre: user?.nombre || "" });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          rut: editForm.rut,
          nombre: editForm.nombre,
        },
      });

      toast({
        title: "✅ Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      });

      setEditProfileOpen(false);
      window.location.reload(); // Recargar para actualizar el usuario en el contexto
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };
  
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
        {/* User Info - Clickeable */}
        <div 
          className="bg-slate-800/50 rounded-xl p-3 cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={handleOpenEditProfile}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.nombre}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.rut}</p>
            </div>
            <Edit2 className="w-4 h-4 text-slate-400" />
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

      {/* Modal de Edición de Perfil */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Editar Mi Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre Completo</Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="edit-rut">RUT</Label>
              <Input
                id="edit-rut"
                value={user?.rut || ""}
                disabled
                className="bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El RUT no se puede modificar
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Cambiar Contraseña (Opcional)</p>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-password">Nueva Contraseña</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="edit-confirm-password"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    placeholder="Repetir contraseña"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditModalOpen(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={updateUser.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {updateUser.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

      {/* Modal de Edición de Perfil */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Editar Mi Perfil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                value={editForm.rut}
                onChange={(e) => setEditForm({ ...editForm, rut: e.target.value })}
                placeholder="12.345.678-9"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile} disabled={updateUser.isPending}>
                {updateUser.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}