const io = require("socket.io")(5000, { cors: { origin: "*" } });

const spriteData = require("./../data/spriteData.json");
const keyToId = {}, idToKey = [];

for(const key in spriteData) {
    keyToId[key] = idToKey.length;
    idToKey.push(key);
} // aliases for the sprites

const random = (min, max) => Math.random() * (max - min) + min;

class Terrain
{
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

const map = Terrain.generateMap();
const decorations = Terrain.generateDecorations();

const playersData = {}; // the keys are the ids of the sockets

io.on('connection', socket => {
    console.log("socket connected -", socket.id);

    playersData[socket.id] = {
        pos: [ -1000, -1000 ],
        leftFacing: false,
        spriteOff: 0,
        textBox: {
            texts: [],
            visible: true
        }
    };

    socket.on("store", data => {
        playersData[socket.id] = data;
    });

    socket.on("getTerrain", () => {
        socket.emit("terrain", { map, decorations });
    });

    socket.on('disconnect', () => {
        delete playersData[socket.id]; // apparently this exists, nice
        io.emit("remove", socket.id);
    });
});

setInterval(() => io.emit("players", playersData), 1000 / 60);