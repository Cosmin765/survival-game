window.onload = main;

let canvas, ctx;

// const [ width, height ] = [ 900, 1600 ];
const [ width, height ] = [ 450, 800 ];
let joystick, ratio, player, terrain;
const buttons = {}; // drawn buttons
const keys = {}; // keyboard

const adapt = val => val * width / 450;
const unadapt = val => val * 450 / width;

const collided = (x1, y1, w1, h1, x2, y2, w2, h2) => x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;

const TILE_WIDTH = adapt(80);

const textures = {
    player: null,
    map: null
};

const spriteOffset = { // y offsets for animations
    player: {
        idle: 0,
        walking: 1,
        running: 2,
    },
    map: null,
    decorations: null
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
        [ 0.2, 0.2, 0.6, 0.6 ]
    ]
};

colliders["top_left_corner"] = [...colliders.top_edge, ...colliders.left_edge];
colliders["top_right_corner"] = [...colliders.top_edge, ...colliders.right_edge];
colliders["bottom_right_corner"] = [...colliders.bottom_edge, ...colliders.right_edge];
colliders["bottom_left_corner"] = [...colliders.bottom_edge, ...colliders.left_edge];

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

    spriteData = await loadJSON("spriteData.json");

    for(const key in spriteData) {
        keyToId[key] = idToKey.length;
        idToKey.push(key);
    } // aliases for the sprites
}

async function main() {
    canvas = document.querySelector("#c");
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
    await preload();

    joystick = new Joystick(new Vec2(100, unadapt(height) - 100).modify(adapt));
    player = new Player(CENTER.copy().sub(new Vec2(1, 0).mult(TILE_WIDTH)));
    terrain = new Terrain();

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
    
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(...player.pos.copy().mult(-1).add(CENTER));

    terrain.render();
    player.render();

    ctx.restore();
    
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

    addEventListener("touchmove", e => {
        for(let i = 0; i < e.touches.length; ++i)
        {
            const touch = e.touches[i];
            const pos = new Vec2(touch.pageX, touch.pageY).mult(ratio);

            if(joystick.touchID === touch.identifier)
                joystick.update(pos);
        }
    });

    addEventListener("mousemove", e => {
        const pos = new Vec2(e.clientX, e.clientY).mult(ratio);

        if(joystick.touchID)
            joystick.update(pos);
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

    addEventListener("mouseup", e => {
        joystick.removeTouch();

        for(const type in buttons)
            buttons[type].release();
    });
}