const collisionSystem = {
  padding: 0.25, // Reducido de 0.35 para evitar que el jugador se atasque en pasillos de 1 tile

  // Verifica si una posición es válida — solo centro + 4 esquinas (suficiente para hitbox cuadrado)
  canMoveTo(x, y) {
    const p = this.padding;
    const points = [
      { cx: x,     cy: y     }, // centro
      { cx: x - p, cy: y - p }, // esquina TL
      { cx: x + p, cy: y - p }, // esquina TR
      { cx: x - p, cy: y + p }, // esquina BL
      { cx: x + p, cy: y + p }, // esquina BR
    ];
    for (const pt of points) {
      const gx = Math.floor(pt.cx);
      const gy = Math.floor(pt.cy);
      if (gx < 0 || gx >= CONFIG.MAP.COLS || gy < 0 || gy >= CONFIG.MAP.ROWS) return false;
      if (!isWalkable(gx, gy)) return false;
    }
    return true;
  },

  // Mueve al jugador con sliding suave contra muros
  move(px, py, dx, dy, speed) {
    // Limitar el step máximo a 0.2 tiles para evitar tunneling en frames lentos
    const maxStep = 0.2;
    const totalDist = Math.hypot(dx, dy) * speed;
    const steps = Math.ceil(totalDist / maxStep);
    const stepDx = (dx * speed) / steps;
    const stepDy = (dy * speed) / steps;

    let x = px, y = py;
    for (let i = 0; i < steps; i++) {
      const nx = x + stepDx;
      const ny = y + stepDy;

      const canX = this.canMoveTo(nx, y);
      const canY = this.canMoveTo(x, ny);
      const canXY = this.canMoveTo(nx, ny);

      if (canXY) {
        x = nx; y = ny;
      } else if (canX) {
        x = nx; // sliding horizontal
      } else if (canY) {
        y = ny; // sliding vertical
      } else {
        break; // bloqueado completamente
      }
    }
    return { x, y };
  },

  checkStairs(x, y, chapter, floor) {
    return getStairAt(Math.floor(x + 0.5), Math.floor(y + 0.5), chapter, floor);
  }
};
