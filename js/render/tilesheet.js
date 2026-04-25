// ── Tilesheet manager ────────────────────────────────────────────────────────
const TILESHEET = {
  sheets: {},
  ready: false,

  TILES: {
    // hoja de terreno.png
    floor_stone:      { sheet: 'main',     x: 1109, y: 85,  w: 119, h: 69  },
    floor_block:      { sheet: 'main',     x: 951,  y: 85,  w: 118, h: 69  },
    floor_wood_mid:   { sheet: 'main',     x: 494,  y: 201, w: 118, h: 70  },
    floor_wood_dark:  { sheet: 'main',     x: 646,  y: 201, w: 119, h: 70  },
    floor_dirt:       { sheet: 'main',     x: 798,  y: 202, w: 118, h: 69  },
    floor_dirt_dark:  { sheet: 'main',     x: 798,  y: 85,  w: 118, h: 69  },
    wall_brick_nw:    { sheet: 'main',     x: 739,  y: 377, w: 108, h: 132 },
    wall_brick_ne:    { sheet: 'main',     x: 914,  y: 377, w: 109, h: 132 },
    wall_stone:       { sheet: 'main',     x: 1091, y: 377, w: 108, h: 132 },
    door_left:        { sheet: 'main',     x: 554,  y: 584, w: 64,  h: 153 },
    door_right:       { sheet: 'main',     x: 622,  y: 606, w: 62,  h: 142 },
    // hoja de terreno-pasto.png
    floor_grass_mid:  { sheet: 'pasto',    x: 649,  y: 74,  w: 120, h: 78  },
    floor_grass_low:  { sheet: 'pasto',    x: 1118, y: 77,  w: 121, h: 75  },
    floor_grass_high: { sheet: 'pasto',    x: 183,  y: 62,  w: 122, h: 90  },
    wall_grass:       { sheet: 'pasto',    x: 23,   y: 373, w: 144, h: 127 },
    // hoja de terreno-scalones.png
    stair_brick:      { sheet: 'scalones', x: 186,  y: 38,  w: 121, h: 118 },
    stair_wood:       { sheet: 'scalones', x: 496,  y: 38,  w: 121, h: 118 },
    door_stair:       { sheet: 'scalones', x: 746,  y: 578, w: 122, h: 170 },
    // hoja de terreno-agua.png
    water_rock1:      { sheet: 'agua', x: 320,  y: 194, w: 128, h: 142 },
    water_rock2:      { sheet: 'agua', x: 456,  y: 190, w: 117, h: 142 },
    water_rock_small: { sheet: 'agua', x: 1098, y: 260, w: 132, h: 94  },
    water_cave:       { sheet: 'agua', x: 198,  y: 322, w: 162, h: 127 },
    water_log:        { sheet: 'agua', x: 352,  y: 338, w: 173, h: 124 },
    water_tile1:      { sheet: 'agua', x: 1104, y: 360, w: 96,  h: 93  },
    water_tile2:      { sheet: 'agua', x: 1201, y: 358, w: 91,  h: 95  },
    water_tile3:      { sheet: 'agua', x: 1302, y: 368, w: 76,  h: 77  },
    water_plants:     { sheet: 'agua', x: 956,  y: 0,   w: 69,  h: 82  },
    water_lake:       { sheet: 'agua', x: 186,  y: 194, w: 128, h: 130 },
    water_rocks:      { sheet: 'agua', x: 328,  y: 125, w: 113, h: 73  },
    boats:            { sheet: 'agua', x: 246,  y: 568, w: 159, h: 177 },
    rope:             { sheet: 'agua', x: 717,  y: 685, w: 71,  h: 45  },
    // hoja de terreno-arboles.png
    tree_small:       { sheet: 'arboles',  x: 704,  y: 86,  w: 70,  h: 102 },
    tree_pine:        { sheet: 'arboles',  x: 844,  y: 58,  w: 72,  h: 135 },
    tree_dry:         { sheet: 'arboles',  x: 1098, y: 257, w: 124, h: 177 },
    tree_big:         { sheet: 'arboles',  x: 637,  y: 265, w: 164, h: 167 },
    tree_pine_tall:   { sheet: 'arboles',  x: 562,  y: 438, w: 91,  h: 299 },
    tree_double_pine: { sheet: 'arboles',  x: 188,  y: 261, w: 153, h: 179 },
    tree_cluster:     { sheet: 'arboles',  x: 810,  y: 440, w: 140, h: 141 },
    cave_entrance:    { sheet: 'arboles',  x: 665,  y: 572, w: 143, h: 166 },
    log_cut:          { sheet: 'arboles',  x: 941,  y: 616, w: 136, h: 126 },
    flower_pink:      { sheet: 'arboles',  x: 58,   y: 68,  w: 64,  h: 60  },
    flower_red:       { sheet: 'arboles',  x: 126,  y: 65,  w: 63,  h: 63  },
  },

  load() {
    const sources = {
      main:     'img/hoja de terreno.png',
      pasto:    'img/hoja de terreno-pasto.png',
      scalones: 'img/hoja de terreno-scalones.png',
      arboles:  'img/hoja de terreno-arboles.png',
      agua:     'img/hoja de terreno-agua.png',
    };
    const promises = Object.entries(sources).map(([key, src]) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload  = () => { this.sheets[key] = { img, ready: true }; resolve(); };
        img.onerror = () => { console.warn(`[Tilesheet] No cargó: ${src}`); this.sheets[key] = { img: null, ready: false }; resolve(); };
        img.src = src;
      })
    );
    return Promise.all(promises).then(() => { this.ready = true; });
  },

  _img(sheetKey) {
    const s = this.sheets[sheetKey];
    return (s && s.ready) ? s.img : null;
  },

  _drawClipped(ctx, tile, sx, sy, tileW, tileH, alpha = 1) {
    const img = this._img(tile.sheet);
    if (!img) return false;
    const scale = Math.max(tileW / tile.w, tileH / tile.h);
    const dw = tile.w * scale;
    const dh = tile.h * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath();
    ctx.moveTo(sx,             sy - tileH / 2);
    ctx.lineTo(sx + tileW / 2, sy);
    ctx.lineTo(sx,             sy + tileH / 2);
    ctx.lineTo(sx - tileW / 2, sy);
    ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, tile.x, tile.y, tile.w, tile.h, sx - dw / 2, sy - dh / 2, dw, dh);
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  },

  _drawClippedPoly(ctx, points, tile, cx, cy, dw, dh, alpha = 1) {
    const img = this._img(tile.sheet);
    if (!img) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, tile.x, tile.y, tile.w, tile.h, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.globalAlpha = 1;
    ctx.restore();
    return true;
  },

  // Suelos por TileType: 0=FLOOR, 2=DARK, 3=INTERIOR, 4=STAIR, 5=UPPER, 6=BRIDGE
  drawForType(ctx, type, sx, sy, tileW, tileH, chapter = 1) {
    if (!this.ready) return false;
    // Cap 3: DARK = agua del río, BRIDGE = puente de madera
    if (chapter === 3 && type === 2) {
      return this._drawClipped(ctx, this.TILES.water_tile1, sx, sy, tileW, tileH);
    }
    if (chapter === 3 && type === 6) {
      return this._drawClipped(ctx, this.TILES.floor_wood_dark, sx, sy, tileW, tileH);
    }
    switch (type) {
      case 0: return this._drawClipped(ctx, this.TILES.floor_grass_mid,  sx, sy, tileW, tileH);
      case 2: return this._drawClipped(ctx, this.TILES.floor_dirt_dark,  sx, sy, tileW, tileH);
      case 3: return this._drawClipped(ctx, this.TILES.floor_stone,      sx, sy, tileW, tileH);
      case 4: return this._drawClipped(ctx, this.TILES.floor_block,      sx, sy, tileW, tileH);
      case 5: return this._drawClipped(ctx, this.TILES.floor_grass_low,  sx, sy, tileW, tileH);
      case 6: return this._drawClipped(ctx, this.TILES.floor_wood_dark,  sx, sy, tileW, tileH); // puente
      default: return false;
    }
  },

  // Hash determinista para variar tiles de agua por posición
  getWaterDecoForPos(col, row) {
    const decos = ['water_tile1', 'water_tile2', 'water_tile3', 'water_tile1', 'water_tile2'];
    return decos[(col * 3 + row * 7) % decos.length];
  },

  // Decoración de agua sobre tile WALL en cap 3 (rocas, troncos, cueva)
  getWaterObstacleForPos(col, row) {
    const obs = ['water_rock1', 'water_rock2', 'water_rock_small', 'water_log', 'water_lake', 'water_rocks'];
    return obs[(col * 11 + row * 5) % obs.length];
  },

  // Muros: cara NW + cara NE
  drawWall(ctx, sx, sy, tileW, tileH) {
    if (!this.ready) return false;
    const wallH = tileH * 2;
    const nw = this.TILES.wall_brick_nw;
    const ne = this.TILES.wall_brick_ne;
    const scaleNW = Math.max((tileW / 2) / nw.w, wallH / nw.h) * 1.2;
    const scaleNE = Math.max((tileW / 2) / ne.w, wallH / ne.h) * 1.2;
    this._drawClippedPoly(ctx, [
      { x: sx - tileW / 2, y: sy },
      { x: sx,             y: sy + tileH / 2 },
      { x: sx,             y: sy + tileH / 2 - wallH },
      { x: sx - tileW / 2, y: sy - wallH }
    ], nw, sx - tileW / 4, sy - wallH / 2, nw.w * scaleNW, nw.h * scaleNW, 0.85);
    this._drawClippedPoly(ctx, [
      { x: sx,             y: sy + tileH / 2 },
      { x: sx + tileW / 2, y: sy },
      { x: sx + tileW / 2, y: sy - wallH },
      { x: sx,             y: sy + tileH / 2 - wallH }
    ], ne, sx + tileW / 4, sy - wallH / 2, ne.w * scaleNE, ne.h * scaleNE, 1);
    return true;
  },

  // Tope del muro
  drawWallTop(ctx, sx, sy, tileW, tileH) {
    return this._drawClipped(ctx, this.TILES.floor_stone, sx, sy - tileH * 2, tileW, tileH);
  },

  // Escalera
  drawStair(ctx, sx, sy, tileW, tileH) {
    const tile = this.TILES.stair_brick;
    const img = this._img(tile.sheet);
    if (!img) return false;
    const scale = tileW / tile.w;
    const dw = tile.w * scale;
    const dh = tile.h * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, tile.x, tile.y, tile.w, tile.h, sx - dw / 2, sy - dh + tileH / 2, dw, dh);
    ctx.restore();
    return true;
  },

  // Árbol sobre tile WALL (cap 2)
  drawTree(ctx, tileKey, sx, sy, tileW, tileH) {
    const tile = this.TILES[tileKey];
    const img = this._img(tile ? tile.sheet : null);
    if (!img || !tile) return false;
    const scale = tileW / tile.w * 1.1;
    const dw = tile.w * scale;
    const dh = tile.h * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, tile.x, tile.y, tile.w, tile.h, sx - dw / 2, sy - dh + tileH * 0.6, dw, dh);
    ctx.restore();
    return true;
  },

  // Hash determinista para variar árboles por posición
  getTreeForPos(col, row) {
    const trees = ['tree_big', 'tree_pine', 'tree_double_pine', 'tree_small', 'tree_cluster', 'tree_pine_tall', 'tree_dry'];
    return trees[(col * 7 + row * 13) % trees.length];
  }
};
