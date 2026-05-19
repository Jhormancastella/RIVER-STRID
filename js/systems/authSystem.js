// js/systems/authSystem.js
// Gestión de autenticación con Supabase Auth

import { supabase } from '../lib/supabaseClient.js';

export const AuthSystem = {
  currentUser: null,
  session: null,
  isInitialized: false,

  // Inicializar: verificar sesión existente y escuchar cambios
  async init() {
    if (this.isInitialized) return !!this.currentUser;
    
    try {
      // Validar que la clave ANON esté configurada antes de intentar conectar
      const { SUPABASE_CONFIG } = await import('../config/env.js');
      if (!SUPABASE_CONFIG?.ANON_KEY || SUPABASE_CONFIG.ANON_KEY === 'TU_SUPABASE_ANON_KEY_AQUI' || !SUPABASE_CONFIG.ANON_KEY.startsWith('eyJ')) {
        console.error('❌ [Auth] Clave Supabase ANON no configurada. Edita js/config/env.js con tu clave real.');
        return false;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        // Detectar error de API key inválida y mostrar mensaje claro
        if (error?.message?.includes('Invalid API key') || error?.code === 'invalid_api_key') {
          console.error('❌ [Auth] Clave API inválida. Verifica que copiaste la clave "anon" (no "secret") desde Supabase Dashboard → Settings → API');
        }
        throw error;
      }
      
      this.session = session;
      this.currentUser = session?.user || null;

      // Suscribirse a cambios de autenticación (login/logout en otra pestaña, etc.)
      supabase.auth.onAuthStateChange((event, newSession) => {
        this.session = newSession;
        this.currentUser = newSession?.user || null;
        console.log(`[Auth] Evento: ${event}, Usuario: ${this.currentUser?.email || 'null'}`);
      });

      this.isInitialized = true;
      return !!this.currentUser;
    } catch (err) {
      console.error('[Auth] Error al inicializar:', err);
      return false;
    }
  },

  // Registrar nuevo usuario (email + password + username opcional)
  async register(email, password, username = null) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split('@')[0] },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        // Mensajes más amigables para errores comunes
        if (error?.message?.includes('Invalid API key')) {
          throw new Error('Clave de API inválida. Revisa js/config/env.js');
        }
        if (error?.message?.includes('User already registered')) {
          throw new Error('Este correo ya tiene una cuenta');
        }
        if (error?.message?.includes('Password')) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        throw error;
      }
      
      this.currentUser = data.user;
      this.session = data.session;
      return { user: data.user, needsConfirmation: !data.session };
    } catch (err) {
      console.error('[Auth] Error en registro:', err);
      throw err;
    }
  },

  // Iniciar sesión con email y password
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error?.message?.includes('Invalid API key')) {
          throw new Error('Clave de API inválida. Revisa js/config/env.js');
        }
        if (error?.message?.includes('Invalid login credentials')) {
          throw new Error('Correo o contraseña incorrectos');
        }
        if (error?.message?.includes('Email not confirmed')) {
          throw new Error('Confirma tu correo antes de iniciar sesión');
        }
        throw error;
      }
      
      this.currentUser = data.user;
      this.session = data.session;
      return data;
    } catch (err) {
      console.error('[Auth] Error en login:', err);
      throw err;
    }
  },

  // Enviar Magic Link (login sin contraseña, ideal para móvil)
  async sendMagicLink(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  },

  // Cerrar sesión
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    this.currentUser = null;
    this.session = null;
    // Limpiar caché local de invitado si existe
    localStorage.removeItem('riverstrid_save_guest');
  },

  // Verificar si es usuario invitado (no autenticado)
  isGuest() {
    return !this.currentUser;
  },

  // Obtener metadata del usuario (username, etc.)
  getUserMeta() {
    return this.currentUser?.user_metadata || {};
  }
};

// Exponer globalmente para acceso desde scripts no-modulares si es necesario
if (typeof window !== 'undefined') {
  window.AuthSystem = AuthSystem;
}
