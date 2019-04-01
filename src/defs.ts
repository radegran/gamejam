export interface HeightMap {
    set: (index:number, value:number) => void,
    get: (index:number) => number,
    count: () => number
    clone: () => HeightMap
};

export interface Point {
    x:number,
    y:number
}

export interface PointCallback {
    (p:Point): void
}

export interface GameData {
    heightMap: HeightMap,
    player: {
        pos: Point,
        vel: Point,
        angle: number
    }
}

export interface LayerDefinition {
    id: string,
    scale: number
}