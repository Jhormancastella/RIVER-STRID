const hud = {
  charIndicator: null, sensBar: null, proximityIndicator: null, controlsInfo: null,
  init() {
    this.charIndicator = document.getElementById('char-indicator');
    this.sensBar = document.getElementById('sens-bar');
    this.proximityIndicator = document.getElementById('proximity-indicator');
    this.controlsInfo = document.getElementById('controls-info');
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
    }
  }
};
