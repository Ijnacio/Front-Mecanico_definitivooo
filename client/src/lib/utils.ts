import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número de teléfono chileno para mostrar
 * @param phone - Teléfono en formato "+56912345678", "56912345678", "912345678", etc.
 * @returns Teléfono formateado como "+56 9 1234 5678" o el valor original si no se puede formatear
 */
export function formatPhoneCL(phone?: string | null): string {
  if (!phone) return "";
  
  // Limpiar todo excepto números
  const cleaned = phone.replace(/[^0-9]/g, "");
  
  // Casos válidos para móvil chileno
  // +56912345678 -> 11 dígitos empezando con 569
  if (cleaned.startsWith("569") && cleaned.length === 11) {
    const digits = cleaned.substring(3); // Extraer los 8 dígitos
    return `+56 9 ${digits.substring(0, 4)} ${digits.substring(4)}`;
  }
  
  // 56912345678 -> 10 dígitos empezando con 569
  if (cleaned.startsWith("569") && cleaned.length === 10) {
    const digits = cleaned.substring(3); // Extraer los 8 dígitos (quitando 569)
    return `+56 9 ${digits.substring(0, 4)} ${digits.substring(4)}`;
  }
  
  // 912345678 -> 9 dígitos empezando con 9
  if (cleaned.startsWith("9") && cleaned.length === 9) {
    const digits = cleaned.substring(1); // Extraer los 8 dígitos
    return `+56 9 ${digits.substring(0, 4)} ${digits.substring(4)}`;
  }
  
  // 12345678 -> 8 dígitos exactos (asumir móvil)
  if (cleaned.length === 8 && !cleaned.startsWith("0")) {
    return `+56 9 ${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }
  
  // Si ya está formateado correctamente, retornarlo
  if (phone.match(/^\+56 9 \d{4} \d{4}$/)) {
    return phone;
  }
  
  // Si no cumple ningún patrón, retornar el valor original
  return phone;
}

/**
 * Formatea un RUT chileno para mostrar con puntos y guión
 * @param rut - RUT en formato "123456789", "12345678-9", "12.345.678-9", etc.
 * @returns RUT formateado como "12.345.678-9"
 */
export function formatRutCL(rut?: string | null): string {
  if (!rut) return "";
  
  // Limpiar todo excepto números y K
  const cleaned = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (!cleaned) return "";
  
  // Separar cuerpo y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  if (!body) return cleaned;
  
  // Formatear cuerpo con puntos (de derecha a izquierda)
  const reversedBody = body.split("").reverse().join("");
  const formatted = reversedBody.match(/.{1,3}/g)?.join(".") || "";
  const finalBody = formatted.split("").reverse().join("");
  
  return `${finalBody}-${dv}`;
}
