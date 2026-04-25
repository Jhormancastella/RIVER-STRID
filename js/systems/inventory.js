const inventorySystem = {
  slots: [],
  init() {
    for (let i = 0; i < CONFIG.PLAYER.INVENTORY_SIZE; i++) {
      this.slots.push(document.getElementById(`slot${i}`));
    }
  },
  update() {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) continue;
      const itemName = player.inventory[i];
      if (itemName) {
        const item = interactableManager.getAllInteractables().find(x => x.name === itemName);
        slot.innerHTML = item ? item.icon : '📦';
        slot.className = 'inv-slot filled';
        slot.title = itemName;
      } else {
        slot.innerHTML = '';
        slot.className = 'inv-slot';
        slot.title = '';
      }
    }
  },
  addItem(itemName) {
    if (player.addToInventory(itemName)) { this.update(); return true; }
    return false;
  },
  hasItem(itemName) { return player.hasItem(itemName); }
};
