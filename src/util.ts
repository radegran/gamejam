import { Point, HeightMap } from "./defs";

export const isCloseToPath = (p:Point, heights:HeightMap, tolerance:number) => {
    let ix = Math.round(p.x);
    if (ix < -tolerance || ix > heights.count() + tolerance) {
        return false;
    }
    return Math.abs(heights.get(p.x) - p.y) < tolerance;
};