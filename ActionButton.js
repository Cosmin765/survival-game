class ActionButton extends Interactive
{
    // constructor(text, pos, handler = () => {}, displayCondition = () => true)
    constructor(options)
    {
        const size = options.size || new Vec2(150, 75).modify(adapt);
        const pos = options.pos;

        super(pos.x - size.x / 2, pos.y - size.y / 2, ...size);
        this.pos = pos.copy();
        this.size = size;
        this.text = options.text;
        this.pressed = false;
        this.handler = (options.handler || (() => {})).bind(this);
        this.displayCondition = options.displayCondition || (() => true);
        this.fontSize = options.fontSize || adapt(22);
    }

    press()
    {
        if(!this.displayCondition())
            return;
        
        this.pressed = true;
    }

    release()
    {
        if(this.pressed) {
            this.pressed = false;

            // click handler
            this.handler();
        }
    }

    render()
    {
        if(!this.displayCondition())
            return;

        ctx.strokeStyle = this.pressed ? "red" : "#00ccff";
        ctx.fillStyle = this.pressed ? "rgba(99, 159, 255, 0.8)" : "rgba(28, 106, 232, 0.5)";

        const rectData = [...this.pos.copy().sub(new Vec2(this.size.x, this.size.y).div(2)), this.size.x, this.size.y];
        ctx.fillRect(...rectData);
        ctx.strokeRect(...rectData);
        
        ctx.font = `${this.fontSize}px Arial`;
        ctx.fillStyle = this.pressed ? "red" : "#000";
        const textWidth = ctx.measureText(this.text).width;
        ctx.fillText(this.text, ...this.pos.copy().add(new Vec2(-textWidth / 2, adapt(10))));
    }
}