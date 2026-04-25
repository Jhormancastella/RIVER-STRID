const minimap = {
  canvas: null,
  ctx: null,
  init() {
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  },
  render() {
    const mmW = this.canvas.width, mmH = this.canvas.height;
    const tileSize = Math.min(mmW / CONFIG.MAP.COLS, mmH / CONFIG.MAP.ROWS);
    this.ctx.clearRect(0, 0, mmW, mmH);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, mmW, mmH);

    // Tiles
    for (let y = 0; y < CONFIG.MAP.ROWS; y++) {
      for (let x = 0; x < CONFIG.MAP.COLS; x++) {
        const v = MAP_DATA[y][x];
        if (v === TileType.WALL) {
          this.ctx.fillStyle = '#2c3e50';
        } else if (v === TileType.INTERIOR) {
          this.ctx.fillStyle = '#2a1a1a';
        } else if (v === TileType.DARK) {
          this.ctx.fillStyle = '#111118';
        } else if (v === TileType.STAIR) {
          this.ctx.fillStyle = '#5a3e2b';
        } else {
          this.ctx.fillStyle = '#1a1a24';
        }
        this.ctx.fillRect(x * tileSize, y * tileSize, tileSize - 0.5, tileSize - 0.5);
      }
    }

    // Interactables — centrados en su tile
    const interactables = interactableManager.getAllInteractables();
    interactables.forEach(obj => {
      if (obj.state === 'taken' && obj.type !== 'whisper' && obj.type !== 'door') return;
      if (obj.floor !== undefined && obj.floor !== player.floor) return;
      this.ctx.fillStyle = obj.type === 'whisper' ? '#9b59b6'
                         : obj.type === 'door'    ? '#2ecc71'
                         : obj.type === 'key'     ? '#f1c40f'
                         : '#e67e22';
      const ox = Math.floor(obj.x) * tileSize + tileSize * 0.25;
      const oy = Math.floor(obj.y) * tileSize + tileSize * 0.25;
      const os = tileSize * 0.5;
      this.ctx.fillRect(ox, oy, os, os);
    });

    // Jugador — posición continua mapeada al grid
    this.ctx.fillStyle = player.char === 'Lucas' ? CONFIG.COLORS.LUCAS : CONFIG.COLORS.SOFIA;
    const px = player.x * tileSize + tileSize * 0.5;
    const py = player.y * tileSize + tileSize * 0.5;
    this.ctx.beginPath();
    this.ctx.arc(px, py, Math.max(2, tileSize * 0.4), 0, Math.PI * 2);
    this.ctx.fill();
  },
  resize(size) {
    if (!this.canvas) return;
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
  }
};
