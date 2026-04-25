const collisionSystem = {
  padding: 0.35, // Aumentado para evitar que el sprite se superponga visualmente a la base de los muros

  // Verifica si una posición (centro del jugador) es válida
  canMoveTo(x, y) {
    // Verificamos el centro + las 4 esquinas del hitbox
    const points = [
      { cx: x,                  cy: y                  }, // centro
      { cx: x - this.padding,   cy: y - this.padding   }, // esquina TL
      { cx: x + this.padding,   cy: y - this.padding   }, // esquina TR
      { cx: x - this.padding,   cy: y + this.padding   }, // esquina BL
      { cx: x + this.padding,   cy: y + this.padding   }, // esquina BR
      { cx: x - this.padding,   cy: y                  }, // lado izq
      { cx: x + this.padding,   cy: y                  }, // lado der
      { cx: x,                  cy: y - this.padding   }, // lado top
      { cx: x,                  cy: y + this.padding   }, // lado bot
    ];
    for (const p of points) {
      const gx = Math.floor(p.cx);
      const gy = Math.floor(p.cy);
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
