// 테트리스 게임

const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('tetrisStartBtn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

let grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
let score = 0;
let lines = 0;
let level = 1;
let gameRunning = false;
let gamePaused = false;

// 테트리스 블록 정의
const pieces = [
    { shape: [[1, 1, 1, 1]], color: '#00FFFF' }, // I
    { shape: [[1, 1], [1, 1]], color: '#FFFF00' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#9933FF' }, // T
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' }, // L
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#00FF00' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#FF0000' } // Z
];

let currentPiece = null;
let currentPos = { x: 0, y: 0 };

function getRandomPiece() {
    return JSON.parse(JSON.stringify(pieces[Math.floor(Math.random() * pieces.length)]));
}

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
}

function drawGrid() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 격자선
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
}

function drawBoard() {
    drawGrid();

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) {
                drawBlock(col, row, grid[row][col]);
            }
        }
    }
}

function drawCurrentPiece() {
    if (!currentPiece) return;

    currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                drawBlock(currentPos.x + x, currentPos.y + y, currentPiece.color);
            }
        });
    });
}

function canPlace(piece, pos) {
    return piece.shape.every((row, y) => {
        return row.every((cell, x) => {
            if (!cell) return true;

            const newY = pos.y + y;
            const newX = pos.x + x;

            if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
            if (newY < 0) return true;

            return grid[newY][newX] === 0;
        });
    });
}

function placePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                const newY = currentPos.y + y;
                const newX = currentPos.x + x;
                if (newY >= 0) {
                    grid[newY][newX] = currentPiece.color;
                }
            }
        });
    });

    clearLines();
    spawnPiece();
}

function clearLines() {
    let clearedLines = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (grid[row].every(cell => cell !== 0)) {
            grid.splice(row, 1);
            grid.unshift(Array.from({ length: COLS }, () => 0));
            clearedLines++;
            row++;
        }
    }

    if (clearedLines > 0) {
        lines += clearedLines;
        score += clearedLines * 100 * level;
        level = Math.floor(lines / 10) + 1;
        updateUI();
    }
}

function spawnPiece() {
    currentPiece = getRandomPiece();
    currentPos = { x: Math.floor(COLS / 2) - 1, y: 0 };

    if (!canPlace(currentPiece, currentPos)) {
        gameRunning = false;
        startBtn.textContent = '🎮 게임 오버! 다시 시작';
        alert(`게임 오버!\n점수: ${score}\n라인: ${lines}`);
    }
}

function rotatePiece() {
    const rotated = {
        ...currentPiece,
        shape: currentPiece.shape[0].map((_, i) =>
            currentPiece.shape.map(row => row[i]).reverse()
        )
    };

    if (canPlace(rotated, currentPos)) {
        currentPiece = rotated;
    }
}

function moveDown() {
    if (canPlace(currentPiece, { x: currentPos.x, y: currentPos.y + 1 })) {
        currentPos.y++;
    } else {
        placePiece();
    }
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// 렌더링은 매 프레임, 낙하는 시간 기반으로 분리 (입력 즉각 반응)
let dropCounter = 0;
let lastTime = 0;

function render() {
    drawBoard();
    drawCurrentPiece();
}

function update(time = 0) {
    if (!gameRunning) return;
    if (!lastTime) lastTime = time;

    if (gamePaused) {
        lastTime = time;
        requestAnimationFrame(update);
        return;
    }

    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;

    const dropInterval = Math.max(80, 500 - (level - 1) * 50);
    if (dropCounter >= dropInterval) {
        moveDown();
        dropCounter = 0;
    }

    render();
    requestAnimationFrame(update);
}

function startGame() {
    grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
    score = 0;
    lines = 0;
    level = 1;
    gameRunning = true;
    gamePaused = false;
    dropCounter = 0;
    lastTime = 0;
    updateUI();
    spawnPiece();
    startBtn.textContent = '⏸️ 일시정지';
    requestAnimationFrame(update);
}

function togglePause() {
    if (!gameRunning) {
        startGame();
    } else {
        gamePaused = !gamePaused;
        startBtn.textContent = gamePaused ? '▶️ 계속' : '⏸️ 일시정지';
    }
}

// 이벤트 리스너
startBtn.addEventListener('click', togglePause);

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    const key = e.key.toLowerCase();
    let handled = false;

    switch (key) {
        case 'arrowleft':
            if (canPlace(currentPiece, { x: currentPos.x - 1, y: currentPos.y })) {
                currentPos.x--;
            }
            handled = true;
            break;
        case 'arrowright':
            if (canPlace(currentPiece, { x: currentPos.x + 1, y: currentPos.y })) {
                currentPos.x++;
            }
            handled = true;
            break;
        case 'arrowup':
            rotatePiece();
            handled = true;
            break;
        case 'arrowdown':
            moveDown();
            dropCounter = 0;
            handled = true;
            break;
        case ' ':
            while (canPlace(currentPiece, { x: currentPos.x, y: currentPos.y + 1 })) {
                currentPos.y++;
            }
            placePiece();
            handled = true;
            break;
        case 'p':
            togglePause();
            handled = true;
            break;
    }

    if (handled) {
        e.preventDefault();
    }
});

// 모바일 터치 조작 (키보드와 동일 동작)
function actLeft() {
    if (!gameRunning || gamePaused) return;
    if (canPlace(currentPiece, { x: currentPos.x - 1, y: currentPos.y })) currentPos.x--;
}
function actRight() {
    if (!gameRunning || gamePaused) return;
    if (canPlace(currentPiece, { x: currentPos.x + 1, y: currentPos.y })) currentPos.x++;
}
function actRotate() {
    if (!gameRunning || gamePaused) return;
    rotatePiece();
}
function actDown() {
    if (!gameRunning || gamePaused) return;
    moveDown();
    dropCounter = 0;
}
function actHardDrop() {
    if (!gameRunning || gamePaused) return;
    while (canPlace(currentPiece, { x: currentPos.x, y: currentPos.y + 1 })) currentPos.y++;
    placePiece();
}

[
    ['btnLeft', actLeft],
    ['btnRight', actRight],
    ['btnRotate', actRotate],
    ['btnDown', actDown],
    ['btnDrop', actHardDrop]
].forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
});

// 초기 드로우
drawBoard();
