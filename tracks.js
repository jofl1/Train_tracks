
class Tracks{
    constructor() {
        const t = this;
        t.grid = document.getElementById('grid');
        for (let i = 0; i < 64;i++){
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = "cell_" + i;
            
            cell.addEventListener('click', (e) => { t.cell_click(t, e.target); });
            t.grid.appendChild(cell);
        }
    } //end constructor
    
    cell_click(t, el) {
        el.style["background-color"] = "blue";
    }
    
}

