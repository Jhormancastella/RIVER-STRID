const keyboardInput = { 
  keys: {}, 
  callbacks: {}, 
  
  // Helper seguro para normalizar teclas
  _normalizeKey(key) {
    if (!key || typeof key !== 'string') return '';
    return key.toLowerCase();
  },
  
  init(callbacks) { 
    this.callbacks = { ...this.callbacks, ...callbacks }; 
    
    window.addEventListener('keydown', (e) => { 
      // ✅ Protección: e.key puede ser undefined en algunos navegadores/casos edge
      const key = this._normalizeKey(e.key);
      if (!key) return; // Ignorar eventos sin tecla válida
      
      this.keys[key] = true; 
      
      if (key === 'e' && this.callbacks.onInteract) this.callbacks.onInteract(); 
      if (key === 'q' && typeof GameState !== 'undefined' && !GameState.dialogueActive && this.callbacks.onSwitch) this.callbacks.onSwitch(); 
      if (key === 'f' && this.callbacks.onFullscreen) this.callbacks.onFullscreen(); 
      // ✅ Tecla P para pausar/reanudar (solo si no hay diálogo activo)
      if (key === 'p' && typeof window.PauseMenu !== 'undefined' && (!GameState || !GameState.dialogueActive)) {
        e.preventDefault();
        window.PauseMenu.toggle();
      } 
    }); 
    
    window.addEventListener('keyup', (e) => { 
      const key = this._normalizeKey(e.key);
      if (key) this.keys[key] = false; 
    }); 
  }, 
  
  isDown(key) { 
    const normalized = this._normalizeKey(key);
    return normalized && this.keys[normalized] === true; 
  }, 
  
  getMovement() { 
    let dx = 0, dy = 0; 
    if (this.isDown('w') || this.isDown('arrowup')) dy = -1; 
    if (this.isDown('s') || this.isDown('arrowdown')) dy = 1; 
    if (this.isDown('a') || this.isDown('arrowleft')) dx = -1; 
    if (this.isDown('d') || this.isDown('arrowright')) dx = 1; 
    return { dx, dy }; 
  },
  
  // Método para resetear teclas (útil al cambiar de pantalla)
  reset() {
    this.keys = {};
  }
};

// Exponer globalmente si es necesario para compatibilidad
if (typeof window !== 'undefined') {
  window.keyboardInput = keyboardInput;
}
