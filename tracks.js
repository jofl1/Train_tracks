'use strict';

// Represents a single track piece type
class Track {
    // Every track piece has a unique id and a path to its image
    constructor(id, imagePath) {
        this.id = id;
        this.imagePath = imagePath;
    }
    
    // method to apply the track's image to a grid cell element
    apply(element) {
        element.style.backgroundImage = `url('${this.imagePath}')`;
    }
    
    // method to remove the track's image from a grid cell element
    remove(element) {
        element.style.backgroundImage = '';
    }
}

// Represents a single grid cell on game board
class Cell {
    // Each cell is identified by its index in the grid
    // also calculate its row and column for easier reference
    constructor(index, gridSize = 8) {
        this.index = index;
        this.row = Math.floor(index / gridSize);
        this.column = index % gridSize; //remainder
        this.currentTrack = null; // This will hold the track piece placed in this cell
        this.isFixed = false; // Fixed cells can't be changed
        this.element = this.createElement(); // The actual HTML element for this cell
    }
    
    // Creates the HTML div element for cell
    createElement() {
        const element = document.createElement('div');
        element.className = 'cell';
        element.id = `cell_${this.index}`;
        return element;
    }
    
    // method to place a track in the cell, or removes it if one is already there
    placeTrack(track) {
        if (this.isFixed) return null; // Can't change fixed cells
        
        // If there's already a track remove it
        if (this.currentTrack) {
            this.currentTrack.remove(this.element);
            this.currentTrack = null;
            return 'removed';
        }
        
        // Otherwise place the new track.
        this.currentTrack = track;
        track.apply(this.element);
        return 'placed';
    }
    
    // This sets a cell as fixed, meaning it can't be changed.
    setAsFixed(track) {
        this.isFixed = true;
        this.currentTrack = track;
        track.apply(this.element);
    }
}

// Manages the game grid and the rules for placing tracks
class Grid {
    constructor(size = 8) {
        this.size = size;
        this.cells = []; // An array to hold all the Cell objects
        this.rowCounts = new Array(size).fill(3); // How many tracks can be in each row
        this.columnCounts = new Array(size).fill(3); // How many tracks can be in each column
        this.gridElement = document.getElementById('grid');
        this.wrapperElement = this.gridElement.parentElement;
        this.buildGrid();
    }
    
    // Creates all the Cell objects and adds them to the grid
    buildGrid() {
        // A loop to create all the cells for 8x8 grid
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = new Cell(i, this.size);
            this.cells.push(cell);
            this.gridElement.appendChild(cell.element);
        }
    }
    
    // Creates the counters for rows and columns that show how many tracks can be placed
    createCounterDisplays() {
        for (let i = 0; i < this.size; i++) {
            this.createCounter('row-count', {top: `${i * 11.5}%`}, this.rowCounts[i]);
            this.createCounter('col-count', {left: `${i * 12.5}%`}, this.columnCounts[i]);
        }
    }
    
    // A helper function to create a single counter element
    createCounter(className, style, value) {
        const counter = document.createElement('div');
        counter.className = className;
        
        if (style.top) {
            counter.style.top = style.top;
        }
        if (style.left) {
            counter.style.left = style.left;
        }
        
        counter.textContent = value;
        counter.setAttribute('data-value', value);
        this.wrapperElement.appendChild(counter);
    }
    
    // Checks if a track can be placed in a cell based on the row and column counts
    canPlaceTrack(cell) {
        return this.rowCounts[cell.row] > 0 && this.columnCounts[cell.column] > 0;
    }
}

// main controller for the game
class TracksGame {
    constructor() {
        this.trackPieces = [
            new Track('straight', 'track_images/tracks_straight.jpg'),
            new Track('horiz', 'track_images/tracks_horiz.jpg'),
            new Track('trc', 'track_images/tracks_trc.jpg'),
            new Track('tlc', 'track_images/tracks_tlc.jpg'),
            new Track('brc', 'track_images/tracks_brc.jpg'),
            new Track('blc', 'track_images/tracks_blc.jpg')
        ];
        
        this.selectedTrack = this.trackPieces[0]; // The track piece currently selected
        this.grid = new Grid(); // The game grid
        this.initialiseTrackSelector();
        
        // Listen for clicks on each cell in the grid
        this.grid.cells.forEach(cell => {
            cell.element.onclick = () => this.handleCellClick(cell);
        });
        
        this.placeFixedTracks(); // Place the initial, unchangeable tracks
        this.grid.createCounterDisplays();
    }
    
    // Sets up the track selector so can choose which piece to place
    initialiseTrackSelector() {
        this.trackPieces.forEach((track, index) => {
            const element = document.getElementById(track.id);
            track.apply(element); // Show the image for each track option
            
            if (index == 0) element.classList.add('selected'); // The first track is selected by default
            
            // When a track option is clicked select it.
            element.onclick = () => this.selectTrack(track, element);
        });
    }
    
    // Called when a player clicks on a track piece to select it
    selectTrack(track, element) {
        // Clear the selection from the previously selected track.
        document.querySelectorAll('.track-option').forEach(option => 
            option.classList.remove('selected')
        );
        
        // Then apply the 'selected' class to the new track and update the game's state
        element.classList.add('selected');
        this.selectedTrack = track;
    }
    
    // This function is called whenever a cell on the grid is clicked
    handleCellClick(cell) {
        if (cell.isFixed) return; // Do nothing if the cell is fixed
        
        // either remove a track or place one if the row/column limits haven't been reached
        const canModify = cell.currentTrack || this.grid.canPlaceTrack(cell);
        
        if (canModify) {
            const action = cell.placeTrack(this.selectedTrack);
            // Depending on whether a track was placed or removed update the counts
            if (action == 'placed') {
                this.grid.rowCounts[cell.row]--;
                this.grid.columnCounts[cell.column]--;
            } else if (action == 'removed') {
                this.grid.rowCounts[cell.row]++;
                this.grid.columnCounts[cell.column]++;
            }
            
            if (action) {
                // update the numbers displayed on the screen for the row and column counts
                const rowElement = this.grid.wrapperElement.querySelectorAll('.row-count')[cell.row];
                const columnElement = this.grid.wrapperElement.querySelectorAll('.col-count')[cell.column];
                
                rowElement.textContent = this.grid.rowCounts[cell.row];
                columnElement.textContent = this.grid.columnCounts[cell.column];
                rowElement.setAttribute('data-value', this.grid.rowCounts[cell.row]);
                columnElement.setAttribute('data-value', this.grid.columnCounts[cell.column]);
            }
        }
    }
    
    // places the initial fixed tracks on the board
    placeFixedTracks() {
        const cell6 = this.grid.cells[6];
        cell6.setAsFixed(this.trackPieces[0]);
        this.grid.rowCounts[cell6.row]--;
        this.grid.columnCounts[cell6.column]--;
        
        const cell24 = this.grid.cells[24];
        cell24.setAsFixed(this.trackPieces[1]);
        this.grid.rowCounts[cell24.row]--;
        this.grid.columnCounts[cell24.column]--;
    }
}
