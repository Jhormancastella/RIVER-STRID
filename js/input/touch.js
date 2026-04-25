const joystickInput = { 
  active: false, 
  touchId: null, 
  dx: 0, 
  dy: 0, 
  init() { 
    const zone = document.getElementById('joystick-zone'), thumb = document.getElementById('joystick-thumb'); 
    if (!zone || !thumb) return; 
    zone.addEventListener('touchstart', (e) => { 
      e.preventDefault(); 
      if (this.active) return; 
      const t = e.changedTouches[0]; 
      this.active = true; 
      this.touchId = t.identifier; 
      const rect = zone.getBoundingClientRect(); 
      this.updatePosition(t.clientX, t.clientY, rect, thumb); 
    }, { passive: false }); 
    zone.addEventListener('touchmove', (e) => { 
      e.preventDefault(); 
      for (const t of e.changedTouches) { 
        if (t.identifier === this.touchId) { 
          const rect = zone.getBoundingClientRect(); 
          this.updatePosition(t.clientX, t.clientY, rect, thumb); 
        } 
      } 
    }, { passive: false }); 
    zone.addEventListener('touchend', (e) => { 
      for (const t of e.changedTouches) { 
        if (t.identifier === this.touchId) { 
          this.active = false; 
          this.touchId = null; 
          this.reset(thumb); 
        } 
      } 
    }); 
    zone.addEventListener('touchcancel', () => { 
      this.active = false; 
      this.touchId = null; 
      this.reset(thumb); 
    }); 
  }, 
  updatePosition(x, y, rect, thumb) { 
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; 
    let dx = x - cx, dy = y - cy; 
    const dist = Math.hypot(dx, dy); 
    const maxR = rect.width / 2 * CONFIG.JOYSTICK.RADIUS_FACTOR; 
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; } 
    this.dx = dx / maxR; 
    this.dy = dy / maxR; 
    if (Math.abs(this.dx) < CONFIG.JOYSTICK.DEADZONE) this.dx = 0; 
    if (Math.abs(this.dy) < CONFIG.JOYSTICK.DEADZONE) this.dy = 0; 
    thumb.style.left = (50 + (dx / rect.width) * 100) + '%'; 
    thumb.style.top = (50 + (dy / rect.height) * 100) + '%'; 
  }, 
  reset(thumb) { 
    this.dx = 0; 
    this.dy = 0; 
    if (thumb) { thumb.style.left = '50%'; thumb.style.top = '50%'; } 
  }, 
  getMovement() { return { dx: this.dx, dy: this.dy }; } 
};

const touchButtons = { 
  callbacks: {}, 
  init(callbacks) { 
    this.callbacks = { ...this.callbacks, ...callbacks }; 
    const btnInteract = document.getElementById('btn-interact'), btnSwitch = document.getElementById('btn-switch'), dialogueBox = document.getElementById('dialogue-box'), charIndicator = document.getElementById('char-indicator'), tutorial = document.getElementById('tutorial'); 
    if (btnInteract) btnInteract.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (this.callbacks.onInteract) this.callbacks.onInteract(); }, { passive: false }); 
    if (btnSwitch) btnSwitch.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (this.callbacks.onSwitch) this.callbacks.onSwitch(); }, { passive: false }); 
    if (dialogueBox) { 
      dialogueBox.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.callbacks.onInteract) this.callbacks.onInteract(); }, { passive: false }); 
      dialogueBox.addEventListener('click', () => { if (this.callbacks.onInteract) this.callbacks.onInteract(); }); 
    } 
    if (charIndicator) { 
      charIndicator.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.callbacks.onSwitch) this.callbacks.onSwitch(); }, { passive: false }); 
      charIndicator.addEventListener('click', () => { if (this.callbacks.onSwitch) this.callbacks.onSwitch(); }); 
    } 
    if (tutorial) { 
      tutorial.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.callbacks.onTutorial) this.callbacks.onTutorial(); }, { passive: false }); 
      tutorial.addEventListener('click', () => { if (this.callbacks.onTutorial) this.callbacks.onTutorial(); }); 
    } 
  } 
};
