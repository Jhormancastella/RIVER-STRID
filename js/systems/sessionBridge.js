// js/systems/sessionBridge.js
// Puente entre Supabase/Auth y el GameState del juego

import { AuthSystem } from './authSystem.js';
import { CloudSave } from './cloudSave.js';

export const SessionBridge = {
  gameStateRef: null,
  lastSavedHash: null,

  // Inicializar puente con referencia al GameState global
  init(gameStateRef) {
    this.gameStateRef = gameStateRef;
    
    // Auto-save periódico cada 2 minutos si hay conexión y usuario autenticado
    setInterval(async () => {
      if (this.gameStateRef && !AuthSystem.isGuest() && navigator.onLine) {
        await CloudSave.save(this.gameStateRef);
      }
    }, 120000);

    // Guardar al perder foco (pestaña inactiva) para evitar pérdida de progreso
    window.addEventListener('blur', () => {
      if (this.gameStateRef) {
        CloudSave.save(this.gameStateRef);
      }
    });

    // Guardar al detectar desconexión (fallback a localStorage si es invitado)
    window.addEventListener('offline', () => {
      console.log('[Bridge] Offline detectado. Guardando localmente...');
      if (this.gameStateRef) {
        CloudSave.save(this.gameStateRef);
      }
    });
  },

  // Restaurar estado desde save (nube o local)
  async restoreState(targetState) {
    // Intentar cargar desde nube primero
    const cloudData = await CloudSave.load();
    
    // Si falla o es invitado, intentar localStorage
    const saveData = cloudData || await CloudSave.loadGuest();
    
    if (!saveData) {
      console.log('[Bridge] No hay save disponible. Nueva partida.');
      return false;
    }

    // Mapeo seguro al GameState actual del juego
    // Usamos operadores de coalescencia (??) para valores por defecto
    Object.assign(targetState, {
      currentChapter: saveData.chapter ?? 1,
      playtime: saveData.playtime_sec ?? 0,
      interactables: saveData.interactables_state ?? {}
    });

    // Restaurar estado del jugador si existe
    if (targetState.player && saveData) {
      targetState.player.x = saveData.position_x ?? 0;
      targetState.player.y = saveData.position_y ?? 0;
      targetState.player.character = saveData.character ?? 'lucas';
      targetState.player.sensitivity = saveData.sensitivity ?? 0;
      targetState.player.inventory = saveData.inventory ?? [];
    }

    console.log(`[Bridge] Estado restaurado: Capítulo ${targetState.currentChapter}, Personaje: ${targetState.player?.character}`);
    return true;
  },

  // Guardado manual en checkpoints (diálogo importante, item recogido, etc.)
  async checkpoint(reason = 'manual') {
    if (!this.gameStateRef) return;
    
    console.log(`[Bridge] Checkpoint: ${reason}`);
    
    if (AuthSystem.isGuest()) {
      // Feedback visual para invitado
      this._showToast('Progreso guardado localmente 📱');
    } else {
      this._showToast('Progreso sincronizado ☁️');
    }
    
    await CloudSave.save(this.gameStateRef);
  },

  // Mostrar mensaje temporal en pantalla (integración con UI existente)
  _showToast(message) {
    // Intentar usar el sistema de diálogo o HUD existente
    // Si no está disponible, fallback a console
    if (typeof window.showNotification === 'function') {
      window.showNotification(message);
    } else {
      console.log(`[Toast] ${message}`);
      // Fallback minimalista: crear elemento temporal
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
        background:rgba(17,17,17,0.95); color:#fff; padding:10px 20px;
        border:1px solid #8a0000; border-radius:6px; z-index:1000;
        font-family:'Inter',sans-serif; font-size:0.9rem;
        animation: fadeInOut 2.5s ease forwards;
      `;
      document.body.appendChild(toast);
      
      // Añadir keyframes si no existen
      if (!document.getElementById('toast-anim')) {
        const style = document.createElement('style');
        style.id = 'toast-anim';
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            15%, 85% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
          }
        `;
        document.head.appendChild(style);
      }
      
      setTimeout(() => toast.remove(), 2500);
    }
  },

  // Obtener info de sesión para UI (username, avatar, etc.)
  getSessionInfo() {
    if (AuthSystem.isGuest()) {
      return { isGuest: true, displayName: 'Invitado' };
    }
    
    const meta = AuthSystem.getUserMeta();
    return {
      isGuest: false,
      email: AuthSystem.currentUser?.email,
      username: meta.username || AuthSystem.currentUser?.email?.split('@')[0],
      avatar: meta.avatar_url,
      joinedAt: AuthSystem.currentUser?.created_at
    };
  }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.SessionBridge = SessionBridge;
}
