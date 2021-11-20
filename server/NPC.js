class NPC {
    constructor(pos, team) {
        this.data = {
            pos,
            leftFacing: false,
            spriteOff: 0,
            health: 50,
            team
        };
    }

    update() {
        // bot logic
    }

    getData() {
        return this.data;
    }
}

module.exports = NPC;