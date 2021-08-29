class SpriteAnim
{
    constructor(dims, frameCount) {
        this.dims = dims.copy().modify(adapt);
        this.animIndex = 0;
        this.acc = 0;
        this.delay = 5;
        this.spriteOff = 0;
        this.frameCount = frameCount; // the number of frames in an animation
        this.interruptible = true;
    }

    updateAnim() {
        this.acc++; // increasing the accumulator
        this.acc %= this.delay * this.frameCount; // so that it is reseted
        this.animIndex = ((this.acc / this.delay) | 0) % this.frameCount; // the actual frame index
        // console.log(this.animIndex);
    }

    setAnim(name, interruptible = true, delay = 5) {
        if(this.interruptible || this.acc === this.delay * this.frameCount - 1) {
            if(!interruptible)
                this.acc = this.animIndex = 0;
            this.spriteOff = spriteOffset.player[name];
            this.interruptible = interruptible;
            this.delay = delay;
        }
    }

    static getCoords(j, i, w, h) {
        if(!h) h = w;
        return [ j * w, i * h, w, h ];   
    }
}