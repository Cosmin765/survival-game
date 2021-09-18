const PlayersManager = require("./PlayersManager");
const io = require("socket.io")(5000, { cors: { origin: "*" } });

const playersManager = new PlayersManager(io);

io.on("connection", socket => playersManager.add(socket));

setInterval(() => playersManager.update(), 1000 / 30); // update loop
setInterval(() => playersManager.fire(), 1000);
setInterval(() => playersManager.generate(), 1000);