const CharacterType = { LUCAS: 'Lucas', SOFIA: 'Sofía' };

const player = {
  x: 4, y: 6,
  floor: 0,
  char: CharacterType.LUCAS,
  inventory: [],
  sensitivity: 0,
  flashlight: true,
  facing: { x: 0, y: 1 },
  walkFrame: 0,
  isMoving: false,
  speed: CONFIG.PLAYER.MOVE_SPEED,
  switchCharacter() {
    this.char = this.char === CharacterType.LUCAS ? CharacterType.SOFIA : CharacterType.LUCAS;
    return this.char;
  },
  updateSensitivity(nearWhisper, dt) {
    if (this.char === CharacterType.SOFIA) {
      if (nearWhisper) {
        const dist = Math.hypot(this.x - nearWhisper.x, this.y - nearWhisper.y);
        const intensity = 1 - (dist / 2.5);
        this.sensitivity = clamp(this.sensitivity + intensity * dt * 30, 0, 100);
      } else {
        this.sensitivity = clamp(this.sensitivity - dt * 10, 0, 100);
      }
    } else {
      this.sensitivity = clamp(this.sensitivity - dt * 25, 0, 100);
    }
  },
  addToInventory(itemName) {
    if (this.inventory.length < CONFIG.PLAYER.INVENTORY_SIZE && !this.inventory.includes(itemName)) {
      this.inventory.push(itemName);
      return true;
    }
    return false;
  },
  hasItem(itemName) { return this.inventory.includes(itemName); }
};
