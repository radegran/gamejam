import { Point } from "./defs";

export const smooth = (x:number, heights:Array<number>) => {
    let x1 = Math.floor(x);
    let fraq = x - x1;

    let x0 = Math.max(0, x1-1);
    let x2 = Math.min(heights.length-1, x1+1);
    let x3 = Math.min(heights.length-1, x1+2);

    const cubic = (x:number) => (3*x*x - x*x*x) / 8;

    return cubic(1 - fraq)*heights[x0] +
        cubic(2 - fraq)*heights[x1] +
        cubic(1 + fraq)*heights[x2] +
        cubic(fraq)*heights[x3];
};

export const isCloseToPath = (p:Point, heights:Array<number>, tolerance:number) => {
    let ix = Math.round(p.x);
    if (ix < -tolerance || ix > heights.length + tolerance) {
        return false;
    }
    return Math.abs(smooth(p.x, heights) - p.y) < tolerance;
};