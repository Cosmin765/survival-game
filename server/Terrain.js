// server
const spriteData = require("./../data/spriteData.json");
const keyToId = {}, idToKey = [];

for(const key in spriteData) {
    keyToId[key] = idToKey.length;
    idToKey.push(key);
} // aliases for the sprites

const random = (min, max) => Math.random() * (max - min) + min;

class Terrain
{
    static DEFAULT_I = 20;
    static DEFAULT_J = 10;

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
        
        const treeCount = i * j / 10 | 0;
        const stoneCount = i * j / 20 | 0;

        const generators = [
            [ Terrain.genTree, treeCount ],
            [ Terrain.genStone, stoneCount ]
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
        if(Terrain.reserved(container, i, j) || Terrain.reserved(container, i - 1, j)) return;
        
        if(container[i][j] !== null || container[i - 1][j] !== null)
            return;
        
        container[i][j] = keyToId["bottom" + treeName];
        container[i - 1][j] = keyToId["top" + treeName];
    }
    
    static genStone(container) {
        const name = [ "stone_1", "stone_2" ][random(0, 2) | 0];
        const [ i, j ] = Terrain.getRandCoord(container.length, container[0].length);
        if(Terrain.reserved(container, i, j)) return;
        
        if(container[i][j] !== null)
            return;
        
        container[i][j] = keyToId[name];
    }

    static getRandCoord(i, j) {
        return [ random(1, i - 1) | 0, random(1, j - 1) | 0 ];
    }
    
    static reserved(container, pos_i, pos_j) {
        let towers_positions = [];
        {
            const [ i, j ] = [ container.length, container[0].length ];
            towers_positions = [
                [ j / 2, 1 ],
                [ 1, i - 2 ],
                [ j - 2, i - 2 ]
            ];
        }

        const r = 3;

        for(const [ j, i ] of towers_positions) {
            if(Math.sqrt(Math.pow(pos_i - i, 2) + Math.pow(pos_j - j, 2)) <= r) return true;
        }
        return false;
    }
};

module.exports = Terrain;