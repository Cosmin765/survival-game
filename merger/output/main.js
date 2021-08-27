class Vec2
{
    constructor(x = 0, y = 0)
    {
        this.x = x; this.y = y;
    }
    
    add(v)
    {
        this.x += v.x; this.y += v.y; return this;
    }
    
    sub(v)
    {
        this.x -= v.x; this.y -= v.y; return this;
    }
    
    mult(n)
    {
        this.x *= n; this.y *= n; return this;
    }

    div(n)
    {
        return this.mult(1 / n);
    }
    
    copy()
    {
        return new Vec2(...this);
    }

    equals(v)
    {
        return this.x === v.x && this.y == v.y;
    }

    dist(v = new Vec2())
    {
        return Math.sqrt(Math.pow(v.x - this.x, 2) + Math.pow(v.y - this.y, 2));
    }
    
    dot(v)
    {
      return this.x * v.x + this.y * v.y;
    }
    
    normalize()
    {
      const len = this.dist();
      if(!len) return this;
      this.x /= len; this.y /= len;
      return this;
    }
    
    angle(v = new Vec2(1, 0))
    {
      const norm = this.copy().normalize();
      const dot = norm.dot(v);
      
      const fact = (norm.y > 0 ? 1 : -1);
      
      return fact * Math.acos(dot / norm.dist() * v.dist());
    }
    
    limit(r)
    {
        if(this.dist() > r)
            this.normalize().mult(r);
        return this;
    }

    set(x, y)
    {
        this.x = x; this.y = y; return this;
    }

    multMat(mat)
    {
        const x = this.x * mat[0][0] + this.y * mat[0][1];
        const y = this.x * mat[1][0] + this.y * mat[1][1];
        return this.set(x, y);
    }

    toFixed(n)
    {
        this.x = this.x.toFixed(n); this.y = this.y.toFixed(n); return this;
    }

    modify(func)
    {
        this.x = func(this.x); this.y = func(this.y); return this;
    }
    
    [Symbol.iterator] = function*() {
        yield this.x; yield this.y;
    }
};
class SpriteAnim
{
    constructor(dims, frameCount) {
        this.dims = dims.copy().modify(adapt);
        this.animIndex = 0;
        this.acc = 0;
        this.delay = 5;
        this.spriteOff = 0;
        this.frameCount = frameCount; // the number of frames in an animation
        this.interruptible = true;
    }

    updateAnim() {
        this.acc++; // increasing the accumulator
        this.acc %= this.delay * this.frameCount; // so that it is reseted
        this.animIndex = ((this.acc / this.delay) | 0) % this.frameCount; // the actual frame index
        // console.log(this.animIndex);
    }

    setAnim(name, interruptible = true, delay = 5) {
        if(this.interruptible || this.acc === this.delay * this.frameCount - 1) {
            if(!interruptible)
                this.acc = this.animIndex = 0;
            this.spriteOff = spriteOffset.player[name];
            this.interruptible = interruptible;
            this.delay = delay;
        }
    }

    static getCoords(i, j, w) {
        return [ i * w, j * w, w, w ];   
    }
}
class Interactive
{
    constructor(left, top, width, height)
    {
        this.bounds = { left, top, width, height };
    }
    
    clicked(pos)
    {
        const { left, top, width, height } = this.bounds;
        const { x, y } = pos;
        return (x >= left && x <= left + width && y >= top && y <= top + height);
    }
};
class ActionButton extends Interactive
{
    // constructor(text, pos, handler = () => {}, displayCondition = () => true)
    constructor(options)
    {
        const size = options.size || new Vec2(150, 75).modify(adapt);
        const pos = options.pos;

        super(pos.x - size.x / 2, pos.y - size.y / 2, ...size);
        this.pos = pos.copy();
        this.size = size;
        this.text = options.text;
        this.pressed = false;
        this.handler = (options.handler || (() => {})).bind(this);
        this.displayCondition = options.displayCondition || (() => true);
        this.fontSize = options.fontSize || adapt(22);
    }

    press()
    {
        if(!this.displayCondition())
            return;
        
        this.pressed = true;
    }

    release()
    {
        if(this.pressed) {
            this.pressed = false;

            // click handler
            this.handler();
        }
    }

    render()
    {
        if(!this.displayCondition())
            return;

        ctx.strokeStyle = this.pressed ? "red" : "#00ccff";
        ctx.fillStyle = this.pressed ? "rgba(99, 159, 255, 0.8)" : "rgba(28, 106, 232, 0.5)";

        const rectData = [...this.pos.copy().sub(new Vec2(this.size.x, this.size.y).div(2)), this.size.x, this.size.y];
        ctx.fillRect(...rectData);
        ctx.strokeRect(...rectData);
        
        ctx.font = `${this.fontSize}px Arial`;
        ctx.fillStyle = this.pressed ? "red" : "#000";
        const textWidth = ctx.measureText(this.text).width;
        ctx.fillText(this.text, ...this.pos.copy().add(new Vec2(-textWidth / 2, adapt(10))));
    }
}
class Terrain
{
    constructor(map = Terrain.generateMap(), decorations = Terrain.generateDecorations()) {
        this.map = map;
        this.decorations = decorations;
        this.layers = { map, decorations };
        this.upperLayer = this.calculateUpperLayer();
        
        if(socket) {
            socket.emit("getTerrain");
            socket.on("terrain", terrain => {
                this.map = terrain.map;
                this.decorations = terrain.decorations;
                this.layers = terrain;
                this.upperLayer = this.calculateUpperLayer();
    
                const pos = new Vec2(...this.getEmptySpot()).modify(val => val * TILE_WIDTH);
                pos.x += TILE_WIDTH / 2;
                player.pos = pos;
            });
        }
    }

    calculateUpperLayer() {
        const upperLayer = [];

        const upperSprites = [
            keyToId["top_tree_1"],
            keyToId["top_tree_2"],
            keyToId["top_tree_3"],
            keyToId["bottom_tree_1"],
            keyToId["bottom_tree_2"],
            keyToId["bottom_tree_3"]
        ];

        for(let i = 0; i < this.decorations.length; ++i) {
            for(let j = 0; j < this.decorations[i].length; ++j) {
                if(upperSprites.includes(this.decorations[i][j])) {
                    upperLayer.push({ i, j, id: keyToId["upper_" + idToKey[this.decorations[i][j]]] });
                }
            }
        }

        return upperLayer;
    }

    render() {
        const view = player.pos.copy().sub(CENTER);
        const len1 = this.map.length;
        const len2 = this.map[0].length;
        
        for(let i = 0; i < len1; ++i) {
            for(let j = 0; j < len2; ++j) {
                const x = j * TILE_WIDTH, y = i * TILE_WIDTH; // not using Vec2 because it's very expensive
                if(!collided(x, y, TILE_WIDTH, TILE_WIDTH, view.x, view.y, width, height)) // checking if the tile is within the view
                    continue;
                    
                    for(const layer in this.layers) {
                        const value = this.layers[layer][i][j];
                        if(value === null) continue;
                        const offset = spriteData[idToKey[value]];
                        ctx.drawImage(textures[layer], ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
                    }
                }
            }
        }
        
    renderUpper() { // to render things above the player ( i know it's dumb, but whatever )
        const view = player.pos.copy().sub(CENTER);
        for(const ob of this.upperLayer) {
            const x = ob.j * TILE_WIDTH, y = ob.i * TILE_WIDTH; // not using Vec2 because it's very expensive
            if(!collided(x, y, TILE_WIDTH, TILE_WIDTH, view.x, view.y, width, height)) // checking if the tile is within the view
                continue;

            if(ob.id === null) continue;
            const offset = spriteData[idToKey[ob.id]];
            ctx.drawImage(textures.upperLayer, ...SpriteAnim.getCoords(...offset, 16), x, y, TILE_WIDTH, TILE_WIDTH);
        }
    }

    inRange(i, j) {
        return j >= 0 && j < this.map[0].length && i >= 0 && i < this.map.length;
    }

    getEmptySpot() {
        for(let i = 1; i < this.map.length; ++i) {
            for(let j = 1; j < this.map[i].length; ++j) {
                let possible = true;
                for(const layer in this.layers) {
                    if(colliders[idToKey[this.layers[layer][i][j]]]) {
                        possible = false;
                        break;
                    }
                }

                if(possible)
                    return [ j, i ];
            }
        }
        return null;
    }

    static generateEmpty(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        return Array(i).fill(0).map(_ => Array(j).fill(keyToId["plain"]));
    }

    static generateMap(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        const map = Array(i).fill(0).map(_ => Array(j).fill(keyToId["plain"]));
        for(let k = 0; k < i; ++k) {
            map[k][0] = keyToId["left_edge"];
            map[k][j - 1] = keyToId["right_edge"];
        }
        for(let k = 0; k < j; ++k) {
            map[0][k] = keyToId["top_edge"];
            map[i - 1][k] = keyToId["bottom_edge"];
        }

        map[0][0] = keyToId["top_left_corner"];
        map[0][j - 1] = keyToId["top_right_corner"];
        map[i - 1][0] = keyToId["bottom_left_corner"];
        map[i - 1][j - 1] = keyToId["bottom_right_corner"];
        return map;
    }

    static generateDecorations(i = Terrain.DEFAULT_I, j = Terrain.DEFAULT_J) {
        const decorations = Array(i).fill(0).map(_ => Array(j).fill(null));

        const generators = [
            [ Terrain.genTree, 1000 ],
            [ Terrain.genStone, 500 ]
        ];

        for(const [ generator, count ] of generators) {
            for(let k = 0; k < count; ++k)
                generator(decorations);
        }
        
        return decorations;
    }
    
    static genTree(container) {
        const treeName = [ "_tree_1", "_tree_2", "_tree_3" ][random(0, 3) | 0];
        
        const [ i, j ] = Terrain.getRandCoord(container.length, container[0].length);

        if(container[i][j] !== null || container[i - 1][j] !== null)
            return;

        container[i][j] = keyToId["bottom" + treeName];
        container[i - 1][j] = keyToId["top" + treeName];
    }

    static genStone(container) {
        const name = [ "stone_1", "stone_2" ][random(0, 2) | 0];
        const [ i, j ] = Terrain.getRandCoord(container.length, container[0].length);
        
        if(container[i][j] !== null)
            return;

        container[i][j] = keyToId[name];
    }

    static getRandCoord(i, j) {
        return [ random(1, i - 1) | 0, random(1, j - 1) | 0 ];
    }

    static DEFAULT_I = 100;
    static DEFAULT_J = 100;
}
class TextBox
{
    constructor(texts = [], width = adapt(200), finishedTextHandler = () => {}, color = "white")
    {
        this.size = new Vec2(width, 0);
        this.setTexts(texts);
        
        this.fontSize = adapt(30);
        this.visible = true;
        this.frozen = false;
        this.finishedTextHandler = finishedTextHandler;
        this.color = color;
    }

    setTexts(texts)
    {
        this.texts = texts;
        this.last = texts;
        this.textsIndex = 0;
        this.text = this.texts[this.textsIndex];
        this.visible = true;
        this.reset();
    }

    reset()
    {
        this.acc = this.index = 0;
        this.frozen = false;
        this.currText = "";
        this.updateSize();
    }

    updateSize()
    {
        const lines = this.getLines(adapt(this.size.x));
        this.size.y = this.fontSize * lines.length + this.fontSize;
    }

    update()
    {
        if(!this.visible || this.frozen || !this.text)
            return;
        
        if(this.index < this.text.length)
        {
            this.acc++;
            if(this.acc % 4 === 0) {
                this.acc = 0;
                this.currText += this.text[this.index++];
                this.updateSize();
            }
        } else if(this.textsIndex < this.texts.length - 1) {
            this.frozen = true;
            wait(1000).then(() => {
                this.reset();
                this.textsIndex++;
                this.text = this.texts[this.textsIndex];
                this.frozen = false;
            });
        } else {
            this.frozen = true;
            wait(1000).then(() => {
                this.visible = false;
                this.text = null;
                this.finishedTextHandler();
            });
        }
    }

    getLines(maxWidth) {
        ctx.font = `${this.fontSize}px Arial`;
        const words = this.currText.split(" ");
        const lines = [];
        let currentLine = words[0];
    
        for (let i = 1; i < words.length; ++i) {
            const word = words[i];
            const width = adapt(ctx.measureText(currentLine + " " + word).width);
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    renderPanel()
    {
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = adapt(3);
        ctx.fillStyle = this.color;
        ctx.translate(...this.size.copy().div(-2));
        ctx.beginPath();
        const pad = adapt(10);
        ctx.moveTo(-pad, 0);
        ctx.lineTo(this.size.x + pad, 0);
        ctx.lineTo(this.size.x + pad, this.size.y);
        ctx.lineTo(this.size.x / 2 + adapt(10), this.size.y);
        ctx.lineTo(this.size.x / 2, this.size.y + adapt(10));
        ctx.lineTo(this.size.x / 2 - adapt(10), this.size.y);
        ctx.lineTo(-pad, this.size.y);
        ctx.lineTo(-pad, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    render()
    {
        if(!this.visible || !this.text)
            return;

        ctx.save();
        ctx.translate(0, -this.size.y / 2);
        this.renderPanel();
        ctx.translate(0, -this.size.y / 2 + this.fontSize);
        
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = `${this.fontSize}px VT323`;
        const lines = this.getLines(adapt(this.size.x));
        for(let i = 0; i < lines.length; ++i)
        {
            ctx.fillText(lines[i], 0, i * this.fontSize);
        }
        ctx.restore();
    }
}
class Player extends SpriteAnim
{
    constructor(pos) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos.copy();
        this.leftFacing = false;
        this.name = "";
        this.nameColor = "white";

        this.textBox = new TextBox(["Hello, world!"]);

        setInterval(() => {
            if(socket) {
                socket.emit("store", {
                    pos: [...this.pos].map(unadapt), // sending a normalized version
                    leftFacing: this.leftFacing,
                    spriteOff: this.spriteOff,
                    texts: this.textBox.visible ? this.textBox.texts : [], // no point in sending the texts if they are not visible
                    name: this.name
                });
            }
        }, 1000 / 30);
    }

    update() {
        this.updateAnim();
        this.textBox.update();

        const movement = new Vec2();
        if(keys["w"]) movement.y -= 1;
        if(keys["a"]) movement.x -= 1;
        if(keys["s"]) movement.y += 1;
        if(keys["d"]) movement.x += 1;

        const vel = (movement.dist() ? movement : joystick.dir()).normalize().mult(adapt(4));

        if(vel.dist()) {
            this.leftFacing = vel.x < 0;
            this.setAnim("running");

            const options = [ vel, new Vec2(vel.x, 0), new Vec2(0, vel.y) ]; // the ways we can move
            const origin = this.getColliderOrigin();

            for(const option of options) {
                const [ j, i ] = origin.map(val => val / TILE_WIDTH | 0); // the tile coords of the origin point

                const positions = []; // the surrounding tiles' positions
                for(let a = -1; a <= 1; ++a)
                    for(let b = -1; b <= 1; ++b)
                        positions.push([ a + j, b + i ]);

                let obstacle = false;
                
                for(const [ j, i ] of positions) {
                    if(!terrain.inRange(i, j))
                        continue;
                    
                    for(const layer in terrain.layers) {
                        const collider = colliders[idToKey[terrain.layers[layer][i][j]]];
        
                        if(collider) {
                            for(const component of collider) {
                                const data = [...component];
                                data[0] += j; data[1] += i;
            
                                if(collided(...this.getCollider(...option), ...data.map(val => val * TILE_WIDTH))) {
                                    obstacle = true;
                                    break;
                                }
                            }
                        }
    
                        if(obstacle) break;
                    }
                }
                if(!obstacle) {
                    this.pos.add(option);
                    break;
                }
            }
        } else {
            this.setAnim("idle");
        }
    }

    getCollider(offX = 0, offY = 0) {
        return [this.pos.x + offX + this.dims.x / 4 - this.dims.x / 2, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2, this.dims.x / 2, this.dims.y / 3];
    }

    getColliderOrigin(offX = 0, offY = 0) {
        return [ this.pos.x + offX, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2 + this.dims.y / 6 ];
    }

    render() {
        ctx.save();
        ctx.translate(...this.dims.copy().modify(val => -val / 2));
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        ctx.restore();
        
        // ctx.strokeStyle = "red";
        // ctx.strokeRect(...this.getCollider());
    }
    
    renderUpper() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.translate(0, adapt(-50));
        this.textBox.render(); // textbox
        ctx.translate(0, this.dims.y / 2 + adapt(80));
        ctx.textAlign = "center";
        ctx.fillStyle = this.nameColor;
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.name, 0, 0); // name
        ctx.restore();
    }
}
class Other extends SpriteAnim
{
    constructor(pos = [ -1000, -1000 ]) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos;
        this.leftFacing = false;
        this.name = "";
        this.nameColor = "white";

        this.textBox = new TextBox();
    }

    update() {
        this.updateAnim();
        this.textBox.update();
    }

    render() {
        this.update();
        ctx.save();
        ctx.translate(...this.dims.copy().modify(val => -val / 2));
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        ctx.restore();
    }

    renderUpper() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.translate(0, adapt(-50));
        this.textBox.render();
        ctx.translate(0, this.dims.y / 2 + adapt(80));
        ctx.textAlign = "center";
        ctx.fillStyle = this.nameColor;
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.name, 0, 0);
        ctx.restore();
    }
}
class Joystick extends Interactive
{
    constructor(pos)
    {
        const r = adapt(50);
    
        super(pos.x - r, pos.y - r, r * 2, r * 2);
        
        this.r = r;
        this.pos = pos.copy();
        this.ballPos = this.pos.copy();
        this.lastPos = this.pos.copy();
        this.touchID = null;
    }

    setTouch(id, pos)
    {
        if(this.touchID === null) {
            this.touchID = id;
            this.update(pos);
        }
    }

    removeTouch()
    {
        this.touchID = null;
        this.ballPos = this.pos.copy();
    }
    
    update(pos)
    {
        const dist = this.pos.dist(pos);

        if(dist < this.r) {
          this.ballPos = pos.copy();
        } else {
          const dir = pos.copy().sub(this.pos);
          this.ballPos = dir.limit(this.r).add(this.pos);
        }

        this.lastPos = pos.copy();
    }

    dir()
    {
        return this.ballPos.copy().sub(this.pos);
    }
    
    render()
    {
        ctx.save();
        ctx.strokeStyle = "#00ccff";
        ctx.lineWidth = adapt(4);
        ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(...this.pos, this.r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = "#1c6ae8";
        ctx.arc(...this.ballPos, this.r / 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
};
window.onload = main;
const MOBILE = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

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
    socket = io.connect("http://109.98.216.123:5000");
    
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
