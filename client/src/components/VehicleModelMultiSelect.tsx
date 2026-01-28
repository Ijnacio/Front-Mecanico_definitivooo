import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Search, Loader2, Car } from "lucide-react";
import { useSearchVehicleModels, useVehicleModelBrands, useVehicleModelsByBrand, type VehicleModel } from "@/hooks/use-vehicle-models";
import { cn } from "@/lib/utils";

interface VehicleModelMultiSelectProps {
  selectedModels: VehicleModel[];
  onModelsChange: (models: VehicleModel[]) => void;
  className?: string;
}

export function VehicleModelMultiSelect({ 
  selectedModels, 
  onModelsChange, 
  className 
}: VehicleModelMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: brands = [], isLoading: brandsLoading } = useVehicleModelBrands();
  
  // Debounce para búsqueda (400ms - dentro del rango 300-500ms)
  useEffect(() => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timer = setTimeout(() => {
      // Solo buscar si hay al menos 2 caracteres
      if (searchQuery.length >= 2) {
        abortControllerRef.current = new AbortController();
        setDebouncedSearch(searchQuery);
      } else {
        setDebouncedSearch("");
      }
    }, 400);
    
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery]);
  
  // Búsqueda global si no hay marca seleccionada
  const { data: searchResults = [], isLoading: searchLoading } = useSearchVehicleModels(
    selectedBrand === "all" ? debouncedSearch : "",
  );
  
  // Modelos por marca si hay una marca seleccionada
  const { data: brandModels = [], isLoading: brandLoading } = useVehicleModelsByBrand(
    selectedBrand !== "all" ? selectedBrand : "",
  );

  // Decidir qué resultados mostrar
  const availableModels = selectedBrand === "all" 
    ? searchResults 
    : brandModels.filter(m => 
        debouncedSearch.length < 2 || 
        m.modelo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        m.anio.toString().includes(debouncedSearch)
      );

  const isLoading = searchLoading || brandLoading;

  const handleSelectModel = (model: VehicleModel) => {
    // Evitar duplicados
    const exists = selectedModels.some(m => m.id === model.id);
    if (!exists) {
      onModelsChange([...selectedModels, model]);
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveModel = (modelId: string) => {
    onModelsChange(selectedModels.filter(m => m.id !== modelId));
  };

  const filteredAvailableModels = availableModels.filter(
    model => !selectedModels.some(selected => selected.id === model.id)
  );

  // Mostrar dropdown solo si hay búsqueda >= 2 caracteres o si hay marca seleccionada
  const shouldShowDropdown = showDropdown && (
    (debouncedSearch.length >= 2 && selectedBrand === "all") ||
    (selectedBrand !== "all" && debouncedSearch.length >= 2) ||
    (selectedBrand !== "all" && searchQuery.length === 0)
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selector de Marca */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            Marca del vehículo
          </label>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="h-10 bg-white border-slate-300">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Buscador con autocomplete */}
      <div className="relative">
        <label className="text-xs font-medium text-slate-600 mb-1.5 block">
          Buscar modelo y año
        </label>
        <div className="relative">
          {!searchFocused && !searchQuery && (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          )}
          {isLoading && searchQuery.length >= 2 && (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin pointer-events-none z-10" />
          )}
          <Input
            placeholder=""
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setSearchFocused(true);
              setShowDropdown(true);
            }}
            onBlur={() => {
              setSearchFocused(false);
              // Delay para permitir clicks en resultados
              setTimeout(() => setShowDropdown(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
                setShowDropdown(false);
              }
            }}
            className={cn(
              "h-11 bg-white border-slate-300 transition-all duration-200",
              (searchFocused || searchQuery) ? "pl-3" : "pl-10"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown de Resultados (Autocomplete) */}
        {shouldShowDropdown && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[280px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="py-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-slate-500">Buscando modelos...</p>
              </div>
            ) : filteredAvailableModels.length === 0 ? (
              <div className="py-6 text-center">
                <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-600 font-medium">Sin resultados</p>
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <p className="text-xs text-slate-400 mt-1">Escribe al menos 2 caracteres</p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredAvailableModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className="font-medium text-slate-900 text-sm">
                      {model.marca} – {model.modelo} – {model.anio}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Año: {model.anio}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chips de modelos seleccionados */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          {selectedModels.map((model) => (
            <Badge
              key={model.id}
              variant="secondary"
              className="px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200 gap-1.5"
            >
              <Car className="w-3 h-3" />
              <span className="font-medium">
                {model.marca} {model.modelo} {model.anio}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveModel(model.id)}
                className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Mensaje si no hay modelos seleccionados */}
      {selectedModels.length === 0 && (
        <div className="text-xs text-slate-500 italic">
          No hay modelos compatibles seleccionados. Usa el buscador para agregar.
        </div>
      )}
    </div>
  );
}
