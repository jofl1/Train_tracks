
class Tracks{
    constructor() {
        const t = this;
        t.selectedTrack = 'tracks_straight.jpg';
        t.grid = document.getElementById('grid');
        
        const straightOption = document.getElementById('straight');
        const horizOption = document.getElementById('horiz');
        
        straightOption.style["background-image"] = "url('tracks_straight.jpg')";
        horizOption.style["background-image"] = "url('tracks_horiz.jpg')";
        straightOption.style["outline"] = "3px solid blue";
        
        straightOption.addEventListener('click', () => {
            t.selectedTrack = 'tracks_straight.jpg';
            straightOption.style["outline"] = "3px solid blue";
            horizOption.style["outline"] = "";
        });
        
        horizOption.addEventListener('click', () => {
            t.selectedTrack = 'tracks_horiz.jpg';
            horizOption.style["outline"] = "3px solid blue";
            straightOption.style["outline"] = "";
        });
        
        for (let i = 0; i < 64;i++){
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = "cell_" + i;
            
            cell.addEventListener('click', (e) => { t.cell_click(t, e.target); });
            t.grid.appendChild(cell);
        }
    } 
    
    cell_click(t, el) {
        if (el.style["background-image"]) {
            el.style["background-image"] = "";
        } else {
            el.style["background-image"] = "url('" + t.selectedTrack + "')";
            el.style["background-size"] = "cover";
            el.style["background-position"] = "center";
            el.style["background-repeat"] = "no-repeat";
        }
    }
    
}

