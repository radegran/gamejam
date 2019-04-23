import { Editor } from "./editor";
import { createKeyboardInput, bindPlayerKeyboardInput } from "./keyboardinput";
import { GameLoop } from "./gameloop";
import { createGameData, createLayers, GameData, Resources, defineResources } from "./defs";
import { createViewPort } from "./viewport";
import { createPathDrawer } from "./editor-graphics";
import { createHeightMap, resetPlayersOnGround } from "./heightmap";
import { stepState } from "./physics";
import SVG from "svgjs";
import { test } from "./test";
import { createView } from "./view";
import { loadSvg, loadLevelJson, timeSinceOnlyOnPlayerStillInTheGame } from "./util";
import { welcomeScreen, selectPlayers, createPlayerDefinitions, story } from "./welcome";

async function startGame(resources:Resources) {

    let svgId = "mainsvg";
    let svgElement = document.getElementById(svgId);

    await welcomeScreen(resources);
    await story("story-1");

    let playerDefs = await selectPlayers(SVG(svgElement), resources); 

    let loadedSvg = (await loadSvg(resources.levelSvg)).asElement();
    svgElement.replaceWith(loadedSvg);
    let s = SVG(document.getElementById(svgId));

    let heightMap = await loadLevelJson(resources.levelJson);
    
    let layers = createLayers();
    let viewPort = createViewPort(s, layers);
    
    let view = createView(viewPort, s, layers, resources);
    let gameLoop = GameLoop(stepState, view.update);
    
    let keyboardinput = createKeyboardInput();
    let gameData:GameData;

    const RUN = () => {
        gameData = createGameData(heightMap, playerDefs);
        bindPlayerKeyboardInput(gameData.players, playerDefs, keyboardinput);
        view.setup(gameData.players);
        resetPlayersOnGround(gameData.players, heightMap, 1);
        gameLoop.start(gameData);
    };

    RUN();
    
    let k = createKeyboardInput();
    k.onKeyDown(32, () => {   
        if (tryRestartGame(gameData)) {
            view.teardown();
            gameLoop.stop();

            RUN();
        }
    });

};

const tryRestartGame = (gameData:GameData) => {
    if (gameData.isGameOver && timeSinceOnlyOnPlayerStillInTheGame(gameData) > 3000) {
        gameData.isGameOver = false;
        gameData.elapsedTime = 0;
        gameData.players.forEach(p => p.score = 0);
        return true;
    }
    return false;
}

const startEditMode = (resources:Resources) => {
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
    let view = createView(viewPort, s, layers, resources);
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
            let gameData = createGameData(heightMap, defaultPlayers);
            view.setup(gameData.players);
            
            resetPlayersOnGround(gameData.players, heightMap, 1);
            bindPlayerKeyboardInput(gameData.players, defaultPlayers, temporaryKeyboardInput);
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
        startEditMode(defineResources("none"));
    }
    else {
        // ENTER GAMING MODE
        let levelname = "level";
        if (href.search(/\?level=/) > -1) {
            levelname = href.split("?level=")[1];
        }

        startGame(defineResources(levelname));
    }
};

main();