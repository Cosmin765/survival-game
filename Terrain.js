class Terrain
{
    constructor(map = Terrain.generate(10, 6)) {
        this.map = map;
    }

    render() {
        const view = player.pos.copy().sub(CENTER);
        for(let i = 0; i < this.map.length; ++i) {
            for(let j = 0; j < this.map[i].length; ++j) {
                const x = j * TILE_WIDTH, y = i * TILE_WIDTH; // not using Vec2 because it's very expensive
                if(!collided(x, y, TILE_WIDTH, TILE_WIDTH, view.x, view.y, width, height)) // checking if the tile is within the view
                    continue;

                const offset = tileData[idToKey[this.map[i][j]]];
                ctx.drawImage(textures.map, ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
            }
        }
    }

    static generate(i, j) {
        const map = Array(i).fill(0).map(_ => Array(j).fill(4));
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
}