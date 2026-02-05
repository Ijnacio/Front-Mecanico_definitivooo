import { Link, useLocation } from "wouter";
import { Package, ShoppingCart, ClipboardList, Wrench, Menu, LogOut, User, Edit2, LayoutDashboard, Users, TrendingUp, Shield, Key, Trash2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser, useUsers, useDeleteUser } from "@/hooks/use-users";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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
  const [editForm, setEditForm] = useState({ nombre: "", newPassword: "", confirmPassword: "" });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ rut: "", newPassword: "" });
  const { user, logout } = useAuth();
  const updateUser = useUpdateUser();
  const { data: users = [] } = useUsers();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  
  // Filtrar links según el rol del usuario
  const userRole = (user?.role === "administrador" || user?.role === "ADMIN") ? "ADMIN" : "WORKER";
  const links = allLinks.filter(link => 
    link.roles.includes(userRole)
  );

  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";

  const handleOpenEditProfile = () => {
    setEditForm({ nombre: user?.nombre || "", newPassword: "", confirmPassword: "" });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validar contraseña si se está cambiando
    if (editForm.newPassword) {
      if (editForm.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        });
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          nombre: editForm.nombre,
          newPassword: editForm.newPassword || undefined,
        },
      });

      toast({
        title: "✅ Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      });

      setEditProfileOpen(false);
      setEditForm({ nombre: "", newPassword: "", confirmPassword: "" });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (targetUser: any) => {
    setEditingUser(targetUser);
    setEditUserForm({ rut: targetUser.rut, newPassword: "" });
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        data: {
          rut: editUserForm.rut,
          newPassword: editUserForm.newPassword || undefined,
        },
      });

      toast({
        title: "✅ Usuario actualizado",
        description: "Las credenciales han sido actualizadas",
      });

      setEditingUser(null);
      setEditUserForm({ rut: "", newPassword: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de desactivar al usuario ${nombre}?`)) return;

    try {
      await deleteUser.mutateAsync(id);
      toast({
        title: "✅ Usuario desactivado",
        description: `${nombre} ha sido desactivado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo desactivar el usuario",
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

          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden lg:block w-72 h-screen fixed left-0 top-0 overflow-y-auto">
        <NavContent />
      </aside>

      {/* Modal de Perfil y Gestión */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Mi Perfil
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Información Personal</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>}
            </TabsList>

            {/* Tab: Información Personal */}
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={user?.rut || ""}
                    disabled={isAdmin}
                    className={isAdmin ? "bg-slate-50 cursor-not-allowed" : ""}
                  />
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Shield className="w-3 h-3 inline mr-1" />
                      El RUT está bloqueado para administradores
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Cambiar Contraseña (Opcional)
                  </p>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="confirmPassword"
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
                    onClick={() => {
                      setEditProfileOpen(false);
                      setEditForm({ nombre: "", newPassword: "", confirmPassword: "" });
                    }}
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
                    {updateUser.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Gestión de Usuarios (Solo ADMIN) */}
            {isAdmin && (
              <TabsContent value="users" className="space-y-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.nombre}</TableCell>
                          <TableCell>{u.rut}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                              {u.role === "ADMIN" ? "Administrador" : "Trabajador"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(u)}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id, u.nombre)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición de Usuario (ADMIN) */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Editar Credenciales: {editingUser?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-user-rut">RUT</Label>
              <Input
                id="edit-user-rut"
                value={editUserForm.rut}
                onChange={(e) => setEditUserForm({ ...editUserForm, rut: e.target.value })}
                placeholder="12.345.678-9"
              />
            </div>

            <div>
              <Label htmlFor="edit-user-password">Nueva Contraseña (Opcional)</Label>
              <Input
                id="edit-user-password"
                type="password"
                value={editUserForm.newPassword}
                onChange={(e) => setEditUserForm({ ...editUserForm, newPassword: e.target.value })}
                placeholder="Dejar vacío para no cambiar"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditingUser(null);
                  setEditUserForm({ rut: "", newPassword: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveUserEdit}
                disabled={updateUser.isPending}
              >
                {updateUser.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}