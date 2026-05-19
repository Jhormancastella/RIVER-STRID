// js/ui/authOverlay.js
// Overlay de autenticación con diseño adaptado a la estética del juego

export class AuthOverlay {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'auth-overlay';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.innerHTML = this._getTemplate();
    document.body.appendChild(this.el);
    
    this.form = this.el.querySelector('#auth-form');
    this.errorEl = this.el.querySelector('#auth-error');
    this.toggleBtn = this.el.querySelector('#auth-toggle');
    this.submitBtn = this.el.querySelector('#auth-submit');
    this.guestBtn = this.el.querySelector('#auth-guest');
    this.titleEl = this.el.querySelector('#auth-title');
    this.userField = this.el.querySelector('#auth-user');
    
    this.isRegister = false;
    this._bindEvents();
  }

  _getTemplate() {
    return `
      <div class="auth-box">
        <h2 id="auth-title">RIVER-STRID</h2>
        <form id="auth-form" novalidate>
          <input type="text" id="auth-user" class="auth-input" placeholder="Nombre de usuario (opcional)" autocomplete="username" style="display:none">
          <input type="email" id="auth-email" class="auth-input" placeholder="Correo electrónico" autocomplete="email" required>
          <input type="password" id="auth-pass" class="auth-input" placeholder="Contraseña" autocomplete="current-password" required minlength="6">
          <button type="submit" class="auth-btn" id="auth-submit">Iniciar Sesión</button>
        </form>
        <p class="auth-error" id="auth-error" role="alert" aria-live="polite"></p>
        <span class="auth-toggle" id="auth-toggle" tabindex="0">¿No tienes cuenta? Regístrate</span>
        <button class="auth-btn secondary" id="auth-guest" type="button">Jugar como Invitado</button>
        <p class="auth-footer">Tu progreso se guarda en la nube ☁️</p>
      </div>
    `;
  }

  _bindEvents() {
    // Toggle registro/login
    this.toggleBtn.onclick = () => this._toggleMode();
    this.toggleBtn.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggleMode(); }};

    // Invitado
    this.guestBtn.onclick = () => this._emit('guest', null);

    // Submit form
    this.form.onsubmit = async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    };

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.el.classList.contains('active')) {
        // Solo cerrar si es invitado o ya está autenticado, no interrumpir login
        if (window.AuthSystem?.currentUser || this._isGuestMode()) {
          this.hide();
        }
      }
    });
  }

  _toggleMode() {
    this.isRegister = !this.isRegister;
    
    // Actualizar UI
    this.titleEl.textContent = this.isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN';
    this.submitBtn.textContent = this.isRegister ? 'Registrarse' : 'Iniciar Sesión';
    this.toggleBtn.textContent = this.isRegister 
      ? '¿Ya tienes cuenta? Inicia sesión' 
      : '¿No tienes cuenta? Regístrate';
    this.userField.style.display = this.isRegister ? 'block' : 'none';
    this.userField.required = this.isRegister;
    
    // Limpiar errores y campos
    this.errorEl.textContent = '';
    this.form.reset();
    
    // Enfocar primer campo visible
    setTimeout(() => {
      (this.isRegister ? this.userField : this.el.querySelector('#auth-email')).focus();
    }, 100);
  }

  async _handleSubmit() {
    const email = this.el.querySelector('#auth-email').value.trim();
    const pass = this.el.querySelector('#auth-pass').value;
    const user = this.el.querySelector('#auth-user').value.trim();
    
    // Validaciones básicas
    if (!email || !pass) {
      this._setError('Correo y contraseña son obligatorios');
      return;
    }
    if (pass.length < 6) {
      this._setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this._setLoading(true);
    this._setError('');

    try {
      if (this.isRegister) {
        const result = await window.AuthSystem.register(email, pass, user || null);
        if (result.needsConfirmation) {
          this._setError('✅ Revisa tu correo para confirmar la cuenta');
          this._setLoading(false);
          return;
        }
      } else {
        await window.AuthSystem.login(email, pass);
      }
      
      // Éxito
      this.hide();
      this._emit('authenticated', { email, isRegister: this.isRegister });
      
    } catch (err) {
      console.error('[AuthOverlay] Error:', err);
      this._setError(err.message || 'Error de autenticación. Intenta de nuevo.');
    } finally {
      this._setLoading(false);
    }
  }

  _setError(msg) {
    this.errorEl.textContent = msg;
    this.errorEl.style.color = msg?.includes('✅') ? '#4ade80' : '#ff6b6b';
  }

  _setLoading(loading) {
    this.submitBtn.disabled = loading;
    this.submitBtn.textContent = loading ? 'Conectando...' : (this.isRegister ? 'Registrarse' : 'Iniciar Sesión');
    this.form.style.opacity = loading ? '0.7' : '1';
    this.form.style.pointerEvents = loading ? 'none' : 'auto';
  }

  _isGuestMode() {
    return !this.isRegister && !window.AuthSystem?.currentUser;
  }

  _emit(event, detail) {
    this.el.dispatchEvent(new CustomEvent(event, { detail, bubbles: true }));
  }

  show() {
    this.el.classList.add('active');
    // Enfocar primer campo
    setTimeout(() => this.el.querySelector('#auth-email')?.focus(), 100);
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.el.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Método estático para inicialización rápida
  static async initAndShow() {
    const overlay = new AuthOverlay();
    
    return new Promise((resolve) => {
      overlay.el.addEventListener('authenticated', (e) => resolve({ type: 'auth', ...e.detail }));
      overlay.el.addEventListener('guest', () => resolve({ type: 'guest' }));
      overlay.show();
    });
  }
}

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.AuthOverlay = AuthOverlay;
}
