const io = require("socket.io")(5000, { cors: { origin: "*" } });
const Terrain = require("./Terrain");
const PlayerManager = require("./PlayerManager");

const TILE_WIDTH = 80;

const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
const playerManager = new PlayerManager();

const [ map, decorations ] = [ Terrain.generateMap(), Terrain.generateDecorations() ];

const playersData = {}; // the keys are the ids of the sockets
const towersData = {
    red: {},
    yellow: {},
    blue: {}
};

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

    socket.emit("initial", { team, towersData });

    socket.on("store", data => {
        const nonMutable = [ "team" ];

        for(const property in data) {
            if(nonMutable.includes(property)) continue;

            playersData[socket.id][property] = data[property];
        }
    });

    socket.on("tower", data => {
        towersData[data.type][data.id] = { pos: data.pos, ownerID: data.ownerID };
        socket.broadcast.emit("towerSpawn", data);
    });

    socket.on("removeDecoration", data => {
        socket.broadcast.emit("removeDecoration", data);

        const { i, j } = data;
        const name = Terrain.idToKey[decorations[i][j]];
        if(name.includes("tree"))
            decorations[i - 1][j] = null;
        decorations[i][j] = null;
    });

    socket.on("getTerrain", () => socket.emit("terrain", { map, decorations }));

    socket.on("disconnect", () => {
        playerManager.remove(socket.id, playersData);
        const type = playersData[socket.id].team;
        const towersRemoveData = {
            type,
            ids: []
        };
        for(const id in towersData[type]) { // removing the towers which were spawned by the disconnected player
            if(towersData[type][id].ownerID === socket.id){
                towersRemoveData.ids.push(id);
                delete towersData[team][id];
            }
        }
        delete playersData[socket.id]; // apparently this exists, nice
        io.emit("remove", { id: socket.id, towersRemoveData });
    });
});

setInterval(() => io.emit("players", playersData), 1000 / 30);

setInterval(() => {
    const treshold = 400; // no need for adapt on the server side
    const targetData = [];
    for(const type in towersData) {
        for(const towerID in towersData[type]) {
            const towerPos = towersData[type][towerID].pos;
            let smallest = Infinity;
            let targetID = null;

            for(const entityID in playersData) {
                if(playerManager.teamsData[type].includes(entityID)) continue;
                const dist = getDist(...towerPos, ...playersData[entityID].pos);
                if(dist > treshold) continue;

                if(dist < smallest) {
                    smallest = dist;
                    targetID = entityID;
                }
            }

            if(targetID) {
                targetData.push({
                    targetID,
                    towerType: type,
                    towerID
                });
            }
        }
    }

    io.emit("fire", targetData);
}, 1000);

setInterval(() => {
    const data = Math.random() < 0.5 ? Terrain.genTree(decorations) : Terrain.genStone(decorations);
    if(!data) return;
    if(Terrain.ITEMS_COUNT > decorations.length * decorations[0].length / 10) return;
    const r = 2;
    for(const item of data) {
        for(const id in playersData) {
            if(getDist(item.j, item.i, playersData[id].pos[0] / TILE_WIDTH, playersData[id].pos[1] / TILE_WIDTH) < r)
                return;
        }
    }

    Terrain.ITEMS_COUNT++;
    io.emit("spawnDecoration", data);
}, 1000);