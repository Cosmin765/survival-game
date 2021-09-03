class Tower
{
    constructor(pos, color) {
        this.pos = pos.copy();
        this.color = color;
        this.type = color + "_tower";
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
            for(const id in entities) {
                const entity = entities[id];
                if(entity.team === this.color) continue;
                if(collided(...entity.getFullCollider(), ...this.fireBalls[i].getCollider())) {
                    entity.healthBar.decrease(4);
                    this.fireBalls.splice(i, 1);
                    i--; break;
                }
            }
        }

        if(player.hurt(this.getCollider())) {
            const damage = player.sword.getDamage();
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