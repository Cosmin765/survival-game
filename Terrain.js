class Terrain
{
    constructor(map = Terrain.generateMap(), decorations = Terrain.generateDecorations()) {
        this.map = map;
        this.decorations = decorations;
        this.layers = { map, decorations };
        this.upperLayer = this.calculateUpperLayer();
    }

    calculateUpperLayer() {
        const upperLayer = [];

        const upperSprites = [
            keyToId["top_tree_1"],
            keyToId["top_tree_2"]
        ];

        for(let i = 0; i < this.decorations.length; ++i) {
            for(let j = 0; j < this.decorations[i].length; ++j) {
                if(upperSprites.includes(this.decorations[i][j])) {
                    upperLayer.push({ i, j, id: this.decorations[i][j] });
                }
            }
        }

        return upperLayer;
    }

    render() {
        const view = player.pos.copy().sub(CENTER);
        
        for(let i = 0; i < this.map.length; ++i) {
            for(let j = 0; j < this.map[i].length; ++j) {
                const x = j * TILE_WIDTH, y = i * TILE_WIDTH; // not using Vec2 because it's very expensive
                if(!collided(x, y, TILE_WIDTH, TILE_WIDTH, view.x, view.y, width, height)) // checking if the tile is within the view
                    continue;
                    
                    for(const layer in this.layers) {
                        const value = this.layers[layer][i][j];
                        if(value === null) continue;
                        const offset = spriteData[idToKey[value]];
                        ctx.drawImage(textures[layer], ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
                    }
                }
            }
        }
        
    renderUpper() { // to render things above the player ( i know it's dumb, but whatever )
        const view = player.pos.copy().sub(CENTER);
        for(const ob of this.upperLayer) {
            const x = ob.j * TILE_WIDTH, y = ob.i * TILE_WIDTH; // not using Vec2 because it's very expensive
            if(!collided(x, y, TILE_WIDTH, TILE_WIDTH, view.x, view.y, width, height)) // checking if the tile is within the view
                continue;

            if(ob.id === null) continue;
            const offset = spriteData[idToKey[ob.id]];
            ctx.drawImage(textures.decorations, ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
        }
    }

    inRange(j, i) {
        return j >= 0 && j < this.map[0].length && i >= 0 && i < this.map.length;
    }

    getEmptySpot() {
        for(let i = 1; i < this.map.length; ++i) {
            for(let j = 0; j < this.map[i].length; ++j) {
                if(!colliders[idToKey[this.map[i][j]]] && !colliders[idToKey[this.decorations[i][j]]]) {
                    return [ j, i ];
                }
            }
        }

        return null;
    }

    static generateMap(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        const map = Array(i).fill(0).map(_ => Array(j).fill(keyToId["plain"]));
        for(let k = 0; k < i; ++k) {
            map[k][0] = keyToId["left_edge"];
            map[k][j - 1] = keyToId["right_edge"];
        }
        for(let k = 0; k < j; ++k) {
            map[0][k] = keyToId["top_edge"];
            map[i - 1][k] = keyToId["bottom_edge"];
        }

        map[0][0] = keyToId["top_left_corner"];
        map[0][j - 1] = keyToId["top_right_corner"];
        map[i - 1][0] = keyToId["bottom_left_corner"];
        map[i - 1][j - 1] = keyToId["bottom_right_corner"];

        map[4][3] = keyToId["left_edge"];
        return map;
    }

    static generateDecorations(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        const decorations = Array(i).fill(0).map(_ => Array(j).fill(null));

        const treeCount = 1000;
        const treeNames = [ "_tree_1", "_tree_2" ];

        for(let k = 0; k < treeCount; ++k) {
            const pos_i = random(1, i - 1) | 0;
            const pos_j = random(1, j - 1) | 0;
            const treeName = treeNames[random(0, 2) | 0];

            if(decorations[pos_i][pos_j] !== null || decorations[pos_i - 1][pos_j] !== null)
                continue;

            decorations[pos_i][pos_j] = keyToId["bottom" + treeName];
            decorations[pos_i - 1][pos_j] = keyToId["top" + treeName];
        }

        return decorations;
    }

    static DEFAULT_I = 100;
    static DEFAULT_J = 100;
}