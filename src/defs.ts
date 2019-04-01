interface NumCallback {
    (index:number): number
}

export interface HeightMap {
    setAll: (callback:NumCallback) => void,
    get: (index:number) => number,
    count: () => number
    clone: () => HeightMap,
    bounds: () => {x:number, y:number, width:number, height:number}
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