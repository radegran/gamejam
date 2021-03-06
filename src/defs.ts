export const PLAYER_WIDTH = 1;
export const PLAYER_HEIGHT = 1.5;
export const GRAVITY = 10;
export const VIEWPORT_WIDTH = 40;

interface NumCallback {
    (index:number): number
}

export interface PlayerDef {
    keyMap: KeyboardMap,
    accentColor: string,
    svgName: string
}

export type Player = ReturnType<typeof createPlayer>;

export const createPlayerDefinitions = ():Array<PlayerDef> => {
    let players = [
        {
            keyMap: {right: 90, left: 81, up: 83},
            accentColor: "#e46167",
            svgName: staticResources["player1Svg"]
        },
        {
            keyMap: {right: 78, left: 86, up: 71},
            accentColor: "#c47ec2",
            svgName: staticResources["player2Svg"]
        },
        {
            keyMap: {right: 39, left: 37, up: 38},
            accentColor: "#48baec",
            svgName: staticResources["player3Svg"]
        },
        {
            keyMap: {right: 104, left: 98, up: 100},
            accentColor: "#78bc78",
            svgName: staticResources["player4Svg"]
        }
    ];

    return players;
};

export const createPlayer = () => ({
    score: 0,
    droppedOutTime: -1,
    definition: {
        keyMap: {
            right: 0,
            left: 0,
            up: 0
        },
        accentColor: "black",
        svgName: "..."
    },
    pos: {x:0, y:0},
    vel: {x:0, y:0},
    angle: 0,
    angleVel: 0,
    touchesGround: false,
    hasJumped: 0,
    input: {
        rotateLeft: false,
        rotateRight: false,
        jump: false
    }
});

export const createGameData = (heightMap:HeightMap, playerDefs:Array<PlayerDef>):GameData => {
    
    let players:Array<Player> = playerDefs.map(def => {
        let p = createPlayer();
        p.definition = def;
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
        if (!catalog) return;
        catalog.pickninja1.play();
    }

    function startGame() {
        if (!catalog) return;
        catalog.pickninja0.play();
        catalog.gameover.stop();
    }

    function gameover() {
        if (!catalog) return;
        catalog.gameover.play();
    }

    function jump() {
        if (!catalog) return;
        catalog.jump.play();
    }
    
    function land() {
        if (!catalog) return;
        catalog.collide.volume(0.6);
        catalog.collide.play();
    }
    
    function collide() {
        if (!catalog) return;
        catalog.land.volume(0.9);
        catalog.land.play();
    }

    function roundover() {
        if (!catalog) return;
        catalog.roundover.volume(0.7);
        catalog.roundover.play();
    }

    function music() {
        if (!catalog) return;
        catalog.music.stop();
        catalog.music.play();
        catalog.gameover.stop();
    }

    return {
        selectPlayer,
        startGame,
        gameover,
        roundover,
        jump,
        collide,
        land,
        music
    }
};

export type Sound = ReturnType<typeof createSounds>;

export const staticResources = {
    player1Svg: "player-1.svg",
    player2Svg: "player-2.svg",
    player3Svg: "player-3.svg",
    player4Svg: "player-4.svg",
    music: "music.mp3",
    collide: "collide.mp3",
    gameover: "gameover.mp3",
    jump: "jump.mp3",
    land: "land.mp3",
    pickninja0: "pickninja0.mp3",
    pickninja1: "pickninja1.mp3",
    roundover: "roundover.mp3"
};

export const defineResources = (levelname:string) => {
    return {...staticResources, 
        levelSvg: "levels/" + levelname + ".svg",
        levelJson: levelname ? "levels/" + levelname + ".json" : "",
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

export const getMaxScore = (numPlayers:number) => {
    switch (numPlayers) {
        case 1:
            return 5;
        case 2: 
            return 6;
        case 3:
            return 8;
        default:
            return 10;
    }
};

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