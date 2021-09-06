class Base
{
    constructor(pos, color) {
        this.pos = pos.copy();
        this.dims = new Vec2(2.6, 2.6).mult(TILE_WIDTH);
        this.color = color;
        this.type = color + "_base";
    }

    getCollider() {
        const padding = adapt(40);
        return [ this.pos.x - this.dims.x / 2 + padding, this.pos.y - this.dims.y / 2 + padding, this.dims.x - 2 * padding, this.dims.y - 2 * padding ];
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.drawImage(textures.bases, ...SpriteAnim.getCoords(...spriteData[this.type], 64, 64), -this.dims.x / 2, -this.dims.y / 2, this.dims.x, this.dims.y);
        ctx.restore();
    }
}