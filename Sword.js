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