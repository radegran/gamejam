import { ViewPort } from "./viewport";
import SVG from "svgjs";
import { LayerDefinition, Point, GameData, PLAYER_HEIGHT, Player } from "./defs";
import { setupPartitions } from "./partitioning";
import { loadSvg, isStillInTheGame } from "./util";

export const createView = (viewPort:ViewPort, s:SVG.Doc, layers:Array<LayerDefinition>) => {
    
    let playerSvgGroups: Array<SVG.G> = [];
    let previousCamFocus:Point = {x:0, y:0};
    let applyTransition:(from:Point, to:Point)=>void;

    const update = (gameData:GameData) => {
        viewPort.location(gameData.camFocus);
        
        gameData.players.forEach((player, i) => {
            if (!isStillInTheGame(player)) {
                return;
            }

            let playerPos = player.pos;
            let g = playerSvgGroups[i];
            g.rotate(180 * -player.angle / Math.PI);
            g.translate(playerPos.x, playerPos.y);
            g.style("color", player.accentColor);
        });

        applyTransition(previousCamFocus, gameData.camFocus);
        previousCamFocus = gameData.camFocus;
    };

    const reset = () => {
        layers.forEach(layer => {
            let elem = s.select("#" + layer.id).get(0) as SVG.G;
            if (!!elem) {
                elem.matrix(1, 0, 0, 1, 0, 0);
            }
        });

        viewPort.zoomLevel(1);
        viewPort.location({x:0, y:0});
    };

    const setup = async (players:Array<Player>) => {
        reset();

        // Performance: This is about not rendering svg elements that are not visible
        let canvasWidth = s.node.getBoundingClientRect().width;
        applyTransition = setupPartitions(canvasWidth, viewPort.width(), layers, s);

        playerSvgGroups = players.map(_ => {
            let g = (s.select("#player-layer").get(0) as SVG.G).group();
            loadPlayerSvg(g);
            return g;
        });    
    };

    const teardown = () => {
        while (playerSvgGroups.length) {
            playerSvgGroups.pop().remove();
        }
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