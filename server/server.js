const io = require("socket.io")(5000, { cors: { origin: "*" } });
const Terrain = require("./Terrain");
const PlayersManager = require("./PlayersManager");

const TILE_WIDTH = 80;

const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
const playersManager = new PlayersManager();

const mapSize = [ Terrain.DEFAULT_I, Terrain.DEFAULT_J ];

const basesData = {
    red: {
        pos: [ mapSize[1] / 2, 1 ].map(val => val * TILE_WIDTH),
        health: 100
    },
    yellow: {
        pos: [ 1, mapSize[0] - 2 ].map(val => val * TILE_WIDTH),
        health: 100
    },
    blue: {
        pos: [ mapSize[1] - 2, mapSize[0] - 2 ].map(val => val * TILE_WIDTH),
        health: 100
    },
};

const [ map, decorations ] = [ Terrain.generateMap(...mapSize), Terrain.generateDecorations(...mapSize) ];

// const playersData = {}; // the keys are the ids of the sockets
const towersData = {
    red: {},
    yellow: {},
    blue: {}
};

const hurtBase = (type, damage) => {
    basesData[type].health -= damage;
    if(basesData[type].health <= 0) {
        console.log(type, "base destroyed!");
    }
};

io.on("connection", socket => {
    const team = playersManager.add(socket.id);

    playersManager.playersData[socket.id] = {
        pos: [ -1000, -1000 ],
        leftFacing: false,
        spriteOff: 0,
        texts: [],
        name: "",
        team: team,
        health: 50,
        attacking: false
    };

    socket.emit("initial", { team, towersData, basesData, terrain: { map, decorations } });

    socket.on("store", data => {
        for(const property in data)
            playersData[socket.id][property] = data[property];
    });

    socket.on("towerSpawn", data => {
        towersData[data.type][data.id] = { pos: data.pos, ownerID: data.ownerID, health: 40 };
        socket.broadcast.emit("towerSpawn", data);
    });

    socket.on("removeDecoration", data => {
        socket.broadcast.emit("removeDecoration", data);

        const { i, j } = data;
        const name = Terrain.idToKey[decorations[i][j]];
        if(name.includes("tree"))
            decorations[i - 1][j] = null;
        decorations[i][j] = null;

        Terrain.ITEMS_COUNT--;
    });

    socket.on("hurtTower", data => {
        towersData[data.type][data.id].health -= data.damage;
        if(towersData[data.type][data.id].health <= 0) {
            io.emit("removeTower", { type: data.type, id: data.id });
            delete towersData[data.type][data.id];
        }
        socket.broadcast.emit("hurtTower", data);
    });

    socket.on("hurtBase", data => {
        hurtBase(data.type, data.damage);
        socket.broadcast.emit("hurtBase", data);
    });

    socket.on("justHurtBase", data => hurtBase(data.type, data.damage)); // hurt without propagating

    socket.on("disconnect", () => {
        playersManager.remove(socket.id, playersData);
        const type = playersData[socket.id].team;
        const towersRemoveData = { type, ids: [] };
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

// setInterval(() => io.emit("players", playersData), 1000 / 30); // update loop
setInterval(() => playersManager.update(io), 1000 / 30); // update loop

setInterval(() => { // firing
    const treshold = 400; // no need for adapt on the server side
    const targetData = [];
    
    for(const type in towersData) {
        const positions = []; // the possible targets
        for(const id in playersData) {
            if(playersData[id].team === type) continue;
            positions.push(playersData[id].pos);
        }
        for(const baseType in basesData) {
            if(baseType === type) continue;
            positions.push(basesData[baseType].pos);
        }

        for(const towerID in towersData[type]) {
            const towerPos = towersData[type][towerID].pos;
            let smallest = Infinity;
            let targetPos = null;

            for(const pos of positions) {
                const dist = getDist(...towerPos, ...pos);
                if(dist > treshold) continue;

                if(dist < smallest) {
                    smallest = dist;
                    targetPos = pos;
                }
            }

            if(targetPos)
                targetData.push({ targetPos, towerType: type, towerID });
        }
    }

    io.emit("fire", targetData);
}, 1000);

setInterval(() => { // generation
    const MAX_COUNT = decorations.length * decorations[0].length / 5;
    if(Terrain.ITEMS_COUNT > MAX_COUNT) return;
    const data = Math.random() < 0.5 ? Terrain.genTree(decorations) : Terrain.genStone(decorations);
    if(!data) return;

    const r = 2;
    for(const item of data) {
        for(const id in playersData) {
            const dist = getDist(item.j, item.i, ...playersData[id].pos.map(val => val / TILE_WIDTH));
            if(dist < r) {
                for(const item of data)
                    decorations[item.i][item.j] = null; // removing the item
                return;
            }
        }
    }

    Terrain.ITEMS_COUNT++;
    io.emit("spawnDecoration", data);
}, 1000);