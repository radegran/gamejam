import { ViewPort } from "./viewport";
import SVG from "svgjs";
import { LayerDefinition, Point, GameData, PLAYER_HEIGHT } from "./defs";
import { setupPartitions } from "./partitioning";
import { loadSvg } from "./util";

export const createView = (viewPort:ViewPort, s:SVG.Doc, layers:Array<LayerDefinition>) => {
    
    let playerSvgGroup:SVG.G;
    let previousCamFocus:Point = {x:0, y:0};
    let applyTransition:(from:Point, to:Point)=>void;

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
                //elem.translate(0, 0);
                elem.matrix(1, 0, 0, 1, 0, 0);
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

        playerSvgGroup = (s.select("#player-layer").get(0) as SVG.G).group();

        loadPlayerSvg(playerSvgGroup);    
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

let playerCached:SVGSVGElement; 
export const loadPlayerSvg = async (g:SVG.G) => {
    if (!playerCached) {
        let elem = (await loadSvg("player.svg")).asElement();
        playerCached = elem;
    }
    let elemText = playerCached.getElementsByTagName('g')[0].outerHTML;
    g.svg(elemText);
    let bbox = g.bbox();
    g.scale(PLAYER_HEIGHT/bbox.height, PLAYER_HEIGHT/bbox.height, 0, 0);
};