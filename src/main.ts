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

const createView = (viewPort:ViewPort, s:SVG.Doc, layers:Array<LayerDefinition>) => {
    
    let playerSvgGroup:SVG.G;
    let playerSvg:SVG.Element;
    let applyTransition:(from:Point, to:Point)=>void;
    let previousCamFocus:Point = {x:0, y:0};

    const update = (gameData:GameData) => {
        let playerPos = gameData.player.pos;
        viewPort.location(gameData.camFocus);

        playerSvgGroup.rotate(180 * -gameData.player.angle / Math.PI);
        playerSvgGroup.translate(playerPos.x, playerPos.y);
        playerSvgGroup.style("color", gameData.player.touchesGround ? "red" : "salmon");
        
        applyTransition(previousCamFocus, gameData.camFocus);
        previousCamFocus = gameData.camFocus;
    };

    const reset = () => {
        layers.forEach(layer => {
            let elem = s.select("#" + layer.id).get(0) as SVG.G;
            if (!!elem) {
                elem.translate(0, 0);
            }
        });

        viewPort.zoomLevel(1);
        viewPort.location({x:0, y:0});
    };

    const setup = async () => {
        reset();

        // Performance: This is about not rendering svg elements that are not visible
        let canvasWidth = s.node.getBoundingClientRect().width;
        applyTransition = setupPartitions(canvasWidth, viewPort.width(), layers, s);

        playerSvgGroup = s.group();
        if (!playerSvg) {
            let elem = (await loadSvg("player.svg")).asElement();
            let elemText = elem.getElementsByTagName('g')[0].outerHTML;
            playerSvgGroup.svg(elemText);
            let bbox = playerSvgGroup.bbox();
            playerSvgGroup.scale(PLAYER_HEIGHT/bbox.height);
        }

    };

    const teardown = () => {
        playerSvgGroup.remove();
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

async function loadLevelJson(levelName:string) {
    let response = await fetch(levelName);
    let json = await response.json();
    let heightMap = createHeightMap(json.length);
    heightMap.setAll((i:number) => json[i]);
    return heightMap;
};

const loadSvg = async function(svgUrl:string) {
    let response = await fetch(svgUrl);
    let text = await response.text();
    
    return {
        asText,
        asElement
    };

    function asText() {
        return text;
    };

    function asElement() {
	    const parser = new DOMParser();
        const parsed = parser.parseFromString(text, 'image/svg+xml');
        return parsed;
    };
};

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