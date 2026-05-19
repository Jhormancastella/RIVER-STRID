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
  paused: false, // ✅ Estado de pausa
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
    
    // ✅ Inicializar menú de pausa con callback para salir al menú principal
    if (typeof window.PauseMenu?.init === 'function') {
      window.PauseMenu.init(() => {
        // Callback cuando el jugador elige "Salir al Menú"
        this.running = false;
        if (typeof window.mainMenu?.show === 'function') {
          window.mainMenu.show();
        }
      });
      // Exponer referencia para acceso desde otros módulos
      window.pauseMenu = window.PauseMenu;
    }
    
    // ✅ Configurar auto-guardado periódico (cada 45 segundos)
    this._setupAutoSave();
    
    this.running = true;
    this.lastTime = 0;
    requestAnimationFrame(this.gameLoop.bind(this));
    if (!GameState.isMobile) this.showOpeningDialogue();
  },

  loadChapter(chapter) {
    // Wrapper para compatibilidad: llama a loadChapterAtPosition con spawn por defecto
    const cfg = CHAPTER_CONFIG[chapter];
    this.loadChapterAtPosition(chapter, cfg.spawnX, cfg.spawnY, 0, true);
  },

  // ✅ NUEVO: Cargar capítulo en posición específica (para "Continuar")
  async loadChapterAtPosition(chapter, x, y, floor = 0, resetInventory = false) {
    GameState.currentChapter = chapter;
    GameState.chapterEnded = false;
    GameState.dialogueActive = false;
    GameState.nearInteractable = null;
    GameState._stairCooldown = false;
    if (TypewriterState.interval) { clearInterval(TypewriterState.interval); TypewriterState.interval = null; }
    TypewriterState.done = true;
    TypewriterState.fullText = '';

    player.floor = floor;
    loadChapterMap(chapter, floor);
    interactableManager.loadChapter(chapter);

    // ✅ POSICIÓN PERSONALIZADA (no spawn por defecto si resetInventory es false)
    player.x = x;
    player.y = y;
    player.facing = { x: 0, y: 1 };
    player.isMoving = false;
    
    // Solo resetear inventario si es nueva partida
    if (resetInventory) {
      player.inventory = [];
      player.sensitivity = 0;
    }

    this.fixSpawnIfBlocked();
    this.camera.x = player.x;
    this.camera.y = player.y;

    inventorySystem.update();
    hud.updateCharacterIndicator();
    hud.updateFloor(floor);

    const titleEl = document.getElementById('chapter-title');
    if (titleEl) titleEl.textContent = CHAPTER_CONFIG[chapter]?.title || '';
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
    
    // ✅ Mostrar/ocultar botón de pausa según dispositivo
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.style.display = isMobile ? 'flex' : 'none';
    }
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
          // ✅ Guardar progreso al recoger items importantes
          if (target.name !== 'Pista Genérica') {
            this._saveProgress('item_collected');
          }
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
    
    // ✅ GUARDAR PROGRESO ANTES DE TRANSICIÓN DE CAPÍTULO
    this._saveProgress('chapter_complete');
    
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

  // ✅ Método para pausar el juego
  pause() {
    if (this.paused || !this.running) return;
    this.paused = true;
    if (typeof GameState !== 'undefined') GameState.paused = true;
    // Mostrar menú de pausa si está inicializado
    if (typeof window.PauseMenu?.show === 'function') {
      window.PauseMenu.show();
    }
  },

  // ✅ Método para reanudar el juego
  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (typeof GameState !== 'undefined') GameState.paused = false;
    // Ocultar menú de pausa
    if (typeof window.PauseMenu?.hide === 'function') {
      window.PauseMenu.hide();
    }
  },

  // ✅ Método para alternar pausa
  togglePause() {
    if (this.paused) this.resume();
    else this.pause();
  },

  startGame() {
    this.tryFullscreen();
    screenSystem.hideTutorial();
    GameState.gameStarted = true;
    this.showOpeningDialogue();
  },

  // ✅ Configurar auto-guardado periódico
  _setupAutoSave() {
    // Guardar cada 45 segundos si el juego está activo y no está pausado
    setInterval(() => {
      if (this.running && !this.paused && !GameState.dialogueActive && GameState.gameStarted) {
        this._saveProgress('auto');
      }
    }, 45000);
  },

  // ✅ Guardar progreso del juego (reutilizable para checkpoints)
  _saveProgress(reason = 'manual') {
    if (typeof CloudSave?.save !== 'function') return;
    
    // Construir objeto de estado compatible con CloudSave
    const saveState = {
      currentChapter: GameState.currentChapter ?? 1,
      player: {
        x: player?.x ?? CHAPTER_CONFIG[GameState.currentChapter]?.spawnX ?? 5,
        y: player?.y ?? CHAPTER_CONFIG[GameState.currentChapter]?.spawnY ?? 10,
        character: player?.character ?? 'lucas',
        sensitivity: player?.sensitivity ?? 0,
        inventory: Array.isArray(player?.inventory) ? [...player.inventory] : [],
        floor: player?.floor ?? 0
      },
      interactables: typeof interactableManager?.getState === 'function' 
        ? interactableManager.getState() 
        : {},
      playtime: Math.floor(GameState.ambientTimer ?? 0)
    };
    
    CloudSave.save(saveState);
    
    // Actualizar tiempo jugado en localStorage para el perfil
    localStorage.setItem('riverstrid_playtime', String(Math.floor(GameState.ambientTimer ?? 0)));
    
    if (reason === 'checkpoint' || reason === 'chapter_complete') {
      console.log('💾 Progreso guardado:', reason);
    }
  },

  update(dt) {
    // ✅ No actualizar si está pausado o en diálogo
    if (!GameState.running || GameState.dialogueActive || this.paused) return;
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
