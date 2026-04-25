class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.width = 0;
    this.height = 0;
  }
  resize(width, height) { this.width = width; this.height = height; }
  clear() { this.ctx.fillStyle = CONFIG.COLORS.BG; this.ctx.fillRect(0, 0, this.width, this.height); }
  
  drawFloor(camera) {
    for (let y = 0; y < CONFIG.MAP.ROWS; y++) {
      for (let x = 0; x < CONFIG.MAP.COLS; x++) {
        if (!isoProjection.isTileVisible(x, y, camera.x, camera.y, this.width, this.height)) continue;
        const tile = MAP_DATA[y][x];
        if (tile === TileType.WALL) continue;
        const worldPos = isoProjection.getTileCenter(x, y);
        const screenPos = isoProjection.project(worldPos.x, worldPos.y, camera.x, camera.y, this.width, this.height);

        // Intentar dibujar con textura; si no está lista, usar color sólido
        const textured = TILESHEET.drawForType(this.ctx, tile, screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH, GameState.currentChapter);
        if (!textured) {
          this.drawIsoDiamond(screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH, this.getTileColor(tile), this.getTileStroke(tile));
        }

        if (tile === TileType.STAIR) {
          // Usar sprite de escalera si está disponible, sino emoji
          if (!TILESHEET.drawStair(this.ctx, screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH)) {
            this.ctx.save();
            this.ctx.font = `${Math.max(10, 14 * isoProjection.zoom)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.globalAlpha = 0.85;
            this.ctx.fillText('🪜', screenPos.x, screenPos.y - 4 * isoProjection.zoom);
            this.ctx.restore();
          }
        }
      }
    }
  }

  drawPlayer(camera) {
    const worldX = player.x + 0.5, worldY = player.y + 0.5;
    const screenPos = isoProjection.project(worldX, worldY, camera.x, camera.y, this.width, this.height);
    const bob = player.isMoving ? Math.sin(player.walkFrame) * 2 : 0;
    this.drawShadow(screenPos.x, screenPos.y);
    const sprite = characterSprites.getSprite(player.char);
    if (sprite && sprite.ready) {
      const direction = getDirectionFromFacing(player.facing.x, player.facing.y);
      const frameInfo = this.getAnimFrame(direction, player.isMoving);
      // Ajustado para que los pies toquen el suelo correctamente (offset de 10px)
      drawSpriteFrame(this.ctx, sprite, frameInfo.frame, screenPos.x, screenPos.y + 10 * isoProjection.zoom + bob, frameInfo.flip);
    } else {
      this.drawFallbackCharacter(screenPos.x, screenPos.y - 20 * isoProjection.zoom + bob);
    }
  }

  getAnimFrame(direction, isMoving) {
    const anims = player.char === 'Lucas' ? LUCAS_ANIMATIONS : SOFIA_ANIMATIONS;
    const t = Math.floor(characterSprites.currentFrame) % 4;
    if (!isMoving) {
      if (direction === 'up')    return { frame: anims.idleUp,    flip: false };
      if (direction === 'down')  return { frame: anims.idleDown,  flip: false };
      if (direction === 'left')  return { frame: anims.idleLeft,  flip: false };
      if (direction === 'right') return { frame: anims.idleRight, flip: false };
      return { frame: anims.idleDown, flip: false };
    }
    if (direction === 'up')    return { frame: anims.walkUp[t],    flip: false };
    if (direction === 'down')  return { frame: anims.walkDown[t],  flip: false };
    if (direction === 'left')  return { frame: anims.walkLeft[t],  flip: false };
    if (direction === 'right') return { frame: anims.walkRight[t], flip: false };
    return { frame: anims.walkDown[t], flip: false };
  }

  drawShadow(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 12 * isoProjection.zoom, 14 * isoProjection.zoom, 6 * isoProjection.zoom, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawFallbackCharacter(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);
    const color = player.char === 'Lucas' ? '#4a90e2' : '#9b59b6';
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillRect(-12 * isoProjection.zoom, -24 * isoProjection.zoom, 24 * isoProjection.zoom, 32 * isoProjection.zoom);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-12 * isoProjection.zoom, -24 * isoProjection.zoom, 24 * isoProjection.zoom, 32 * isoProjection.zoom);
    this.ctx.restore();
  }

  render(camera) {
    this.clear();
    this.drawFloor(camera);

    // Render por fila para z-ordering correcto: muro/interactable/jugador ordenados por Y
    const interactables = interactableManager.getAllInteractables().filter(
      obj => !(obj.state === 'taken' && obj.type !== 'whisper' && obj.type !== 'door')
            && (obj.floor === undefined || obj.floor === player.floor)
    );

    // Profundidad isométrica continua del jugador (x+y), evita saltos visuales al cruzar el centro de un tile
    const playerDepth = player.x + player.y;

    // Dibujamos por "capas" de suma (x + y) para asegurar el orden isométrico correcto
    // Esto hace que se dibuje de atrás hacia adelante (de arriba a abajo en la pantalla)
    const maxLayer = (CONFIG.MAP.ROWS - 1) + (CONFIG.MAP.COLS - 1);
    let playerDrawn = false;
    
    for (let layer = 0; layer <= maxLayer; layer++) {
      // Dibujar jugador cuando su profundidad continua queda por delante de esta capa
      if (!playerDrawn && playerDepth < layer + 1) {
        this.drawPlayer(camera);
        playerDrawn = true;
      }

      for (let y = 0; y < CONFIG.MAP.ROWS; y++) {
        const x = layer - y;
        if (x < 0 || x >= CONFIG.MAP.COLS) continue;

        // Frustum culling: saltar tiles fuera de pantalla
        if (!isoProjection.isTileVisible(x, y, camera.x, camera.y, this.width, this.height)) continue;

        // Muros — cap 2: árboles, cap 3: obstáculos de agua, resto: muros de ladrillo
        if (MAP_DATA[y][x] === TileType.WALL) {
          const worldPos = isoProjection.getTileCenter(x, y);
          const screenPos = isoProjection.project(worldPos.x, worldPos.y, camera.x, camera.y, this.width, this.height);
          if (GameState.currentChapter === 2) {
            TILESHEET.drawForType(this.ctx, TileType.FLOOR, screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH);
            TILESHEET.drawTree(this.ctx, TILESHEET.getTreeForPos(x, y), screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH);
          } else if (GameState.currentChapter === 3) {
            // En el río los WALL son obstáculos: agua con rocas/troncos
            TILESHEET.drawForType(this.ctx, TileType.DARK, screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH, 3);
            TILESHEET.drawTree(this.ctx, TILESHEET.getWaterObstacleForPos(x, y), screenPos.x, screenPos.y, isoProjection.tileW, isoProjection.tileH);
          } else {
            this.drawWall(screenPos.x, screenPos.y);
          }
        }

        // Interactables en esta celda
        for (const obj of interactables) {
          if (Math.floor(obj.y + 0.5) === y && Math.floor(obj.x + 0.5) === x) {
            const worldX = obj.x + 0.5, worldY = obj.y + 0.5;
            const screenPos = isoProjection.project(worldX, worldY, camera.x, camera.y, this.width, this.height);
            const bob = Math.sin(GameState.ambientTimer * CONFIG.ANIMATION.BOB_SPEED + obj.x * 2) * 3;
            this.ctx.save();
            this.ctx.translate(screenPos.x, screenPos.y - 15 + bob);
            const isNear = GameState.nearInteractable === obj;
            if (isNear) {
              this.ctx.shadowColor = obj.type === 'whisper' ? '#9b59b6' : obj.type === 'door' ? '#2ecc71' : '#e67e22';
              this.ctx.shadowBlur = 14;
            }
            const color = CONFIG.INTERACTABLE_COLORS[obj.type] || '#888';
            this.ctx.globalAlpha = isNear ? 1 : 0.75;
            this.drawIsoDiamond(0, 0, 20 * isoProjection.zoom, 12 * isoProjection.zoom, color, isNear ? '#fff' : null);
            this.ctx.globalAlpha = 1;
            this.ctx.font = `${isNear ? 16 : 14}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText(obj.icon || '?', 0, -1);
            this.ctx.restore();
          }
        }
      }
    }

    // Asegurar que el jugador se dibuje si quedó en la última capa
    if (!playerDrawn) this.drawPlayer(camera);

    this.drawFlashlightEffect(camera);
  }

  drawFlashlightEffect(camera) {
    const worldX = player.x + 0.5, worldY = player.y + 0.5;
    const screenPos = isoProjection.project(worldX, worldY, camera.x, camera.y, this.width, this.height);
    const px = screenPos.x, py = screenPos.y;

    // Radio escala con el tamaño de pantalla para que siempre sea proporcional
    const screenDiag = Math.hypot(this.width, this.height);
    const innerR = screenDiag * 0.12;
    const outerR = screenDiag * 0.55;

    if (player.char !== 'Lucas' || !player.flashlight) {
      // Sofía: niebla suave, sin linterna
      const grad = this.ctx.createRadialGradient(px, py, innerR * 0.5, px, py, outerR);
      grad.addColorStop(0,   'rgba(155, 89, 182, 0.02)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1,   'rgba(0, 0, 0, 0.82)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }

    // Lucas: linterna direccional
    const a = Math.atan2(player.facing.y, player.facing.x);
    const lx = px + Math.cos(a) * innerR * 0.5;
    const ly = py + Math.sin(a) * innerR * 0.25;
    const lightR = screenDiag * 0.32;
    const grad = this.ctx.createRadialGradient(lx, ly - innerR * 0.1, innerR * 0.3, lx, ly - innerR * 0.1, lightR);
    grad.addColorStop(0,   'rgba(255, 255, 220, 0.13)');
    grad.addColorStop(0.4, 'rgba(255, 255, 200, 0.05)');
    grad.addColorStop(1,   'rgba(0, 0, 0, 0.88)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawIsoDiamond(sx, sy, w, h, fill, stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(sx, sy - h / 2);
    this.ctx.lineTo(sx + w / 2, sy);
    this.ctx.lineTo(sx, sy + h / 2);
    this.ctx.lineTo(sx - w / 2, sy);
    this.ctx.closePath();
    if (fill) { this.ctx.fillStyle = fill; this.ctx.fill(); }
    if (stroke) { this.ctx.strokeStyle = stroke; this.ctx.lineWidth = 1; this.ctx.stroke(); }
  }

  drawWall(sx, sy) {
    const tw = isoProjection.tileW;
    const th = isoProjection.tileH;
    const wallH = th * 2;

    // Intentar dibujar con textura
    if (TILESHEET.drawWall(this.ctx, sx, sy, tw, th)) {
      // Tope con textura
      if (!TILESHEET.drawWallTop(this.ctx, sx, sy, tw, th)) {
        this.drawIsoDiamond(sx, sy - wallH, tw, th, CONFIG.TILE_COLORS.WALL.top, '#445566');
      }
      return;
    }

    // Fallback colores sólidos
    this.ctx.fillStyle = CONFIG.TILE_COLORS.WALL.fill;
    this.ctx.beginPath();
    this.ctx.moveTo(sx - tw / 2, sy);
    this.ctx.lineTo(sx,          sy + th / 2);
    this.ctx.lineTo(sx,          sy + th / 2 - wallH);
    this.ctx.lineTo(sx - tw / 2, sy - wallH);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#1e2d3a';
    this.ctx.beginPath();
    this.ctx.moveTo(sx,          sy + th / 2);
    this.ctx.lineTo(sx + tw / 2, sy);
    this.ctx.lineTo(sx + tw / 2, sy - wallH);
    this.ctx.lineTo(sx,          sy + th / 2 - wallH);
    this.ctx.closePath();
    this.ctx.fill();
    this.drawIsoDiamond(sx, sy - wallH, tw, th, CONFIG.TILE_COLORS.WALL.top, '#445566');
  }

  getTileColor(type) {
    switch (type) {
      case TileType.FLOOR:    return CONFIG.TILE_COLORS.FLOOR.fill;
      case TileType.DARK:     return CONFIG.TILE_COLORS.DARK.fill;
      case TileType.INTERIOR: return CONFIG.TILE_COLORS.INTERIOR.fill;
      case TileType.STAIR:    return CONFIG.TILE_COLORS.STAIR.fill;
      case TileType.UPPER:    return CONFIG.TILE_COLORS.UPPER.fill;
      default: return CONFIG.TILE_COLORS.FLOOR.fill;
    }
  }

  getTileStroke(type) {
    switch (type) {
      case TileType.FLOOR:    return CONFIG.TILE_COLORS.FLOOR.stroke;
      case TileType.DARK:     return CONFIG.TILE_COLORS.DARK.stroke;
      case TileType.INTERIOR: return CONFIG.TILE_COLORS.INTERIOR.stroke;
      case TileType.STAIR:    return CONFIG.TILE_COLORS.STAIR.stroke;
      case TileType.UPPER:    return CONFIG.TILE_COLORS.UPPER.stroke;
      default: return CONFIG.TILE_COLORS.FLOOR.stroke;
    }
  }
}
