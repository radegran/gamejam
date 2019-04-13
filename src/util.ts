import { Point, HeightMap, Player, GameData } from "./defs";
import { createHeightMap } from "./heightmap";

export const isCloseToPath = (p:Point, heights:HeightMap, tolerance:number) => {
    let ix = Math.round(p.x);
    if (ix < -tolerance || ix > heights.count() + tolerance) {
        return false;
    }
    return Math.abs(heights.get(p.x) - p.y) < tolerance;
};

export const loadLevelJson = async (levelName:string) => {
    let response = await fetch(levelName);
    let json = await response.json();
    let heightMap = createHeightMap(json.length);
    heightMap.setAll((i:number) => json[i]);
    return heightMap;
};

export const loadSvg = async function(svgUrl:string) {
    let response = await fetch(svgUrl);
    let text = await response.text();
    
    return {
        asElement
    };

    function asElement() {
	    const parser = new DOMParser();
        const parsed = parser.parseFromString(text, 'image/svg+xml');
        return parsed.getElementsByTagName("svg")[0];
    };
};

export const isStillInTheGame = (player:Player) => {
    return player.droppedOutTime < 0;
};

export const timeSinceOnlyOnPlayerStillInTheGame = (gameData:GameData) => {
    let playersStillInTheGame = 0;
    let timeForLastPlayerDroppedOut = 0; 
    let elapsedTime = gameData.elapsedTime;

    gameData.players.forEach(p => {
        let droppedOutTime = p.droppedOutTime;
        if (droppedOutTime < 0) {
            playersStillInTheGame++;
        } else {
            timeForLastPlayerDroppedOut = Math.max(timeForLastPlayerDroppedOut, droppedOutTime);
        }
    });

    return playersStillInTheGame === 1 ? (elapsedTime - timeForLastPlayerDroppedOut) : 0
};