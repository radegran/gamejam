import {Foo} from "./foo";
import { Editor } from "./editor";
import { KeyboardInput } from "./keyboardinput";
import { GameLoop } from "./gameloop";
import { GameData, LayerDefinition, HeightMap } from "./defs";
import { createViewPort, ViewPort } from "./viewport";
import SVG from "svgjs";
import { smooth } from "./util";
import { createPathDrawer } from "./editor-graphics";
import { createHeightMap } from "./heightmap";
import { stepState } from "./physics";

const createGameData = (heightMap:HeightMap):GameData => {
    return {
        heightMap,
        player: {
            pos: {x:5, y:0},
            vel: {x:0, y:0},
            angle: 0
        }    
    };
};

const createView = (viewPort:ViewPort, s:SVG.Doc) => {
    
    const playerWidth = 1;
    const playerHeight = 1.5;
    let playerSvg:SVG.Element;

    const update = (gameData:GameData) => {
        let playerPos = gameData.player.pos;
        viewPort.location(playerPos);
        playerSvg.translate(playerPos.x - playerWidth/2, playerPos.y - playerHeight);
    };

    const setup = () => {
        playerSvg = s.rect(playerWidth, playerHeight).fill("red");
        viewPort.zoomLevel(1);
    };

    const teardown = () => {
        playerSvg.remove();
    };
    
    return {
        update,
        setup,
        teardown
    };
};

const createLayerDefinition = (id:string, scale:number):LayerDefinition => ({
    id,
    scale
});

function main() {
    
    let heightMap = createHeightMap(500);
    let gameData = createGameData(heightMap);

    let svgId = "mainsvg";
    let s = SVG(document.getElementById(svgId));

    let layers:Array<LayerDefinition> = [
        createLayerDefinition("background-layer", 0.5),
        createLayerDefinition("player-layer", 1),
        createLayerDefinition("foreground-layer", 1.2)
    ];

    let viewPort = createViewPort(svgId, layers, heightMap);
    
    // Editor
    let pathDrawer = createPathDrawer(s, heightMap, layers)
    let editor = Editor(gameData, viewPort, pathDrawer);    

    // Game
    let view = createView(viewPort, s);
    let gameLoop = GameLoop(stepState, view.update);

    // Toggle Game/Editor
    let keyboardInput = KeyboardInput();

    keyboardInput.onKeyDown(32, () => {   // Space
        let editorVisible = editor.toggle();
        if (editorVisible) {
            gameLoop.stop();
            view.teardown();
        }
        else {
            view.setup();
            gameData.player.pos.y = smooth(gameData.player.pos.x, gameData.heightMap);
            gameLoop.start(createGameData(heightMap));
        }
    });

    editor.toggle(true);
};

main();