// js/config/env.js
// ⚠️ IMPORTANTE: Usa SOLO la clave 'anon' pública en el frontend.
// La clave 'secret' y la contraseña de BD NUNCA van en código del cliente.

// 🔧 CONFIGURACIÓN DE SUPABASE
// Para obtener tu clave ANON:
// 1. Ve a https://supabase.com/dashboard/project/nldakabxziuciemcgzyi
// 2. Settings (⚙️) → API
// 3. Copia la clave que dice "anon" / "public" (empieza con "eyJ...")
// 4. Pégala abajo reemplazando el placeholder

const SUPABASE_URL = 'https://nldakabxziuciemcgzyi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZGFrYWJ4eml1Y2llbWNnenlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Njk3MzQsImV4cCI6MjA5NDQ0NTczNH0.4pCZJBTUBHqLaiNQJbbKTsBv_e6ahwi21HipDVtEgjY'; // ← ✅ Clave ANON configurada

// Validación en tiempo de ejecución para evitar errores silenciosos
if (SUPABASE_ANON_KEY === 'TU_SUPABASE_ANON_KEY_AQUI' || !SUPABASE_ANON_KEY?.startsWith('eyJ')) {
  console.warn('⚠️ [Supabase] Clave ANON no configurada correctamente. El login NO funcionará hasta que edites js/config/env.js con tu clave real.');
}

export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY
};
