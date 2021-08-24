class TextBox
{
    constructor(texts = [], width = adapt(200), finishedTextHandler = () => {}, color = "white")
    {
        this.size = new Vec2(width, 0);
        this.setTexts(texts);
        
        this.fontSize = adapt(30);
        this.visible = true;
        this.frozen = false;
        this.finishedTextHandler = finishedTextHandler;
        this.color = color;
    }

    setTexts(texts)
    {
        this.texts = texts;
        this.last = texts;
        this.textsIndex = 0;
        this.text = this.texts[this.textsIndex];
        this.visible = true;
        this.reset();
    }

    reset()
    {
        this.acc = this.index = 0;
        this.frozen = false;
        this.currText = "";
        this.updateSize();
    }

    updateSize()
    {
        const lines = this.getLines(adapt(this.size.x));
        this.size.y = this.fontSize * lines.length + this.fontSize;
    }

    update()
    {
        if(!this.visible || this.frozen || !this.text)
            return;
        
        if(this.index < this.text.length)
        {
            this.acc++;
            if(this.acc % 4 === 0) {
                this.acc = 0;
                this.currText += this.text[this.index++];
                this.updateSize();
            }
        } else if(this.textsIndex < this.texts.length - 1) {
            this.frozen = true;
            wait(1000).then(() => {
                this.reset();
                this.textsIndex++;
                this.text = this.texts[this.textsIndex];
                this.frozen = false;
            });
        } else {
            this.frozen = true;
            wait(1000).then(() => {
                this.visible = false;
                this.text = null;
                this.finishedTextHandler();
            });
        }
    }

    getLines(maxWidth) {
        ctx.font = `${this.fontSize}px Arial`;
        const words = this.currText.split(" ");
        const lines = [];
        let currentLine = words[0];
    
        for (let i = 1; i < words.length; ++i) {
            const word = words[i];
            const width = adapt(ctx.measureText(currentLine + " " + word).width);
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    renderPanel()
    {
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.color;
        ctx.translate(...this.size.copy().div(-2));
        ctx.beginPath();
        const pad = adapt(10);
        ctx.moveTo(-pad, 0);
        ctx.lineTo(this.size.x + pad, 0);
        ctx.lineTo(this.size.x + pad, this.size.y);
        ctx.lineTo(this.size.x / 2 + adapt(10), this.size.y);
        ctx.lineTo(this.size.x / 2, this.size.y + adapt(10));
        ctx.lineTo(this.size.x / 2 - adapt(10), this.size.y);
        ctx.lineTo(-pad, this.size.y);
        ctx.lineTo(-pad, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    render()
    {
        if(!this.visible || !this.text)
            return;

        ctx.save();
        ctx.translate(0, -this.size.y / 2);
        this.renderPanel();
        ctx.translate(0, -this.size.y / 2 + this.fontSize);
        
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = `${this.fontSize}px VT323`;
        const lines = this.getLines(adapt(this.size.x));
        for(let i = 0; i < lines.length; ++i)
        {
            ctx.fillText(lines[i], 0, i * this.fontSize);
        }
        ctx.restore();
    }
}