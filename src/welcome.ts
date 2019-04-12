import { createKeyboardInput } from "./keyboardinput";
import { PLAYER_HEIGHT, PlayerDef } from "./defs";
import SVG from "svgjs";
import { loadPlayerSvg } from "./view";

export const createPlayerDefinitions = ():Array<PlayerDef> => {
    let players = [
        {
            keyMap: {right: 90, left: 81, up: 83},
            accentColor: "red"
        },
        {
            keyMap: {right: 78, left: 86, up: 71},
            accentColor: "green"
        },
        {
            keyMap: {right: 39, left: 37, up: 38},
            accentColor: "blue"
        },
        {
            keyMap: {right: 104, left: 98, up: 100},
            accentColor: "yellow"
        }
    ];

    return players;
};

const makeDiv = (className:string) => {
    let div = document.createElement("div");
    div.className = className;
    let container = document.getElementsByClassName("aspectRatioChild")[0];
    container.append(div);
    return div;
};

export const welcomeScreen = async () => {
    let welcomeDiv = makeDiv("welcome");
    let keyBoard = createKeyboardInput();

    await new Promise(resolve => keyBoard.onKeyDown(32, resolve));

    keyBoard.off();
    welcomeDiv.remove();
};

export const selectPlayers = async (s:SVG.Doc) => {
    let playerDefs = createPlayerDefinitions();
    let participatingPlayers = new Set<PlayerDef>();
    let keyBoard = createKeyboardInput();
    
    s.viewbox(-5, -5, 10, 10);
    let toCleanup:Array<SVG.G> = [];

    const participate = (p:PlayerDef, g:SVG.G) => () => {
        participatingPlayers.add(p);
        g.opacity(1);
    };

    playerDefs.forEach((p, i) => {

        let g = s.group()
            .translate(-3 + i*6/3, PLAYER_HEIGHT/2)
            .opacity(0.3)
            .style("color", p.accentColor);
        loadPlayerSvg(g);
        toCleanup.push(g);

        let action = participate(p, g);
        keyBoard.onKeyDown(p.keyMap.left, action);
        keyBoard.onKeyDown(p.keyMap.right, action);
        keyBoard.onKeyDown(p.keyMap.up, action);
    })

    await new Promise(resolve => keyBoard.onKeyDown(32, () => {
        let atLeastTwoParticipants = participatingPlayers.size > 1;
        if (atLeastTwoParticipants) {
            resolve();
        }
    }));

    keyBoard.off();
    toCleanup.forEach(elem => elem.remove());
    return Array.from(participatingPlayers.values());
};