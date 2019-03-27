export interface Point {
    x:number,
    y:number
}

export interface PointCallback {
    (p:Point): void
}