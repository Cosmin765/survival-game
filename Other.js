class Other extends SpriteAnim
{
    constructor(pos = [ -1000, -1000 ]) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = pos;
        this.leftFacing = false;

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
        
        ctx.save();
        ctx.translate(...this.pos);
        ctx.translate(0, adapt(-50));
        this.textBox.render();
        ctx.restore();
    }
}