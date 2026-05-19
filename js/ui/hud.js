const hud = {
  charIndicator: null, sensBar: null, proximityIndicator: null, controlsInfo: null, pauseBtn: null,
  init() {
    this.charIndicator = document.getElementById('char-indicator');
    this.sensBar = document.getElementById('sens-bar');
    this.proximityIndicator = document.getElementById('proximity-indicator');
    this.controlsInfo = document.getElementById('controls-info');
    // ✅ Crear botón de pausa para móvil (se muestra en mobile, oculto en desktop por CSS)
    this.createPauseButton();
  },
  
  // Crear botón de pausa dinámico
  createPauseButton() {
    // Si ya existe, no duplicar
    if (document.getElementById('pause-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'pause-btn';
    btn.setAttribute('aria-label', 'Pausar juego');
    btn.innerHTML = '⏸'; // Icono de pausa
    btn.onclick = () => {
      if (typeof window.PauseMenu !== 'undefined') {
        window.PauseMenu.toggle();
      }
    };
    
    // Insertar en el contenedor del juego
    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(btn);
    }
    this.pauseBtn = btn;
  },
  updateCharacterIndicator() {
    if (!this.charIndicator) return;
    if (player.char === 'Lucas') { this.charIndicator.className = 'lucas'; this.charIndicator.textContent = '👤 LUCAS'; }
    else { this.charIndicator.className = 'sofia'; this.charIndicator.textContent = '👩 SOFÍA'; }
  },
  updateSensitivity() { if (this.sensBar) this.sensBar.style.width = `${player.sensitivity}%`; },
  updateFloor(floor) {
    const el = document.getElementById('floor-indicator');
    if (el) el.textContent = floor === 0 ? 'PLANTA BAJA' : `PISO ${floor}`;
  },
  updateProximity(nearInteractable) {
    if (!this.proximityIndicator) return;
    if (nearInteractable) {
      this.proximityIndicator.style.display = 'block';
      const canUse = nearInteractable.requiredChar === 'Any' || nearInteractable.requiredChar === player.char;
      this.proximityIndicator.textContent = canUse ? `❗ ${nearInteractable.name}` : `🔒 Necesita ${nearInteractable.requiredChar}`;
      this.proximityIndicator.style.borderColor = canUse ? 'rgba(46, 204, 113, 0.4)' : 'rgba(231, 76, 60, 0.4)';
      this.proximityIndicator.style.color = canUse ? 'rgba(46, 204, 113, 0.85)' : 'rgba(231, 76, 60, 0.85)';
    } else { this.proximityIndicator.style.display = 'none'; }
  },
  toggleMobileMode(isMobile) {
    const joystickEl = document.getElementById('joystick-zone'), touchCtrl = document.getElementById('touch-controls'), tutorial = document.getElementById('tutorial');
    if (isMobile) {
      if (joystickEl) joystickEl.style.display = 'block';
      if (touchCtrl) touchCtrl.style.display = 'block';
      if (this.controlsInfo) this.controlsInfo.style.display = 'none';
      if (tutorial) tutorial.style.display = 'flex';
    } else {
      if (joystickEl) joystickEl.style.display = 'none';
      if (touchCtrl) touchCtrl.style.display = 'none';
      if (this.controlsInfo) this.controlsInfo.style.display = 'block';
      if (tutorial) tutorial.style.display = 'none';
    }
  }
};
