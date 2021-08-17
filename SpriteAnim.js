class SpriteAnim
{
    constructor(dims, frameCount) {
        this.dims = dims.copy().modify(adapt);
        this.animIndex = 0;
        this.acc = 0;
        this.delay = 5;
        this.spriteOff = 0;
        this.frameCount = frameCount; // the number of frames in an animation
    }

    updateAnim() {
        this.acc++; // increasing the accumulator
        this.acc %= this.delay * this.frameCount; // so that it is reseted
        this.animIndex = ((this.acc / this.delay) | 0) % this.frameCount; // the actual frame index
    }

    setAnim(name) {
        this.spriteOff = spriteData.player[name];
    }

    static getCoords(i, j, w) {
        return [ i * w, j * w, w, w ];   
    }
}