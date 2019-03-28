export interface Point {
    x:number,
    y:number
}

export interface PointCallback {
    (p:Point): void
}

export interface GameData {
    heightMap: Array<number>,
    player: {
        pos: Point,
        vel: Point,
        angle: number
    }
}