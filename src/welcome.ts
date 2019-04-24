import { createKeyboardInput } from "./keyboardinput";
import { PLAYER_HEIGHT, PlayerDef, Resources, playerSvgs } from "./defs";
import SVG from "svgjs";
import { loadPlayerSvg } from "./view";
import { loadSvg, loadLevelJson } from "./util";

export const createPlayerDefinitions = ():Array<PlayerDef> => {
    let players = [
        {
            keyMap: {right: 90, left: 81, up: 83},
            accentColor: "#e46167"
        },
        {
            keyMap: {right: 78, left: 86, up: 71},
            accentColor: "#c47ec2"
        },
        {
            keyMap: {right: 39, left: 37, up: 38},
            accentColor: "#48baec"
        },
        {
            keyMap: {right: 104, left: 98, up: 100},
            accentColor: "#78bc78"
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



const preLoadResources = async (resources:Resources) => {
    let ps:Array<Promise<void>> = [];

    const awaitParallel = (f:()=>void) => {
        ps.push(new Promise(async (res) => {
            await f();
            res();
        }));
    };

    awaitParallel(async () => await loadSvg(resources.levelSvg));
    playerSvgs(resources).forEach(playerSvg => {
        awaitParallel(async () => await loadSvg(playerSvg));
    });
    awaitParallel(async () => await loadLevelJson(resources.levelJson));

    await Promise.all(ps);
}

export const welcomeScreen = async (resources:Resources) => {
    let welcomeDiv = makeDiv("welcome loading");
    let keyBoard = createKeyboardInput();

    await preLoadResources(resources);
    welcomeDiv.className = "welcome";
    
    await new Promise(resolve => keyBoard.onKeyDown(32, resolve));

    keyBoard.off();
    welcomeDiv.remove();
};

export const story = async (storyname:string) => {
    let story = makeDiv(storyname);
    let keyBoard = createKeyboardInput();
    
    await new Promise(resolve => keyBoard.onKeyDown(32, resolve));

    keyBoard.off();
    story.remove();
};

export const selectPlayers = async (s:SVG.Doc, resources:Resources) => {
    let story = makeDiv("selectPlayers");

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
            .translate(-2.5 + i*5/3, PLAYER_HEIGHT/2)
            .opacity(0.3)
            .style("color", p.accentColor);
        loadPlayerSvg(g, playerSvgs(resources)[i]);
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
    story.remove();
    return Array.from(participatingPlayers.values());
};