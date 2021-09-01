class Fireball
{
    constructor(pos, targetEntity, color) {
        this.pos = pos.copy();
        this.speed = adapt(4);
        this.targetEntity = targetEntity;
        this.vel = new Vec2(...targetEntity.getColliderOrigin()).sub(this.pos).normalize().mult(this.speed);
        this.color = color;
        this.r = adapt(10);
        this.lifeSpan = adapt(4) * 100 / this.speed; // the lifespan is independent of speed
    }

    update() {
        this.pos.add(this.vel);
        this.lifeSpan--;
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    getCollider() {
        return [ ...this.pos, 2 * this.r, 2 * this.r ];
    }
}