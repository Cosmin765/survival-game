const io = require("socket.io")(5000, { cors: { origin: "*" } });
const Terrain = require("./Terrain");
const PlayerManager = require("./PlayerManager");

const TILE_WIDTH = 80;
const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
const playerManager = new PlayerManager();

const [ map, decorations ] = [ Terrain.generateMap(), Terrain.generateDecorations() ];

const playersData = {}; // the keys are the ids of the sockets

io.on('connection', socket => {
    const team = playerManager.add(socket.id);

    playersData[socket.id] = {
        pos: [ -1000, -1000 ],
        leftFacing: false,
        spriteOff: 0,
        texts: [],
        name: "",
        team: team,
        health: 50,
        attacking: false
    };

    socket.emit("team", team);

    socket.on("store", data => {
        const nonMutable = [ "team" ];

        for(const property in data) {
            if(nonMutable.includes(property)) continue;

            playersData[socket.id][property] = data[property];
        }
    });

    socket.on("getTerrain", () => socket.emit("terrain", { map, decorations }));

    socket.on("disconnect", () => {
        playerManager.remove(socket.id, playersData);
        delete playersData[socket.id]; // apparently this exists, nice
        io.emit("remove", socket.id);
    });
});

setInterval(() => io.emit("players", playersData), 1000 / 30);

setInterval(() => {
    const treshold = 400; // no need for adapt on the server side
    const towersData = {};
    {
        const [ i, j ] = [ map.length, map[0].length ];
        const towersPositions = [
            [ j / 2, 1 ],
            [ 1, i - 2 ],
            [ j - 2, i - 2 ]
        ].map(pos => pos.map(val => val * TILE_WIDTH));
        const types = [ "red", "yellow", "blue" ];
        for(let i = 0; i < 3; ++i) {
            towersData[types[i]] = towersPositions[i];
        }
    }
    
    
    const targetIDs = {};
    for(const type in towersData) {
        let smallest = Infinity;
        let targetEntityID = null;
        for(const id in playersData) {
            if(playerManager.teamsData[type].includes(id)) continue;
            const dist = getDist(...towersData[type], ...playersData[id].pos);
            if(dist > treshold) continue;

            if(dist < smallest) {
                smallest = dist;
                targetEntityID = id;
            }
        }

        if(targetEntityID) {
            targetIDs[type] = targetEntityID;
        }
    }

    io.emit("fire", targetIDs);
}, 1000);