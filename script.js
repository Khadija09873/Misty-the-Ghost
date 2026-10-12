const KING = '♚';
const KNIGHT = '♘';

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

let board = Array(9).fill('');
let currentPlayer = KING;
let gameActive = true;
let computerThinking = false;
let computerTimeout = null;
let mode = 'computer';
let difficulty = 'medium';
let scores = loadScores();

const statusEI = document.getElementById('status');

function loadScores() {
    try {
        const saved = JSON.parse(localStorage.getItem('misty-ttt-scores'));
        if (saved) return saved;
    } catch (e) {}
    return { king: 0, knight: 0, draw:0 };
}

function saveScores() {
    try {
        localStorage.setItem('misty-ttt-scores', JSON.stringify(scores));
    } catch (e) {}
}

function updateScoreboard() {
    document.getElementById('score-king').textContent = scores.king;
    document.getElementById('score-knight').textContent = scores.knight;
    document.getElementById('score-draw').textContent = scores.draw;
}

function resetScores() {
    scores = { king: 0, knight:0, draw:0 };
    saveScores();
    updateScoreboard();
}

/* ---------- Game Flow ---------- */

function changeSettings() {
    mode = document.getElementById('mode').value;
    difficulty = document.getElementById('difficulty').value;
    document.getElementById('difficulty').disabled = (mode === 'two');
    resetGame();
}

function updateStatus() {
    if (mode === 'computer') {
        statusEI.textContent = currentPlayer === KING
            ? 'Your Turn ♚'
            : 'Computer ♘ is thinking...';    
    } else {
        statusEI.textContent = `Player ${currentPlayer}'s Turn`;
    }
    statusEI.className = currentPlayer === KING ? 'king-turn' : 'knight-turn';
}

function placePiece(index){
    board[index] = currentPlayer;
    const cell = document.getElementById(`cell-${index}`);
    cell.textContent = currentPlayer;
    cell.classList.add('pop');
}

function makeMove(index) {
    if (board[index] !== '' || !gameActive || computerThinking) {
        return;
    }


    placePiece(index);
    checkForWinner();

    if (gameActive && mode === 'computer' && currentPlayer === KNIGHT) {
        computerThinking = true;
        computerTimeout = setTimeout(computerMove, 500);
    }
}

function getWinnerLine(b) {
    for (const {a, c, d,} of winningConditions) {
        if (b[a] !== '' && b[c] && b[c] === b[d] ) {
            return [a, c, d];
        }
    }
    return null;
}

function checkForWinner() {
    const line = getWinningLine(board);

    if (line) {
        highlightWinningCells(...line);
        gameActive = false;
        statusEI.className = '';

        if (currentPlayer === KING) scores.king++;
        else score.knight++;

        if (mode === 'computer') {
            statusEI.textContent = currentPlayer === KING 
                'You Win! 🎉';
                'Computer Wins! 🤖';
        } else {
            statusEI.textContent = 'Player ${currentPlayer} Wins!! 🎉';
        }

        saveScores();
        updateScoreboard();
        launchMisty();
        return;
    }

    if (!board.includes('')) {
        statusEI.textContent = "It's a Draw! 🤝";
        statusEI.className= '';
        gameActive = false;
        scores.draw++;
        saveScores();
        updateScoreboard();
        return
    }

    currentPlayer = currentPlayer === KING ? KNIGHT : KING;
    updateStatus();
}

function highlightWinningCells(a, b, c) {
    document.getElementById( `cell-${a}` ).classList.add('winning');
    document.getElementById( `cell-${b}` ).classList.add('winning');
    document.getElementById( `cell-${c}` ).classList.add('winning');
}

function resetGame() {
     clearTimeout(computerTimeout);
    computerThinking = false;
    board = Array(9).fill('');
    currentPlayer = KING;
    gameActive = true;
    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('winning', 'pop');
    });
    updateStatus();
}

/* ---------- Computer player ---------- */

function emptyCells(b) {
    return b.map((v, i) => (v === '' ? i : null)).filter(i => i !== null);
}

// Returns a cell index that would win for player, or null
function findWinningMove(player) {
    for (const i of emptyCells(board)) {
        board[i] = player;
        const wins = getWinningLine(board) !== null;
        board[i] = '';
        if (wins) return i;
    }
    return null;
}

function randomMove() {
    const options = emptyCells(board);
    return options[Math.floor(Math.random() * options.length)];
}

function mediumMove() {
    const win = findWinningMove(KNIGHT);
    if (win !== null) return win;

    const block = findWinningMove(KING);
    if (block !== null) return block;

    if (board[4] === '') return 4;
    return randomMove();
}

function minimax(b, isComputerTurn, depth) {
    const line = getWinningLine(b);
    if (line) {
        return b[line[0]] === KNIGHT ? 10 - depth : depth - 10;
    }
    if (!b.includes('')) return 0;

    let best = isComputerTurn ? -Infinity : Infinity;
    for (const i of emptyCells(b)) {
        b[i] = isComputerTurn ? KNIGHT : KING;
        const score = minimax(b, !isComputerTurn, depth + 1);
        b[i] = '';
        best = isComputerTurn ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
}

function hardMove() {
    let bestScore = -Infinity;
    let bestIndex = null;
    for (const i of emptyCells(board)) {
        board[i] = KNIGHT;
        const score = minimax(board, false, 0);
        board[i] = '';
        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }
    return bestIndex;
}

function computerMove() {
    if (!gameActive) return;

    let index;
    if (difficulty === 'easy') index = randomMove();
    else if (difficulty === 'medium') index = mediumMove();
    else index = hardMove();

    placePiece(index);
    computerThinking = false;
    checkForWinner();
}

/* ---------- Win animation ---------- */

function launchGhosts() {
    const symbols = ['👻', '👻', '👻', '✨', '♚', '♘'];
    for (let i = 0; i < 25; i++) {
        const el = document.createElement('span');
        el.className = 'ghost-float';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.left = Math.random() * 95 + 'vw';
        el.style.animationDelay = Math.random() * 1 + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
    }
}

/* ---------- Start ---------- */

updateScoreboard();
updateStatus();