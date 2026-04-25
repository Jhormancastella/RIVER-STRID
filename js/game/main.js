const CHAPTER_CONFIG = {
  1: {
    title: 'Cap 1: La Casa',
    spawnX: 5, spawnY: 10,
    opening: [
      'Sofía: (susurro)... "Casa... del bosque... la mujer que roba almas..."',
      'Lucas: "¿Sofía? ¿Escuchaste algo?"',
      'Sofía: "Álex me susurró. Debemos registrar la casa."',
      'Lucas: "Bien. Yo buscaré pistas. Tú siente lo que puedas."'
    ],
    winCondition(inv) { return inv.includes('Foto Campamento') && inv.includes('Llave Oxidada'); },
    doorName: 'Puerta Principal',
    winDialogue: [
      'Sofía: "Tenemos todo. Es hora de ir al campamento."',
      'Lucas: "Álex nos espera. Pero tengo un mal presentimiento..."',
      'Sofía: "River Strid... el río que nunca devuelve lo que se traga."'
    ]
  },
  2: {
    title: 'Cap 2: El Campamento',
    spawnX: 9, spawnY: 10,
    opening: [
      'Sofía: (respira hondo) Álex estuvo aquí. Lo siento.',
      'Lucas: El campamento está revuelto. ¿Qué pasó?',
      'Sofía: Algo lo llamó. Necesito tocar las cosas para entender.',
      'Lucas: Yo te cubro. Tú eres la que puede encontrar la verdad aquí.'
    ],
    winCondition(inv) {
      return inv.includes('Diario de Álex') && inv.includes('Amuleto Roto');
    },
    doorName: 'Sendero al Río',
    winDialogue: [
      'Sofía: Ya sé lo que pasó. Álex escuchó una voz y fue al río.',
      'Lucas: ¿Una voz? ¿De quién?',
      'Sofía: De una mujer. La misma del espejo en la casa.',
      'Sofía: Tenemos que ir al río. Yo puedo seguir su rastro.'
    ]
  },
  3: {
    title: 'Cap 3: El Río',
    spawnX: 19, spawnY: 4,
    opening: [
      'Sofía: "El río... es como si respirara."',
      'Lucas: "Álex tiene que estar cerca. Busquemos."',
      'Sofía: "Lucas... tengo miedo. Este lugar se lleva a la gente."',
      'Lucas: "Nos quedamos juntos. Pase lo que pase."'
    ],
    winCondition(inv) { return inv.includes('Diario Final') && inv.includes('Foto de Álex') && inv.includes('Cuerda Salvavidas') && inv.includes('Mapa del Río'); },
    doorName: 'Altar del Río',
    winDialogue: [
      'Sofía: "Álex... ya no está. El río se lo llevó."',
      'Lucas: "Lo siento. Llegamos tarde."',
      'Sofía: "Pero encontramos la verdad. Y eso importa."',
      'Lucas: "River Strid nunca devuelve lo que se traga... pero nosotros sobrevivimos."'
    ]
  }
};

const game = {
  canvas: null,
  renderer: null,
  camera: { x: 0, y: 0, shake: 0 },
  running: false,
  lastTime: 0,

  async init() {
    setVhVar();
    this.canvas = document.getElementById('game');
    this.renderer = new Renderer(this.canvas);
    this.initSystems();
    this.setupResize();
    this.detectMobileMode();
    await this.loadSprites();
    this.loadChapter(1);
    this.running = true;
    this.lastTime = 0;
    requestAnimationFrame(this.gameLoop.bind(this));
    if (!GameState.isMobile) this.showOpeningDialogue();
  },

  loadChapter(chapter) {
    GameState.currentChapter = chapter;
    GameState.chapterEnded = false;
    GameState.dialogueActive = false;
    GameState.nearInteractable = null;

    player.floor = 0;
    loadChapterMap(chapter, 0);
    interactableManager.loadChapter(chapter);

    const cfg = CHAPTER_CONFIG[chapter];
    player.x = cfg.spawnX;
    player.y = cfg.spawnY;
    player.inventory = [];
    player.facing = { x: 0, y: 1 };
    player.isMoving = false;
    player.sensitivity = 0;

    this.fixSpawnIfBlocked();
    this.camera.x = player.x;
    this.camera.y = player.y;

    inventorySystem.update();
    hud.updateCharacterIndicator();
    hud.updateFloor(0);

    const titleEl = document.getElementById('chapter-title');
    if (titleEl) titleEl.textContent = cfg.title;
  },

  setupResize() {
    const resize = () => {
      const dpr = getDevicePixelRatio();
      const { width, height } = getVisualViewportSize();
      this.renderer.canvas.width = Math.floor(width * dpr);
      this.renderer.canvas.height = Math.floor(height * dpr);
      this.renderer.canvas.style.width = width + 'px';
      this.renderer.canvas.style.height = height + 'px';
      this.renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.renderer.resize(width, height);
      const base = Math.min(width, height);
      const portrait = height > width;
      let z = base / CONFIG.CAMERA.BASE_DIVISOR;
      z = clamp(z, portrait ? CONFIG.CAMERA.MIN_ZOOM : 0.72, CONFIG.CAMERA.MAX_ZOOM);
      isoProjection.setZoom(z);
      characterSprites.updateViewScale(z);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => { setVhVar(); resize(); });
      window.visualViewport.addEventListener('scroll', () => { setVhVar(); resize(); });
    }
    window.addEventListener('resize', () => { setVhVar(); this.detectMobileMode(); resize(); });
    window.addEventListener('orientationchange', () => setTimeout(() => { setVhVar(); this.detectMobileMode(); resize(); }, 200));
    resize();
  },

  detectMobileMode() {
    const isMobile = detectMobile();
    GameState.isMobile = isMobile;
    document.body.classList.toggle('mobile', isMobile);
    hud.toggleMobileMode(isMobile);
    dialogueSystem.setMobileHints(isMobile);
    screenSystem.showRotateHint(isMobile);
    minimap.resize(isMobile ? 68 : 86);
  },

  initSystems() {
    dialogueSystem.init();
    inventorySystem.init();
    hud.init();
    screenSystem.init();
    minimap.init();
    const callbacks = {
      onInteract: () => this.handleInteract(),
      onSwitch: () => this.switchCharacter(),
      onFullscreen: () => this.tryFullscreen(),
      onTutorial: () => this.startGame()
    };
    keyboardInput.init(callbacks);
    joystickInput.init();
    touchButtons.init(callbacks);
  },

  async loadSprites() {
    try { await Promise.all([characterSprites.loadAll(), TILESHEET.load()]); }
    catch (e) { console.warn('[Game] Asset loading failed, using fallback'); }
  },

  fixSpawnIfBlocked() {
    const tx = Math.floor(player.x), ty = Math.floor(player.y);
    if (collisionSystem.canMoveTo(tx, ty)) return;
    for (let r = 1; r <= 8; r++) {
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          const nx = tx + ox, ny = ty + oy;
          if (collisionSystem.canMoveTo(nx, ny)) {
            player.x = nx + 0.01;
            player.y = ny + 0.01;
            return;
          }
        }
      }
    }
  },

  switchCharacter() { player.switchCharacter(); hud.updateCharacterIndicator(); },

  handleInteract() {
    if (!dialogueSystem.isActive()) {
      const target = interactableManager.getNearInteractable(player.x, player.y, player.char);
      if (target) {
        if (target.requiredChar !== 'Any' && target.requiredChar !== player.char) {
          dialogueSystem.show([`Necesitas a ${target.requiredChar} para interactuar con esto.`]);
          return;
        }

        const cfg = CHAPTER_CONFIG[GameState.currentChapter];

        // Lógica de puerta/salida
        if (target.name === cfg.doorName) {
          if (cfg.winCondition(player.inventory)) {
            GameState.chapterEnded = true;
            dialogueSystem.show(cfg.winDialogue);
          } else {
            dialogueSystem.show(target.dialog);
          }
          return;
        }

        if (target.collectible && target.state === 'available') {
          target.take();
          inventorySystem.addItem(target.name);
        }
        dialogueSystem.show(target.dialog);
      }
    } else {
      const completed = dialogueSystem.advance();
      if (completed) this.checkChapterEnd();
    }
  },

  checkChapterEnd() {
    if (!GameState.chapterEnded) return;
    const chapter = GameState.currentChapter;
    if (chapter < 3) {
      setTimeout(() => {
        screenSystem.showChapterTransition(chapter + 1, () => {
          this.loadChapter(chapter + 1);
          this.showOpeningDialogue();
        });
      }, 800);
    } else {
      setTimeout(() => { screenSystem.showEndScreen(); this.running = false; }, 1000);
    }
  },

  showOpeningDialogue() {
    const cfg = CHAPTER_CONFIG[GameState.currentChapter];
    const msgs = [...cfg.opening];
    if (GameState.isMobile) {
      msgs.push('🎮 Joystick: mover | Q: cambiar | E: interactuar');
    }
    dialogueSystem.show(msgs);
  },

  tryFullscreen() {
    // Solo en móvil; en escritorio no forzamos pantalla completa
    if (!GameState.isMobile) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen({ navigationUI: 'hide' })
        .then(() => {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        })
        .catch(() => {});
    }
  },

  startGame() {
    this.tryFullscreen();
    screenSystem.hideTutorial();
    GameState.gameStarted = true;
    this.showOpeningDialogue();
  },

  update(dt) {
    if (!GameState.running || GameState.dialogueActive) return;
    const keyboard = keyboardInput.getMovement();
    const joystick = joystickInput.getMovement();
    let dx = keyboard.dx || joystick.dx;
    let dy = keyboard.dy || joystick.dy;
    if (dx || dy) { const mag = Math.hypot(dx, dy); if (mag > 0) { dx /= mag; dy /= mag; } }
    player.isMoving = Math.hypot(dx, dy) > 0;
    if (dx || dy) {
      player.facing.x = dx;
      player.facing.y = dy;
      const speed = player.speed * dt * 60;
      const result = collisionSystem.move(player.x, player.y, dx, dy, speed);
      player.x = result.x;
      player.y = result.y;
      player.walkFrame += dt * 10;
      characterSprites.currentFrame = player.walkFrame;
    }
    const lerpFactor = 1 - Math.pow(CONFIG.CAMERA.LERP_FACTOR, dt);
    this.camera.x += (player.x - this.camera.x) * lerpFactor;
    this.camera.y += (player.y - this.camera.y) * lerpFactor;
    this.camera.x = clamp(this.camera.x, 1, CONFIG.MAP.COLS - 2);
    this.camera.y = clamp(this.camera.y, 1, CONFIG.MAP.ROWS - 2);
    const nearInteractable = interactableManager.getNearInteractable(player.x, player.y, player.char);
    GameState.nearInteractable = nearInteractable;
    hud.updateProximity(nearInteractable);
    player.updateSensitivity(nearInteractable, dt);
    hud.updateSensitivity();
    GameState.ambientTimer += dt;

    // Escaleras: cambio de piso automático al pisar
    const stair = collisionSystem.checkStairs(player.x, player.y, GameState.currentChapter, player.floor);
    if (stair && !GameState._stairCooldown) {
      player.floor = stair.toFloor;
      loadChapterMap(GameState.currentChapter, stair.toFloor);
      player.x = stair.spawnX + 0.5;
      player.y = stair.spawnY + 0.5;
      this.camera.x = player.x;
      this.camera.y = player.y;
      hud.updateFloor(player.floor);
      GameState._stairCooldown = true;
      setTimeout(() => { GameState._stairCooldown = false; }, 800);
    }
  },

  render() {
    this.renderer.render(this.camera);
    minimap.render();
  },

  gameLoop(ts) {
    if (!this.lastTime) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    if (this.running) { this.update(dt); this.render(); }
    requestAnimationFrame(this.gameLoop.bind(this));
  }
};

document.addEventListener('DOMContentLoaded', () => { game.init(); });
document.addEventListener('touchmove', (e) => { if (e.target.closest('#game-container')) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());
