export const PLAYER_WIDTH = 1;
export const PLAYER_HEIGHT = 1.5;
export const GRAVITY = 10;
export const VIEWPORT_WIDTH = 40;

interface NumCallback {
    (index:number): number
}

export interface HeightMap {
    setAll: (callback:NumCallback) => void,
    get: (index:number) => number,
    count: () => number
    clone: () => HeightMap,
    bounds: () => {x:number, y:number, width:number, height:number},
    smoothEnabled: (enable?:boolean) => void | boolean,
    serialize: () => string
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
        angle: number,
        angleVel: number,
        touchesGround: boolean;
    },
    input: {
        rotateRight: boolean,
        rotateLeft: boolean,
        jump: boolean
    }
    camFocus: Point
}

export interface LayerDefinition {
    id: string,
    scale: number
}