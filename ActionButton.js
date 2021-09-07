class ActionButton extends Interactive
{
    constructor(options) // { size?, pos, text, handler?, displayCondition?, fontSize?, theme? }
    {
        const size = options.size || new Vec2(150, 75).modify(adapt);
        const pos = options.pos;

        super(pos.x - size.x / 2, pos.y - size.y / 2, ...size);
        this.pos = pos.copy();
        this.size = size;
        this.text = options.text;
        this.name = options.text;
        this.pressed = false;
        this.handler = (options.handler || (() => {})).bind(this);
        this.displayCondition = options.displayCondition || (() => buttonDisplay[this.name]);
        if(!options.displayCondition) buttonDisplay[this.name] = true;
        this.fontSize = options.fontSize || adapt(22);
        this.theme = options.theme || ActionButton.themes.blue;
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

        ctx.strokeStyle = this.theme.stroke[this.pressed];
        ctx.fillStyle = this.theme.background[this.pressed];

        const rectData = [this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y];
        ctx.fillRect(...rectData);
        ctx.strokeRect(...rectData);
        
        ctx.font = `${this.fontSize}px Arial`;
        ctx.fillStyle = this.theme.text[this.pressed];
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.pos.x, this.pos.y + adapt(10));
    }

    static themes = {
        blue: {
            background: {
                true: "rgba(99, 159, 255, 0.8)", // true means pressed
                false: "rgba(28, 106, 232, 0.5)"
            },
            stroke: {
                true: "red",
                false: "#00ccff"
            },
            text: {
                true: "red",
                false: "black"
            }
        },
        red: {
            background: {
                true: "rgba(255, 56, 56, 0.4)",
                false: "rgba(255, 0, 0, 0.4)"
            },
            stroke: {
                true: "white",
                false: "red"
            },
            text: {
                true: "white",
                false: "black"
            }
        }
    }
}