import { SimonGame } from "./game-core.mjs";

const pad = document.querySelector(".pad");
const statusText = document.getElementById("status-text");
const scoreValue = document.getElementById("score-value");
const bestValue = document.getElementById("best-value");
const roundValue = document.getElementById("round-value");
const speedValue = document.getElementById("speed-value");
const pauseValue = document.getElementById("pause-value");
const muteValue = document.getElementById("mute-value");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const muteButton = document.getElementById("mute-button");
const restartButton = document.getElementById("restart-button");
const keyHint = document.getElementById("key-hint");

const panelByColor = {
  green: document.querySelector('[data-color="green"]'),
  yellow: document.querySelector('[data-color="yellow"]'),
  blue: document.querySelector('[data-color="blue"]'),
  orange: document.querySelector('[data-color="orange"]')
};

const audioContext = window.AudioContext ? new AudioContext() : null;

function playTone(freq, durationMs, type = "sine", gainValue = 0.035) {
  if (!audioContext) return;
  if (audioContext.state === "suspended") audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(gainValue, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000 + 0.02);
}

function playSound(name) {
  switch (name) {
    case "beep":
      playTone(740, 140, "square");
      break;
    case "ready":
      playTone(520, 150, "triangle");
      setTimeout(() => playTone(660, 160, "triangle"), 80);
      break;
    case "click":
      playTone(610, 90, "square", 0.025);
      break;
    case "lose":
      playTone(420, 150, "sawtooth");
      setTimeout(() => playTone(360, 180, "sawtooth"), 130);
      setTimeout(() => playTone(300, 230, "sawtooth"), 280);
      break;
    default:
      break;
  }
}

function flashColor(colorName, length = 260) {
  const panel = panelByColor[colorName];
  if (!panel) return;
  panel.classList.add("active");
  setTimeout(() => {
    panel.classList.remove("active");
  }, length);
}

const game = new SimonGame({
  onStateChange: render,
  onFlash: (colorName) => flashColor(colorName),
  onSound: playSound,
  onGameOver: () => {
    keyHint.textContent = "Game over! Press J or tap Restart.";
  }
});

function phaseLabel(state) {
  if (state.phase === "idle") return "Ready to start";
  if (state.phase === "waiting") return "Get ready...";
  if (state.phase === "showing") return "Watch the sequence";
  if (state.phase === "input") return "Your turn";
  if (state.phase === "feedback") return "Nice!";
  if (state.phase === "over") return "Game over";
  return state.phase;
}

function render(state) {
  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.highScore);
  roundValue.textContent = state.round > 0 ? String(state.round) : "-";
  speedValue.textContent = String(state.speedLevel);
  pauseValue.textContent = state.paused ? "Paused" : "Running";
  muteValue.textContent = state.muted ? "Muted" : "On";

  statusText.textContent = phaseLabel(state);
  statusText.dataset.state = state.phase;

  pad.classList.toggle("is-paused", state.paused);
  pad.classList.toggle("is-over", state.phase === "over");

  startButton.hidden = state.phase !== "idle";
  restartButton.hidden = state.phase !== "over";

  pauseButton.disabled = state.phase === "idle" || state.phase === "over";
  pauseButton.textContent = state.paused ? "Unpause (K)" : "Pause (K)";
  muteButton.textContent = state.muted ? "Unmute (L)" : "Mute (L)";

  if (state.phase === "idle") {
    keyHint.textContent = "Press Start to begin, then use W/A/S/D.";
  } else if (state.paused) {
    keyHint.textContent = "Paused. Press K or tap Unpause to continue.";
  } else if (state.phase === "showing") {
    keyHint.textContent = "Memorize the flashes.";
  } else if (state.phase === "input") {
    keyHint.textContent = "Repeat the sequence with W/A/S/D or tap panels.";
  }
}

startButton.addEventListener("click", () => game.startGame());
pauseButton.addEventListener("click", () => game.togglePause());
muteButton.addEventListener("click", () => game.toggleMute());
restartButton.addEventListener("click", () => game.restartAfterGameOver());

Object.entries(panelByColor).forEach(([colorName, element]) => {
  const trigger = () => {
    const accepted = game.inputColor(colorName);
    if (accepted) flashColor(colorName, 180);
  };

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    trigger();
  });

  element.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      trigger();
    }
  });
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "j", "k", "l"].includes(key)) {
    event.preventDefault();
    game.handleKey(key);
  }
});

render(game.snapshot());
