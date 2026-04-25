const CONFIG = {
  TILE: { WIDTH: 64, HEIGHT: 32 },
  MAP: { COLS: 20, ROWS: 20 },
  PLAYER: { MOVE_SPEED: 0.06, INVENTORY_SIZE: 4, INTERACTION_DISTANCE: 1.2 },
  CAMERA: { LERP_FACTOR: 0.001, MIN_ZOOM: 0.5, MAX_ZOOM: 1.2, BASE_DIVISOR: 480 },
  SPRITES: {
    LUCAS: { 
      URL: 'img/lucas.png', 
      COLS: 4, ROWS: 4, SCALE: 1.0, ANCHOR_Y: 0.88 
    },
    SOFIA: { 
      URL: 'img/sofia.png', 
      COLS: 4, ROWS: 4, SCALE: 1.0, ANCHOR_Y: 0.88 
    }
  },
  JOYSTICK: { DEADZONE: 0.15, RADIUS_FACTOR: 0.55 },
  ANIMATION: { WALK_FRAME_SPEED: 10, TYPEWRITER_SPEED: 18, BOB_SPEED: 3 },
  COLORS: { BG: '#0a0a0f', ACCENT: '#8a0000', TEXT: '#e0e0e0', MUTED: '#777', LUCAS: '#4a90e2', SOFIA: '#9b59b6' },
  TILE_COLORS: {
    FLOOR:    { fill: '#1a1a24', stroke: '#252530' },
    DARK:     { fill: '#151520', stroke: '#1e1e2a' },
    INTERIOR: { fill: '#2a1a1a', stroke: '#3a2525' },
    WALL:     { fill: '#2c3e50', top: '#34495e' },
    STAIR:    { fill: '#3d2b1f', stroke: '#5a3e2b' },
    UPPER:    { fill: '#1f1f2e', stroke: '#2a2a3e' }
  },
  INTERACTABLE_COLORS: { photo: '#e67e22', diary: '#3498db', whisper: '#9b59b6', door: '#2ecc71', key: '#f1c40f' }
};
