class Player extends SpriteAnim
{
    constructor(pos) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos.copy();
        this.leftFacing = false;

        this.textBox = new TextBox(["hello!"]);
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

        if(socket) {
            socket.emit("store", {
                pos: [...this.pos].map(unadapt), // sending a normalized version
                leftFacing: this.leftFacing,
                spriteOff: this.spriteOff,
                textBox: {
                    texts: this.textBox.texts,
                    visible: this.textBox.visible
                }
            });
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
        
        ctx.save();
        ctx.translate(...this.pos);
        ctx.translate(0, adapt(-50));
        this.textBox.render();
        ctx.restore();
        // ctx.strokeStyle = "red";
        // ctx.strokeRect(...this.getCollider());
    }
}