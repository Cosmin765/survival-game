window.onload = main;

let canvas, ctx;

// const [ width, height ] = [ 900, 1600 ];
const [ width, height ] = [ 450, 800 ];
let joystick, ratio, player, terrain;
const buttons = {}; // drawn buttons
const keys = {}; // keyboard

const adapt = val => val * width / 450;
const unadapt = val => val * 450 / width;

const TILE_WIDTH = adapt(80);

const textures = {
    player: null,
    map: null
};

const spriteData = { // y offsets for animations
    player: {
        idle: 0,
        walking: 1,
        running: 2,
    }
};

let tileData, tileKeys; // json data


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

    tileData = await loadJSON("tileData.json");
    tileKeys = await loadJSON("tileKeys.json");
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

    joystick = new Joystick(new Vec2(100, unadapt(height) - 100).modify(adapt));
    player = new Player(CENTER);
    terrain = new Terrain();

    setupEvents();

    await preload();
    requestAnimationFrame(render);
}

function update() {
    player.update();

    // temp
    const movement = new Vec2();
    if(keys["w"]) movement.y -= 1;
    if(keys["a"]) movement.x -= 1;
    if(keys["s"]) movement.y += 1;
    if(keys["d"]) movement.x += 1;
    movement.normalize();

    if(movement.dist()) {
        player.leftFacing = movement.x < 0;
        player.setAnim("running");
        player.pos.add(movement.mult(adapt(4)));
    }
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