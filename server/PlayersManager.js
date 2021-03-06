const Terrain = require("./Terrain");
const NPC = require("./NPC");
const Vec2 = require("../Vec2");
const { v4: uuid } = require("uuid");
const TILE_WIDTH = 80;
const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

class PlayersManager {
    constructor(io) {
        this.io = io; // reference to the io
        this.rooms = [];
        this.createRoom(uuid());
    }

    createRoom() {
        const mapSize = [ Terrain.DEFAULT_I, Terrain.DEFAULT_J ];
        const room = {
            name: uuid(),
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
            },
            npcs: [],
            maxPlayers: 6,
            requiredPlayers: 3,
            currentPlayers: 0,
            started: false
        };

        for(let i = 0; i < 1; ++i) {
            this.addNPC(room);
        }
        this.rooms.push(room);
        return room;
    }

    update() {
        for(const room of this.rooms) {
            if(room.started)
                this.updateRoom(room);
        }
    }

    updateRoom(room) {
        for(const npc of room.npcs)
            npc.update();

        this.storeNPCData(room);
        this.io.to(room.name).emit("players", room.playersData);
    }
    
    addNPC(room) {
        // add a temp npc
        const team = this.getTeam(room);
        const pos = [...new Vec2(...room.basesData[team].pos).add(new Vec2(TILE_WIDTH * 1.2, 0))];

        const id = uuid();
        const npc = new NPC(pos, team, id, room);
        room.npcs.push(npc);
        room.playersData[id] = npc.getData();
        room.teamsData[team].push(id);
        room.currentPlayers += 1;
    }

    storeNPCData(room) {
        for(const npc of room.npcs)
            room.playersData[npc.id] = npc.getData();
    }

    fire() {
        const treshold = 400; // no need for adapt on the server side
        for(const room of this.rooms) {
            if(!room.started)
                continue;

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
    
            this.io.to(room.name).emit("fire", targetData);
        }
    }

    generate() {
        for(const room of this.rooms) {
            if(!room.started)
                continue;
                
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
            this.io.to(room.name).emit("spawnDecoration", data);
        }
    }
    
    add(socket) {
        let room = this.rooms[0];
        for(let i = 1; i < this.rooms.length; ++i) {
            const otherRoom = this.rooms[i];
            if(!otherRoom.started && otherRoom.maxPlayers - otherRoom.currentPlayers > 0 && otherRoom.currentPlayers < room.currentPlayers) {
                room = this.rooms[i];
            }
        }

        if(room.currentPlayers >= room.maxPlayers || room.started) {
            room = this.createRoom();
        }
        
        socket.join(room.name);
        const team = this.getTeam(room);
        
        room.teamsData[team].push(socket.id);
        room.playersData[socket.id] = {
            name: "",
            pos: [ -1000, -1000 ],
            leftFacing: false,
            spriteOff: 0,
            health: 50,
            team: team,
            attacking: false,
            texts: [],
        };

        room.currentPlayers += 1;

        if(room.currentPlayers >= room.requiredPlayers) {
            room.started = true;
        }
        
        this.io.to(room.name).emit("players", room.playersData);
        socket.emit("initial", { 
            team, 
            towersData: room.towersData, 
            basesData: room.basesData, 
            terrain: room.terrain
        });

        this.io.to(room.name).emit("updateWaitingInfo", { currentPlayers: room.currentPlayers, requiredPlayers: room.requiredPlayers });

        socket.on("towerSpawn", data => {
            room.towersData[data.type][data.id] = { pos: data.pos, ownerID: data.ownerID, health: 40 };
            socket.broadcast.to(room.name).emit("towerSpawn", data);
        });
        
        socket.on("removeDecoration", data => {
            socket.broadcast.to(room.name).emit("removeDecoration", data);
            
            const { i, j } = data;
            const decorations = room.terrain.decorations;
            const name = Terrain.idToKey[decorations[i][j]];
            if(name.includes("tree"))
            decorations[i - 1][j] = null;
            decorations[i][j] = null;
            
            Terrain.ITEMS_COUNT--;
        });
        
        socket.on("hurtTower", data => {
            if(!room.towersData[data.type][data.id]) return;
            room.towersData[data.type][data.id].health -= data.damage;
            if(room.towersData[data.type][data.id].health <= 0) {
                this.io.to(room.name).emit("removeTower", { type: data.type, id: data.id });
                delete room.towersData[data.type][data.id];
            }
            socket.broadcast.to(room.name).emit("hurtTower", data);
        });
        
        const hurtBase = (type, damage) => {
            if(!room.basesData[type]) return;
            room.basesData[type].health -= damage;
            if(room.basesData[type].health <= 0) {
                delete room.basesData[type];
                this.io.to(room.name).emit("removeBase", type);
            }
        };
        
        socket.on("hurtBase", data => {
            hurtBase(data.type, data.damage);
            socket.broadcast.to(room.name).emit("hurtBase", data);
        });
        
        socket.on("store", data => {
            for(const property in data) {
                room.playersData[socket.id][property] = data[property];
            }
        });
        
        socket.on("texts", data => socket.broadcast.to(room.name).emit("texts", data));
        
        socket.on("disconnect", () => {
            this.remove(socket, room);
            const type = room.playersData[socket.id].team;
            const towersRemoveData = { type, ids: [] };
            for(const id in room.towersData[type]) { // removing the towers which were spawned by the disconnected player
                if(room.towersData[type][id].ownerID === socket.id){
                    towersRemoveData.ids.push(id);
                    delete room.towersData[team][id];
                }
            }
            delete room.playersData[socket.id]; // apparently this exists, nice
            this.io.to(room.name).emit("remove", { id: socket.id, towersRemoveData });
            this.io.to(room.name).emit("updateWaitingInfo", { currentPlayers: room.currentPlayers, requiredPlayers: room.requiredPlayers });
        });
    }

    getTeam(room) {
        const lenToTeam = {};
        const lengths = []; // generate a team for the new player
        for(const team in room.basesData) {
            lenToTeam[room.teamsData[team].length] = team;
            lengths.push(room.teamsData[team].length);
        }
        lengths.sort();
        const team = lenToTeam[lengths[0]];
        return team;
    }

    remove(socket, room) {
        const team = room.playersData[socket.id].team;
        const index = room.teamsData[team].indexOf(socket.id);
        room.teamsData[team].splice(index, 1);
        room.currentPlayers -= 1;
    }
}

module.exports = PlayersManager;