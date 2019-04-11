import { Editor } from "./editor";
import { KeyboardInput } from "./keyboardinput";
import { GameLoop } from "./gameloop";
import { GameData, LayerDefinition, HeightMap, PLAYER_WIDTH, PLAYER_HEIGHT, Point } from "./defs";
import { createViewPort, ViewPort } from "./viewport";
import { createPathDrawer } from "./editor-graphics";
import { createHeightMap } from "./heightmap";
import { stepState } from "./physics";
import SVG from "svgjs";
import { setupPartitions } from "./partitioning";
import { test } from "./test";
import { createView } from "./view";
import { loadSvg, loadLevelJson } from "./util";

const createGameData = (heightMap:HeightMap):GameData => {
    return {
        heightMap,
        player: {
            pos: {x:5, y:0},
            vel: {x:0, y:0},
            angle: 0,
            angleVel: 0,
            touchesGround: false
        },
        input: {
            rotateLeft: false,
            rotateRight: false,
            jump: false
        },
        camFocus: {x:0, y:0}
    };
};

const createLayerDefinition = (id:string, scale:number):LayerDefinition => ({
    id,
    scale
});

function createLayers() {
    let layers:Array<LayerDefinition> = [
        createLayerDefinition("background-layer", 0.3),
        createLayerDefinition("player-layer", 1),
        createLayerDefinition("foreground-layer", 1.2)
    ];
    return layers;
}

async function startGame(levelname:string) {

    let svgString = (await loadSvg("levels/" + levelname + ".svg")).asText();
    let svgId = "mainsvg";
    let svgElement = document.getElementById(svgId);
    svgElement.outerHTML = svgString;

    let s = SVG(document.getElementById(svgId));

    let heightMap = await loadLevelJson("levels/" + levelname + ".json");
    let gameData = createGameData(heightMap);

    let layers = createLayers();
    let viewPort = createViewPort(svgId, layers, heightMap);
    
    let view = createView(viewPort, s, layers);
    let gameLoop = GameLoop(stepState, view.update);
    
    let keyboardinput = KeyboardInput();
    gameData.player.pos.y = gameData.heightMap.get(gameData.player.pos.x);
    keyboardinput.onKeyDown(39, () => { gameData.input.rotateRight = true; });
    keyboardinput.onKeyUp(39, () => { gameData.input.rotateRight = false; });
    keyboardinput.onKeyDown(37, () => { gameData.input.rotateLeft = true; });
    keyboardinput.onKeyUp(37, () => { gameData.input.rotateLeft = false; });
    keyboardinput.onKeyDown(38, () => { gameData.input.jump = true; });
    keyboardinput.onKeyUp(38, () => { gameData.input.jump = false; });
    
    view.setup();
    gameLoop.start(gameData);
};

const startEditMode = () => {
    let svgId = "mainsvg";
    let s = SVG(document.getElementById(svgId));

    let layers = createLayers();

    let heightMap = createHeightMap(2500);
    let viewPort = createViewPort(svgId, layers, heightMap);
    
    // Editor
    let pathDrawer = createPathDrawer(s, heightMap, layers);
    let editor = Editor(createGameData(heightMap), viewPort, pathDrawer);    

    // Game
    let view = createView(viewPort, s, layers);
    let gameLoop = GameLoop(stepState, view.update);

    let temporaryKeyboardInput = KeyboardInput();
    // Toggle Game/Editor
    KeyboardInput().onKeyDown(32, () => {   // Space
        temporaryKeyboardInput.off();

        let editorVisible = editor.toggle();
        if (editorVisible) {
            gameLoop.stop();
            view.teardown();
        }
        else {
            view.setup();

            let gameData = createGameData(heightMap);
            gameData.player.pos.y = gameData.heightMap.get(gameData.player.pos.x);
            temporaryKeyboardInput.onKeyDown(39, () => { gameData.input.rotateRight = true; });
            temporaryKeyboardInput.onKeyUp(39, () => { gameData.input.rotateRight = false; });
            temporaryKeyboardInput.onKeyDown(37, () => { gameData.input.rotateLeft = true; });
            temporaryKeyboardInput.onKeyUp(37, () => { gameData.input.rotateLeft = false; });
            temporaryKeyboardInput.onKeyDown(38, () => { gameData.input.jump = true; });
            temporaryKeyboardInput.onKeyUp(38, () => { gameData.input.jump = false; });
            gameLoop.start(gameData);
        }
    });

    editor.toggle(true);
};

function main() {

    test();
    let href = window.location.href;

    if (href.search(/\?edit/) > -1) {
        // ENTER EDIT MODE
        startEditMode();
    }
    else {
        // ENTER GAMING MODE
        let levelname = "level";
        if (href.search(/\?level=/) > -1) {
            levelname = href.split("?level=")[1];
        }
        startGame(levelname);
    }
};

main();