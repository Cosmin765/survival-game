window.onload = main;
const MOBILE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
const LOCAL = true;

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

let socket;

const others = {};

const TILE_WIDTH = adapt(80);

const textures = {
    player: null,
    map: null,
    decorations: null,
    upperLayer: null
};

const spriteOffset = { // y offsets for animations
    player: {
        idle: 0,
        walking: 1,
        running: 2,
        dying: 5,
        attack: 6,
    }
};

let spriteData, idToKey = [], keyToId = {}; // json data

const colliders = {
    "left_edge": [
        [ 0, 0, 0.1, 1 ]
    ],
    "top_edge": [
        [ 0, 0, 1, 0.1 ]
    ],
    "right_edge": [
        [ 0.9, 0, 0.1, 1 ]
    ],
    "bottom_edge": [
        [ 0, 0.9, 1, 0.1 ]
    ],
    "bottom_tree_1": [
        [ 0.4, 0.2, 0.2, 0.4 ]
    ],
    "stone_1": [
        [ 0.3, 0.2, 0.4, 0.4 ]
    ],
    "stone_2": [
        [ 0.3, 0.1, 0.4, 0.5 ]
    ]
};

colliders["top_left_corner"] = [...colliders.top_edge, ...colliders.left_edge];
colliders["top_right_corner"] = [...colliders.top_edge, ...colliders.right_edge];
colliders["bottom_right_corner"] = [...colliders.bottom_edge, ...colliders.right_edge];
colliders["bottom_left_corner"] = [...colliders.bottom_edge, ...colliders.left_edge];
colliders["bottom_tree_2"] = colliders["bottom_tree_1"];
colliders["bottom_tree_3"] = colliders["bottom_tree_1"];

// TODO: make them run in parallel
function loadImg(path) {
    return new Promise(resolve => {
        const img = new Image();
        img.src = "./assets/" + path;
        img.onload = () => resolve(img);
    });
}

async function loadJSON(path) {
    const res = await fetch("./data/" + path);
    return await res.json();
}

async function preload() {
    textures.player = await loadImg("characters/bandit_.png");
    textures.map = await loadImg("forest.png");
    textures.decorations = await loadImg("plainDecoration_0.png");
    textures.upperLayer = await loadImg("upperLayer.png");

    spriteData = await loadJSON("spriteData.json");

    for(const key in spriteData) {
        keyToId[key] = idToKey.length;
        idToKey.push(key);
    } // aliases for the sprites
}

let started = false;
async function main() {
    canvas = $("#c");
    ctx = canvas.getContext("2d");

    $(".online").addEventListener("click", connect);
    $(".offline").addEventListener("click", init);
    $(".close").addEventListener("click", () => {
        $(".connect-error").style.display = "none";
    });
    $("input.button").addEventListener("click", () => {
        const input = $("input.text");
        const text = input.value.slice(0, 50);
        input.value = "";
        player.textBox.setTexts([text]);
        $(".chat").style.display = "none";
    });

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
    await preload();
}

function setLayout() {
    $(".main-menu").style.display = "none";
    canvas.style.display = "block";
    $(".loader").style.display = "none";
    $(".chat").style.width = `${(width - adapt(40)) / ratio}px`;
    $(".name").style.display = "none";
}

function connect() {
    $(".loader").style.display = "block";
    socket = io.connect(LOCAL ? "http://192.168.1.6:5000" : "http://109.98.216.123:5000");
    
    socket.on("connect", () => {
        if(started) return;
        init();
    });
    
    socket.on("players", data => {
        for(const id in data) {
            if(id === socket.id) continue;
            if(!(id in others))
                others[id] = new Other();
            
            others[id].pos = data[id].pos.map(adapt); // adapt for the new resolution
            others[id].leftFacing = data[id].leftFacing;
            others[id].spriteOff = data[id].spriteOff;
            others[id].name = data[id].name;
            if(others[id].name === "Cosmin")
                others[id].nameColor = "cyan";
            if(!data[id].texts.equals(others[id].textBox.last)) {
                others[id].textBox.setTexts(data[id].texts);
            }
        }
    });
    
    socket.on("connect_error", () => { // offline
        socket.close(); // stop trying to connect
        $(".connect-error").style.display = "flex";
        $(".loader").style.display = "none";
    });
    
    socket.on("remove", id => delete others[id]);
}

function init() {
    setLayout();

    { // creating a scope
        const options = {
            text: "Chat",
            size: new Vec2(50, 50).modify(adapt),
            pos: new Vec2(width / 2, adapt(25)),
            fontSize: adapt(20),
            handler: () => {
                const opposite = {
                    "": "flex", // sometimes, none in display is returned as an empty string. Why, JavaScript?... WHY?
                    "flex": "none",
                    "none": "flex"
                };
                const value = $(".chat").style.display;
                $(".chat").style.display = opposite[value];
            }
        };
        buttons.chat = new ActionButton(options);
    }

    {
        const options = {
            text: "Attack",
            size: new Vec2(100, 50).modify(adapt),
            pos: new Vec2(adapt(50 + 50), height - adapt(25 + 100)),
            handler: () => {
                player.setAnim("attack", false, 3);
            }
        };
        buttons.attack = new ActionButton(options);
    }

    joystick = new Joystick(new Vec2(width - adapt(100), height - adapt(100)));
    terrain = new Terrain();
    
    const pos = new Vec2(...terrain.getEmptySpot()).modify(val => val * TILE_WIDTH);
    pos.x += TILE_WIDTH / 2;
    player = new Player(pos);
    player.name = $(".name input").value.slice(0, 20) || "Anonymous";
    if(player.name === "Cosmin") player.nameColor = "cyan";
    started = true;
    setupEvents();
    requestAnimationFrame(render);
}

function update() {
    player.update();
}

function render() {
    // credit to analogstudios for the assets
    // characters are 24 x 24
    // tiles are 16 x 16
    update();
    
    ctx.fillStyle = "rgb(85, 125, 85)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(...player.pos.copy().mult(-1).add(CENTER));

    terrain.render();

    for(const id in others)
        others[id].render();
    player.render();

    terrain.renderUpper();

    for(const id in others)
        others[id].renderUpper();
    player.renderUpper();

    ctx.restore();
    
    for(const key in buttons)
        buttons[key].render();
    joystick.render();

    requestAnimationFrame(render);
}

function setupEvents()
{
    addEventListener("keydown", e => keys[e.key] = true);
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