export const COLORS = ["green", "yellow", "blue", "orange"];

export const KEY_TO_COLOR = {
  w: "green",
  a: "yellow",
  s: "blue",
  d: "orange"
};

const DEFAULT_SPEED = 650;
const MIN_SPEED = 250;

export class SimonGame {
  constructor({
    random = Math.random,
    now = () => Date.now(),
    setTimeoutFn = setTimeout,
    onStateChange = () => {},
    onFlash = () => {},
    onSound = () => {},
    onGameOver = () => {}
  } = {}) {
    this.random = random;
    this.now = now;
    this.setTimeoutFn = setTimeoutFn;
    this.onStateChange = onStateChange;
    this.onFlash = onFlash;
    this.onSound = onSound;
    this.onGameOver = onGameOver;

    this.highScore = 0;
    this.muted = false;
    this.resetToIdle();
  }

  resetToIdle() {
    this.gameID = 0;
    this.phase = "idle";
    this.sequence = [];
    this.position = 0;
    this.score = 0;
    this.paused = false;
    this.flashSpeed = DEFAULT_SPEED;
    this.emitState();
  }

  snapshot() {
    return {
      phase: this.phase,
      score: this.score,
      highScore: this.highScore,
      round: this.sequence.length,
      speedLevel: Math.floor(this.score / 3) + 1,
      paused: this.paused,
      muted: this.muted,
      sequenceLength: this.sequence.length,
      position: this.position,
      gameOver: this.phase === "over"
    };
  }

  emitState() {
    this.onStateChange(this.snapshot());
  }

  playSound(name) {
    if (!this.muted) this.onSound(name);
  }

  startGame() {
    this.gameID += 1;
    this.sequence = [];
    this.position = 0;
    this.score = 0;
    this.paused = false;
    this.flashSpeed = DEFAULT_SPEED;
    this.phase = "waiting";
    this.emitState();
    this.startRound();
  }

  restartAfterGameOver() {
    if (this.phase === "over") this.startGame();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.emitState();
  }

  togglePause() {
    if (this.phase === "over" || this.phase === "idle") return;
    this.paused = !this.paused;
    this.emitState();
  }

  randomColor() {
    return COLORS[Math.floor(this.random() * COLORS.length)];
  }

  gameTimeout(callback, delay) {
    const currentGame = this.gameID;
    let remaining = delay;
    let lastTime = this.now();

    const checkTimer = () => {
      if (currentGame !== this.gameID) return;
      const currentTime = this.now();
      if (!this.paused) remaining -= currentTime - lastTime;
      lastTime = currentTime;

      if (remaining <= 0) callback();
      else this.setTimeoutFn(checkTimer, Math.min(remaining, 50));
    };

    this.setTimeoutFn(checkTimer, Math.min(delay, 50));
  }

  startRound() {
    this.phase = "showing";
    this.position = 0;
    this.flashSpeed = Math.max(MIN_SPEED, DEFAULT_SPEED - Math.floor(this.score / 2) * 40);
    this.sequence.push(this.randomColor());
    this.playSound("click");
    this.emitState();
    this.gameTimeout(() => this.showSequence(0), 600);
  }

  showSequence(index) {
    if (index >= this.sequence.length) {
      this.phase = "input";
      this.playSound("ready");
      this.emitState();
      return;
    }

    const colorName = this.sequence[index];
    this.onFlash(colorName);
    this.playSound("beep");
    this.gameTimeout(() => this.showSequence(index + 1), this.flashSpeed);
  }

  inputColor(colorName) {
    if (this.phase !== "input" || this.paused) return false;

    const expectedColor = this.sequence[this.position];
    if (colorName !== expectedColor) {
      this.phase = "over";
      this.paused = false;
      this.gameID += 1;
      this.emitState();
      this.playSound("lose");
      this.onGameOver(this.snapshot());
      return false;
    }

    this.phase = "feedback";
    this.onFlash(colorName);
    this.position += 1;
    this.emitState();

    if (this.position === this.sequence.length) {
      this.score += 1;
      if (this.score > this.highScore) this.highScore = this.score;
      this.emitState();
      this.gameTimeout(() => this.startRound(), 800);
    } else {
      this.gameTimeout(() => {
        this.phase = "input";
        this.emitState();
      }, 350);
    }

    return true;
  }

  handleKey(key) {
    const lowerKey = key.toLowerCase();

    if (KEY_TO_COLOR[lowerKey]) {
      this.inputColor(KEY_TO_COLOR[lowerKey]);
      return;
    }

    if (lowerKey === "k") {
      this.togglePause();
      return;
    }

    if (lowerKey === "l") {
      this.toggleMute();
      return;
    }

    if (lowerKey === "j") {
      this.restartAfterGameOver();
    }
  }
}
