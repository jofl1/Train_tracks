class Tracks{
    constructor() {
        const t = this;
        t.trackoptions = [ //array of objects, id must match html id
            { id: 'straight', image: 'track_images/tracks_straight.jpg' },
            { id: 'horiz', image: 'track_images/tracks_horiz.jpg' },
            { id: 'trc', image: 'track_images/tracks_trc.jpg' },
            { id: 'tlc', image: 'track_images/tracks_tlc.jpg' },
            { id: 'brc', image: 'track_images/tracks_brc.jpg' },
            { id: 'blc', image: 'track_images/tracks_blc.jpg' }
        ];
        
        t.selectedTrack = t.trackoptions[0].image; 
        t.grid = document.getElementById('grid'); 
        
        t.initializeTrackOptions(t); //Immediately sets up track options and creates grid
        t.createGrid(t);
    }
    
    initializeTrackOptions(t) { 
        t.trackoptions.forEach((option, index) => { // Loops through each option to show backrgrounf image
            const element = document.getElementById(option.id);
            element.style.backgroundImage = `url('${option.image}')`; // sets background image of element to track image ($ is f string equivalent)
            
            if (index == 0) {
                element.style.outline = '3px solid blue';
            }
            
            element.addEventListener('click', (e) => {
                t.selectTrack(t, option.image, element, e); // on click calls select track
            });
        });
    }
    
    selectTrack(t, trackImage, selectedElement, e) {
        t.selectedTrack = trackImage; //updates to the image of the piece clicked
        
        t.trackoptions.forEach(option => { //Removes blue outline from all
            const element = document.getElementById(option.id);
            element.style.outline = '';
           });
        
        selectedElement.style.outline = '3px solid blue'; //gives selected piece blue border line
    }
    
    createGrid(t) { //create grid function
        for (let i = 0; i < 64; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell_${i}`;
            
            cell.addEventListener('click', (e) => {
                t.cellClick(t, e.target, e); //calls cell click on event click
            });
            
            t.grid.appendChild(cell);
        }
        
        // Set fixed tracks
        const cell6 = document.getElementById('cell_6');
        cell6.style.backgroundImage = `url('${t.trackoptions[0].image}')`;
        cell6.style.backgroundSize = 'cover';
        cell6.style.backgroundPosition = 'center';
        cell6.style.backgroundRepeat = 'no-repeat';
        
        const cell24 = document.getElementById('cell_24');
        cell24.style.backgroundImage = `url('${t.trackoptions[1].image}')`;
        cell24.style.backgroundSize = 'cover';
        cell24.style.backgroundPosition = 'center';
        cell24.style.backgroundRepeat = 'no-repeat';
        
    }
    
    cellClick(t, element, e) {
        // Skip fixed cells
        if (element.id == 'cell_6' || element.id == 'cell_24') {
            return;
        }
        
        if (element.style.backgroundImage) {
            element.style.backgroundImage = ''; // if already has an image remove it 
        } else {
            element.style.backgroundImage = `url('${t.selectedTrack}')`; // else add image at center 
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundRepeat = 'no-repeat';
        }
    }
    
    getrandint(max) {
        return Math.floor(Math.random() * max);
    }
    
}