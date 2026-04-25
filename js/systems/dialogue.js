const dialogueSystem = {
  dialogueBox: null, dialogueText: null, advanceHint: null,
  init() {
    this.dialogueBox = document.getElementById('dialogue-box');
    this.dialogueText = document.getElementById('dialogue-text');
    this.advanceHint = document.getElementById('dialogue-advance-hint');
  },
  show(texts) {
    GameState.dialogueActive = true;
    GameState.dialogueQueue = texts;
    GameState.dialogueIndex = 0;
    if (this.dialogueBox) this.dialogueBox.style.display = 'block';
    this.updateText();
  },
  hide() {
    GameState.dialogueActive = false;
    GameState.dialogueQueue = [];
    GameState.dialogueIndex = 0;
    if (this.dialogueBox) this.dialogueBox.style.display = 'none';
    if (TypewriterState.interval) { clearInterval(TypewriterState.interval); TypewriterState.interval = null; }
  },
  advance() {
    if (this.completeCurrentIfTyping()) return;
    GameState.dialogueIndex++;
    if (GameState.dialogueIndex >= GameState.dialogueQueue.length) {
      this.hide();
      return true;
    } else { this.updateText(); }
    return false;
  },
  completeCurrentIfTyping() {
    if (TypewriterState.interval && !TypewriterState.done) {
      clearInterval(TypewriterState.interval);
      TypewriterState.interval = null;
      TypewriterState.done = true;
      if (this.dialogueText) this.dialogueText.textContent = TypewriterState.fullText;
      return true;
    }
    return false;
  },
  updateText() {
    const text = GameState.dialogueQueue[GameState.dialogueIndex];
    if (!this.dialogueText) return;
    if (TypewriterState.interval) clearInterval(TypewriterState.interval);
    this.dialogueText.textContent = '';
    TypewriterState.done = false;
    TypewriterState.fullText = text;
    let i = 0;
    TypewriterState.interval = setInterval(() => {
      if (i < text.length) this.dialogueText.textContent += text[i++];
      else { clearInterval(TypewriterState.interval); TypewriterState.interval = null; TypewriterState.done = true; }
    }, 18);
  },
  isActive() { return GameState.dialogueActive; },
  setMobileHints(isMobile) { if (this.advanceHint) this.advanceHint.textContent = isMobile ? 'TAP ▶' : 'E ▶'; }
};
