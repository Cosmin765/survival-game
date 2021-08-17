class Player extends SpriteAnim
{
    constructor(pos) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos.copy();
        this.leftFacing = false;
    }

    update() {
        this.updateAnim();

        const vel = joystick.dir().normalize();
        if(vel.dist()) {
            this.leftFacing = vel.x < 0;
            this.setAnim("running");
            this.pos.add(vel.mult(adapt(4)));
        } else {
            this.setAnim("idle");
        }
    }

    render() {
        ctx.save();
        ctx.translate(...this.dims.copy().modify(val => -val / 2));
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        ctx.restore();
    }
}