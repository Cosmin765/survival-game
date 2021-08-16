class Joystick extends Interactive
{
    constructor(pos)
    {
        const r = adapt(50);
    
        super(pos.x - r, pos.y - r, r * 2, r * 2);
        
        this.r = r;
        this.pos = pos.copy();
        this.ballPos = this.pos.copy();
        this.lastPos = this.pos.copy();
        this.touchID = null;
    }

    setTouch(id, pos)
    {
        if(this.touchID === null) {
            this.touchID = id;
            this.update(pos);
        }
    }

    removeTouch()
    {
        this.touchID = null;
        this.ballPos = this.pos.copy();
    }
    
    update(pos)
    {
        const dist = this.pos.dist(pos);

        if(dist < this.r) {
          this.ballPos = pos.copy();
        } else {
          const dir = pos.copy().sub(this.pos);
          this.ballPos = dir.limit(this.r).add(this.pos);
        }

        this.lastPos = pos.copy();
    }

    dir()
    {
        return this.ballPos.copy().sub(this.pos);
    }
    
    render()
    {
        ctx.save();
        ctx.strokeStyle = "#00ccff";
        ctx.lineWidth = adapt(4);
        ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(...this.pos, this.r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = "#1c6ae8";
        ctx.arc(...this.ballPos, this.r / 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
};