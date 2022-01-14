const Vec2 = require("../Vec2");
const TILE_WIDTH = 80;

class NPC {
    constructor(pos, team, id, room) {
        this.id = id;
        this.data = {
            name: "Bot",
            pos,
            leftFacing: false,
            spriteOff: 0,
            health: 50,
            team,
            attacking: false
        };
        this.room = room;
    }

    update() {
        // bot logic
        this.data.attacking = false;
        this.data.spriteOff = 0;
        const botPos = new Vec2(...this.data.pos);

        let smallestDist = Infinity;
        let target = null;

        for(const playerID in this.room.playersData) {
            if(playerID === this.id)
                continue;

            const playerData = this.room.playersData[playerID];
            const playerPos = new Vec2(...playerData.pos);

            if(playerData.team === this.data.team)
                continue;

            if(playerPos.x === -1000 && playerPos.y === -1000) // the player is dead
                continue;

            const dir = playerPos.copy().sub(botPos);

            if(dir.dist() < smallestDist) {
                smallestDist = dir.dist();
                target = playerPos;
            }
        }

        if(target) {
            if(botPos.x - target.x > 0) {
                this.data.leftFacing = true;
                target.add(new Vec2(TILE_WIDTH / 2, 0));
            } else {
                this.data.leftFacing = false;
                target.sub(new Vec2(TILE_WIDTH / 2, 0));
            }

            const dir = target.sub(botPos);
            const dist = dir.dist();
            this.data.attacking = (dist < 50);
            if(dist > 30 && dist < 400) { // the bot has problems seeing long distances
                // moving
                this.data.spriteOff = 2;
                const movement = dir.normalize().mult(5);
                botPos.add(movement);
                this.data.pos = [...botPos];
            }
        }
    }

    getData() {
        return this.data;
    }
}

module.exports = NPC;