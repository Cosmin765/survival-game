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
    
    [Symbol.iterator] = function*() { // very inefficient and I regret doing it
        yield this.x; yield this.y;
    }
};
class HealthBar
{
    constructor(max, curr = 1)
    {
        this.max = max;
        this.curr = max * curr;
        this.len = adapt(100);
        this.dead = false;
    }

    set(amount)
    {
        this.curr = amount;
        if(this.curr > 0) this.dead = false;
    }

    decrease(amount)
    {
        this.curr -= amount;
        if(this.curr <= 0) {
            this.curr = 0;
            this.dead = true;
        }
    }

    increase(amount)
    {
        this.curr += amount;
        if(this.curr > this.max) this.curr = this.max;
    }

    render()
    {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = adapt(2);
        ctx.translate(-this.len / 2, 0);
        ctx.fillRect(0, 0, this.len, adapt(7));
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(0, 0, adapt(this.curr / this.max * this.len), adapt(7));
        ctx.strokeRect(0, 0, this.len, adapt(7));
        ctx.restore();
    }
}
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

    static getCoords(j, i, w, h) {
        if(!h) h = w;
        return [ j * w, i * h, w, h ];   
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
    constructor(options) // { size?, pos, text, handler?, displayCondition?, fontSize?, theme? }
    {
        const size = options.size || new Vec2(150, 75).modify(adapt);
        const pos = options.pos;

        super(pos.x - size.x / 2, pos.y - size.y / 2, ...size);
        this.pos = pos.copy();
        this.size = size;
        this.text = options.text;
        this.name = options.text;
        this.pressed = false;
        this.handler = (options.handler || (() => {})).bind(this);
        this.displayCondition = options.displayCondition || (() => buttonDisplay[this.name]);
        if(!options.displayCondition) buttonDisplay[this.name] = true;
        this.fontSize = options.fontSize || adapt(22);
        this.theme = options.theme || ActionButton.themes.blue;
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

        ctx.strokeStyle = this.theme.stroke[this.pressed];
        ctx.fillStyle = this.theme.background[this.pressed];

        const rectData = [this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y];
        ctx.fillRect(...rectData);
        ctx.strokeRect(...rectData);
        
        ctx.font = `${this.fontSize}px Arial`;
        ctx.fillStyle = this.theme.text[this.pressed];
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.pos.x, this.pos.y + adapt(10));
    }

    static themes = {
        blue: {
            background: {
                true: "rgba(99, 159, 255, 0.8)", // true means pressed
                false: "rgba(28, 106, 232, 0.5)"
            },
            stroke: {
                true: "red",
                false: "#00ccff"
            },
            text: {
                true: "red",
                false: "black"
            }
        },
        red: {
            background: {
                true: "rgba(255, 56, 56, 0.4)",
                false: "rgba(255, 0, 0, 0.4)"
            },
            stroke: {
                true: "white",
                false: "red"
            },
            text: {
                true: "white",
                false: "black"
            }
        }
    }
}
class Fireball
{
    constructor(pos, targetEntity, color) {
        this.pos = pos.copy();
        this.speed = adapt(4);
        this.targetEntity = targetEntity;
        this.vel = new Vec2(...targetEntity.getColliderOrigin()).sub(this.pos).normalize().mult(this.speed);
        this.color = color;
        this.r = adapt(10);
        this.lifeSpan = adapt(4) * 100 / this.speed; // the lifespan is independent of speed
    }

    update() {
        this.pos.add(this.vel);
        this.lifeSpan--;
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    getCollider() {
        return [ ...this.pos, 2 * this.r, 2 * this.r ];
    }
}
class Tower
{
    constructor(pos, color, id) {
        this.pos = pos.copy();
        this.color = color;
        this.type = color + "_tower";
        this.id = id;
        this.dims = new Vec2(1.3, 2.6).mult(TILE_WIDTH);
        this.fireBalls = [];
        this.healthBar = new HealthBar(40, 1);
    }

    update() {
        for(let i = 0; i < this.fireBalls.length; ++i) {
            this.fireBalls[i].update();
            if(this.fireBalls[i].lifeSpan <= 0) {
                this.fireBalls.splice(i, 1);
                i--; continue;
            }
            const fireballCollider = this.fireBalls[i].getCollider();
            for(const id in entities) {
                const entity = entities[id];
                if(entity.team === this.color) continue;
                if(collided(...entity.getFullCollider(), ...fireballCollider)) {
                    entity.healthBar.decrease(4);
                    this.fireBalls.splice(i, 1);
                    i--; break;
                }
            }
        }

        if(player.team !== this.color && player.hurt(this.getCollider())) {
            const damage = player.sword.getDamage();
            socket.emit("hurtTower", { type: this.color, id: this.id, damage: damage });
            this.healthBar.decrease(damage);
        }
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.drawImage(textures.towers, ...SpriteAnim.getCoords(...spriteData[this.type], 32, 64), -this.dims.x / 2, -this.dims.y / 2, ...this.dims);
        
        ctx.translate(0, this.dims.y / 2 + adapt(10));
        this.healthBar.render();

        ctx.restore();

        for(const fireBall of this.fireBalls)
            fireBall.render();
    }

    getCollider() {
        const h = adapt(60);
        return [ this.pos.x - this.dims.x / 3, this.pos.y + this.dims.y / 2 - h, this.dims.x * 2 / 3, h ];
    }
}
class Terrain
{
    constructor(map = Terrain.generateMap(), decorations = Terrain.generateDecorations()) {
        this.map = map;
        this.decorations = decorations;
        this.layers = { map, decorations };
        this.upperLayer = this.calculateUpperLayer();
        this.healthData = {};
    }

    getFromServer() {
        socket.emit("getTerrain");
        socket.on("terrain", terrain => {
            this.map = terrain.map;
            this.decorations = terrain.decorations;
            this.layers = terrain;
            this.upperLayer = this.calculateUpperLayer();

            { // bases
                const [ i, j ] = [ this.map.length, this.map[0].length ];
                const basePositions = [
                    [ j / 2, 1 ],
                    [ 1, i - 2 ],
                    [ j - 2, i - 2 ]
                ];
                const types = [ "red", "yellow", "blue" ];
    
                for(let i = 0; i < types.length; ++i) {
                    const type = types[i];
                    bases[type] = new Base(new Vec2(...basePositions[i]).mult(TILE_WIDTH), type);
                }
            }
            
            player.pos = bases[player.team].pos.copy().add(new Vec2(TILE_WIDTH * 1.2, 0));
        });

        socket.on("fire", targetData => {
            for(const data of targetData) {
                if(!(data.towerID in towers[data.towerType] && data.targetID in entities)) continue;
                const tower = towers[data.towerType][data.towerID];
                tower.fireBalls.push(new Fireball(tower.pos, entities[data.targetID], tower.color));
            }
        });
    }

    relativeCollider(layer, i, j) {
        if(i >= this.map.length || j >= this.map[0].length) return null;
        const collider = colliders[idToKey[this.layers[layer][i][j]]];
        if(!collider) return null;

        return collider.map(component => {
            const data = [...component];
            data[0] += j; data[1] += i;
            return data.map(val => val * TILE_WIDTH);
        });
    }

    removeDecoration(i, j) {
        const name = idToKey[this.decorations[i][j]];
        if(name.includes("tree")) {
            this.decorations[i - 1][j] = null;
            for(let k = 0; k < this.upperLayer.length; ++k) {
                const item = this.upperLayer[k];
                if((item.i === i - 1 || item.i === i) && item.j === j) {
                    this.upperLayer.splice(k--, 1);
                }
            }
        }
        this.decorations[i][j] = null;
        delete this.healthData[i + "," + j];
    }

    calculateUpperLayer() {
        const upperLayer = [];

        for(let i = 0; i < this.decorations.length; ++i) {
            for(let j = 0; j < this.decorations[i].length; ++j) {
                this.genUpper(upperLayer, i, j);
            }
        }

        return upperLayer;
    }

    genUpper(container, i, j) {
        const upperSprites = [
            "top_tree_1",
            "top_tree_2",
            "top_tree_3",
            "bottom_tree_1",
            "bottom_tree_2",
            "bottom_tree_3"
        ].map(key => keyToId[key]);

        if(upperSprites.includes(this.decorations[i][j])) {
            container.push({ i, j, id: keyToId["upper_" + idToKey[this.decorations[i][j]]] });
        }
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

    getEmptySpot(offX = 1, offY = 1) {
        for(let i = offY; i < this.map.length; ++i) {
            for(let j = offX; j < this.map[i].length; ++j) {
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
        this.team = "";
        this.healthBar = new HealthBar(50, 1);
        this.money = 1000;
        this.sword = new Sword();

        this.textBox = new TextBox(["Hello, world!"]);

        setInterval(() => {
            if(!socket) return;
            socket.emit("store", {
                pos: [this.pos.x, this.pos.y].map(unadapt), // sending a normalized version
                leftFacing: this.leftFacing,
                spriteOff: this.spriteOff,
                texts: this.textBox.visible ? this.textBox.texts : [], // no point in sending the texts if they are not visible
                name: this.name,
                health: this.healthBar.curr,
                attacking: this.sword.attacking
            });
        }, 1000 / 30);
    }

    update() {
        this.updateAnim();
        this.textBox.update();
        this.sword.update();

        for(const id in others) {
            if(others[id].hurt(this.getFullCollider())) {
                const damage = others[id].sword.getDamage();
                this.healthBar.decrease(damage);
            }
        }

        const movement = new Vec2();
        if(keys["ArrowUp"]) movement.y -= 1;
        if(keys["ArrowLeft"]) movement.x -= 1;
        if(keys["ArrowDown"]) movement.y += 1;
        if(keys["ArrowRight"]) movement.x += 1;

        const vel = (movement.dist() ? movement : joystick.dir()).normalize().mult(adapt(4));
        const positions = this.getSurroundingPositions();

        if(vel.dist()) {
            this.leftFacing = vel.x < 0;
            this.setAnim("running");

            const options = [ vel, new Vec2(vel.x, 0), new Vec2(0, vel.y) ]; // the ways we can move

            for(const option of options) {
                const futureCollider = this.getCollider(...option);
                let ableToMove = true;
                
                for(const [ j, i ] of positions) {
                    if(!terrain.inRange(i, j)) continue;
                    
                    for(const layer in terrain.layers) {
                        const collider = terrain.relativeCollider(layer, i, j);
                        if(!collider) continue;
        
                        for(const component of collider) {
                            if(collided(...futureCollider, ...component)) {
                                ableToMove = false;
                                break;
                            }
                        }
    
                        if(!ableToMove) break;
                    }
                }
                if(obstacle(futureCollider)) ableToMove = false;

                if(ableToMove) {
                    this.pos.add(option);
                    break;
                }
            }
        } else {
            this.setAnim("idle");
        }

        if(this.sword.attacking) {
            const swordCollider = this.getSwordCollider();
            for(const [ j, i ] of positions) {
                const collider = terrain.relativeCollider("decorations", i, j);
                if(!collider) continue;
    
                for(const component of collider) {
                    if(!collided(...swordCollider, ...component))
                        continue;

                    const key = i + "," + j;
                    if(!(key in terrain.healthData))
                        terrain.healthData[key] = 3; // how many hits are needed to destroy the item
                    
                    if(player.sword.getDamage())
                        terrain.healthData[key] -= 1;

                    if(!terrain.healthData[key]) {
                        terrain.removeDecoration(i, j);
                        player.money += 50;
                        socket.emit("removeDecoration", { i, j });
                    }
                    break;
                }
            }
        }
    }

    getSurroundingPositions() {
        const origin = this.getColliderOrigin();

        const [ j, i ] = origin.map(val => val / TILE_WIDTH | 0); // the tile coords of the origin point

        const positions = [];
        for(let a = -1; a <= 1; ++a)
            for(let b = -1; b <= 1; ++b)
                positions.push([ a + j, b + i ]);
        return positions;
    }

    getCollider(offX = 0, offY = 0) {
        return [this.pos.x + offX + this.dims.x / 4 - this.dims.x / 2, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2, this.dims.x / 2, this.dims.y / 3];
    }
    
    getFullCollider() {
        return [this.pos.x + adapt(10) + this.dims.x / 4 - this.dims.x / 2, this.pos.y, this.dims.x / 2 - adapt(20), this.dims.y / 2];
    }

    getColliderOrigin(offX = 0, offY = 0) {
        return [ this.pos.x + offX, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2 + this.dims.y / 6 ];
    }

    getSwordCollider() {
        const x = (this.leftFacing ? this.pos.x - this.sword.dims.x * 1.5 : this.pos.x + this.sword.dims.x / 2);
        return [ x, this.pos.y, this.sword.dims.x, this.sword.dims.y / 2 ];
    }

    hurt(collider) {
        return (this.sword.attacking && collided(...this.getSwordCollider(), ...collider) && !this.sword.hit);
    }

    render() {
        ctx.save();
        ctx.translate(-this.dims.x / 2, -this.dims.y / 2);
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        ctx.restore();
    }
    
    renderUpper() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.translate(0, adapt(-50));
        this.textBox.render(); // textbox
        ctx.translate(0, this.dims.y / 2 + adapt(70));
        ctx.textAlign = "center";
        ctx.fillStyle = this.team; // the color of the name 
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.name, 0, 0); // name
        ctx.translate(0, adapt(10));
        this.healthBar.render();
        ctx.restore();

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        if(this.leftFacing) ctx.scale(-1, 1); // life hack
        ctx.translate(this.sword.dims.x - adapt(20), 0);
        this.sword.render();
        ctx.restore();
    }
}
class Other extends SpriteAnim
{
    constructor(pos = [ -1000, -1000 ]) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = new Vec2(...pos);
        this.leftFacing = false;
        this.name = "";
        this.team = "";
        this.healthBar = new HealthBar(50, 1);
        this.sword = new Sword();

        this.textBox = new TextBox();
    }

    update() {
        this.updateAnim();
        this.textBox.update();
        this.sword.update();
    }

    getFullCollider() {
        return [this.pos.x + adapt(10) + this.dims.x / 4 - this.dims.x / 2, this.pos.y, this.dims.x / 2 - adapt(20), this.dims.y / 2];
    }

    getColliderOrigin(offX = 0, offY = 0) {
        return [ this.pos.x + offX, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2 + this.dims.y / 6 ];
    }

    getFullCollider() {
        return [this.pos.x + adapt(10) + this.dims.x / 4 - this.dims.x / 2, this.pos.y, this.dims.x / 2 - adapt(20), this.dims.y / 2];
    }

    getSwordCollider() {
        const x = (this.leftFacing ? this.pos.x - this.sword.dims.x * 1.5 : this.pos.x + this.sword.dims.x / 2);
        return [ x, this.pos.y, this.sword.dims.x, this.sword.dims.y / 2 ];
    }

    hurt(collider) {
        if(!(this.sword.attacking && collided(...this.getSwordCollider(), ...collider))) return 0;
        return this.sword.damage;
    }

    render() {
        ctx.save();
        ctx.translate(-this.dims.x / 2, -this.dims.y / 2);
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        ctx.restore();
    }

    renderUpper() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.translate(0, adapt(-50));
        this.textBox.render();
        ctx.translate(0, this.dims.y / 2 + adapt(70));
        ctx.textAlign = "center";
        ctx.fillStyle = this.team;
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.name, 0, 0);
        ctx.translate(0, adapt(10));
        this.healthBar.render();
        ctx.restore();

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        if(this.leftFacing) ctx.scale(-1, 1); // life hack
        ctx.translate(this.sword.dims.x - adapt(20), 0);
        this.sword.render();
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
class Panel
{
    constructor(pos, dims, text = () => {}) { // text is a function for convenience
        this.pos = pos.copy();
        this.dims = dims.copy();
        this.text = text;
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(-this.dims.x / 2, -this.dims.y / 2, ...this.dims);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.text(), 0, 0);
        ctx.restore();
    }
}
class Sword
{
    constructor() {
        this.dims = new Vec2(TILE_WIDTH, TILE_WIDTH).mult(4 / 5);
        this.angle = 0;
        this.rotPoint = new Vec2(this.dims.x * (0.125 - 0.03125), this.dims.y - this.dims.y * (0.125 - 0.03125)); // very exact calculation, but I like math
        this.attacking = false;
        this.increaseDamage = true;
        this.damage = 100; // this is relative, meaning that is could (and should) be mapped to another value
        this.hit = false;
        this.ableToAttack = true;
    }

    update() {
        if(this.damage < 100) this.damage++;
        if(!this.attacking) return;
        this.angle += 0.2;

        if(this.angle > Math.PI) {
            this.angle = 0;
            this.attacking = this.increaseDamage = this.hit = this.ableToAttack = false;
            this.damage = 0;
            wait(250).then(() => this.increaseDamage = true);
            wait(100).then(() => this.ableToAttack = true);
        }
    }

    attack() {
        if(this.ableToAttack)
            this.attacking = true;
    }

    getDamage() {
        if(this.hit) return 0;
        this.hit = true;
        return this.damage / 5;
    }

    render() {
        if(!this.attacking) return;
        ctx.save();
        ctx.translate(-this.dims.x / 2, -this.dims.y / 2);
        
        ctx.translate(this.rotPoint.x, this.rotPoint.y);
        ctx.rotate(this.angle - Math.PI / 2);
        ctx.translate(-this.rotPoint.x, -this.rotPoint.y);
        
        ctx.drawImage(textures.sword, 0, 0, this.dims.x, this.dims.y);
        ctx.restore();
    }
}
class Base
{
    constructor(pos, color) {
        this.pos = pos.copy();
        this.dims = new Vec2(2.6, 2.6).mult(TILE_WIDTH);
        this.color = color;
        this.type = color + "_base";
        this.healthBar = new HealthBar(100, 1);
    }

    update() {
        
    }

    getCollider() {
        const padding = adapt(40);
        return [ this.pos.x - this.dims.x / 2 + padding, this.pos.y - this.dims.y / 2 + padding, this.dims.x - 2 * padding, this.dims.y - 2 * padding ];
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.drawImage(textures.bases, ...SpriteAnim.getCoords(...spriteData[this.type], 64), -this.dims.x / 2, -this.dims.y / 2, this.dims.x, this.dims.y);
        ctx.translate(0, adapt(20));
        this.healthBar.render();
        ctx.restore();
    }
}
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
        attack: 6,
    }
};

let spriteData, idToKey = [], keyToId = {}; // json data

const buttonDisplay = {};

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
    textures.towers = await loadImg("towers.png");
    textures.sword = await loadImg("sword.png");
    textures.bases = await loadImg("bases.png");

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

                if(obstacle(tower.getCollider())) return;

                player.money -= cost;

                const id = uuidv4();
                towers[type][id] = tower;
                socket.emit("tower", {
                    pos: [...tower.pos.modify(unadapt)],
                    type: type,
                    id: id,
                    ownerID: socket.id
                });
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
    socket = io.connect(LOCAL ? "http://192.168.1.6:5000" : "http://109.98.216.123:5000");
    
    socket.on("connect", () => {
        if(started) return;
        entities[socket.id] = player;
        terrain.getFromServer();
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
            if(!data[id].texts.equals(others[id].textBox.last)) {
                others[id].textBox.setTexts(data[id].texts);
            }
        }
    });

    const spawnTower = (pos, type, id) => towers[type][id] = new Tower(new Vec2(...pos).modify(adapt), type, id);

    socket.on("initial", data => {
        player.team = data.team;
        
        for(const type in data.towersData)
            for(const id in data.towersData[type])
                spawnTower(data.towersData[type][id].pos, type, id);
    });

    socket.on("towerSpawn", data => spawnTower(data.pos, data.type, data.id));
    
    socket.on("removeDecoration", data => terrain.removeDecoration(data.i, data.j));

    socket.on("spawnDecoration", data => {
        for(const item of data) {
            terrain.decorations[item.i][item.j] = item.id;
            terrain.genUpper(terrain.upperLayer, item.i, item.j);
        }
    });

    socket.on("hurtTower", data => towers[data.type][data.id].healthBar.decrease(data.damage));

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
