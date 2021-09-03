class Panel
{
    constructor(pos, dims, text = () => {}) { // text is a function for convenience
        this.pos = pos.copy();
        this.dims = dims.copy();
        this.text = text;
    }

    render() {
        ctx.save();
        ctx.translate(...this.pos);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(-this.dims.x / 2, -this.dims.y / 2, ...this.dims);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${adapt(18)}px Arial`;
        ctx.fillText(this.text(), 0, 0);
        ctx.restore();
    }
}