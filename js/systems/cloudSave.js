// js/systems/cloudSave.js
// Sistema de guardado en la nube con fallback offline y cola de sincronización

import { supabase } from '../lib/supabaseClient.js';
import { AuthSystem } from './authSystem.js';

const SYNC_INTERVAL = 60000; // 1 minuto entre intentos de sync
let syncQueue = [];
let isSyncing = false;
let autoSaveTimer = null;

export const CloudSave = {
  // Cargar partida desde la nube (solo si está autenticado)
  async load() {
    if (AuthSystem.isGuest()) return null;
    
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('*')
        .eq('player_id', AuthSystem.currentUser.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('[Cloud] Error cargando save:', error);
        return null;
      }
      return data || null;
    } catch (err) {
      console.error('[Cloud] Excepción al cargar:', err);
      return null;
    }
  },

  // Guardar partida (encola para no bloquear el game loop)
  async save(gameState) {
    // Si es invitado, guardar solo en localStorage
    if (AuthSystem.isGuest()) {
      try {
        localStorage.setItem('riverstrid_save_guest', JSON.stringify(gameState));
      } catch (e) {
        console.warn('[Cloud] No se pudo guardar localmente:', e);
      }
      return false;
    }

    // Encolar estado para sincronización asíncrona
    syncQueue.push({ ...gameState, _syncedAt: Date.now() });
    
    // Procesar cola si no hay proceso activo
    if (!isSyncing) {
      this._processQueue();
    }
    
    // Programar próximo auto-save si no existe
    if (!autoSaveTimer) {
      autoSaveTimer = setInterval(() => {
        if (syncQueue.length > 0 && !isSyncing) {
          this._processQueue();
        }
      }, SYNC_INTERVAL);
    }
    
    return true;
  },

  // Procesar cola de sincronización (interno)
  async _processQueue() {
    isSyncing = true;
    
    while (syncQueue.length > 0) {
      const state = syncQueue[0];
      
      try {
        const payload = {
          player_id: AuthSystem.currentUser.id,
          chapter: state.currentChapter ?? 1,
          position_x: state.player?.x ?? 0,
          position_y: state.player?.y ?? 0,
          character: state.player?.character ?? 'lucas',
          sensitivity: state.player?.sensitivity ?? 0,
          inventory: state.player?.inventory ?? [],
          interactables_state: state.interactables ?? {},
          playtime_sec: state.playtime ?? 0,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('saves')
          .upsert(payload, { onConflict: 'player_id' });
        
        if (error) throw error;
        
        // Eliminar de cola si fue exitoso
        syncQueue.shift();
        
      } catch (err) {
        console.error('[Cloud] Error sincronizando:', err);
        // Mantener en cola y reintentar en 30s
        await new Promise(res => setTimeout(res, 30000));
        continue;
      }
    }
    
    isSyncing = false;
    
    // Limpiar timer si no hay más cola
    if (syncQueue.length === 0 && autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  },

  // Cargar save de invitado desde localStorage
  async loadGuest() {
    try {
      const raw = localStorage.getItem('riverstrid_save_guest');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Forzar sincronización inmediata (para checkpoints importantes)
  async forceSync(gameState) {
    if (!AuthSystem.isGuest()) {
      syncQueue.unshift({ ...gameState, _priority: true });
      if (!isSyncing) await this._processQueue();
    }
  },

  // Limpiar todos los saves (para testing o "Nueva Partida")
  async clear() {
    if (!AuthSystem.isGuest()) {
      await supabase.from('saves').delete().eq('player_id', AuthSystem.currentUser.id);
    }
    localStorage.removeItem('riverstrid_save_guest');
  },

  // Obtener estado de la cola (para debugging/UI)
  getQueueStatus() {
    return {
      pending: syncQueue.length,
      syncing: isSyncing,
      hasAutoSave: !!autoSaveTimer
    };
  }
};

// Exponer globalmente si es necesario
if (typeof window !== 'undefined') {
  window.CloudSave = CloudSave;
}
