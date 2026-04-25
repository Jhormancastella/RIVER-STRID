class Sprite {
  constructor(config) {
    this.img = new Image();
    this.ready = false;
    this.cols = config.COLS || config.cols;
    this.rows = config.ROWS || config.rows;
    this.frameW = 0;
    this.frameH = 0;
    this.scale = config.SCALE || config.scale || 1;
    this.anchorYFactor = config.ANCHOR_Y || config.anchorY || 0.5;
  }
  load(url) {
    return new Promise((resolve, reject) => {
      // Eliminamos crossOrigin para evitar bloqueos de Pinterest
      this.img.onload = () => {
        this.frameW = this.img.naturalWidth / this.cols;
        this.frameH = this.img.naturalHeight / this.rows;
        this.ready = true;
        resolve(this);
      };
      this.img.onerror = () => {
        console.warn('Failed to load sprite:', url);
        reject();
      };
      this.img.src = url;
    });
  }
}

const LUCAS_ANIMATIONS = {
  walkDown: [0, 1, 2, 3],   idleDown: 0,
  walkLeft: [4, 5, 6, 7],   idleLeft: 4,
  walkRight: [8, 9, 10, 11], idleRight: 8,
  walkUp: [12, 13, 14, 15], idleUp: 12
};

const SOFIA_ANIMATIONS = {
  walkDown: [0, 1, 2, 3],   idleDown: 0,
  walkLeft: [4, 5, 6, 7],   idleLeft: 4,
  walkRight: [8, 9, 10, 11], idleRight: 8,
  walkUp: [12, 13, 14, 15], idleUp: 12
};

const characterSprites = {
  sprites: {},
  currentFrame: 0,
  async loadAll() {
    const lucasConfig = CONFIG.SPRITES.LUCAS;
    const sofiaConfig = CONFIG.SPRITES.SOFIA;
    const lucasSprite = new Sprite(lucasConfig);
    const sofiaSprite = new Sprite(sofiaConfig);
    
    const loads = [
      lucasSprite.load(lucasConfig.URL).then(() => this.sprites.Lucas = lucasSprite).catch(e => console.warn('Lucas sprite fail')),
      sofiaSprite.load(sofiaConfig.URL).then(() => this.sprites.Sofía = sofiaSprite).catch(e => console.warn('Sofia sprite fail'))
    ];
    
    await Promise.all(loads);
  },
  getSprite(character) { return this.sprites[character]; },
  updateViewScale(zoom) {
    if (this.sprites.Lucas) this.sprites.Lucas.scale = 1.0 * zoom;
    if (this.sprites.Sofía) this.sprites.Sofía.scale = 1.0 * zoom;
  }
};

function drawSpriteFrame(ctx, asset, frameIndex, x, y, flipX = false) {
  if (!asset || !asset.ready) return;
  const sx = (frameIndex % asset.cols) * asset.frameW;
  const sy = Math.floor(frameIndex / asset.cols) * asset.frameH;
  const dw = asset.frameW * asset.scale;
  const anchorY = asset.frameH * asset.anchorYFactor;
  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(asset.img, sx, sy, asset.frameW, asset.frameH, -dw / 2, -anchorY * asset.scale, dw, asset.frameH * asset.scale);
  ctx.restore();
}

function getDirectionFromFacing(fx, fy) {
  if (Math.abs(fx) > Math.abs(fy)) return fx >= 0 ? 'right' : 'left';
  return fy >= 0 ? 'down' : 'up';
}
