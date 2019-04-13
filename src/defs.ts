export const PLAYER_WIDTH = 1;
export const PLAYER_HEIGHT = 1.5;
export const GRAVITY = 10;
export const VIEWPORT_WIDTH = 40;

interface NumCallback {
    (index:number): number
}

export interface PlayerDef {
    keyMap: KeyboardMap,
    accentColor: string
}

export const createGameData = (heightMap:HeightMap, playerDefs:Array<PlayerDef>):GameData => {
    
    let players:Array<Player> = playerDefs.map(def => (
        {
            score: 0,
            droppedOutTime: -1,
            accentColor: def.accentColor,
            pos: {x:0, y:0},
            vel: {x:0, y:0},
            angle: 0,
            angleVel: 0,
            touchesGround: false,
            input: {
                rotateLeft: false,
                rotateRight: false,
                jump: false
            }
        }));

    return {
        isGameOver: false,
        elapsedTime: 0,
        heightMap,
        players: players,
        camFocus: {x:0, y:0}
    };
};

const createLayerDefinition = (id:string, scale:number):LayerDefinition => ({
    id,
    scale
});

export const  createLayers = () => {
    let layers:Array<LayerDefinition> = [
        createLayerDefinition("background-layer", 0.3),
        createLayerDefinition("player-layer", 1),
        createLayerDefinition("foreground-layer", 1.2)
    ];
    return layers;
};

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

export const defineResources = (levelname:string) => {
    return {
        levelSvg: "levels/" + levelname + ".svg",
        playerSvg: "player.svg",
        levelJson: "levels/" + levelname + ".json"
    };
}

export type Resources = ReturnType<typeof defineResources>;

export interface PointCallback {
    (p:Point): void
}

export interface Player {
    score: number,
    droppedOutTime: number,
    accentColor: string,
    pos: Point,
    vel: Point,
    angle: number,
    angleVel: number,
    touchesGround: boolean;
    input: {
        rotateRight: boolean,
        rotateLeft: boolean,
        jump: boolean
    }
}

export interface KeyboardMap {
    left:number,
    right:number,
    up:number
};

export interface GameData {
    isGameOver: boolean,
    elapsedTime: 0,
    heightMap: HeightMap,
    players: Array<Player>,
    camFocus: Point
}

export interface LayerDefinition {
    id: string,
    scale: number
}