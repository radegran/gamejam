import { Editor } from "./editor";
import { KeyboardInput } from "./keyboardinput";
import { GameLoop } from "./gameloop";
import { GameData, LayerDefinition, HeightMap, PLAYER_WIDTH, PLAYER_HEIGHT } from "./defs";
import { createViewPort, ViewPort } from "./viewport";
import { smooth } from "./util";
import { createPathDrawer } from "./editor-graphics";
import { createHeightMap } from "./heightmap";
import { stepState } from "./physics";
import SVG from "svgjs";

const createGameData = (heightMap:HeightMap):GameData => {
    return {
        heightMap,
        player: {
            pos: {x:5, y:0},
            vel: {x:0, y:0},
            angle: 0,
            angleVel: 0
        },
        input: {
            rotateLeft: false,
            rotateRight: false,
            jump: false
        }
    };
};

const createView = (viewPort:ViewPort, s:SVG.Doc) => {
    
    let playerSvg:SVG.Element;

    const update = (gameData:GameData) => {
        let playerPos = gameData.player.pos;
        viewPort.location(playerPos);
        playerSvg.rotate(180 * -gameData.player.angle / Math.PI);
        playerSvg.translate(playerPos.x, playerPos.y);
    };

    const setup = () => {
        playerSvg = s.group().add(
            s.rect(PLAYER_WIDTH, PLAYER_HEIGHT).move(-PLAYER_WIDTH/2, -PLAYER_HEIGHT/2)
            .fill("red")
        );
        
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
    
    let svgId = "mainsvg";
    let s = SVG(document.getElementById(svgId));

    let layers:Array<LayerDefinition> = [
        createLayerDefinition("background-layer", 0.5),
        createLayerDefinition("player-layer", 1),
        createLayerDefinition("foreground-layer", 1.2)
    ];

    let heightMap = createHeightMap(500);
    let viewPort = createViewPort(svgId, layers, heightMap);
    
    // Editor
    let pathDrawer = createPathDrawer(s, heightMap, layers)
    let editor = Editor(createGameData(heightMap), viewPort, pathDrawer);    

    // Game
    let view = createView(viewPort, s);
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
            gameData.player.pos.y = smooth(gameData.player.pos.x, gameData.heightMap);
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

main();