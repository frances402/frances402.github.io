# Calm Sudoku

A mobile-first Sudoku web app. Open `index.html` locally to play, or host the folder over HTTPS to install it to an iPhone home screen.

## Files

- `index.html` — semantic app structure
- `styles.css` — responsive visual design
- `app.js` — puzzle state and interactions
- `manifest.webmanifest` and `sw.js` — install/offline support

Each puzzle is generated in the browser from a newly randomized valid Sudoku board whenever it starts—there are no built-in Easy, Medium, or Hard board templates. Difficulty controls how many cells are left empty. Each puzzle provides at most three hints; a hint selects a different originally empty square and never overwrites a clue or a player-entered number. Starting a new puzzle resets the hint allowance.

Player-entered correct values display in green. Incorrect values display in red and increment the mistake counter. When all values are correct, the timer stops and the app confirms the completion time.
