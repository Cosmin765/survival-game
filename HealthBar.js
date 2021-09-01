class HealthBar
{
    constructor(max, curr = 1)
    {
        this.max = max;
        this.curr = max * curr;
        this.len = adapt(100);
        this.dead = false;
    }

    set(amount)
    {
        this.curr = amount;
        if(this.curr > 0) this.dead = false;
    }

    decrease(amount)
    {
        this.curr -= amount;
        if(this.curr <= 0) {
            this.curr = 0;
            this.dead = true;
        }
    }

    increase(amount)
    {
        this.curr += amount;
        if(this.curr > this.max) this.curr = this.max;
    }

    render()
    {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = adapt(2);
        ctx.translate(-this.len / 2, 0);
        ctx.fillRect(0, 0, this.len, adapt(7));
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(0, 0, adapt(this.curr / this.max * this.len), adapt(7));
        ctx.strokeRect(0, 0, this.len, adapt(7));
        ctx.restore();
    }
}