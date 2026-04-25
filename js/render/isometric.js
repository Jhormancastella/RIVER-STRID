const isoProjection = {
  zoom: 1,
  tileW: CONFIG.TILE.WIDTH,
  tileH: CONFIG.TILE.HEIGHT,
  setZoom(z) {
    this.zoom = z;
    this.tileW = CONFIG.TILE.WIDTH * z;
    this.tileH = CONFIG.TILE.HEIGHT * z;
  },
  // World → Screen  (fórmula dimetric 2:1 estándar)
  project(worldX, worldY, cameraX, cameraY, screenWidth, screenHeight) {
    const relX = worldX - cameraX;
    const relY = worldY - cameraY;
    const screenX = (relX - relY) * (this.tileW / 2) + screenWidth / 2;
    const screenY = (relX + relY) * (this.tileH / 2) + screenHeight / 2;
    return { x: screenX, y: screenY };
  },
  // Screen → World  (transformación inversa para picking de tiles con mouse/touch)
  unproject(screenX, screenY, cameraX, cameraY, screenWidth, screenHeight) {
    const dx = (screenX - screenWidth / 2) / (this.tileW / 2);
    const dy = (screenY - screenHeight / 2) / (this.tileH / 2);
    return {
      x: (dx + dy) / 2 + cameraX,
      y: (dy - dx) / 2 + cameraY
    };
  },
  getTileCenter(col, row) { return { x: col + 0.5, y: row + 0.5 }; },
  // Devuelve true si el tile (col, row) es visible en pantalla (frustum culling)
  isTileVisible(col, row, cameraX, cameraY, screenWidth, screenHeight) {
    const { x, y } = this.project(col + 0.5, row + 0.5, cameraX, cameraY, screenWidth, screenHeight);
    const hw = this.tileW / 2 + 4;
    const hh = this.tileH * 2 + 4; // +tileH extra para cubrir muros altos
    return x + hw > 0 && x - hw < screenWidth && y + hh > 0 && y - hh < screenHeight;
  }
};
