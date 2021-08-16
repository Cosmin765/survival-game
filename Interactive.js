class Interactive
{
    constructor(left, top, width, height)
    {
        this.bounds = { left, top, width, height };
    }
    
    clicked(pos)
    {
        const { left, top, width, height } = this.bounds;
        const { x, y } = pos;
        return (x >= left && x <= left + width && y >= top && y <= top + height);
    }
};