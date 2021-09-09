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
        return (this.sword.attacking && collided(...this.getSwordCollider(), ...collider));
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