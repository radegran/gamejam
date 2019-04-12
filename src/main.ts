import { Editor } from "./editor";
import { createKeyboardInput, bindPlayerKeyboardInput } from "./keyboardinput";
import { GameLoop } from "./gameloop";
import { createGameData, createLayers } from "./defs";
import { createViewPort } from "./viewport";
import { createPathDrawer } from "./editor-graphics";
import { createHeightMap } from "./heightmap";
import { stepState } from "./physics";
import SVG from "svgjs";
import { test } from "./test";
import { createView } from "./view";
import { loadSvg, loadLevelJson } from "./util";
import { welcomeScreen, selectPlayers, createPlayerDefinitions } from "./welcome";

async function startGame(levelname:string) {

    let svgId = "mainsvg";
    let svgElement = document.getElementById(svgId);

    await welcomeScreen();

    let players = await selectPlayers(SVG(svgElement)); 

    let loadedSvg = (await loadSvg("levels/" + levelname + ".svg")).asElement();
    svgElement.replaceWith(loadedSvg);
    let s = SVG(document.getElementById(svgId));

    let heightMap = await loadLevelJson("levels/" + levelname + ".json");
    let gameData = createGameData(heightMap, players);
    
    let layers = createLayers();
    let viewPort = createViewPort(s, layers);
    
    let view = createView(viewPort, s, layers);
    let gameLoop = GameLoop(stepState, view.update);
    
    let keyboardMap = {right: 39, left: 37, up: 38};
    let keyboardinput = createKeyboardInput();
    bindPlayerKeyboardInput(gameData.player, keyboardMap, keyboardinput);
    
    gameData.player.pos.y = gameData.heightMap.get(gameData.player.pos.x);
    view.setup();
    gameLoop.start(gameData);
};

const startEditMode = () => {
    let svgId = "mainsvg";
    let s = SVG(document.getElementById(svgId));

    let layers = createLayers();

    let heightMap = createHeightMap(1500);
    let viewPort = createViewPort(s, layers);

    let defaultPlayers = [createPlayerDefinitions()[2]]
    
    // Editor
    let pathDrawer = createPathDrawer(s, heightMap, layers);
    let editor = Editor(createGameData(heightMap, defaultPlayers), viewPort, pathDrawer);    

    // Game
    let view = createView(viewPort, s, layers);
    let gameLoop = GameLoop(stepState, view.update);

    let temporaryKeyboardInput = createKeyboardInput();
    // Toggle Game/Editor
    createKeyboardInput().onKeyDown(32, () => {   // Space
        temporaryKeyboardInput.off();

        let editorVisible = editor.toggle();
        if (editorVisible) {
            gameLoop.stop();
            view.teardown();
        }
        else {
            view.setup();

            let gameData = createGameData(heightMap, defaultPlayers);
            gameData.player.pos.y = gameData.heightMap.get(gameData.player.pos.x);
            
            let keyboardMap = {right: 39, left: 37, up: 38};
            bindPlayerKeyboardInput(gameData.player, keyboardMap, temporaryKeyboardInput);
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