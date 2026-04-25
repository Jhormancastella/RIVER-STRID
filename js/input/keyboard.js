const keyboardInput = { 
  keys: {}, 
  callbacks: {}, 
  init(callbacks) { 
    this.callbacks = { ...this.callbacks, ...callbacks }; 
    window.addEventListener('keydown', (e) => { 
      const key = e.key.toLowerCase(); 
      this.keys[key] = true; 
      if (key === 'e' && this.callbacks.onInteract) this.callbacks.onInteract(); 
      if (key === 'q' && !GameState.dialogueActive && this.callbacks.onSwitch) this.callbacks.onSwitch(); 
      if (key === 'f' && this.callbacks.onFullscreen) this.callbacks.onFullscreen(); 
    }); 
    window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false); 
  }, 
  isDown(key) { return this.keys[key.toLowerCase()] === true; }, 
  getMovement() { 
    let dx = 0, dy = 0; 
    if (this.isDown('w') || this.isDown('arrowup')) dy = -1; 
    if (this.isDown('s') || this.isDown('arrowdown')) dy = 1; 
    if (this.isDown('a') || this.isDown('arrowleft')) dx = -1; 
    if (this.isDown('d') || this.isDown('arrowright')) dx = 1; 
    return { dx, dy }; 
  } 
};
