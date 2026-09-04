const DIFFICULTIES = {
  easy: { name: 'Easy', emptyCells: 36 },
  medium: { name: 'Medium', emptyCells: 46 },
  hard: { name: 'Hard', emptyCells: 54 }
};

const MAX_HINTS = 3;
const isEmbedded = new URLSearchParams(window.location.search).has('embedded');
if (isEmbedded) document.body.classList.add('embedded');

const elements = {
  board: document.querySelector('#board'), numberPad: document.querySelector('#number-pad'),
  difficulty: document.querySelector('#difficulty'), timer: document.querySelector('#timer'),
  hintCount: document.querySelector('#hint-count'), notes: document.querySelector('#notes-button'),
  mistakeCount: document.querySelector('#mistake-count'), sheet: document.querySelector('#difficulty-sheet'),
  toast: document.querySelector('#toast')
};

let state;
let timerId;

function newGame(level) {
  const puzzle = createPuzzle(level);
  state = {
    level, solution: puzzle.solution, values: [...puzzle.puzzle].map(value => value === '0' ? '' : value),
    givens: [...puzzle.puzzle].map(value => value !== '0'), selected: null, notes: {}, history: [],
    notesMode: false, hintsUsed: 0, hintedCells: new Set(), mistakes: 0, seconds: 0, isComplete: false
  };
  elements.difficulty.textContent = puzzle.name;
  elements.timer.textContent = '00:00';
  closeSheet();
  startTimer();
  render();
}

// Generate a complete, valid board, then remove a difficulty-specific number of cells.
// The board is randomized every time without relying on prewritten puzzle templates.
function createPuzzle(level) {
  const difficulty = DIFFICULTIES[level];
  const solution = generateSolution();
  const puzzle = [...solution];

  shuffle([...Array(81).keys()])
    .slice(0, difficulty.emptyCells)
    .forEach(index => { puzzle[index] = '0'; });

  return { name: difficulty.name, puzzle: puzzle.join(''), solution };
}

function generateSolution() {
  const canonicalBoard = Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const column = index % 9;
    return String((row * 3 + Math.floor(row / 3) + column) % 9 + 1);
  }).join('');

  return transformGrid(canonicalBoard);
}

// Shuffle digits, row bands, and column stacks. Each operation preserves the
// Sudoku rules, producing a different complete solution on every new game.
function transformGrid(grid) {
  const digitMap = shuffle([...'123456789']);
  const rows = groupedOrder();
  const columns = groupedOrder();

  const transform = grid => {
    const result = Array(81);
    rows.forEach((sourceRow, newRow) => {
      columns.forEach((sourceColumn, newColumn) => {
        const value = grid[sourceRow * 9 + sourceColumn];
        result[newRow * 9 + newColumn] = value === '0' ? '0' : digitMap[Number(value) - 1];
      });
    });
    return result.join('');
  };

  return transform(grid);
}

function groupedOrder() {
  return shuffle([0, 1, 2]).flatMap(group => shuffle([0, 1, 2]).map(offset => group * 3 + offset));
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    state.seconds += 1;
    const minutes = String(Math.floor(state.seconds / 60)).padStart(2, '0');
    const seconds = String(state.seconds % 60).padStart(2, '0');
    elements.timer.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function render() {
  renderBoard();
  renderNumberPad();
  elements.notes.classList.toggle('active', state.notesMode);
  elements.hintCount.textContent = `Hint ${MAX_HINTS - state.hintsUsed}/${MAX_HINTS}`;
  elements.mistakeCount.textContent = state.mistakes;
  document.querySelector('#hint-button').disabled = state.hintsUsed >= MAX_HINTS;
}

function renderBoard() {
  elements.board.replaceChildren();
  state.values.forEach((value, index) => {
    const cell = document.createElement('button');
    const incorrect = value && value !== state.solution[index];
    const correct = value && !state.givens[index] && value === state.solution[index];
    cell.className = `cell${state.givens[index] ? ' given' : ''}${index === state.selected ? ' selected' : ''}${isRelatedToSelection(index) ? ' related' : ''}${incorrect ? ' error' : ''}${correct ? ' correct' : ''}`;
    if (value) cell.textContent = value;
    else if (state.notes[index]?.length) cell.append(createNotes(state.notes[index]));
    cell.addEventListener('click', () => { state.selected = index; render(); });
    elements.board.append(cell);
  });
}

function createNotes(notes) {
  const noteGrid = document.createElement('div');
  noteGrid.className = 'notes-grid';
  for (let number = 1; number <= 9; number += 1) {
    const note = document.createElement('span');
    note.textContent = notes.includes(number) ? number : '';
    noteGrid.append(note);
  }
  return noteGrid;
}

function isRelatedToSelection(index) {
  if (state.selected === null || index === state.selected) return false;
  const selected = state.selected;
  return Math.floor(index / 9) === Math.floor(selected / 9) || index % 9 === selected % 9 ||
    (Math.floor(index / 27) === Math.floor(selected / 27) && Math.floor((index % 9) / 3) === Math.floor((selected % 9) / 3));
}

function renderNumberPad() {
  elements.numberPad.replaceChildren();
  for (let number = 1; number <= 9; number += 1) {
    const button = document.createElement('button');
    button.textContent = number;
    button.disabled = state.values.filter(value => value === String(number)).length === 9;
    button.addEventListener('click', () => enterNumber(number));
    elements.numberPad.append(button);
  }
}

function saveState() {
  state.history.push({ values: [...state.values], notes: JSON.stringify(state.notes) });
}

function enterNumber(number) {
  if (state.isComplete) return showToast('This puzzle is already complete');
  if (state.selected === null || state.givens[state.selected]) return showToast('Choose an empty square');
  if (state.notesMode) {
    if (state.values[state.selected]) return;
    const notes = state.notes[state.selected] ?? [];
    state.notes[state.selected] = notes.includes(number) ? notes.filter(item => item !== number) : [...notes, number];
  } else {
    saveState();
    const isNewMistake = state.values[state.selected] !== String(number) && String(number) !== state.solution[state.selected];
    state.values[state.selected] = String(number);
    delete state.notes[state.selected];
    if (isNewMistake) state.mistakes += 1;
    checkWin();
  }
  render();
}

function eraseCell() {
  if (state.isComplete) return;
  if (state.selected === null || state.givens[state.selected]) return;
  saveState();
  state.values[state.selected] = '';
  delete state.notes[state.selected];
  render();
}

function undo() {
  if (state.isComplete) return;
  const previous = state.history.pop();
  if (!previous) return showToast('Nothing to undo');
  state.values = previous.values;
  state.notes = JSON.parse(previous.notes);
  render();
}

function useHint() {
  if (state.isComplete) return;
  if (state.hintsUsed >= MAX_HINTS) return showToast('All 3 hints have been used');
  const availableCells = state.values
    .map((value, index) => ({ value, index }))
    .filter(({ value, index }) => !value && !state.givens[index] && !state.hintedCells.has(index));
  if (!availableCells.length) return showToast('No empty squares are available for a hint');

  const { index } = availableCells[Math.floor(Math.random() * availableCells.length)];
  saveState();
  state.values[index] = state.solution[index];
  delete state.notes[index];
  state.selected = index;
  state.hintsUsed += 1;
  state.hintedCells.add(index);
  render();
  showToast(`Hint ${state.hintsUsed} of ${MAX_HINTS} used`);
  checkWin();
}

function checkWin() {
  if (state.values.join('') !== state.solution) return;
  state.isComplete = true;
  clearInterval(timerId);
  setTimeout(() => showToast('Solved!'), 100);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.remove('show'), 1700);
}

function openSheet() {
  elements.sheet.classList.add('show');
  elements.sheet.setAttribute('aria-hidden', 'false');
}

function closeSheet() {
  elements.sheet.classList.remove('show');
  elements.sheet.setAttribute('aria-hidden', 'true');
}

document.querySelector('#menu-button').addEventListener('click', openSheet);
document.querySelector('#new-puzzle-button').addEventListener('click', openSheet);
document.querySelector('#erase-button').addEventListener('click', eraseCell);
document.querySelector('#undo-button').addEventListener('click', undo);
document.querySelector('#hint-button').addEventListener('click', useHint);
elements.notes.addEventListener('click', () => { state.notesMode = !state.notesMode; render(); });
elements.sheet.addEventListener('click', event => { if (event.target === elements.sheet) closeSheet(); });
document.querySelectorAll('.level').forEach(button => button.addEventListener('click', () => newGame(button.dataset.level)));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
newGame('easy');
