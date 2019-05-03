import { ViewPort } from "./viewport";
import SVG from "svgjs";
import { LayerDefinition, Point, GameData, PLAYER_HEIGHT, Player, VIEWPORT_WIDTH, PLAYER_WIDTH, Resources, playerSvgs, getMaxScore } from "./defs";
import { setupPartitions } from "./partitioning";
import { loadSvg, isStillInTheGame, timeSinceOnlyOnPlayerStillInTheGame } from "./util";

const showRoundResults = (s:SVG.Doc, viewPort:ViewPort, players:Array<Player>, isGameOver:boolean, resources:Resources) => {
    let elem = s.select(".roundResultsContainer").get(0) as SVG.G;
    if (!elem) {
        elem = s.group().addClass("roundResultsContainer");
        
        let innerElem = elem.group().addClass(isGameOver ? "gameResults" : "roundResults");
        innerElem.group()
            .rect(VIEWPORT_WIDTH*5, VIEWPORT_WIDTH*5)
            .translate(-5*VIEWPORT_WIDTH/2, -5*VIEWPORT_WIDTH/2)
            .opacity(0.8)
            .fill("white");

        let maxScore = getMaxScore(players.length);
        
        // sort, make winner first
        let circleSize = 0.5;
        let rowHeight = PLAYER_HEIGHT * 1.5;
        let leftAlign = -PLAYER_WIDTH - circleSize*maxScore*1.25/2;
        let topAlign = -rowHeight * players.length / 2 + PLAYER_HEIGHT / 2;

        players.forEach((p, i) => {
            let row = innerElem.group().translate(leftAlign, topAlign + i*rowHeight);
            loadPlayerSvg(row.group().style("color", p.accentColor), playerSvgs(resources)[i]);

            let points = row.group();
            for (var i = 0; i < maxScore; i++) {
                let circleSize = 0.5;
                let circle = points.circle(circleSize)
                    .stroke({width:0.05, color: p.accentColor})
                    .fill("transparent")
                    .translate(PLAYER_WIDTH + i*circleSize*1.25, -PLAYER_HEIGHT/2 - circleSize/2);
                if (p.score > i) {
                    circle.fill(p.accentColor);
                }
            }
        });
    }
    
    let location = viewPort.location();
    elem.translate(location.x, location.y);

};

const hideRoundResults = (s:SVG.Doc) => {
    let elem = s.select(".roundResultsContainer").get(0) as SVG.G;
    if (!!elem) {
        elem.remove();
    }
};

export const createView = (viewPort:ViewPort, s:SVG.Doc, layers:Array<LayerDefinition>, resources:Resources) => {
    
    let playerSvgGroups: Array<SVG.G> = [];
    let previousCamFocus:Point = {x:0, y:0};
    let applyTransition:(from:Point, to:Point)=>void;

    const update = (gameData:GameData) => {
        viewPort.location(gameData.camFocus);
        
        if (timeSinceOnlyOnPlayerStillInTheGame(gameData) > 0 || gameData.isGameOver) {
            showRoundResults(s, viewPort, gameData.players, gameData.isGameOver, resources);
        } else {
            hideRoundResults(s);
        }
        
        gameData.players.forEach((player, i) => {
            let g = playerSvgGroups[i];
            if (!isStillInTheGame(player)) {
                g.hide();
                return;
            }

            g.show();
            let playerPos = player.pos;
            g.rotate(180 * -player.angle / Math.PI);
            g.translate(playerPos.x, playerPos.y);
        });

        applyTransition(previousCamFocus, gameData.camFocus);
        previousCamFocus = gameData.camFocus;
    };

    const reset = (location:Point) => {
        layers.forEach(layer => {
            let elem = s.select("#" + layer.id).get(0) as SVG.G;
            if (!!elem) {
                elem.matrix(1, 0, 0, 1, 0, 0);
            }
        });

        viewPort.zoomLevel(1);
        viewPort.location(location);
    };

    const setup = async (gameData:GameData) => {
        reset(gameData.camFocus);

        // Performance: This is about not rendering svg elements that are not visible
        let canvasWidth = s.node.getBoundingClientRect().width;
        applyTransition = setupPartitions(canvasWidth, viewPort.width(), layers, s);

        playerSvgGroups = gameData.players.map((player, i) => {
            let g = (s.select("#player-layer").get(0) as SVG.G).group();
            g.style("color", player.accentColor);
            loadPlayerSvg(g, playerSvgs(resources)[i]);
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

export const loadPlayerSvg = async (g:SVG.G, playerSvg:string) => {
    let elem = (await loadSvg(playerSvg)).asElement();
    let elemText = elem.getElementsByTagName('g')[0].outerHTML;
    let scaleG = g.group();
    let translateG = scaleG.group();
    translateG.svg(elemText);
    let bbox = g.bbox();
    translateG.translate(-(bbox.x2 - bbox.width/2), -bbox.y2);
    scaleG.scale(PLAYER_HEIGHT/bbox.height, 
        PLAYER_HEIGHT/bbox.height, 
        0, 
        0);
};

// cx: 90.29594612121582
// cy: 104.9392204284668
// h: 138.38157653808594
// height: 138.38157653808594
// w: 122.54891204833984
// width: 122.54891204833984
// x: 29.0214900970459
// x2: 151.57040214538574
// y: 35.74843215942383
// y2: 174.13000869750977