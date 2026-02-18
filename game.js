const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const messageEl = document.getElementById('message');
const speedMenuEl = document.getElementById('speedMenu');

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const SPEED_LEVELS = {
  1: 220,
  2: 170,
  3: 120,
  4: 90,
  5: 65,
};

let snake;
let direction;
let nextDirection;
let food;
let score;
let running;
let paused;
let gameOver;
let timer;
let speedLevel = 3;
let tickMs = SPEED_LEVELS[speedLevel];

const HIGH_SCORE_KEY = 'snake_high_score';
let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
highScoreEl.textContent = String(highScore);

function randomCell() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

function spawnFood() {
  let candidate = randomCell();
  while (snake.some((part) => part.x === candidate.x && part.y === candidate.y)) {
    candidate = randomCell();
  }
  food = candidate;
}

function restartTimer() {
  clearInterval(timer);
  timer = setInterval(move, tickMs);
}

function updateSpeedUI() {
  const buttons = speedMenuEl.querySelectorAll('.speed-option');
  buttons.forEach((button) => {
    const isActive = Number(button.dataset.speed) === speedLevel;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function setSpeed(level) {
  if (!SPEED_LEVELS[level]) return;
  speedLevel = level;
  tickMs = SPEED_LEVELS[level];
  updateSpeedUI();
  restartTimer();

  if (!gameOver && !paused) {
    messageEl.textContent = `Speed set to ${level}`;
  }
}

function reset() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  running = false;
  paused = false;
  gameOver = false;
  scoreEl.textContent = '0';
  messageEl.textContent = 'Press any arrow key to start';
  spawnFood();
  draw();
}

function drawGridBackground() {
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID_SIZE; i += 1) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawBlock(cell, color, radius = 4) {
  const x = cell.x * CELL_SIZE;
  const y = cell.y * CELL_SIZE;
  const pad = 1;
  const size = CELL_SIZE - pad * 2;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + pad, y + pad, size, size, radius);
  ctx.fill();
}

function draw() {
  drawGridBackground();

  drawBlock(food, '#f87171', 6);
  snake.forEach((part, index) => {
    drawBlock(part, index === 0 ? '#34d399' : '#22c55e');
  });

  if (paused && !gameOver) {
    drawOverlay('Paused (press Space to resume)');
  }

  if (gameOver) {
    drawOverlay('Game Over (press Enter to restart)');
  }
}

function drawOverlay(text) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function move() {
  if (!running || paused || gameOver) return;

  direction = nextDirection;
  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };

  if (
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y >= GRID_SIZE ||
    snake.some((part) => part.x === newHead.x && part.y === newHead.y)
  ) {
    gameOver = true;
    running = false;
    messageEl.textContent = 'You crashed! Press Enter to restart';
    draw();
    return;
  }

  snake.unshift(newHead);

  if (newHead.x === food.x && newHead.y === food.y) {
    score += 1;
    scoreEl.textContent = String(score);
    messageEl.textContent = 'Nice! Keep going';

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
      highScoreEl.textContent = String(highScore);
    }

    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function setDirection(x, y) {
  if (gameOver) return;

  if (direction.x === -x && direction.y === -y) {
    return;
  }

  nextDirection = { x, y };

  if (!running) {
    running = true;
    messageEl.textContent = 'Game in progress...';
  }
}

function togglePause() {
  if (gameOver || !running) return;
  paused = !paused;
  messageEl.textContent = paused ? 'Paused' : 'Game in progress...';
  draw();
}

speedMenuEl.addEventListener('click', (event) => {
  const target = event.target.closest('.speed-option');
  if (!target) return;
  setSpeed(Number(target.dataset.speed));
});

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      setDirection(0, -1);
      break;
    case 'ArrowDown':
      event.preventDefault();
      setDirection(0, 1);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      setDirection(-1, 0);
      break;
    case 'ArrowRight':
      event.preventDefault();
      setDirection(1, 0);
      break;
    case ' ':
      event.preventDefault();
      togglePause();
      break;
    case 'Enter':
      event.preventDefault();
      if (gameOver) {
        reset();
      }
      break;
    default:
      break;
  }
});

reset();
updateSpeedUI();
restartTimer();

window.addEventListener('beforeunload', () => {
  clearInterval(timer);
});
