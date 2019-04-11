import { ViewPort } from "./viewport";
import SVG from "svgjs";
import { LayerDefinition, Point, GameData, PLAYER_HEIGHT } from "./defs";
import { setupPartitions } from "./partitioning";
import { loadSvg } from "./util";

export const createView = (viewPort:ViewPort, s:SVG.Doc, layers:Array<LayerDefinition>) => {
    
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