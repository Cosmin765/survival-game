class Tower
{
    constructor(pos, color) {
        this.pos = pos.copy();
        this.color = color;
        this.type = color + "_tower";
        this.dims = new Vec2(1.3, 2.6).mult(TILE_WIDTH);
        this.fireBalls = [];
    }

    update() {
        for(let i = 0; i < this.fireBalls.length; ++i) {
            const entity = this.fireBalls[i].targetEntity;
            if(collided(...entity.getFullCollider(), ...this.fireBalls[i].getCollider())) {
                entity.healthBar.decrease(4);
                this.fireBalls.splice(i, 1);
                i--; continue;
            }
            if(this.fireBalls[i].lifeSpan <= 0) {
                this.fireBalls.splice(i, 1);
                i--; continue;    
            }
            this.fireBalls[i].update();
        }
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.drawImage(textures.towers, ...SpriteAnim.getCoords(...spriteData[this.type], 32, 64), -this.dims.x / 2, -this.dims.y / 2, ...this.dims);
        
        ctx.restore();

        for(const fireBall of this.fireBalls)
            fireBall.render();
    }

    getCollider() {
        const h = adapt(60);
        return [ this.pos.x - this.dims.x / 3, this.pos.y + this.dims.y / 2 - h, this.dims.x * 2 / 3, h ];
    }
}