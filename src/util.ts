import { Point, HeightMap } from "./defs";

export const smooth = (x:number, heights:HeightMap) => {
    let x1 = Math.floor(x);
    let fraq = x - x1;

    const cubic = (x:number) => (3*x*x - x*x*x) / 8;

    return cubic(1 - fraq)*heights.get(x1 - 1) +
        cubic(2 - fraq)*heights.get(x1) +
        cubic(1 + fraq)*heights.get(x1 + 1) +
        cubic(fraq)*heights.get(x1 + 2);
};

export const isCloseToPath = (p:Point, heights:HeightMap, tolerance:number) => {
    let ix = Math.round(p.x);
    if (ix < -tolerance || ix > heights.count() + tolerance) {
        return false;
    }
    return Math.abs(smooth(p.x, heights) - p.y) < tolerance;
};