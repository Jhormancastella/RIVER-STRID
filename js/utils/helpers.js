function setVhVar() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
}

function detectMobile() {
  return ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900);
}

function getVisualViewportSize() {
  return {
    width: window.visualViewport ? window.visualViewport.width : window.innerWidth,
    height: window.visualViewport ? window.visualViewport.height : window.innerHeight
  };
}

function getDevicePixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2);
}
