var KING = '♚';
var KNIGHT = '♘';

var winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

var board = ['', '', '', '', '', '', '', '', ''];
var currentPlayer = KING;
var gameActive = true;
var computerThinking = false;
var computerTimeout = null;
var mode = 'computer';
var difficulty = 'medium';
var scores = loadScores();

var statusEl = document.getElementById('status');

/* ---------- Scores ---------- */

function loadScores() {
    try {
        var saved = JSON.parse(localStorage.getItem('misty-ttt-scores'));
        if (saved) return saved;
    } catch (e) {}
    return { king: 0, knight: 0, draw: 0 };
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
    scores = { king: 0, knight: 0, draw: 0 };
    saveScores();
    updateScoreboard();
}

/* ---------- Pop-up ---------- */

function showModal(title, text) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

/* ---------- Game flow ---------- */

function changeSettings() {
    mode = document.getElementById('mode').value;
    difficulty = document.getElementById('difficulty').value;
    document.getElementById('difficulty').disabled = (mode === 'two');
    resetGame();
}

function updateStatus() {
    if (mode === 'computer') {
        if (currentPlayer === KING) {
            statusEl.textContent = 'Your turn ' + KING;
        } else {
            statusEl.textContent = 'Computer ' + KNIGHT + ' is thinking...';
        }
    } else {
        statusEl.textContent = 'Player ' + currentPlayer + "'s Turn";
    }
    statusEl.className = (currentPlayer === KING) ? 'king-turn' : 'knight-turn';
}

function placePiece(index) {
    board[index] = currentPlayer;
    var cell = document.getElementById('cell-' + index);
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

function getWinningLine(b) {
    for (var i = 0; i < winningConditions.length; i++) {
        var a = winningConditions[i][0];
        var c = winningConditions[i][1];
        var d = winningConditions[i][2];
        if (b[a] !== '' && b[a] === b[c] && b[c] === b[d]) {
            return [a, c, d];
        }
    }
    return null;
}

function checkForWinner() {
    var line = getWinningLine(board);

    if (line) {
        highlightWinningCells(line[0], line[1], line[2]);
        gameActive = false;
        statusEl.className = '';

        var title;
        var text;

        if (currentPlayer === KING) {
            scores.king++;
        } else {
            scores.knight++;
        }

        if (mode === 'computer') {
            if (currentPlayer === KING) {
                title = 'You win! 🎉';
                text = 'The King takes the crown.';
            } else {
                title = 'Computer wins! 🤖';
                text = 'The Knight got you this time.';
            }
        } else {
            title = 'Player ' + currentPlayer + ' wins! 🎉';
            text = 'Nice game!';
        }

        statusEl.textContent = title;
        saveScores();
        updateScoreboard();
        launchGhosts();
        setTimeout(function () {
            showModal(title, text);
        }, 900);
        return;
    }

    if (board.indexOf('') === -1) {
        statusEl.textContent = "It's a Draw! 🤝";
        statusEl.className = '';
        gameActive = false;
        scores.draw++;
        saveScores();
        updateScoreboard();
        setTimeout(function () {
            showModal("It's a draw! 🤝", 'Nobody wins this round.');
        }, 500);
        return;
    }

    currentPlayer = (currentPlayer === KING) ? KNIGHT : KING;
    updateStatus();
}

function highlightWinningCells(a, b, c) {
    document.getElementById('cell-' + a).classList.add('winning');
    document.getElementById('cell-' + b).classList.add('winning');
    document.getElementById('cell-' + c).classList.add('winning');
}

function resetGame() {
    clearTimeout(computerTimeout);
    computerThinking = false;
    closeModal();
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = KING;
    gameActive = true;
    var cells = document.querySelectorAll('.cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].textContent = '';
        cells[i].classList.remove('winning');
        cells[i].classList.remove('pop');
    }
    updateStatus();
}

/* ---------- Computer player ---------- */

function emptyCells(b) {
    var result = [];
    for (var i = 0; i < b.length; i++) {
        if (b[i] === '') result.push(i);
    }
    return result;
}

function findWinningMove(player) {
    var options = emptyCells(board);
    for (var i = 0; i < options.length; i++) {
        var idx = options[i];
        board[idx] = player;
        var wins = getWinningLine(board) !== null;
        board[idx] = '';
        if (wins) return idx;
    }
    return null;
}

function randomMove() {
    var options = emptyCells(board);
    return options[Math.floor(Math.random() * options.length)];
}

function mediumMove() {
    var win = findWinningMove(KNIGHT);
    if (win !== null) return win;

    var block = findWinningMove(KING);
    if (block !== null) return block;

    if (board[4] === '') return 4;
    return randomMove();
}

function minimax(b, isComputerTurn, depth) {
    var line = getWinningLine(b);
    if (line) {
        return (b[line[0]] === KNIGHT) ? 10 - depth : depth - 10;
    }
    if (b.indexOf('') === -1) return 0;

    var best = isComputerTurn ? -Infinity : Infinity;
    var options = emptyCells(b);
    for (var i = 0; i < options.length; i++) {
        var idx = options[i];
        b[idx] = isComputerTurn ? KNIGHT : KING;
        var score = minimax(b, !isComputerTurn, depth + 1);
        b[idx] = '';
        best = isComputerTurn ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
}

function hardMove() {
    var bestScore = -Infinity;
    var bestIndex = null;
    var options = emptyCells(board);
    for (var i = 0; i < options.length; i++) {
        var idx = options[i];
        board[idx] = KNIGHT;
        var score = minimax(board, false, 0);
        board[idx] = '';
        if (score > bestScore) {
            bestScore = score;
            bestIndex = idx;
        }
    }
    return bestIndex;
}

function computerMove() {
    if (!gameActive) return;

    var index;
    if (difficulty === 'easy') index = randomMove();
    else if (difficulty === 'medium') index = mediumMove();
    else index = hardMove();

    placePiece(index);
    computerThinking = false;
    checkForWinner();
}

/* ---------- Win animation ---------- */

function launchGhosts() {
    var symbols = ['👻', '👻', '👻', '✨', KING, KNIGHT];
    for (var i = 0; i < 25; i++) {
        (function () {
            var el = document.createElement('span');
            el.className = 'ghost-float';
            el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            el.style.left = (Math.random() * 95) + 'vw';
            el.style.animationDelay = (Math.random() * 1) + 's';
            document.body.appendChild(el);
            setTimeout(function () { el.remove(); }, 4500);
        })();
    }
}

/* ---------- Start ---------- */

updateScoreboard();
updateStatus();