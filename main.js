window.onload = main;
const MOBILE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
const LOCAL = true;
const FRAMERATE = 60; // not really framerate, more like "update rate", so that the gameplay doesn't feel slow for weaker devices

Array.prototype.equals = function(array) {
    if (!array)
        return false;

    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            return false;   
        }           
    }       
    return true;
} // completely stolen code, hehe

let canvas, ctx;
const $ = name => document.querySelector(name);

// const [ width, height ] = [ 900, 1600 ];
const [ width, height ] = [ 450, 800 ];
let joystick, ratio, player, terrain;
const buttons = {}; // drawn buttons
const keys = {}; // keyboard

const adapt = val => val * width / 450;
const unadapt = val => val * 450 / width;
const wait = amount => new Promise(resolve => setTimeout(resolve, amount));
const collided = (x1, y1, w1, h1, x2, y2, w2, h2) => x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2; // checks if 2 rectangles are colliding with the specified values
const random = (min, max) => Math.random() * (max - min) + min;
const map = (x, a, b, c, d) => (x - a) / (b - a) * (d - c) + c;
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
}); // also stolen

let socket;

const others = {};
const entities = {};
const panels = [];
const towers = {
    red: {},
    yellow: {},
    blue: {}
};
const bases = {}; // the keys are the team names

const obstacle = collider => {
    for(const type in towers)
        for(const id in towers[type])
            if(collided(...towers[type][id].getCollider(), ...collider))
                return true;

    for(const type in bases)
        if(collided(...bases[type].getCollider(), ...collider))
            return true;

    return false;
};

const TILE_WIDTH = adapt(80);

const textures = {
    player: null,
    map: null,
    decorations: null,
    upperLayer: null,
    towers: null,
    sword: null,
    bases: null
};

const spriteOffset = { // y offsets for animations
    player: {
        idle: 0,
        walking: 1,
        running: 2,
        dying: 5,
    }
};

let spriteData, idToKey = [], keyToId = {}, colliders = {}; // json data

const buttonDisplay = {};

const loadImg = path => new Promise(resolve => {
    const img = new Image();
    img.src = "./assets/" + path;
    img.onload = () => resolve(img);
});
const loadJSON = async path => await (await fetch("./data/" + path)).json();

function preload() {
    return new Promise(resolve => {
        const imageData = [
            [ "player", "bandit_.png" ],
            [ "map", "forest.png" ],
            [ "decorations", "plainDecoration_0.png" ],
            [ "upperLayer", "upperLayer.png" ],
            [ "towers", "towers.png" ],
            [ "sword", "sword.png" ],
            [ "bases", "bases.png" ]
        ];
        const jsonData = [
            [ "spriteData", "spriteData.json" ],
            [ "colliders", "colliders.json" ]
        ];
        const count = {
            image: 0,
            json: 0
        };
        const tempContainer = {};
        const handler = () => {
            const done = count.image === imageData.length && count.json === jsonData.length;
            if(!done) return;
            spriteData = tempContainer.spriteData;
            colliders = tempContainer.colliders;
            for(const key in spriteData) {
                keyToId[key] = idToKey.length;
                idToKey.push(key);
            } // aliases for the sprites
            resolve();
        };
        imageData.forEach(([ key, filename ]) => loadImg(filename).then(img => { textures[key] = img; count.image++; handler(); }));
        jsonData.forEach(([ key, filename ]) => loadJSON(filename).then(json => { tempContainer[key] = json; count.json++; handler(); }));
    });
}

let started = false;
async function main() {
    canvas = $("#c");
    ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    if(innerHeight / innerWidth > 16 / 9) {
        canvas.style.width = "100vw";
        ratio = width / innerWidth;
    } else {
        canvas.style.height = "100vh";
        ratio = height / innerHeight;
    } // mapping to the screen
    ctx.imageSmoothingEnabled = false; // self-explainatory

    window.CENTER = new Vec2(width / 2, height / 2); // constant that represents the center of the screen
    
    $(".online").addEventListener("click", connect);
    $(".offline").addEventListener("click", init);
    $(".close").addEventListener("click", () => $(".connect-error").style.display = "none");
    $(".chat .button").addEventListener("click", () => { // the send button
        const input = $(".chat .text");
        const text = input.value.slice(0, 50);
        input.value = "";
        player.textBox.setTexts([text]);
        $(".chat").style.display = "none";
    });

    await preload();
    $("body").style.display = "initial";

    {
        const options = {
            text: "Chat",
            size: new Vec2(50, 50).modify(adapt),
            pos: new Vec2(width / 2, adapt(25)),
            fontSize: adapt(20),
            handler() {
                const opposite = {
                    "": "flex", // sometimes, none in display is returned as an empty string. Why, JavaScript?... WHY?
                    "flex": "none",
                    "none": "flex"
                };
                const value = $(".chat").style.display;
                $(".chat").style.display = opposite[value];
                wait(150).then(() => $(".chat .text").focus());
            }
        };
        buttons[options.text] = new ActionButton(options);
    } // chat button

    {
        const options = {
            text: "Attack",
            size: new Vec2(100, 50).modify(adapt),
            pos: new Vec2(adapt(50 + 50), height - adapt(25 + 100)),
            handler() {
                player.sword.attack();  
            }
        };
        buttons[options.text] = new ActionButton(options);
    } // attack button

    {
        const options = {
            text: "Spawn",
            size: new Vec2(100, 50).modify(adapt),
            pos: new Vec2(width - adapt(50 + 50), height - adapt(25 + 200)),
            handler() {
                for(const name in buttons) {
                    if(name.includes("Tower"))
                        buttonDisplay[name] = !buttonDisplay[name];
                }

                this.text = this.text === "Spawn" ? "Return" : "Spawn";
                this.theme = this.theme === ActionButton.themes.blue ? ActionButton.themes.red : ActionButton.themes.blue;
            }
        };
        buttons[options.text] = new ActionButton(options);
    } // spawn button

    {
        const options = {
            text: "Tower $200",
            size: new Vec2(160, 50).modify(adapt),
            pos: new Vec2(width - adapt(50 + 50), height - adapt(25 + 300)),
            handler() {
                const cost = 200;
                if(player.money < cost) return;

                const pos = player.pos.copy().add(new Vec2(TILE_WIDTH, 0).mult(player.leftFacing ? -1 : 1));
                const type = player.team;
                const tower = new Tower(pos, type);

                const towerCollider = tower.getCollider();
                if(obstacle(towerCollider)) return;
                
                for(const id in entities)
                    if(collided(...entities[id].getCollider(), ...towerCollider))
                        return;

                player.money -= cost;

                const id = uuidv4();
                towers[type][id] = tower;
                socket.emit("towerSpawn", { pos: [...tower.pos.modify(unadapt)], type: type, id: id, ownerID: socket.id });
            }
        };
        buttons[options.text] = new ActionButton(options);
        buttonDisplay[options.text] = false;
    } // tower button

    joystick = new Joystick(new Vec2(width - adapt(100), height - adapt(100)));
    terrain = new Terrain();
    
    const pos = new Vec2(...terrain.getEmptySpot()).modify(val => val * TILE_WIDTH);
    pos.x += TILE_WIDTH / 2;
    player = new Player(pos);

    {
        const dims = new Vec2(160, 50).modify(adapt);
        const pos = new Vec2(width - dims.x / 2, dims.y / 2);
        const panel = new Panel(pos, dims, () => `Money: $${player.money}`);
        panels.push(panel);
    } // money panel
}

function connect() {
    $(".loader").style.display = "block";
    socket = io.connect(LOCAL ? "localhost:5000" : "http://109.98.216.123:5000");
    
    socket.on("connect", () => {
        if(started) return;
        entities[socket.id] = player;
        init();
    });
    
    socket.on("players", data => {
        for(const id in data) {
            if(id === socket.id) continue;
            if(!(id in others)) {
                others[id] = new Other();
                entities[id] = others[id];
            }
            
            others[id].pos = new Vec2(...data[id].pos.map(adapt)); // adapt for the new resolution
            others[id].leftFacing = data[id].leftFacing;
            others[id].spriteOff = data[id].spriteOff;
            others[id].team = data[id].team;
            others[id].name = data[id].name;
            others[id].healthBar.set(data[id].health);
            if(data[id].attacking) others[id].sword.attack();
        }
    });
    
    const spawnTower = (pos, type, id) => towers[type][id] = new Tower(new Vec2(...pos).modify(adapt), type, id);
    
    socket.on("initial", data => {
        socket.emit("texts", { texts: ["Hello, world!"], id: socket.id });
        socket.emit("store", { name: player.name });
        player.team = data.team;
        terrain.parseTerrain(data.terrain);
        
        for(const type in data.towersData)
            for(const id in data.towersData[type]) {
                spawnTower(data.towersData[type][id].pos, type, id);
                towers[type][id].healthBar.curr = data.towersData[type][id].health;
            }
        
        for(const type in data.basesData) {
            const pos = new Vec2(...data.basesData[type].pos).modify(adapt);
            bases[type] = new Base(pos, type);
            const health = data.basesData[type].health;
            bases[type].healthBar.curr = health > 0 ? health : 0;
        }
        player.pos = bases[player.team].pos.copy().add(new Vec2(TILE_WIDTH * 1.2, 0));
    });

    socket.on("towerSpawn", data => spawnTower(data.pos, data.type, data.id));
    socket.on("removeDecoration", data => terrain.removeDecoration(data.i, data.j));
    socket.on("spawnDecoration", data => {
        for(const item of data) {
            terrain.decorations[item.i][item.j] = item.id;
            terrain.genUpper(terrain.upperLayer, item.i, item.j);
        }
    });
    socket.on("fire", targetData => {
        for(const data of targetData) {
            const tower = towers[data.towerType][data.towerID];
            tower.fireBalls.push(new Fireball(tower.pos, data.targetPos, tower.color));
        }
    });
    socket.on("hurtTower", data => towers[data.type][data.id].healthBar.decrease(data.damage));
    socket.on("hurtBase", data => bases[data.type].healthBar.decrease(data.damage));
    socket.on("removeTower", data => delete towers[data.type][data.id]);
    socket.on("texts", data => others[data.id].textBox.setTexts(data.texts));

    socket.on("connect_error", () => { // offline
        socket.close(); // stop trying to connect
        $(".connect-error").style.display = "flex";
        $(".loader").style.display = "none";
    });
    
    socket.on("remove", ({ id, towersRemoveData }) => {
        delete others[id];
        delete entities[id];

        for(const id of towersRemoveData.ids) {
            delete towers[towersRemoveData.type][id];
        }
    });
}

function init() {
    $(".main-menu").style.display = "none";
    canvas.style.display = "block";
    $(".loader").style.display = "none";
    $(".chat").style.width = `${(width - adapt(40)) / ratio}px`;
    $(".name").style.display = "none";
    
    player.name = $(".name input").value.slice(0, 20) || "Anonymous";
    if(player.name === "Cosmin") player.nameColor = "cyan";
    started = true;
    setupEvents();
    requestAnimationFrame(render);
}

function update() {
    player.update();
    for(const id in others)
        others[id].update();

    for(const type in towers) {
        for(const id in towers[type])
            towers[type][id].update();
    }

    for(const type in bases)
        bases[type].update();
}

let lastTime = 0;
let timeSinceLast = 0;
function render(time) {
    // credit to analogstudios for the assets
    // characters are 24 x 24
    // tiles are 16 x 16

    timeSinceLast += time - lastTime;
    const desiredTime = 1000 / FRAMERATE;

    while(timeSinceLast > desiredTime) {
        timeSinceLast -= desiredTime;
        update();
    }
    lastTime = time;

    
    ctx.fillStyle = "rgb(85, 125, 85)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(...player.pos.copy().mult(-1).add(CENTER));

    terrain.render();

    for(const id in others)
        others[id].render();
    player.render();

    terrain.renderUpper();

    for(const type in bases)
        bases[type].render();

    for(const type in towers) {
        for(const id in towers[type])
            towers[type][id].render();
    }

    for(const id in others)
        others[id].renderUpper();
    player.renderUpper();

    ctx.restore();
    
    for(const key in buttons)
        buttons[key].render();
    joystick.render();

    for(const panel of panels)
        panel.render();

    requestAnimationFrame(render);
}

function setupEvents()
{
    addEventListener("keydown", e => {
        if(e.key === "a") buttons["Attack"].handler();
        if(e.key === "s") buttons["Spawn"].handler();
        if(e.key === "t") buttons["Tower $200"].handler();
        keys[e.key] = true;
        if(e.key === "Enter" && $(".chat").style.display === "flex") {
            const input = $(".chat .text");
            const text = input.value.slice(0, 50);
            input.value = "";
            player.textBox.setTexts([text]);
            $(".chat").style.display = "none";
        }
    });
    addEventListener("keyup", e => keys[e.key] = false);

    addEventListener("touchstart", e => {
        for(let i = 0; i < e.touches.length; ++i)
        {
            const touch = e.touches[i];
            const pos = new Vec2(touch.pageX, touch.pageY).mult(ratio);

            if(joystick.clicked(pos)) {
                joystick.setTouch(touch.identifier, pos);
                continue;
            }

            for(const type in buttons)
            {
                const btn = buttons[type];
                if(btn.clicked(pos))
                    btn.press();
            }
        }
    });
    
    addEventListener("touchmove", e => {
        for(let i = 0; i < e.touches.length; ++i)
        {
            const touch = e.touches[i];
            const pos = new Vec2(touch.pageX, touch.pageY).mult(ratio);
            
            if(joystick.touchID === touch.identifier)
            joystick.update(pos);
        }
    });
    
    addEventListener("touchend", e => {
        let present = false;
        
        for(let i = 0; i < e.touches.length; ++i)
        {
            const touch = e.touches[i];
            const pos = new Vec2(touch.pageX, touch.pageY).mult(ratio);
            
            if(pos.equals(joystick.lastPos)) {
                present = true;
                break;
            }
        }
        
        if(!present) {
            joystick.removeTouch();
        }
        
        for(const type in buttons)
        {
            const btn = buttons[type];
            let present = false;
            
            for(let i = 0; i < e.touches.length; ++i)
            {
                const touch = e.touches[i];
                const pos = new Vec2(touch.pageX, touch.pageY).mult(ratio);
                
                if(btn.clicked(pos)) {
                    present = true;
                    break;
                }
            }
            
            if(!present)
            btn.release();
        }
    });
    
    if(!MOBILE) {
        addEventListener("mousedown", e => {
            const pos = new Vec2(e.clientX, e.clientY).mult(ratio);
    
            if(joystick.clicked(pos)) {
                joystick.setTouch(true, pos);
            }
    
            for(const type in buttons)
            {
                const btn = buttons[type];
                if(btn.clicked(pos))
                    btn.press();
            }
        });
    
        addEventListener("mousemove", e => {
            const pos = new Vec2(e.clientX, e.clientY).mult(ratio);
    
            if(joystick.touchID)
                joystick.update(pos);
        });
    
        addEventListener("mouseup", e => {
            joystick.removeTouch();
    
            for(const type in buttons)
                buttons[type].release();
        });
    }
}