class Player extends SpriteAnim
{
    constructor(pos) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos.copy();
        this.leftFacing = false;
    }

    update() {
        this.updateAnim();

        const movement = new Vec2();
        if(keys["w"]) movement.y -= 1;
        if(keys["a"]) movement.x -= 1;
        if(keys["s"]) movement.y += 1;
        if(keys["d"]) movement.x += 1;
        movement.normalize();

        const vel = (movement.dist() ? movement : joystick.dir().normalize()).mult(adapt(4));

        if(vel.dist()) {
            this.leftFacing = vel.x < 0;
            this.setAnim("running");

            const j = this.pos.x / TILE_WIDTH | 0, i = this.pos.y / TILE_WIDTH | 0; // indices of the tiles we are colliding with
            const collider = colliders[idToKey[terrain.map[i][j]]];
            let move = true;
            if(collider) {
                for(const component of collider) {
                    const data = [...component];
                    data[0] += j; data[1] += i;

                    if(collided(...this.getCollider(...vel), ...data.map(val => val * TILE_WIDTH))) {
                        if(component === colliders["left_edge"][0] || component === colliders["right_edge"][0]) vel.x = 0;
                        if(component === colliders["top_edge"][0] || component === colliders["bottom_edge"][0]) vel.y = 0;
                    }
                }
            }
            this.pos.add(vel);
        } else {
            this.setAnim("idle");
        }
    }

    getCollider(offX = 0, offY = 0) {
        return [this.pos.x + offX + this.dims.x / 4 - this.dims.x / 2, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2, this.dims.x / 2, this.dims.y / 3];
    }

    render() {
        ctx.save();
        ctx.translate(...this.dims.copy().modify(val => -val / 2));
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        
        ctx.restore();
        // ctx.strokeStyle = "red";
        // ctx.strokeRect(...this.getCollider());
    }
}