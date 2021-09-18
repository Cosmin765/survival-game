class PlayersManager
{
    constructor() {
        this.teamsData = {
            red: [],
            yellow: [],
            blue: []
        };
        this.teams = [ "red", "yellow", "blue" ];
        this.count = 0;
        this.playersData = {}; // the keys are the ids of the sockets
    }

    update(io) {
        io.emit("players", this.playersData);
    }

    add(id) {
        const lenToTeam = {};
        const lengths = [];
        for(const team in this.teamsData) {
            lenToTeam[this.teamsData[team].length] = team;
            lengths.push(this.teamsData[team].length);
        }
        lengths.sort();
        const team = lenToTeam[lengths[0]];
        this.count++;
        this.teamsData[team].push(id);
        return team;
    }

    remove(id, playersData) {
        const team = playersData[id].team;
        const index = this.teamsData[team].indexOf(id);
        this.teamsData[team].splice(index, 1);
        this.count--;
    }

    canStart() {
        return this.count >= 2;
    }
}

module.exports = PlayersManager;