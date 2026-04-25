const GameState = {
  running: true,
  dialogueActive: false,
  dialogueQueue: [],
  dialogueIndex: 0,
  chapterEnded: false,
  nearInteractable: null,
  ambientTimer: 0,
  lastTime: 0,
  isMobile: false,
  isPaused: false,
  gameStarted: false,
  currentChapter: 1
};

const TypewriterState = { interval: null, done: true, fullText: '' };

function getState() { return GameState; }
function getTypewriter() { return TypewriterState; }
