class Terrain
{
    constructor(map = Terrain.generateMap(), decorations = Terrain.generateDecorations()) {
        this.map = map;
        this.decorations = decorations;
        this.layers = { map, decorations };
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

    inRange(j, i) {
        return j >= 0 && j < terrain.map[0].length && i >= 0 && i < terrain.map.length;
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
        decorations[5][3] = keyToId["bottom_tree_1"];
        decorations[4][3] = keyToId["top_tree_1"];
        return decorations;
    }

    static DEFAULT_I = 10;
    static DEFAULT_J = 6;
}