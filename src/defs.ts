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

export type Player = ReturnType<typeof createPlayer>;

export const createPlayer = () => ({
    score: 0,
    droppedOutTime: -1,
    accentColor: "",
    pos: {x:0, y:0},
    vel: {x:0, y:0},
    angle: 0,
    angleVel: 0,
    touchesGround: false,
    hasJumped: false,
    input: {
        rotateLeft: false,
        rotateRight: false,
        jump: false
    }
});

export const createGameData = (heightMap:HeightMap, playerDefs:Array<PlayerDef>):GameData => {
    
    let players:Array<Player> = playerDefs.map(def => {
        let p = createPlayer();
        p.accentColor = def.accentColor;
        return p;
    });

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

export const createSounds = (catalog?:SoundCatalog) => {
    function selectPlayer() {
        catalog.pickninja1.play();
    }

    function startGame() {
        catalog.pickninja0.play();
        catalog.gameover.stop();
    }

    function gameover() {
        catalog.gameover.play();
    }

    function jump() {
        catalog.jump.play();
    }
    
    function land() {
        catalog.collide.volume(0.6);
        catalog.collide.play();
    }
    
    function collide() {
        catalog.land.volume(0.9);
        catalog.land.play();
    }

    function roundover() {
        catalog.roundover.play();
    }

    return {
        selectPlayer,
        startGame,
        gameover,
        roundover,
        jump,
        collide,
        land
    }
};

export type Sound = ReturnType<typeof createSounds>;

export const defineResources = (levelname:string) => {
    return {
        levelSvg: "levels/" + levelname + ".svg",
        player1Svg: "player-1.svg",
        player2Svg: "player-2.svg",
        player3Svg: "player-3.svg",
        player4Svg: "player-4.svg",
        levelJson: "levels/" + levelname + ".json",
        music: "music.mp3",
        collide: "collide.mp3",
        gameover: "gameover.mp3",
        jump: "jump.mp3",
        land: "land.mp3",
        pickninja0: "pickninja0.mp3",
        pickninja1: "pickninja1.mp3",
        roundover: "roundover.mp3",
        sounds: createSounds()
    };
}

export interface SoundCatalog {
    music: Howl,
    collide: Howl,
    gameover: Howl,
    jump: Howl,
    land: Howl,
    pickninja0: Howl,
    pickninja1: Howl,
    roundover: Howl
}

export const playerSvgs = (resources:Resources) => [
    resources.player1Svg,
    resources.player2Svg,
    resources.player3Svg,
    resources.player4Svg
]

export type Resources = ReturnType<typeof defineResources>;

export interface PointCallback {
    (p:Point): void
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