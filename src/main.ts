import {Foo} from "./foo";
import { Editor } from "./editor";
import { KeyboardInput } from "./keyboardinput";
import { GameLoop } from "./gameloop";
import { GameData, LayerDefinition } from "./defs";
import { createViewPort, ViewPort } from "./viewport";
import SVG from "svgjs";
import { smooth } from "./util";
import { createPathDrawer } from "./editor-graphics";

const createHeightMap = (size:number) => {
    let heightMap = new Array(size);
    for (let i = 0; i < size; i++) {
        heightMap[i] = 0;
    }
    return heightMap;
}

const createGameData = (heightMap:Array<number>):GameData => {
    return {
        heightMap,
        player: {
            pos: {x:5, y:0},
            vel: {x:0, y:0},
            angle: 0
        }    
    };
};

const magnitude = (x:number, y:number) => {
    return Math.sqrt(x*x + y*y);
}

const stepState = (dt:number, gameData:GameData) => {
    let pos = gameData.player.pos;
    let vel = gameData.player.vel;

    const gravity = 10;
    vel.y += dt/1000 * gravity;

    pos.x += vel.x*dt/1000;
    pos.y += vel.y*dt/1000;

    let throughGround =  pos.y - smooth(pos.x, gameData.heightMap);
    if (throughGround > 0) {
        pos.y -= throughGround;
        let delta = 1;
        let slope = (smooth(pos.x + delta/2, gameData.heightMap) - smooth(pos.x - delta/2, gameData.heightMap))/delta;
        let absVel = magnitude(vel.x, vel.y);
        let absDir = magnitude(delta, slope);

        let groundNormal = {x:slope/absDir, y:-delta/absDir};
        let groundUnit = {x:delta/absDir, y:slope/absDir};
        let velUnit = {x:vel.x/absVel, y:vel.y/absVel};
        
        let velDotGroundNormal = groundNormal.x*velUnit.x + groundNormal.y*velUnit.y;
        let velDotGroundUnit = groundUnit.x*velUnit.x + groundUnit.y*velUnit.y;
        let movingTowardsGround = velDotGroundNormal < 0;

        if (movingTowardsGround) {
            vel.x = absVel*delta/absDir * velDotGroundUnit;
            vel.y = absVel*slope/absDir * velDotGroundUnit;
        }
    }
    
};

const View = (viewPort:ViewPort, s:SVG.Doc) => {
    
    const playerWidth = 1;
    const playerHeight = 1.5;
    let playerSvg:SVG.Element;

    const update = (dt:number, gameData:GameData) => {
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

const stepGame = (view:any) => (dt:number, gameData:GameData) => {
    stepState(dt, gameData);
    view.update(dt, gameData);
};

const createLayerDefinition = (id:string, scale:number):LayerDefinition => ({
    id,
    scale
});

function main() {
    
    let heightMap = createHeightMap(100);
    let gameData = createGameData(heightMap);

    let svgId = "mainsvg";
    let s = SVG(document.getElementById(svgId));

    let layers:Array<LayerDefinition> = [
        createLayerDefinition("background-layer", 0.3),
        createLayerDefinition("player-layer", 1),
        createLayerDefinition("foreground-layer", 1.2)
    ];

    let pathDrawer = createPathDrawer(s, heightMap, layers)

    let viewPort = createViewPort(svgId);

    let editor = Editor(gameData, viewPort, pathDrawer);    

    let view = View(viewPort, s);

    let gameLoop = GameLoop(stepGame(view));

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
            gameLoop.start(createGameData(editor.getHeightMap()));
        }
    });

    editor.toggle(true);
};

main();