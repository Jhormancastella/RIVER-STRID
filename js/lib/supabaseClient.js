// js/lib/supabaseClient.js
// Cliente singleton de Supabase usando ESM desde CDN (sin bundler)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from '../config/env.js';

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

// Exportar también la config por si se necesita en otros módulos
export { SUPABASE_CONFIG };
