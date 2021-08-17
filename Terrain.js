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
                if (!(x < view.x + width && x + TILE_WIDTH > view.x && y < view.y + height && y + TILE_WIDTH > view.y)) // checking if the tile is within the view
                    continue;

                const offset = tileData[tileKeys[this.map[i][j]]];
                ctx.drawImage(textures.map, ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
            }
        }
    }

    static generate(i, j) {
        let map = Array(i).fill(0).map(_ => Array(j).fill(4));
        for(let k = 0; k < i; ++k) {
            map[k][0] = 3;
            map[k][j - 1] = 5;
        }
        for(let k = 0; k < j; ++k) {
            map[0][k] = 1;
            map[i - 1][k] = 7;
        }
        map[0][0] = 0;
        map[0][j - 1] = 2;
        map[i - 1][0] = 6;
        map[i - 1][j - 1] = 8
        return map;
    }
}