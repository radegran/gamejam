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
import { welcomeScreen, selectPlayers, createPlayerDefinitions, story, logo } from "./welcome";

async function startFromLogo(resources:Resources) {
    await logo(resources);
    startFromWelcomeScreen(resources);
};

async function startFromWelcomeScreen(resources:Resources) {
    let svgId = "mainsvg";
    let svgElement = document.getElementById(svgId);

    await welcomeScreen(resources);
    await story("story-1");

    let playerDefs = await selectPlayers(SVG(svgElement), resources); 

    let loadedSvg = (await loadSvg(resources.levelSvg)).asElement();
    svgElement.replaceWith(loadedSvg);
    svgElement = document.getElementById(svgId);
    svgElement.style.opacity = "0";
    let s = SVG(document.getElementById(svgId));

    let heightMap = await loadLevelJson(resources.levelJson);
    
    let layers = createLayers();
    let viewPort = createViewPort(s, layers);
    
    let view = createView(viewPort, s, layers, resources);
    let gameLoop = GameLoop(stepState, view.update, resources);
    
    let keyboardinput = createKeyboardInput();
    let gameData:GameData;

    gameData = createGameData(heightMap, playerDefs);
    bindPlayerKeyboardInput(gameData.players, playerDefs, keyboardinput);
    view.setup(gameData);
    resetPlayersOnGround(gameData.players, heightMap, 1);
    gameLoop.start(gameData);
    resources.sounds.startGame();
    svgElement.style.opacity = "1";

    
    let k = createKeyboardInput();
    k.onKeyDown(32, () => {   
        if (canRestartGame(gameData)) {
            resetGame();
        }
    });

    k.onKeyDown(27,resetGame);

    function resetGame() {
        view.teardown();
        gameLoop.stop();
        s.children().forEach(child => {
            child.remove();
        });
        k.off();
        startFromWelcomeScreen(resources);
    };
};

const canRestartGame = (gameData:GameData) => {
    return gameData.isGameOver && timeSinceOnlyOnPlayerStillInTheGame(gameData) > 3000;
}

const startEditMode = async (resources:Resources) => {
    let svgId = "mainsvg";
    let s = SVG(document.getElementById(svgId));

    let layers = createLayers();

    let heightMap = resources.levelJson ?  await loadLevelJson(resources.levelJson) : createHeightMap(1500);
    let viewPort = createViewPort(s, layers);

    let defaultPlayers = [createPlayerDefinitions()[2]]
    
    // Editor
    let pathDrawer = createPathDrawer(s, heightMap, layers);
    let editor = Editor(createGameData(heightMap, defaultPlayers), viewPort, pathDrawer);    

    // Game
    let view = createView(viewPort, s, layers, resources);
    let gameLoop = GameLoop(stepState, view.update, resources);

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
            gameData.camFocus = viewPort.location();
            view.setup(gameData);
            
            resetPlayersOnGround(gameData.players, heightMap, gameData.camFocus.x);
            bindPlayerKeyboardInput(gameData.players, defaultPlayers, temporaryKeyboardInput);
            gameLoop.start(gameData);
        }
    });

    editor.toggle(true);
};

function getLevelNameOrDefault(fallback?:string) {

    let ret = fallback;
    if (window.location.href.search(/level=/) > -1) {
        ret = window.location.href.split("level=")[1];
    }

    return ret;
}

function main() {

    test();


    if (window.location.href.search(/\?edit/) > -1) {
        // ENTER EDIT MODE
        let levelname = getLevelNameOrDefault("");
        startEditMode(defineResources(levelname));
    }
    else {
        // ENTER GAMING MODE
        let levelname = getLevelNameOrDefault("level");
        startFromLogo(defineResources(levelname));
    }
};

main();