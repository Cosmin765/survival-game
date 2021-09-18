const Terrain = require("./Terrain");
const mapSize = [ Terrain.DEFAULT_I, Terrain.DEFAULT_J ];
const TILE_WIDTH = 80;
const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

class PlayersManager
{
    constructor(io) {
        this.io = io; // reference to the io
        this.rooms = {
            default: this.initRoom()
        };
    }

    initRoom() {
        return  {
            teamsData: {
                red: [],
                yellow: [],
                blue: []
            },
            playersData: {},
            basesData: {
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
                }
            },
            towersData: {
                red: {},
                yellow: {},
                blue: {}
            },
            terrain: {
                map: Terrain.generateMap(...mapSize),
                decorations: Terrain.generateDecorations(...mapSize)
            }
        };
    }

    update() {
        for(const roomName in this.rooms) {
            this.io.to(roomName).emit("players", this.rooms[roomName].playersData);
        }
    }

    fire() {
        const treshold = 400; // no need for adapt on the server side
        for(const roomName in this.rooms) {
            const room = this.rooms[roomName];
            const targetData = [];
    
            for(const type in room.towersData) {
                const positions = []; // the possible targets
                for(const id in room.playersData) {
                    if(room.playersData[id].team === type) continue;
                    positions.push(room.playersData[id].pos);
                }
                for(const baseType in room.basesData) {
                    if(baseType === type) continue;
                    positions.push(room.basesData[baseType].pos);
                }
    
                for(const towerID in room.towersData[type]) {
                    const towerPos = room.towersData[type][towerID].pos;
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
    
            this.io.to(roomName).emit("fire", targetData);
        }
    }

    generate() {
        for(const roomName in this.rooms) {
            const room = this.rooms[roomName];
            const decorations = room.terrain.decorations;
            const MAX_COUNT = decorations.length * decorations[0].length / 5;
            if(Terrain.ITEMS_COUNT > MAX_COUNT) return;
            const data = Math.random() < 0.5 ? Terrain.genTree(decorations) : Terrain.genStone(decorations);
            if(!data) return;
    
            const r = 2;
            for(const item of data) {
                for(const id in room.playersData) {
                    const dist = getDist(item.j, item.i, ...room.playersData[id].pos.map(val => val / TILE_WIDTH));
                    if(dist < r) {
                        for(const item of data)
                            decorations[item.i][item.j] = null; // removing the item
                        return;
                    }
                }
            }
    
            Terrain.ITEMS_COUNT++;
            this.io.to(roomName).emit("spawnDecoration", data);
        }
    }

    add(socket) {
        const roomName = "default";
        socket.join(roomName);
        socket.roomName = roomName;
        const team = this.getTeam(roomName);
        const room = this.rooms[roomName];

        room.teamsData[team].push(socket.id);
        room.playersData[socket.id] = {
            pos: [ -1000, -1000 ],
            leftFacing: false,
            spriteOff: 0,
            texts: [],
            name: "",
            team: team,
            health: 50,
            attacking: false
        };

        socket.emit("initial", { team, towersData: room.towersData, basesData: room.basesData, terrain: room.terrain });
        
        socket.on("towerSpawn", data => {
            room.towersData[data.type][data.id] = { pos: data.pos, ownerID: data.ownerID, health: 40 };
            socket.broadcast.to(roomName).emit("towerSpawn", data);
        });

        socket.on("removeDecoration", data => {
            socket.broadcast.to(roomName).emit("removeDecoration", data);

            const { i, j } = data;
            const decorations = room.terrain.decorations;
            const name = Terrain.idToKey[decorations[i][j]];
            if(name.includes("tree"))
                decorations[i - 1][j] = null;
            decorations[i][j] = null;

            Terrain.ITEMS_COUNT--;
        });

        socket.on("hurtTower", data => {
            room.towersData[data.type][data.id].health -= data.damage;
            if(room.towersData[data.type][data.id].health <= 0) {
                this.io.to(roomName).emit("removeTower", { type: data.type, id: data.id });
                delete room.towersData[data.type][data.id];
            }
            socket.broadcast.to(roomName).emit("hurtTower", data);
        });

        
        const hurtBase = (type, damage) => {
            room.basesData[type].health -= damage;
            if(room.basesData[type].health <= 0) {
                console.log(type, "base destroyed!");
            }
        };

        socket.on("hurtBase", data => {
            hurtBase(data.type, data.damage);
            socket.broadcast.to(roomName).emit("hurtBase", data);
        });

        socket.on("justHurtBase", data => hurtBase(data.type, data.damage)); // hurt without propagating


        socket.on("store", data => {
            for(const property in data) {
                room.playersData[socket.id][property] = data[property];
            }
        });

        socket.on("disconnect", () => {
            this.remove(socket);
            const room = this.rooms[socket.roomName];
            const type = room.playersData[socket.id].team;
            const towersRemoveData = { type, ids: [] };
            for(const id in room.towersData[type]) { // removing the towers which were spawned by the disconnected player
                if(room.towersData[type][id].ownerID === socket.id){
                    towersRemoveData.ids.push(id);
                    delete room.towersData[team][id];
                }
            }
            delete room.playersData[socket.id]; // apparently this exists, nice
            this.io.to(socket.roomName).emit("remove", { id: socket.id, towersRemoveData });
        });
        
        return team;
    }

    getTeam(roomName) {
        const lenToTeam = {};
        const lengths = [];
        const room = this.rooms[roomName];
        for(const team in room.teamsData) {
            lenToTeam[room.teamsData[team].length] = team;
            lengths.push(room.teamsData[team].length);
        }
        lengths.sort();
        const team = lenToTeam[lengths[0]];
        return team;
    }

    remove(socket) {
        const room = this.rooms[socket.roomName];
        const team = room.playersData[socket.id].team;
        const index = room.teamsData[team].indexOf(socket.id);
        room.teamsData[team].splice(index, 1);
    }
}

module.exports = PlayersManager;