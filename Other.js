class Other extends SpriteAnim
{
    constructor(pos = [ -1000, -1000 ]) {
        super(new Vec2(TILE_WIDTH, TILE_WIDTH).modify(unadapt).mult(24 / 16), 4);
        this.pos = new Vec2(...pos);
        this.leftFacing = false;
        this.name = "";
        this.team = "";
        this.healthBar = new HealthBar(50, 1);
        this.sword = new Sword();

        this.textBox = new TextBox();
    }

    update() {
        this.updateAnim();
        this.textBox.update();
        this.sword.update();
    }

    getFullCollider() {
        return [this.pos.x + adapt(10) + this.dims.x / 4 - this.dims.x / 2, this.pos.y, this.dims.x / 2 - adapt(20), this.dims.y / 2];
    }

    getColliderOrigin(offX = 0, offY = 0) {
        return [ this.pos.x + offX, this.pos.y + offY + this.dims.y / 1.5 - this.dims.y / 2 + this.dims.y / 6 ];
    }

    getFullCollider() {
        return [this.pos.x + adapt(10) + this.dims.x / 4 - this.dims.x / 2, this.pos.y, this.dims.x / 2 - adapt(20), this.dims.y / 2];
    }

    getSwordCollider() {
        const x = (this.leftFacing ? this.pos.x - this.sword.dims.x * 1.5 : this.pos.x + this.sword.dims.x / 2);
        return [ x, this.pos.y, this.sword.dims.x, this.sword.dims.y / 2 ];
    }

    hurt(collider) {
        if(!(this.sword.attacking && collided(...this.getSwordCollider(), ...collider))) return 0;
        return this.sword.damage;
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
        this.textBox.render();
        ctx.translate(0, this.dims.y / 2 + adapt(70));
        ctx.textAlign = "center";
        ctx.fillStyle = this.team;
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.name, 0, 0);
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