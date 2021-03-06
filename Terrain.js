class Terrain
{
    constructor(map = Terrain.generateMap(), decorations = Terrain.generateDecorations()) {
        this.map = map;
        this.decorations = decorations;
        this.layers = { map, decorations };
        this.upperLayer = this.calculateUpperLayer();
        this.healthData = {};
    }

    parseTerrain(terrain) {
        this.map = terrain.map;
        this.decorations = terrain.decorations;
        this.layers = terrain;
        this.upperLayer = this.calculateUpperLayer();
    }

    relativeCollider(layer, i, j) {
        if(i >= this.map.length || j >= this.map[0].length) return null;
        const collider = colliders[idToKey[this.layers[layer][i][j]]];
        if(!collider) return null;

        return collider.map(component => {
            const data = [...component];
            data[0] += j; data[1] += i;
            return data.map(val => val * TILE_WIDTH);
        });
    }

    removeDecoration(i, j) {
        const name = idToKey[this.decorations[i][j]];
        if(name.includes("tree")) {
            this.decorations[i - 1][j] = null;
            for(let k = 0; k < this.upperLayer.length; ++k) {
                const item = this.upperLayer[k];
                if((item.i === i - 1 || item.i === i) && item.j === j) {
                    this.upperLayer.splice(k--, 1);
                }
            }
        }
        this.decorations[i][j] = null;
        delete this.healthData[i + "," + j];
    }

    calculateUpperLayer() {
        const upperLayer = [];

        for(let i = 0; i < this.decorations.length; ++i) {
            for(let j = 0; j < this.decorations[i].length; ++j) {
                this.genUpper(upperLayer, i, j);
            }
        }

        return upperLayer;
    }

    genUpper(container, i, j) {
        const upperSprites = [
            "top_tree_1",
            "top_tree_2",
            "top_tree_3",
            "bottom_tree_1",
            "bottom_tree_2",
            "bottom_tree_3"
        ].map(key => keyToId[key]);

        if(upperSprites.includes(this.decorations[i][j])) {
            container.push({ i, j, id: keyToId["upper_" + idToKey[this.decorations[i][j]]] });
        }
    }

    render() {
        const view = player.pos.copy().sub(CENTER);
        const len1 = this.map.length;
        const len2 = this.map[0].length;
        
        for(let i = 0; i < len1; ++i) {
            for(let j = 0; j < len2; ++j) {
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
            ctx.drawImage(textures.upperLayer, ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
        }
    }

    inRange(i, j) {
        return j >= 0 && j < this.map[0].length && i >= 0 && i < this.map.length;
    }

    getEmptySpot(offX = 1, offY = 1) {
        for(let i = offY; i < this.map.length; ++i) {
            for(let j = offX; j < this.map[i].length; ++j) {
                let possible = true;
                for(const layer in this.layers) {
                    if(colliders[idToKey[this.layers[layer][i][j]]]) {
                        possible = false;
                        break;
                    }
                }

                if(possible)
                    return [ j, i ];
            }
        }
        return null;
    }

    static generateEmpty(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        return Array(i).fill(0).map(_ => Array(j).fill(keyToId["plain"]));
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
        return map;
    }

    static generateDecorations(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        const decorations = Array(i).fill(0).map(_ => Array(j).fill(null));

        const generators = [
            [ Terrain.genTree, 1000 ],
            [ Terrain.genStone, 500 ]
        ];

        for(const [ generator, count ] of generators) {
            for(let k = 0; k < count; ++k)
                generator(decorations);
        }
        
        return decorations;
    }
    
    static genTree(container) {
        const treeName = [ "_tree_1", "_tree_2", "_tree_3" ][random(0, 3) | 0];
        
        const [ i, j ] = Terrain.getRandCoord(container.length, container[0].length);

        if(container[i][j] !== null || container[i - 1][j] !== null)
            return;

        container[i][j] = keyToId["bottom" + treeName];
        container[i - 1][j] = keyToId["top" + treeName];
    }

    static genStone(container) {
        const name = [ "stone_1", "stone_2" ][random(0, 2) | 0];
        const [ i, j ] = Terrain.getRandCoord(container.length, container[0].length);
        
        if(container[i][j] !== null)
            return;

        container[i][j] = keyToId[name];
    }

    static getRandCoord(i, j) {
        return [ random(1, i - 1) | 0, random(1, j - 1) | 0 ];
    }

    static DEFAULT_I = 100;
    static DEFAULT_J = 100;
}