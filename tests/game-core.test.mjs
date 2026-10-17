import test from "node:test";
import assert from "node:assert/strict";
import { SimonGame } from "../game-core.mjs";

class FakeClock {
  constructor() {
    this.current = 0;
    this.id = 1;
    this.tasks = [];
  }

  now = () => this.current;

  setTimeoutFn = (callback, delay) => {
    const id = this.id++;
    this.tasks.push({ id, at: this.current + delay, callback });
    return id;
  };

  advance(ms) {
    const target = this.current + ms;

    while (true) {
      let nextTask = null;
      for (const task of this.tasks) {
        if (task.at <= target && (!nextTask || task.at < nextTask.at)) {
          nextTask = task;
        }
      }

      if (!nextTask) break;
      this.tasks = this.tasks.filter((task) => task.id !== nextTask.id);
      this.current = nextTask.at;
      nextTask.callback();
    }

    this.current = target;
  }
}

function createGame(randomValue = 0) {
  const clock = new FakeClock();
  const game = new SimonGame({
    random: () => randomValue,
    now: clock.now,
    setTimeoutFn: clock.setTimeoutFn
  });

  return { game, clock };
}

test("sequence grows each round and score increases on full correct input", () => {
  const { game, clock } = createGame(0);

  game.startGame();
  clock.advance(2000);
  assert.equal(game.phase, "input");
  assert.equal(game.sequence.length, 1);

  game.inputColor("green");
  assert.equal(game.score, 1);

  clock.advance(4000);
  assert.equal(game.sequence.length, 2);
  assert.equal(game.phase, "input");
});

test("wrong input ends game", () => {
  const { game, clock } = createGame(0);

  game.startGame();
  clock.advance(2000);
  assert.equal(game.phase, "input");

  game.inputColor("blue");
  assert.equal(game.phase, "over");
  assert.equal(game.gameID > 1, true);
});

test("pause freezes round timers until unpaused", () => {
  const { game, clock } = createGame(0);

  game.startGame();
  game.togglePause();
  clock.advance(5000);
  assert.equal(game.phase, "showing");

  game.togglePause();
  clock.advance(2500);
  assert.equal(game.phase, "input");
});

test("high score is preserved after restart", () => {
  const { game, clock } = createGame(0);

  game.startGame();
  clock.advance(2000);
  game.inputColor("green");
  clock.advance(4000);
  assert.equal(game.phase, "input");
  game.inputColor("blue");

  assert.equal(game.phase, "over");
  assert.equal(game.highScore, 1);

  game.restartAfterGameOver();
  clock.advance(2000);
  assert.equal(game.phase, "input");
  assert.equal(game.score, 0);
  assert.equal(game.sequence.length, 1);
  assert.equal(game.highScore, 1);
});

test("input is ignored while paused", () => {
  const { game, clock } = createGame(0);

  game.startGame();
  clock.advance(2000);
  assert.equal(game.phase, "input");

  game.togglePause();
  const accepted = game.inputColor("green");
  assert.equal(accepted, false);
  assert.equal(game.position, 0);
});
