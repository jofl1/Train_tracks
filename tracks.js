'use strict';

// Track piece definitions with their connection points
const TrackPiece = {
    EMPTY: { id: 'empty', connections: [0, 0, 0, 0], symbol: ' ' },
    VERTICAL: { id: 'vertical', connections: [1, 0, 1, 0], symbol: '│' },
    HORIZONTAL: { id: 'horizontal', connections: [0, 1, 0, 1], symbol: '─' },
    CORNER_NE: { id: 'corner_ne', connections: [1, 1, 0, 0], symbol: '└' },
    CORNER_NW: { id: 'corner_nw', connections: [1, 0, 0, 1], symbol: '┘' },
    CORNER_SW: { id: 'corner_sw', connections: [0, 0, 1, 1], symbol: '┐' },
    CORNER_SE: { id: 'corner_se', connections: [0, 1, 1, 0], symbol: '┌' }
};

// Track cycle order for right-click cycling
const TRACK_CYCLE = [
    TrackPiece.EMPTY,
    TrackPiece.VERTICAL,
    TrackPiece.HORIZONTAL,
    TrackPiece.CORNER_NE,
    TrackPiece.CORNER_SE,
    TrackPiece.CORNER_SW,
    TrackPiece.CORNER_NW
];

// Direction helpers
const Direction = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3,
    opposite: (dir) => (dir + 2) % 4,
    delta: (dir) => [[-1, 0], [0, 1], [1, 0], [0, -1]][dir]
};

// Represents a single cell in the puzzle grid
class Cell {
    constructor(row, col, index) {
        this.row = row;
        this.col = col;
        this.index = index;
        this.piece = TrackPiece.EMPTY;
        this.isFixed = false;
        this.isStation = false;
        this._element = null;
    }

    get element() {
        if (!this._element) {
            this._element = this._createElement();
        }
        return this._element;
    }

    _createElement() {
        const el = document.createElement('div');
        el.className = 'cell';
        el.id = `cell_${this.index}`;
        el.dataset.row = this.row;
        el.dataset.col = this.col;
        return el;
    }

    setPiece(piece) {
        if (this.isFixed || this.isStation) return false;
        this.piece = piece;
        this.render();
        return true;
    }

    rotate() {
        if (this.isFixed || this.isStation || this.piece === TrackPiece.EMPTY) return false;
        
        // For straight pieces, toggle between vertical and horizontal
        if (this.piece === TrackPiece.VERTICAL) {
            this.piece = TrackPiece.HORIZONTAL;
        } else if (this.piece === TrackPiece.HORIZONTAL) {
            this.piece = TrackPiece.VERTICAL;
        } else {
            // Rotate corners
            const corners = [TrackPiece.CORNER_NE, TrackPiece.CORNER_SE, TrackPiece.CORNER_SW, TrackPiece.CORNER_NW];
            const currentIndex = corners.indexOf(this.piece);
            if (currentIndex !== -1) {
                this.piece = corners[(currentIndex + 1) % 4];
            }
        }
        
        this.render();
        return true;
    }

    cyclePiece() {
        if (this.isFixed || this.isStation) return false;
        
        const currentIndex = TRACK_CYCLE.indexOf(this.piece);
        this.piece = TRACK_CYCLE[(currentIndex + 1) % TRACK_CYCLE.length];
        this.render();
        return true;
    }

    clear() {
        if (this.isFixed || this.isStation) return false;
        this.piece = TrackPiece.EMPTY;
        this.render();
        return true;
    }

    getConnections() {
        if (this.isStation) return [1, 1, 1, 1];
        return [...this.piece.connections];
    }

    hasConnection(direction) {
        return this.getConnections()[direction] === 1;
    }

    render() {
        const el = this.element;
        el.className = 'cell';
        
        if (this.isStation) {
            el.classList.add('station');
            el.textContent = 'S';
            el.style.backgroundImage = '';
        } else if (this.piece !== TrackPiece.EMPTY) {
            el.textContent = '';
            // Map new names to old image names
            const imageMap = {
                'vertical': 'straight',
                'horizontal': 'horiz',
                'corner_ne': 'trc',
                'corner_nw': 'tlc',
                'corner_sw': 'blc',
                'corner_se': 'brc'
            };
            const imageName = imageMap[this.piece.id] || this.piece.id;
            el.style.backgroundImage = `url('track_images/tracks_${imageName}.jpg')`;
        } else {
            el.textContent = '';
            el.style.backgroundImage = '';
        }
        
        if (this.isFixed && !this.isStation) {
            el.classList.add('fixed');
        }
    }

    // For console debugging
    toString() {
        if (this.isStation) return 'S';
        return this.piece.symbol;
    }
}

// Manages the puzzle grid
class Grid {
    constructor(size = 8) {
        this.size = size;
        this.cells = [];
        this._initializeCells();
        this._rowConstraints = new Array(size).fill(3);
        this._colConstraints = new Array(size).fill(3);
    }

    _initializeCells() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const index = row * this.size + col;
                this.cells.push(new Cell(row, col, index));
            }
        }
    }

    getCell(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return null;
        return this.cells[row * this.size + col];
    }

    getCellByIndex(index) {
        return this.cells[index] || null;
    }

    getNeighbor(cell, direction) {
        const [dr, dc] = Direction.delta(direction);
        return this.getCell(cell.row + dr, cell.col + dc);
    }

    forEachCell(callback) {
        this.cells.forEach(callback);
    }

    getStations() {
        return this.cells.filter(cell => cell.isStation);
    }

    // Count tracks per row/column
    getConstraintCounts() {
        const rowCounts = new Array(this.size).fill(0);
        const colCounts = new Array(this.size).fill(0);
        
        this.forEachCell(cell => {
            if (cell.piece !== TrackPiece.EMPTY && !cell.isStation) {
                rowCounts[cell.row]++;
                colCounts[cell.col]++;
            }
        });
        
        return {
            rows: rowCounts.map((count, i) => this._rowConstraints[i] - count),
            cols: colCounts.map((count, i) => this._colConstraints[i] - count)
        };
    }

    canPlaceTrack(cell) {
        if (cell.isFixed || cell.isStation) return true;
        if (cell.piece !== TrackPiece.EMPTY) return true;
        
        const counts = this.getConstraintCounts();
        return counts.rows[cell.row] > 0 && counts.cols[cell.col] > 0;
    }

    // Check if all tracks form a single connected path
    isConnected() {
        const stations = this.getStations();
        if (stations.length < 2) return false;
        
        const visited = new Set();
        const queue = [stations[0]];
        visited.add(stations[0].index);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            for (let dir = 0; dir < 4; dir++) {
                if (!current.hasConnection(dir)) continue;
                
                const neighbor = this.getNeighbor(current, dir);
                if (!neighbor || visited.has(neighbor.index)) continue;
                
                const oppositeDir = Direction.opposite(dir);
                if (neighbor.hasConnection(oppositeDir)) {
                    visited.add(neighbor.index);
                    queue.push(neighbor);
                }
            }
        }
        
        return stations.every(station => visited.has(station.index));
    }

    // Get connection status for each cell
    getConnectionStatus() {
        const status = new Map();
        const isComplete = this.isConnected();
        
        this.forEachCell(cell => {
            if (cell.piece === TrackPiece.EMPTY && !cell.isStation) {
                status.set(cell.index, 'empty');
                return;
            }
            
            let connectedCount = 0;
            let hasInvalidConnection = false;
            
            for (let dir = 0; dir < 4; dir++) {
                if (!cell.hasConnection(dir)) continue;
                
                const neighbor = this.getNeighbor(cell, dir);
                if (!neighbor) {
                    hasInvalidConnection = true;
                } else if (neighbor.hasConnection(Direction.opposite(dir))) {
                    connectedCount++;
                } else if (!neighbor.isStation) {
                    hasInvalidConnection = true;
                }
            }
            
            if (isComplete) {
                status.set(cell.index, 'complete');
            } else if (hasInvalidConnection || (connectedCount === 0 && !cell.isStation)) {
                status.set(cell.index, 'disconnected');
            } else {
                status.set(cell.index, 'connected');
            }
        });
        
        return status;
    }

    // Console display
    toString() {
        let result = '  ';
        for (let col = 0; col < this.size; col++) {
            result += ` ${col}`;
        }
        result += '\n';
        
        for (let row = 0; row < this.size; row++) {
            result += `${row} `;
            for (let col = 0; col < this.size; col++) {
                const cell = this.getCell(row, col);
                result += ` ${cell.toString()}`;
            }
            result += '\n';
        }
        
        return result;
    }
}

// UI manager for the grid display
class GridUI {
    constructor(grid) {
        this.grid = grid;
        this.gridElement = document.getElementById('grid');
        this.wrapperElement = this.gridElement.parentElement;
        this._initializeDisplay();
    }

    _initializeDisplay() {
        // Add cells to grid
        this.grid.forEachCell(cell => {
            this.gridElement.appendChild(cell.element);
        });
        
        // Create constraint counters
        this._createConstraintCounters();
    }

    _createConstraintCounters() {
        for (let i = 0; i < this.grid.size; i++) {
            // Row counter
            const rowCounter = document.createElement('div');
            rowCounter.className = 'row-count';
            rowCounter.id = `row-count-${i}`;
            rowCounter.style.top = `${i * 12.5 + 6.25}%`;
            this.wrapperElement.appendChild(rowCounter);
            
            // Column counter
            const colCounter = document.createElement('div');
            colCounter.className = 'col-count';
            colCounter.id = `col-count-${i}`;
            colCounter.style.left = `${i * 12.5 + 6.25}%`;
            this.wrapperElement.appendChild(colCounter);
        }
    }

    updateConstraints() {
        const counts = this.grid.getConstraintCounts();
        const isComplete = this.grid.isConnected() && 
                          counts.rows.every(c => c === 0) && 
                          counts.cols.every(c => c === 0);
        
        // Update row counters
        counts.rows.forEach((count, i) => {
            const el = document.getElementById(`row-count-${i}`);
            el.textContent = Math.max(0, count);
            el.className = 'row-count';
            if (isComplete && count === 0) {
                el.classList.add('complete');
            } else if (count === 0) {
                el.classList.add('zero');
            }
        });
        
        // Update column counters
        counts.cols.forEach((count, i) => {
            const el = document.getElementById(`col-count-${i}`);
            el.textContent = Math.max(0, count);
            el.className = 'col-count';
            if (isComplete && count === 0) {
                el.classList.add('complete');
            } else if (count === 0) {
                el.classList.add('zero');
            }
        });
    }

    updateConnections() {
        const status = this.grid.getConnectionStatus();
        
        this.grid.forEachCell(cell => {
            const el = cell.element;
            el.classList.remove('connected', 'disconnected', 'complete');
            
            const cellStatus = status.get(cell.index);
            if (cellStatus && cellStatus !== 'empty') {
                el.classList.add(cellStatus);
            }
        });
    }

    highlightCell(cell) {
        this.grid.forEachCell(c => {
            c.element.classList.remove('selected');
        });
        
        if (cell && !cell.isFixed && !cell.isStation) {
            cell.element.classList.add('selected');
        }
    }

    render() {
        this.grid.forEachCell(cell => cell.render());
        this.updateConstraints();
        this.updateConnections();
    }
}

// Puzzle configurations for different difficulties
const PUZZLES = {
    easy: [
        {
            stations: [{ row: 0, col: 3 }, { row: 7, col: 4 }],
            fixed: [
                { row: 1, col: 3, piece: 'corner_nw' },
                { row: 3, col: 4, piece: 'vertical' },
                { row: 4, col: 3, piece: 'horizontal' },
                { row: 6, col: 4, piece: 'corner_se' }
            ]
        },
        {
            stations: [{ row: 1, col: 1 }, { row: 6, col: 6 }],
            fixed: [
                { row: 2, col: 1, piece: 'vertical' },
                { row: 3, col: 3, piece: 'corner_se' },
                { row: 5, col: 5, piece: 'corner_nw' }
            ]
        }
    ],
    medium: [
        {
            stations: [{ row: 0, col: 2 }, { row: 7, col: 5 }],
            fixed: [
                { row: 1, col: 2, piece: 'corner_nw' },
                { row: 4, col: 4, piece: 'horizontal' },
                { row: 6, col: 5, piece: 'vertical' }
            ]
        }
    ],
    hard: [
        {
            stations: [{ row: 2, col: 0 }, { row: 5, col: 7 }],
            fixed: [
                { row: 3, col: 2, piece: 'corner_se' },
                { row: 4, col: 5, piece: 'corner_nw' }
            ]
        }
    ]
};

// Main game controller
class TracksGame {
    constructor() {
        this.grid = new Grid(8);
        this.ui = new GridUI(this.grid);
        this.moveCount = 0;
        this.selectedCell = null;
        this.isComplete = false;
        this.startTime = Date.now();
        this.hintsUsed = 0;
        this.difficulty = 'easy';
        this.puzzleIndex = 0;
        this.timerInterval = null;
        
        this._setupPuzzle();
        this._setupEventListeners();
        this._startTimer();
        this.ui.render();
        
        // Expose API to window for console access
        window.game = this;
    }

    _setupPuzzle() {
        const puzzles = PUZZLES[this.difficulty];
        const puzzle = puzzles[this.puzzleIndex % puzzles.length];
        
        // Place stations
        puzzle.stations.forEach(pos => {
            const cell = this.grid.getCell(pos.row, pos.col);
            cell.isStation = true;
        });
        
        // Place fixed tracks
        puzzle.fixed.forEach(({ row, col, piece }) => {
            const cell = this.grid.getCell(row, col);
            const trackPiece = Object.values(TrackPiece).find(p => p.id === piece);
            cell.piece = trackPiece;
            cell.isFixed = true;
        });
    }

    _setupEventListeners() {
        // Cell interactions
        this.grid.forEachCell(cell => {
            cell.element.addEventListener('click', (e) => {
                if (e.shiftKey || e.button === 2) {
                    this._handleRightClick(cell);
                } else {
                    this._handleLeftClick(cell);
                }
            });
            
            cell.element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._handleRightClick(cell);
            });
            
            cell.element.addEventListener('mouseenter', () => {
                if (!cell.isFixed && !cell.isStation) {
                    this.selectedCell = cell;
                    this.ui.highlightCell(cell);
                }
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this._handleKeyboard(e));
        
        // Reset button
        document.getElementById('reset-button').addEventListener('click', () => this.reset());
        
        // Difficulty buttons (will add to HTML)
        this._setupDifficultyControls();
    }

    _handleLeftClick(cell) {
        if (cell.isFixed || cell.isStation) return;
        
        let changed = false;
        if (cell.piece === TrackPiece.EMPTY) {
            if (this.grid.canPlaceTrack(cell)) {
                changed = cell.setPiece(TrackPiece.VERTICAL);
            }
        } else {
            changed = cell.rotate();
        }
        
        if (changed) {
            this.moveCount++;
            this._updateGame();
        }
    }

    _handleRightClick(cell) {
        if (cell.isFixed || cell.isStation) return;
        
        const wasEmpty = cell.piece === TrackPiece.EMPTY;
        const changed = cell.cyclePiece();
        
        if (changed && wasEmpty && cell.piece !== TrackPiece.EMPTY && !this.grid.canPlaceTrack(cell)) {
            cell.clear();
            return;
        }
        
        if (changed) {
            this.moveCount++;
            this._updateGame();
        }
    }

    _handleKeyboard(e) {
        if (!this.selectedCell || this.selectedCell.isFixed || this.selectedCell.isStation) return;
        
        let changed = false;
        
        switch(e.key.toLowerCase()) {
            case 'r':
                if (this.selectedCell.piece !== TrackPiece.EMPTY) {
                    changed = this.selectedCell.rotate();
                }
                break;
                
            case ' ':
                e.preventDefault();
                const wasEmpty = this.selectedCell.piece === TrackPiece.EMPTY;
                changed = this.selectedCell.cyclePiece();
                
                if (changed && wasEmpty && this.selectedCell.piece !== TrackPiece.EMPTY && 
                    !this.grid.canPlaceTrack(this.selectedCell)) {
                    this.selectedCell.clear();
                    changed = false;
                }
                break;
                
            case 'delete':
            case 'backspace':
                changed = this.selectedCell.clear();
                break;
        }
        
        if (changed) {
            this.moveCount++;
            this._updateGame();
        }
    }

    _updateGame() {
        this.ui.render();
        document.getElementById('move-counter').textContent = `Moves: ${this.moveCount}`;
        this._checkWin();
    }
    
    _startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timerEl = document.getElementById('timer-display');
            if (timerEl) {
                timerEl.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    _setupDifficultyControls() {
        // Will be called after HTML is updated
    }

    _checkWin() {
        const counts = this.grid.getConstraintCounts();
        const constraintsMet = counts.rows.every(c => c === 0) && counts.cols.every(c => c === 0);
        const isConnected = this.grid.isConnected();
        
        if (constraintsMet && isConnected && !this.isComplete) {
            this.isComplete = true;
            const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
            
            this._stopTimer();
            
            setTimeout(() => {
                const message = document.createElement('div');
                message.className = 'completion-message';
                message.innerHTML = `
                    <h2>Puzzle Solved!</h2>
                    <p>Difficulty: ${this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1)}</p>
                    <p>Completed in ${this.moveCount} moves</p>
                    <p>Time: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}</p>
                    <p>Hints used: ${this.hintsUsed}</p>
                    <button class="next-puzzle-btn" onclick="game.nextPuzzle()">Next Puzzle</button>
                `;
                document.body.appendChild(message);
                
                setTimeout(() => message.classList.add('show'), 100);
            }, 500);
        }
    }

    reset() {
        const message = document.querySelector('.completion-message');
        if (message) message.remove();
        
        this.grid.forEachCell(cell => {
            if (!cell.isFixed && !cell.isStation) {
                cell.clear();
            }
        });
        
        this.moveCount = 0;
        this.selectedCell = null;
        this.isComplete = false;
        this.hintsUsed = 0;
        this.startTime = Date.now();
        this._startTimer();
        this._updateGame();
    }
    
    changeDifficulty(difficulty) {
        if (PUZZLES[difficulty]) {
            this.difficulty = difficulty;
            this.puzzleIndex = 0;
            this.newPuzzle();
        }
    }
    
    nextPuzzle() {
        this.puzzleIndex++;
        this.newPuzzle();
    }
    
    newPuzzle() {
        // Remove old completion message
        const message = document.querySelector('.completion-message');
        if (message) message.remove();
        
        // Clear the grid element
        const gridEl = document.getElementById('grid');
        gridEl.innerHTML = '';
        
        // Remove old counters
        const oldCounters = document.querySelectorAll('.row-count, .col-count');
        oldCounters.forEach(el => el.remove());
        
        // Create new grid
        this.grid = new Grid(8);
        this.ui = new GridUI(this.grid);
        
        // Reset game state
        this.moveCount = 0;
        this.selectedCell = null;
        this.isComplete = false;
        this.hintsUsed = 0;
        this.startTime = Date.now();
        
        // Setup new puzzle
        this._setupPuzzle();
        this._setupEventListeners();
        this._startTimer();
        this.ui.render();
        
        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === this.difficulty);
        });
    }
    
    getHint() {
        if (this.isComplete) return;
        
        // Find a valid move
        const emptyCells = [];
        this.grid.forEachCell(cell => {
            if (!cell.isFixed && !cell.isStation && cell.piece === TrackPiece.EMPTY) {
                emptyCells.push(cell);
            }
        });
        
        if (emptyCells.length > 0) {
            // Highlight a random empty cell that can accept a track
            const validCells = emptyCells.filter(cell => this.grid.canPlaceTrack(cell));
            if (validCells.length > 0) {
                const hintCell = validCells[Math.floor(Math.random() * validCells.length)];
                hintCell.element.classList.add('hint');
                setTimeout(() => {
                    hintCell.element.classList.remove('hint');
                }, 2000);
                
                this.hintsUsed++;
                console.log(`Hint: Try placing a track at row ${hintCell.row}, column ${hintCell.col}`);
            }
        } else {
            // Find incorrectly placed tracks
            const status = this.grid.getConnectionStatus();
            let hintGiven = false;
            
            this.grid.forEachCell(cell => {
                if (!hintGiven && !cell.isFixed && !cell.isStation && 
                    status.get(cell.index) === 'disconnected') {
                    cell.element.classList.add('hint-error');
                    setTimeout(() => {
                        cell.element.classList.remove('hint-error');
                    }, 2000);
                    
                    this.hintsUsed++;
                    console.log(`Hint: The track at row ${cell.row}, column ${cell.col} seems incorrectly placed`);
                    hintGiven = true;
                }
            });
        }
    }

    // Validate that puzzle has a unique solution
    validatePuzzle() {
        // Save current state
        const savedState = [];
        this.grid.forEachCell(cell => {
            savedState.push({
                index: cell.index,
                piece: cell.piece,
                isFixed: cell.isFixed,
                isStation: cell.isStation
            });
        });
        
        // Try to solve puzzle
        const solution = this._solvePuzzle();
        
        // Restore state
        savedState.forEach(state => {
            const cell = this.grid.getCellByIndex(state.index);
            cell.piece = state.piece;
            cell.isFixed = state.isFixed;
            cell.isStation = state.isStation;
        });
        
        this.ui.render();
        
        return solution;
    }
    
    _solvePuzzle() {
        // Simple backtracking solver
        const emptyCells = [];
        this.grid.forEachCell(cell => {
            if (!cell.isFixed && !cell.isStation) {
                emptyCells.push(cell);
            }
        });
        
        const trackOptions = [
            TrackPiece.EMPTY,
            TrackPiece.VERTICAL,
            TrackPiece.HORIZONTAL,
            TrackPiece.CORNER_NE,
            TrackPiece.CORNER_SE,
            TrackPiece.CORNER_SW,
            TrackPiece.CORNER_NW
        ];
        
        const solve = (cellIndex) => {
            if (cellIndex >= emptyCells.length) {
                // Check if solution is valid
                const counts = this.grid.getConstraintCounts();
                const constraintsMet = counts.rows.every(c => c === 0) && counts.cols.every(c => c === 0);
                const isConnected = this.grid.isConnected();
                return constraintsMet && isConnected;
            }
            
            const cell = emptyCells[cellIndex];
            
            for (const piece of trackOptions) {
                cell.piece = piece;
                
                if (piece === TrackPiece.EMPTY || this.grid.canPlaceTrack(cell)) {
                    if (solve(cellIndex + 1)) {
                        return true;
                    }
                }
            }
            
            cell.piece = TrackPiece.EMPTY;
            return false;
        };
        
        return solve(0);
    }
    
    // Console API
    getGrid() {
        return this.grid.toString();
    }

    placeTrack(row, col, pieceId) {
        const cell = this.grid.getCell(row, col);
        if (!cell || cell.isFixed || cell.isStation) return false;
        
        const piece = Object.values(TrackPiece).find(p => p.id === pieceId);
        if (!piece) return false;
        
        const success = cell.setPiece(piece);
        if (success) {
            this.moveCount++;
            this._updateGame();
        }
        return success;
    }

    getStats() {
        const counts = this.grid.getConstraintCounts();
        return {
            moves: this.moveCount,
            isComplete: this.isComplete,
            isConnected: this.grid.isConnected(),
            rowConstraints: counts.rows,
            colConstraints: counts.cols,
            timeElapsed: Math.floor((Date.now() - this.startTime) / 1000)
        };
    }
}

// Initialize game when DOM is ready
let game;
function init() {
    game = new TracksGame();
    
    // Console help
    console.log('Train Tracks Game initialized!');
    console.log('Console API:');
    console.log('  game.getGrid() - Display current grid state');
    console.log('  game.placeTrack(row, col, pieceId) - Place a track piece');
    console.log('  game.getStats() - Get game statistics');
    console.log('  game.reset() - Reset the puzzle');
    console.log('');
    console.log('Piece IDs: empty, vertical, horizontal, corner_ne, corner_nw, corner_sw, corner_se');
    console.log('  game.getHint() - Get a hint for the next move');
    console.log('  game.changeDifficulty(level) - Change difficulty (easy, medium, hard)');
    console.log('  game.nextPuzzle() - Load next puzzle');
    console.log('  game.validatePuzzle() - Check if current puzzle has a solution');
}