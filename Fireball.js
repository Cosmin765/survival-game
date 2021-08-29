class Fireball
{
    constructor(pos, target, color) {
        this.pos = pos.copy();
        this.vel = target.copy().sub(this.pos).normalize().mult(adapt(4));
        this.color = color;
        this.r = adapt(10);
        this.lifeSpan = 100;
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