const screenSystem = {
  tutorial: null, endScreen: null, rotateHint: null, chapterScreen: null,
  init() {
    this.tutorial = document.getElementById('tutorial');
    this.endScreen = document.getElementById('end-screen');
    this.rotateHint = document.getElementById('rotate-hint');
    this.chapterScreen = document.getElementById('chapter-screen');
  },
  showTutorial() { if (this.tutorial) this.tutorial.style.display = 'flex'; },
  hideTutorial() { if (this.tutorial) this.tutorial.style.display = 'none'; },
  showEndScreen() { if (this.endScreen) this.endScreen.style.display = 'flex'; },
  showRotateHint(show) {
    if (this.rotateHint) {
      const isPortrait = window.innerHeight > window.innerWidth;
      this.rotateHint.style.display = show && isPortrait ? 'block' : 'none';
    }
  },
  showChapterTransition(nextChapter, onContinue) {
    if (!this.chapterScreen) return;
    const titles = { 2: 'Capítulo 2: El Campamento', 3: 'Capítulo 3: El Río' };
    const subtitles = {
      2: 'El rastro de Álex lleva al campamento...',
      3: 'River Strid nunca devuelve lo que se traga.'
    };
    document.getElementById('chapter-screen-title').textContent = titles[nextChapter] || '';
    document.getElementById('chapter-screen-sub').textContent = subtitles[nextChapter] || '';
    this.chapterScreen.style.display = 'flex';
    const btn = document.getElementById('chapter-screen-btn');
    btn.onclick = () => {
      this.chapterScreen.style.display = 'none';
      if (onContinue) onContinue();
    };
  }
};
