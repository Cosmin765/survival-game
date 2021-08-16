window.onload = main;

const $ = name => document.querySelector(name);
let canvas, ctx;

// const [ width, height ] = [ 900, 1600 ];
const [ width, height ] = [ 450, 800 ];
let joystick, ratio;
const buttons = {};

const adapt = val => val * width / 450;
const unadapt = val => val * 450 / width;

const textures = {
    player: null
};

function loadImg(path) {
    return new Promise(resolve => {
        const img = new Image();
        img.src = "./assets/" + path;
        img.onload = () => resolve(img);
    });
}

async function preload() {
    textures.player = await loadImg("characters/bandit_.png");
}

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
    }
    ctx.imageSmoothingEnabled = false;

    window.CENTER = new Vec2(width / 2, height / 2);

    joystick = new Joystick(new Vec2(100, unadapt(height) - 100).modify(adapt));

    setupEvents();

    await preload();
    requestAnimationFrame(render);
}

const getCoords = (i, j, w) => [ i * w, j * w, w, w ];

function update() {

}

let i = 0;
function render() {
    // credit to analogstudios for the assets
    // characters are 24 x 24
    // tiles are 16 x 16
    update();

    ctx.fillRect(0, 0, width, height);

    const w = adapt(100);
    ctx.save();
    ctx.translate(-w / 2, -w / 2);
    ctx.drawImage(textures.player, ...getCoords((i++ / 5 | 0) % 4, 2, 24), ...CENTER, w, w);
    ctx.restore();

    joystick.render();

    requestAnimationFrame(render);
}

function setupEvents()
{
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