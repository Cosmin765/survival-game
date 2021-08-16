class Vec2
{
    constructor(x = 0, y = 0)
    {
        this.x = x; this.y = y;
    }
    
    add(v)
    {
        this.x += v.x; this.y += v.y; return this;
    }
    
    sub(v)
    {
        this.x -= v.x; this.y -= v.y; return this;
    }
    
    mult(n)
    {
        this.x *= n; this.y *= n; return this;
    }

    div(n)
    {
        return this.mult(1 / n);
    }
    
    copy()
    {
        return new Vec2(...this);
    }

    equals(v)
    {
        return this.x === v.x && this.y == v.y;
    }

    dist(v = new Vec2())
    {
        return Math.sqrt(Math.pow(v.x - this.x, 2) + Math.pow(v.y - this.y, 2));
    }
    
    dot(v)
    {
      return this.x * v.x + this.y * v.y;
    }
    
    normalize()
    {
      const len = this.dist();
      if(!len) return this;
      this.x /= len; this.y /= len;
      return this;
    }
    
    angle(v = new Vec2(1, 0))
    {
      const norm = this.copy().normalize();
      const dot = norm.dot(v);
      
      const fact = (norm.y > 0 ? 1 : -1);
      
      return fact * Math.acos(dot / norm.dist() * v.dist());
    }
    
    limit(r)
    {
      return this.normalize().mult(r);
    }

    set(x, y)
    {
        this.x = x; this.y = y; return this;
    }

    multMat(mat)
    {
        const x = this.x * mat[0][0] + this.y * mat[0][1];
        const y = this.x * mat[1][0] + this.y * mat[1][1];
        return this.set(x, y);
    }

    toFixed(n)
    {
        this.x = this.x.toFixed(n); this.y = this.y.toFixed(n); return this;
    }

    modify(func)
    {
        this.x = func(this.x); this.y = func(this.y); return this;
    }
    
    [Symbol.iterator] = function*() {
        yield this.x; yield this.y;
    }
};