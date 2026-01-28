import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCreatePurchase, type CreatePurchaseDTO } from "@/hooks/use-purchases";
import { useProviders, useCreateProvider } from "@/hooks/use-providers";
import { useProducts } from "@/hooks/use-products";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, Trash2, Search, Plus, ArrowLeft, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function CreatePurchase() {
  const [, setLocation] = useLocation();
  const [providerOpen, setProviderOpen] = useState(false);
  const [createProviderModalOpen, setCreateProviderModalOpen] = useState(false);
  const [searchProvider, setSearchProvider] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedProviderName, setSelectedProviderName] = useState<string>("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [productSearchFocused, setProductSearchFocused] = useState(false);
  const { mutate: createPurchase, isPending } = useCreatePurchase();
  const { data: products = [] } = useProducts();
  const { data: providers = [] } = useProviders();
  const createProviderMutation = useCreateProvider();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      numero_documento: "",
      tipo_documento: "FACTURA" as const,
      items: [] as any[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Filtrar proveedores por búsqueda
  const filteredProviders = providers.filter(p => 
    p.nombre.toLowerCase().includes(searchProvider.toLowerCase()) ||
    (p.telefono?.toLowerCase() || "").includes(searchProvider.toLowerCase()) ||
    (p.email?.toLowerCase() || "").includes(searchProvider.toLowerCase())
  );

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(productSearchValue.toLowerCase()) ||
    p.nombre.toLowerCase().includes(productSearchValue.toLowerCase()) ||
    (p.marca?.toLowerCase() || "").includes(productSearchValue.toLowerCase())
  );

  // Calcular totales automáticamente
  const watchItems = form.watch("items");
  const calculatedNeto = (watchItems as any[]).reduce((sum, item) => {
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseInt(item.precio_costo) || 0;
    return sum + (cantidad * precio);
  }, 0);
  const calculatedIVA = Math.round(calculatedNeto * 0.19);
  const calculatedTotal = calculatedNeto + calculatedIVA;

  const onSubmit = (data: any) => {
    // Validar que haya un proveedor
    if (!selectedProviderName || !selectedProviderName.trim()) {
      toast({ 
        title: "Error", 
        description: "Debe seleccionar un proveedor",
        variant: "destructive" 
      });
      return;
    }

    // Validar que haya al menos un ítem
    if (!data.items || data.items.length === 0) {
      toast({ 
        title: "Error", 
        description: "Debe agregar al menos un producto",
        variant: "destructive" 
      });
      return;
    }
    
    // Construir payload según formato del backend real
    const payload: CreatePurchaseDTO = {
      proveedor_nombre: selectedProviderName,
      numero_documento: data.numero_documento?.trim() || undefined,
      tipo_documento: data.tipo_documento || "FACTURA",
      items: data.items.map((item: any) => {
        const parsedItem = {
          sku: item.sku?.trim() || "",
          nombre: item.nombre?.trim() || "",
          marca: item.marca?.trim() || undefined,
          calidad: item.calidad?.trim() || undefined,
          cantidad: parseInt(item.cantidad) || 1,
          precio_costo: parseInt(item.precio_costo) || 0,
          precio_venta_sugerido: 0,
          modelos_compatibles_ids: undefined,
        };
        console.log("📦 Item procesado:", parsedItem);
        return parsedItem;
      }),
    };
    
    console.log("📦 Payload completo a enviar:", JSON.stringify(payload, null, 2));
    console.log("📊 Total de items:", payload.items.length);
    console.log("📊 Total cantidad:", payload.items.reduce((sum, i) => sum + i.cantidad, 0));
    
    createPurchase(payload, {
      onSuccess: () => {
        form.reset();
        setLocation("/purchases");
        toast({ 
          title: "Compra registrada", 
          description: "El stock se actualizará automáticamente",
          className: "bg-green-600 text-white border-none" 
        });
      },
      onError: (error: any) => {
        toast({ 
          title: "Error al registrar", 
          description: error.message || "No se pudo registrar la compra",
          variant: "destructive" 
        });
      }
    });
  };

  const handleAddProductFromSearch = (product: any) => {
    append({
      sku: product.sku,
      nombre: product.nombre,
      marca: product.marca || "",
      calidad: "",
      cantidad: 1,
      precio_costo: 0,
    });
    setProductSearchOpen(false);
    setProductSearchValue("");
    toast({
      title: "Producto agregado",
      description: `${product.nombre} añadido a la lista`,
      className: "bg-blue-600 text-white border-none"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/purchases")}
                className="hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Registrar Compra</h1>
                <p className="text-sm text-slate-500 mt-0.5">Ingrese los detalles de la factura de compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Sección: Datos de la compra */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 pb-2 border-b border-slate-200">
              Datos de la Compra
            </h2>

            <div>
              <div>
                <FormLabel className="text-sm font-semibold text-slate-700">Seleccione un Proveedor *</FormLabel>
                <p className="text-xs text-slate-500 mt-1 mb-3">Busque y seleccione el proveedor de esta compra</p>
                <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between h-12 font-normal border-2 transition-all",
                        selectedProviderName 
                          ? "bg-pink-50 border-pink-200 hover:bg-pink-100 text-slate-900" 
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-400"
                      )}
                    >
                      <span className="truncate">{selectedProviderName || "Haga clic para seleccionar un proveedor"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0 border-slate-200 shadow-xl" align="start">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 border-b border-pink-100">
                      <h4 className="font-semibold text-slate-900 text-sm">Buscar Proveedor</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Seleccione de la lista o busque por nombre</p>
                    </div>
                    <Command className="rounded-lg">
                      <CommandInput 
                        placeholder="Escriba para buscar..." 
                        value={searchProvider}
                        onValueChange={setSearchProvider}
                        className="h-11 border-none text-base"
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-slate-300" />
                            <p className="text-sm text-slate-500">No se encontró ningún proveedor</p>
                            <p className="text-xs text-slate-400">Intente con otro nombre o cree uno nuevo</p>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredProviders.map((provider) => {
                            const isSelected = provider.id === selectedProviderId;
                            return (
                              <CommandItem
                                key={provider.id}
                                value={provider.nombre}
                                onSelect={() => {
                                  setSelectedProviderId(provider.id);
                                  setSelectedProviderName(provider.nombre);
                                  setProviderOpen(false);
                                  setSearchProvider("");
                                }}
                                className={cn(
                                  "cursor-pointer py-3 px-3 my-1 mx-2 rounded-md transition-all",
                                  isSelected 
                                    ? "bg-pink-50 border-2 border-pink-200" 
                                    : "hover:bg-slate-100 border-2 border-transparent"
                                )}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                                    isSelected ? "bg-pink-300 text-white" : "bg-slate-200 text-slate-600"
                                  )}>
                                    {provider.nombre.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-900 truncate">{provider.nombre}</div>
                                    {(provider.telefono || provider.email) && (
                                      <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-2">
                                        {provider.telefono && (
                                          <span className="font-mono">{provider.telefono}</span>
                                        )}
                                        {provider.telefono && provider.email && <span>•</span>}
                                        {provider.email && (
                                          <span>{provider.email}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <Check className="h-5 w-5 text-pink-500 flex-shrink-0" />
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <button
                  type="button"
                  onClick={() => setCreateProviderModalOpen(true)}
                  className="text-sm text-pink-600 hover:text-pink-700 hover:underline transition-colors mt-2 block font-medium"
                >
                  + Crear nuevo proveedor
                </button>
              </div>
            </div>
          </div>

          {/* Sección: Detalle de ítems */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Detalle de Ítems
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLocation("/inventory")}
                className="text-slate-600 hover:text-primary border-slate-300"
              >
                <Package className="w-4 h-4 mr-2" />
                Gestionar Productos
              </Button>
            </div>

            {/* Barra de búsqueda de productos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Buscar producto</label>
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-opacity duration-200",
                      (productSearchFocused || productSearchValue) && "opacity-0"
                    )} />
                    <Input
                      placeholder=""
                      value={productSearchValue}
                      onChange={(e) => {
                        setProductSearchValue(e.target.value);
                        setProductSearchOpen(true);
                      }}
                      onFocus={() => {
                        setProductSearchOpen(true);
                        setProductSearchFocused(true);
                      }}
                      onBlur={() => setProductSearchFocused(false)}
                      className={cn(
                        "h-12 bg-white border-slate-300 text-base transition-all duration-200 shadow-sm hover:border-slate-400 focus:border-primary",
                        (productSearchFocused || productSearchValue) ? "pl-4" : "pl-12"
                      )}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[600px] p-0 border-slate-200 shadow-xl" 
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  avoidCollisions={false}
                >
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-500">
                        <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p>No se encontraron productos</p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={() => setLocation("/inventory")}
                          className="mt-2 text-primary"
                        >
                          Ir a Inventario para crear producto
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProductFromSearch(product)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {product.sku}
                                  </span>
                                  <span className="font-medium text-slate-900 truncate">
                                    {product.nombre}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                  {product.marca && <span>Marca: {product.marca}</span>}
                                  <span>Stock: {product.stock_actual}</span>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Lista de ítems */}
            {fields.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-3 text-slate-200" />
                <p className="text-sm">No hay productos agregados</p>
                <p className="text-xs mt-1">Utiliza el buscador para agregar productos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const cantidad = form.watch(`items.${index}.cantidad`) || 0;
                  const precioCosto = form.watch(`items.${index}.precio_costo`) || 0;
                  const subtotal = cantidad * precioCosto;

                  return (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                      {/* Fila 1: Principal */}
                      <div className="grid grid-cols-12 gap-4 items-start mb-4">
                        {/* SKU */}
                        <div className="col-span-2">
                          <FormLabel className="text-xs font-medium text-slate-600 uppercase tracking-wide">SKU</FormLabel>
                          <Input 
                            placeholder="FRN-001"
                            className="h-10 font-mono text-sm mt-1.5 uppercase bg-white border-slate-300"
                            {...form.register(`items.${index}.sku`)}
                            onChange={(e) => {
                              form.setValue(`items.${index}.sku`, e.target.value.toUpperCase());
                            }}
                          />
                        </div>

                        {/* Producto */}
                        <div className="col-span-5">
                          <FormLabel className="text-xs font-medium text-slate-600 uppercase tracking-wide">Producto *</FormLabel>
                          <Input 
                            placeholder="Ej: Pastillas de freno delanteras"
                            className="h-10 mt-1.5 bg-white border-slate-300"
                            {...form.register(`items.${index}.nombre`)}
                          />
                        </div>

                        {/* Cantidad */}
                        <div className="col-span-2">
                          <FormLabel className="text-xs font-medium text-slate-600 uppercase tracking-wide">Cantidad *</FormLabel>
                          <Input 
                            type="number"
                            min="1"
                            placeholder="1"
                            className="h-10 mt-1.5 bg-white border-slate-300 text-center font-medium"
                            {...form.register(`items.${index}.cantidad`, { 
                              required: "La cantidad es requerida",
                              valueAsNumber: true,
                              min: 1
                            })}
                          />
                        </div>

                        {/* Precio Costo */}
                        <div className="col-span-2">
                          <FormLabel className="text-xs font-medium text-slate-600 uppercase tracking-wide">Precio Costo *</FormLabel>
                          <Input 
                            type="text"
                            placeholder="0"
                            className="h-10 mt-1.5 font-mono text-sm bg-white border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            {...form.register(`items.${index}.precio_costo`, { 
                              valueAsNumber: true,
                              setValueAs: (v) => v === '' ? 0 : parseInt(v)
                            })}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              form.setValue(`items.${index}.precio_costo`, parseInt(value) || 0);
                            }}
                          />
                        </div>

                        {/* Eliminar */}
                        <div className="col-span-1 flex justify-end pt-6">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Fila 2: Detalles */}
                      <div className="grid grid-cols-12 gap-4 items-start">
                        {/* Marca */}
                        <div className="col-span-4">
                          <FormLabel className="text-xs font-medium text-slate-500 uppercase tracking-wide">Marca</FormLabel>
                          <Input 
                            placeholder="Ej: Bosch"
                            className="h-9 mt-1.5 bg-white border-slate-200 text-sm"
                            {...form.register(`items.${index}.marca`)}
                          />
                        </div>

                        {/* Calidad */}
                        <div className="col-span-4">
                          <FormLabel className="text-xs font-medium text-slate-500 uppercase tracking-wide">Calidad</FormLabel>
                          <Input 
                            placeholder="Ej: Cerámica"
                            className="h-9 mt-1.5 bg-white border-slate-200 text-sm"
                            {...form.register(`items.${index}.calidad`)}
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-4 flex items-end justify-end h-full pb-1">
                          {subtotal > 0 && (
                            <div className="text-right">
                              <span className="text-xs text-slate-500 block mb-1">Subtotal</span>
                              <span className="text-lg font-mono font-bold text-slate-900">
                                ${subtotal.toLocaleString('es-CL')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Botón para agregar más ítems */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({
                    sku: "",
                    nombre: "",
                    marca: "",
                    calidad: "",
                    cantidad: 1,
                    precio_costo: 0,
                  })}
                  className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-600 hover:text-primary transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar otro producto
                </Button>
              </div>
            )}
          </div>

          {/* Footer: Total y Acciones */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-md p-6 sticky bottom-4 z-40">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Neto</p>
                    <p className="text-lg font-semibold text-slate-700">
                      ${calculatedNeto.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">IVA (19%)</p>
                    <p className="text-lg font-semibold text-slate-700">
                      ${calculatedIVA.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="border-l border-slate-300 pl-6">
                    <p className="text-xs text-slate-500 mb-0.5">Total</p>
                    <p className="text-3xl font-bold text-primary">
                      ${calculatedTotal.toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg"
                  onClick={() => setLocation("/purchases")}
                  className="px-8 border-slate-300"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  size="lg"
                  className="px-8 shadow-md" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Compra"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Modal para crear proveedor */}
      <CreateProviderModal 
        open={createProviderModalOpen}
        onOpenChange={setCreateProviderModalOpen}
        onProviderCreated={(providerName) => {
          form.setValue("proveedor_nombre", providerName);
          setCreateProviderModalOpen(false);
        }}
      />
    </div>
  );
}

// Modal minimalista para crear proveedor
function CreateProviderModal({ 
  open, 
  onOpenChange,
  onProviderCreated 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onProviderCreated: (providerName: string) => void;
}) {
  const createProviderMutation = useCreateProvider();
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      nombre: "",
      telefono: "+569",
      email: "",
    },
  });

  const onSubmit = (data: any) => {
    const cleanData = {
      nombre: data.nombre,
      ...(data.telefono && { telefono: data.telefono }),
      ...(data.email && { email: data.email }),
    };

    createProviderMutation.mutate(cleanData, {
      onSuccess: (newProvider) => {
        toast({
          title: "Proveedor creado",
          description: `${newProvider.nombre} ha sido agregado`,
          className: "bg-green-600 text-white border-none"
        });
        form.reset();
        onProviderCreated(newProvider.nombre);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el proveedor",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crear Nuevo Proveedor</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Complete los datos del proveedor</p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <FormField
              control={form.control}
              name="nombre"
              rules={{ required: "El nombre es obligatorio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Nombre del Proveedor *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Frenos Chile" className="h-11 bg-slate-50 border-slate-200 focus:bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ej: +56912345678"
                      defaultValue="+569"
                      className="h-11 bg-slate-50 border-slate-200 focus:bg-white font-mono"
                      onFocus={(e) => {
                        if (e.target.value === '' || e.target.value === '+569') {
                          e.target.value = '+569';
                          field.onChange('+569');
                        }
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500 mt-1">Opcional</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              rules={{
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email inválido"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Ej: contacto@proveedor.cl" className="h-11 bg-slate-50 border-slate-200 focus:bg-white" />
                  </FormControl>
                  <p className="text-xs text-slate-500 mt-1">Opcional</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createProviderMutation.isPending}
                className="flex-1 h-11 bg-primary hover:bg-primary/90"
              >
                {createProviderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Proveedor"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
