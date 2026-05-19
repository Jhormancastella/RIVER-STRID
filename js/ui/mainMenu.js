// js/ui/mainMenu.js
import { AuthSystem } from '../systems/authSystem.js';
import { CloudSave } from '../systems/cloudSave.js';
import { SessionBridge } from '../systems/sessionBridge.js';

export class MainMenu {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'menu-overlay hidden';
    this.currentView = 'auth';
    this.gameStateRef = null;
    this.buildDOM();
    this.bindEvents();
    document.body.appendChild(this.el);
  }

  buildDOM() {
    this.el.innerHTML = `
      <div class="menu-container">
        <!-- VISTA: AUTH -->
        <div class="view view-auth active" id="view-auth">
          <h1 class="menu-title">RIVER-STRID</h1>
          <form id="auth-form" class="menu-form">
            <input type="email" id="auth-email" class="menu-input" placeholder="Correo electrónico" required autocomplete="email">
            <input type="password" id="auth-pass" class="menu-input" placeholder="Contraseña" required autocomplete="current-password">
            <button type="submit" class="menu-btn primary" id="auth-submit">Iniciar Sesión</button>
          </form>
          <p class="menu-error" id="auth-error"></p>
          <button class="menu-btn ghost" id="auth-toggle">¿No tienes cuenta? Regístrate</button>
          <button class="menu-btn ghost" id="auth-guest">Jugar como Invitado</button>
        </div>

        <!-- VISTA: MENÚ PRINCIPAL -->
        <div class="view view-menu" id="view-menu">
          <h1 class="menu-title">RIVER-STRID</h1>
          <div class="menu-buttons">
            <button class="menu-btn primary" id="btn-new">Nuevo Juego</button>
            <button class="menu-btn primary" id="btn-continue" disabled>Continuar</button>
            <button class="menu-btn secondary" id="btn-options">Opciones</button>
            <button class="menu-btn secondary" id="btn-credits">Créditos</button>
            <button class="menu-btn ghost" id="btn-profile">Perfil / Sesión</button>
          </div>
        </div>

        <!-- VISTA: OPCIONES -->
        <div class="view view-options" id="view-options">
          <h2 class="menu-title" style="font-size:1.3rem">OPCIONES</h2>
          <div class="options-grid">
            <label>
              <span>Volumen Maestro</span>
              <input type="range" id="opt-volume" min="0" max="100" value="80">
            </label>
            <label>
              <span>Música</span>
              <input type="range" id="opt-music" min="0" max="100" value="70">
            </label>
            <label>
              <span>Efectos de Sonido</span>
              <input type="range" id="opt-sfx" min="0" max="100" value="90">
            </label>
            <label>
              <span>Sensibilidad Táctil</span>
              <input type="range" id="opt-touch" min="1" max="10" value="5">
            </label>
            <div class="toggle-row">
              <span>Pantalla Completa</span>
              <label class="toggle">
                <input type="checkbox" id="opt-fullscreen">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-row">
              <span>Reducir Efectos Visuales</span>
              <label class="toggle">
                <input type="checkbox" id="opt-reduced">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <button class="menu-btn secondary" id="btn-back-options">Volver</button>
        </div>

        <!-- VISTA: CRÉDITOS -->
        <div class="view view-credits" id="view-credits">
          <h2 class="menu-title" style="font-size:1.3rem">CRÉDITOS</h2>
          <div class="credits-scroll">
            <p><strong>Diseño & Programación</strong><br>Equipo River-Strid</p>
            <p><strong>Narrativa</strong><br>Adaptación basada en folklore local</p>
            <p><strong>Arte & Sprites</strong><br>Tilesets isométricos y personajes</p>
            <p><strong>Música & Audio</strong><br>Composición original</p>
            <p class="mt-4"><strong>Motor Técnico</strong><br>Vanilla JS + Canvas API</p>
            <p><strong>Cloud Sync</strong><br>Supabase</p>
            <p class="mt-4 text-muted">Gracias por jugar.</p>
            <p class="text-muted" style="font-size:0.8rem">v1.0.0</p>
          </div>
          <button class="menu-btn secondary" id="btn-back-credits">Volver</button>
        </div>

        <!-- VISTA: PERFIL -->
        <div class="view view-profile" id="view-profile">
          <h2 class="menu-title" style="font-size:1.3rem">PERFIL</h2>
          <div class="profile-info">
            <p><strong>Email:</strong> <span id="profile-email">-</span></p>
            <p><strong>Tiempo Jugado:</strong> <span id="profile-time">0 min</span></p>
            <p><strong>Estado:</strong> <span id="profile-mode" class="badge online">En línea</span></p>
          </div>
          <button class="menu-btn danger" id="btn-logout">Cerrar Sesión</button>
          <button class="menu-btn secondary" id="btn-back-profile">Volver</button>
        </div>

        <!-- TOAST NOTIFICATIONS -->
        <div class="toast" id="toast"></div>
      </div>
    `;
  }

  bindEvents() {
    // === AUTH FORM ===
    const form = this.el.querySelector('#auth-form');
    const toggle = this.el.querySelector('#auth-toggle');
    const submitBtn = this.el.querySelector('#auth-submit');
    const errorEl = this.el.querySelector('#auth-error');
    let isRegister = false;

    toggle.onclick = () => {
      isRegister = !isRegister;
      submitBtn.textContent = isRegister ? 'Registrarse' : 'Iniciar Sesión';
      toggle.textContent = isRegister 
        ? '¿Ya tienes cuenta? Inicia sesión' 
        : '¿No tienes cuenta? Regístrate';
      errorEl.textContent = '';
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = this.el.querySelector('#auth-email').value.trim();
      const pass = this.el.querySelector('#auth-pass').value;
      errorEl.textContent = 'Conectando...';

      try {
        if (isRegister) {
          await AuthSystem.register(email, pass);
          this.showToast('✅ Registro exitoso. Ya puedes iniciar sesión.');
          // Cambiar a modo login automáticamente
          isRegister = false;
          submitBtn.textContent = 'Iniciar Sesión';
          toggle.textContent = '¿No tienes cuenta? Regístrate';
          errorEl.textContent = '';
          this.el.querySelector('#auth-pass').value = '';
        } else {
          await AuthSystem.login(email, pass);
          await this.loadUserMenu();
        }
      } catch (err) {
        errorEl.textContent = err.message || 'Error de conexión';
      }
    };

    // Guest mode
    this.el.querySelector('#auth-guest').onclick = () => {
      this.showToast('🎮 Modo invitado activado');
      this.loadUserMenu(true);
    };

    // === MAIN MENU BUTTONS ===
    this.el.querySelector('#btn-new').onclick = () => this.startGame(true);
    this.el.querySelector('#btn-continue').onclick = () => this.startGame(false);
    this.el.querySelector('#btn-options').onclick = () => this.switchView('options');
    this.el.querySelector('#btn-credits').onclick = () => this.switchView('credits');
    this.el.querySelector('#btn-profile').onclick = () => this.showProfile();

    // Back buttons
    this.el.querySelector('#btn-back-options').onclick = () => this.switchView('menu');
    this.el.querySelector('#btn-back-credits').onclick = () => this.switchView('menu');
    this.el.querySelector('#btn-back-profile').onclick = () => this.switchView('menu');

    // Logout
    this.el.querySelector('#btn-logout').onclick = () => this.handleLogout();

    // === OPTIONS SAVE ON CHANGE ===
    ['opt-volume', 'opt-music', 'opt-sfx', 'opt-touch', 'opt-fullscreen', 'opt-reduced'].forEach(id => {
      this.el.querySelector(`#${id}`).addEventListener('change', () => {
        this.saveOptions();
        // Aplicar cambios en tiempo real
        if (id === 'opt-fullscreen') this.toggleFullscreen();
        if (id === 'opt-reduced') this.toggleReducedMotion();
      });
    });

    // Keyboard navigation (Enter to submit, Escape to go back)
    document.addEventListener('keydown', (e) => {
      if (this.el.classList.contains('hidden')) return;
      
      if (e.key === 'Escape') {
        if (this.currentView !== 'auth' && this.currentView !== 'menu') {
          this.switchView('menu');
        }
      }
    });
  }

  async init(gameStateRef) {
    this.gameStateRef = gameStateRef;
    this.loadOptions();
    this.toggleReducedMotion(); // Apply on load
    
    const isLoggedIn = await AuthSystem.init();
    
    if (isLoggedIn && AuthSystem.currentUser) {
      await this.loadUserMenu();
    } else {
      this.switchView('auth');
    }
    
    this.el.classList.remove('hidden');
  }

  async loadUserMenu(isGuest = false) {
    const btnCont = this.el.querySelector('#btn-continue');
    
    // Check for saved game
    let saveData = null;
    if (isGuest) {
      saveData = await CloudSave.loadGuest();
    } else {
      saveData = await CloudSave.load();
    }
    
    // ✅ Validar que el save tenga datos útiles (no solo un objeto vacío)
    const hasValidSave = saveData && (
      (saveData.currentChapter && saveData.currentChapter >= 1) ||
      (saveData.player?.x !== undefined) ||
      (Array.isArray(saveData.player?.inventory) && saveData.player.inventory.length > 0)
    );
    
    btnCont.disabled = !hasValidSave;
    btnCont.title = hasValidSave 
      ? `Continuar: Cap. ${saveData.currentChapter || 1} - ${Math.floor((saveData.playtime||0)/60)} min`
      : 'No hay partida guardada válida';
    
    this.switchView('menu');
  }

  async startGame(isNew) {
    // Hide menu with animation
    this.el.classList.add('hidden');
    
    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (isNew) {
      // New game: clear guest save if any
      if (AuthSystem.isGuest()) {
        localStorage.removeItem('riverstrid_save_guest');
      }
      // Initialize game from chapter 1
      if (typeof window.game !== 'undefined' && typeof window.game.init === 'function') {
        window.game.init({ reset: true, chapter: 1 });
      }
    } else {
      // Continue: load saved state
      let saveData = null;
      if (AuthSystem.isGuest()) {
        saveData = await CloudSave.loadGuest();
      } else {
        saveData = await CloudSave.load();
      }
      
      if (saveData && typeof window.game?.loadChapterAtPosition === 'function') {
        // Usar nueva función que respeta posición guardada
        await window.game.loadChapterAtPosition(
          saveData.currentChapter ?? 1,
          saveData.player?.x ?? 5,
          saveData.player?.y ?? 10,
          saveData.player?.floor ?? 0
        );
        
        // Restaurar estado adicional del jugador
        if (window.player) {
          window.player.character = saveData.player?.character ?? 'lucas';
          window.player.sensitivity = saveData.player?.sensitivity ?? 0;
          window.player.inventory = Array.isArray(saveData.player?.inventory) ? [...saveData.player.inventory] : [];
        }
        
        // Restaurar interactables
        if (typeof interactableManager?.restoreState === 'function') {
          interactableManager.restoreState(saveData.interactables ?? {});
        }
        
        // Iniciar juego sin reset
        if (typeof window.game?.init === 'function') {
          window.game.init({ fromSave: true });
        }
      } else {
        // Fallback: nueva partida si no hay save válido
        this.showToast('⚠️ No se encontró partida guardada. Iniciando nuevo juego.');
        if (typeof window.game?.init === 'function') {
          window.game.init({ reset: true, chapter: 1 });
        }
      }
    }
  }

  showProfile() {
    const emailEl = this.el.querySelector('#profile-email');
    const timeEl = this.el.querySelector('#profile-time');
    const modeEl = this.el.querySelector('#profile-mode');
    
    if (AuthSystem.currentUser) {
      emailEl.textContent = AuthSystem.currentUser.email;
      modeEl.textContent = 'En línea';
      modeEl.className = 'badge online';
    } else {
      emailEl.textContent = 'Invitado';
      modeEl.textContent = 'Invitado';
      modeEl.className = 'badge offline';
    }
    
    // Load playtime from localStorage (simple tracking)
    const playtime = localStorage.getItem('riverstrid_playtime') || '0';
    const minutes = Math.floor(parseInt(playtime) / 60);
    timeEl.textContent = minutes > 0 ? `${minutes} min` : '0 min';
    
    this.switchView('profile');
  }

  async handleLogout() {
    try {
      await AuthSystem.logout();
      this.showToast('👋 Sesión cerrada correctamente');
      this.switchView('auth');
    } catch (err) {
      this.showToast('⚠️ Error al cerrar sesión');
      console.error('[Menu] Logout error:', err);
    }
  }

  switchView(viewName) {
    // Hide all views
    this.el.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // Show target view
    const targetView = this.el.querySelector(`.view-${viewName}`);
    if (targetView) {
      targetView.classList.add('active');
      this.currentView = viewName;
    }
  }

  showToast(message) {
    const toast = this.el.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  saveOptions() {
    const opts = {
      volume: this.el.querySelector('#opt-volume').value,
      music: this.el.querySelector('#opt-music').value,
      sfx: this.el.querySelector('#opt-sfx').value,
      touch: this.el.querySelector('#opt-touch').value,
      fullscreen: this.el.querySelector('#opt-fullscreen').checked,
      reduced: this.el.querySelector('#opt-reduced').checked
    };
    
    localStorage.setItem('riverstrid_options', JSON.stringify(opts));
    
    // Apply visual changes immediately
    this.toggleReducedMotion();
  }

  loadOptions() {
    try {
      const raw = localStorage.getItem('riverstrid_options');
      if (!raw) return;
      
      const opts = JSON.parse(raw);
      
      // Restore values to inputs
      if (opts.volume) this.el.querySelector('#opt-volume').value = opts.volume;
      if (opts.music) this.el.querySelector('#opt-music').value = opts.music;
      if (opts.sfx) this.el.querySelector('#opt-sfx').value = opts.sfx;
      if (opts.touch) this.el.querySelector('#opt-touch').value = opts.touch;
      if (opts.fullscreen !== undefined) this.el.querySelector('#opt-fullscreen').checked = opts.fullscreen;
      if (opts.reduced !== undefined) this.el.querySelector('#opt-reduced').checked = opts.reduced;
      
    } catch (e) {
      console.warn('[Menu] Error loading options:', e);
    }
  }

  toggleFullscreen() {
    const enabled = this.el.querySelector('#opt-fullscreen').checked;
    if (enabled) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  toggleReducedMotion() {
    const enabled = this.el.querySelector('#opt-reduced').checked;
    document.body.classList.toggle('reduced-motion', enabled);
  }

  // Public method to show menu again (e.g., when player pauses)
  show() {
    this.el.classList.remove('hidden');
  }

  // Public method to hide menu (called by game when starting)
  hide() {
    this.el.classList.add('hidden');
  }

  // Check if menu is visible
  isVisible() {
    return !this.el.classList.contains('hidden');
  }
}
