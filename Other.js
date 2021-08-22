class Other extends SpriteAnim
{
    constructor(pos) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos;
        this.leftFacing = false;
    }

    render() {
        this.updateAnim();
        ctx.save();
        ctx.translate(...this.dims.copy().modify(val => -val / 2));
        ctx.drawImage(textures.player, ...SpriteAnim.getCoords(this.animIndex + 4 * this.leftFacing, this.spriteOff, 24), ...this.pos, ...this.dims);
        ctx.restore();
    }
}