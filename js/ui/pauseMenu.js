// js/ui/pauseMenu.js - Sistema de pausa responsive para escritorio y móvil
// NOTA: Sin exports para compatibilidad con scripts clásicos en index.html

const PauseMenuImpl = {
  overlay: null,
  container: null,
  optionsPanel: null,
  isPaused: false,
  onExitCallback: null,

  // Inicializar el overlay de pausa
  init(onExitCallback) {
    this.onExitCallback = onExitCallback;
    this.buildDOM();
    this.bindEvents();
    this.loadOptions();
    return this;
  },

  // Construir el DOM del menú de pausa
  buildDOM() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'pause-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Menú de pausa');

    this.overlay.innerHTML = `
      <div class="pause-container">
        <h2>⏸ PAUSA</h2>
        
        <!-- Menú principal de pausa -->
        <div class="pause-main">
          <button class="pause-btn" id="pause-resume" aria-label="Continuar jugando">▶ Continuar</button>
          <button class="pause-btn" id="pause-options" aria-label="Abrir opciones">⚙ Opciones</button>
          <button class="pause-btn danger" id="pause-exit" aria-label="Salir al menú principal">🏠 Salir al Menú</button>
        </div>
        
        <!-- Panel de opciones (oculto por defecto) -->
        <div class="pause-options" id="pause-options-panel">
          <div class="options-grid">
            <label>
              Volumen Maestro
              <input type="range" id="opt-volume" min="0" max="100" value="80">
            </label>
            <label>
              Música
              <input type="range" id="opt-music" min="0" max="100" value="70">
            </label>
            <label>
              Efectos de Sonido
              <input type="range" id="opt-sfx" min="0" max="100" value="90">
            </label>
            <label>
              Sensibilidad Táctil
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
          <button class="pause-btn pause-back-btn" id="pause-back-options">← Volver</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.container = this.overlay.querySelector('.pause-container');
    this.optionsPanel = this.overlay.querySelector('#pause-options-panel');
  },

  // Vincular eventos de los botones
  bindEvents() {
    // Botón Continuar
    this.overlay.querySelector('#pause-resume').addEventListener('click', () => this.resume());

    // Botón Opciones (mostrar/ocultar panel)
    this.overlay.querySelector('#pause-options').addEventListener('click', () => {
      const main = this.overlay.querySelector('.pause-main');
      if (this.optionsPanel.classList.contains('active')) {
        this.optionsPanel.classList.remove('active');
        main.style.display = 'block';
      } else {
        main.style.display = 'none';
        this.optionsPanel.classList.add('active');
        this.loadOptions(); // Recargar valores al abrir
      }
    });

    // Botón Volver desde opciones
    this.overlay.querySelector('#pause-back-options').addEventListener('click', () => {
      this.optionsPanel.classList.remove('active');
      this.overlay.querySelector('.pause-main').style.display = 'block';
      this.saveOptions(); // Guardar cambios al volver
    });

    // Botón Salir al Menú
    this.overlay.querySelector('#pause-exit').addEventListener('click', () => {
      this.confirmExit();
    });

    // Listeners para sliders de opciones (guardar en tiempo real)
    ['opt-volume', 'opt-music', 'opt-sfx', 'opt-touch'].forEach(id => {
      const el = this.overlay.querySelector(`#${id}`);
      if (el) el.addEventListener('input', () => this.saveOptions());
    });

    // Listeners para toggles
    ['opt-fullscreen', 'opt-reduced'].forEach(id => {
      const el = this.overlay.querySelector(`#${id}`);
      if (el) el.addEventListener('change', () => {
        this.saveOptions();
        if (id === 'opt-fullscreen' && el.checked) {
          this.requestFullscreen();
        }
        if (id === 'opt-reduced') {
          document.body.classList.toggle('reduced-motion', el.checked);
        }
      });
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (this.isPaused && e.key === 'Escape') {
        e.preventDefault();
        this.resume();
      }
    });

    // Prevenir cierre accidental tocando fuera del contenedor
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        // Opcional: no hacer nada o cerrar (mejor no cerrar accidentalmente)
        // this.resume();
      }
    });

    // ✅ Listener para el botón de pausa en el HUD (móvil)
    // Se añade con delay para asegurar que el DOM del juego esté listo
    setTimeout(() => {
      const pauseBtn = document.getElementById('pause-btn');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        });
        // Evitar que el botón capture eventos de toque del joystick
        pauseBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      }
    }, 500);
  },

  // Mostrar el menú de pausa
  show() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.overlay.classList.add('active');
    
    // Pausar el juego a nivel de estado
    if (typeof GameState !== 'undefined') {
      GameState.paused = true;
    }
    
    // Pausar audio si existe el sistema
    if (typeof window.AudioManager?.pause === 'function') {
      window.AudioManager.pause();
    }
    
    // Enfocar el primer botón para accesibilidad
    setTimeout(() => {
      this.overlay.querySelector('#pause-resume')?.focus();
    }, 100);
  },

  // Ocultar el menú y reanudar
  hide() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.overlay.classList.remove('active');
    
    // Restaurar estado del juego
    if (typeof GameState !== 'undefined') {
      GameState.paused = false;
    }
    
    // Reanudar audio
    if (typeof window.AudioManager?.resume === 'function') {
      window.AudioManager.resume();
    }
    
    // Restaurar foco al canvas para controles
    const canvas = document.getElementById('game');
    if (canvas) canvas.focus();
  },

  // Alternar estado de pausa
  toggle() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  },

  // Alias para show()
  pause() {
    this.show();
  },

  // Alias para hide()
  resume() {
    // Guardar opciones antes de cerrar
    this.saveOptions();
    this.hide();
  },

  // Confirmar salida al menú principal
  confirmExit() {
    // En producción podrías mostrar un modal de confirmación
    // Para ahora, salimos directamente pero podrías añadir:
    // if (confirm('¿Seguro que quieres salir? El progreso se guardará.')) { ... }
    
    this.hide();
    
    // Detener el juego y mostrar menú principal
    if (typeof window.game !== 'undefined' && window.game.running) {
      window.game.running = false;
    }
    
    // Mostrar menú principal si existe
    if (typeof window.mainMenu?.show === 'function') {
      window.mainMenu.show();
    } else if (this.onExitCallback) {
      this.onExitCallback();
    }
  },

  // Guardar opciones en localStorage
  saveOptions() {
    const opts = {
      volume: this.overlay.querySelector('#opt-volume')?.value || 80,
      music: this.overlay.querySelector('#opt-music')?.value || 70,
      sfx: this.overlay.querySelector('#opt-sfx')?.value || 90,
      touch: this.overlay.querySelector('#opt-touch')?.value || 5,
      fullscreen: this.overlay.querySelector('#opt-fullscreen')?.checked || false,
      reduced: this.overlay.querySelector('#opt-reduced')?.checked || false
    };
    
    try {
      localStorage.setItem('riverstrid_options', JSON.stringify(opts));
      
      // Aplicar cambios en tiempo real si hay sistema de audio
      if (typeof window.AudioManager?.setVolume === 'function') {
        window.AudioManager.setVolume('master', opts.volume);
        window.AudioManager.setVolume('music', opts.music);
        window.AudioManager.setVolume('sfx', opts.sfx);
      }
    } catch (e) {
      console.warn('[PauseMenu] No se pudo guardar opciones:', e);
    }
  },

  // Cargar opciones desde localStorage
  loadOptions() {
    try {
      const raw = localStorage.getItem('riverstrid_options');
      if (!raw) return;
      
      const opts = JSON.parse(raw);
      
      const setVal = (id, val) => {
        const el = this.overlay.querySelector(`#${id}`);
        if (el && val !== undefined) {
          if (el.type === 'checkbox') {
            el.checked = !!val;
          } else {
            el.value = val;
          }
        }
      };
      
      setVal('opt-volume', opts.volume);
      setVal('opt-music', opts.music);
      setVal('opt-sfx', opts.sfx);
      setVal('opt-touch', opts.touch);
      setVal('opt-fullscreen', opts.fullscreen);
      setVal('opt-reduced', opts.reduced);
      
      // Aplicar clase de efectos reducidos si está activada
      if (opts.reduced) {
        document.body.classList.add('reduced-motion');
      }
    } catch (e) {
      console.warn('[PauseMenu] No se pudieron cargar opciones:', e);
    }
  },

  // Solicitar pantalla completa
  requestFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen({ navigationUI: 'hide' }).catch(err => {
        console.warn('[PauseMenu] No se pudo activar pantalla completa:', err);
      });
    }
  },

  // Getter para estado actual
  isPaused: () => PauseMenu.isPaused
};

// Exponer globalmente para compatibilidad con scripts clásicos
if (typeof window !== 'undefined') {
  window.PauseMenu = PauseMenuImpl;
}
