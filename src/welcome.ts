import { createKeyboardInput } from "./keyboardinput";
import { PLAYER_HEIGHT, PlayerDef, Resources, createSounds, createPlayerDefinitions, staticResources } from "./defs";
import SVG from "svgjs";
import { loadPlayerSvg } from "./view";
import { loadSvg, loadLevelJson } from "./util";

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

    const awaitSound = async (url:string) => {
        return await new Promise<Howl>(res => {
            let howl = new Howl({
                src: url,
                onload: loaded
              });

            function loaded() {
                res(howl);
            }
        });
    }

    awaitParallel(async () => await loadSvg(resources.levelSvg));
    awaitParallel(async () => await loadSvg(staticResources["player1Svg"]));
    awaitParallel(async () => await loadSvg(staticResources["player2Svg"]));
    awaitParallel(async () => await loadSvg(staticResources["player3Svg"]));
    awaitParallel(async () => await loadSvg(staticResources["player4Svg"]));
    awaitParallel(async () => await loadLevelJson(resources.levelJson));
    awaitParallel(async () => await new Promise(res => setTimeout(res, 3000)));

    // //sounds
    var music = new Howl({
        src: resources.music,
        loop: true,
        preload: true,
        volume: 0.6
      });

    resources.sounds = createSounds({
        music,
        collide: await awaitSound(resources.collide),
        jump: await awaitSound(resources.jump),
        pickninja1: await awaitSound(resources.pickninja1),
        pickninja0: await awaitSound(resources.pickninja0),
        gameover: await awaitSound(resources.gameover),
        roundover: await awaitSound(resources.roundover),
        land: await awaitSound(resources.land)
    })

    await Promise.all(ps);
}

export const logo = async (resources:Resources) => {
    let welcomeDiv = makeDiv("logo");
    let aligner = document.querySelector(".aligner");
    aligner.className = "aligner black";
    let keyBoard = createKeyboardInput();
    
    await preLoadResources(resources);

    keyBoard.off();
    aligner.className = "aligner";
    welcomeDiv.remove();
};

const mainWelcomeScreen = async (resources:Resources) => {
    let welcomeDiv = makeDiv("welcome");
    let keyBoard = createKeyboardInput();
    
    resources.sounds.music();
    let pushedButton = await new Promise<number>(resolve => {
        keyBoard.onKeyDown(32, () => resolve(32));
        keyBoard.onKeyDown(73, () => resolve(73));
        keyBoard.onKeyDown(65, () => resolve(65));
    });

    keyBoard.off();
    welcomeDiv.remove();

    return pushedButton;
};

export const welcomeScreen = async (resources:Resources) => {

    let pushedButton:number = 0;
    while (pushedButton !== 32) {
        pushedButton = await mainWelcomeScreen(resources);

        if (pushedButton == 73) {
            await showScreen("instructions");
        } else if (pushedButton == 65) {
            await showScreen("about");
        }
    }
};

export const showScreen = async (screenName:string) => {
    let screen = makeDiv(screenName);
    let keyBoard = createKeyboardInput();
    
    await new Promise(resolve => {
        keyBoard.onKeyDown(32, resolve);
        keyBoard.onKeyDown(27, resolve);
    });

    keyBoard.off();
    screen.remove();
};

export const selectPlayers = async (s:SVG.Doc, resources:Resources) => {
    let story = makeDiv("selectPlayers");

    let playerDefs = createPlayerDefinitions();
    let participatingPlayers = new Set<PlayerDef>();
    let keyBoard = createKeyboardInput();
    
    s.viewbox(-5, -5, 10, 10);
    let toCleanup:Array<SVG.G> = [];

    const participate = (p:PlayerDef, g:SVG.G) => () => {
        if (!participatingPlayers.has(p)) {
            resources.sounds.selectPlayer();
        }
        participatingPlayers.add(p);
        g.opacity(1);
    };

    playerDefs.forEach((p, i) => {
        let g = s.group()
            .translate(-2.5 + i*5/3, PLAYER_HEIGHT/2)
            .opacity(0.3)
            .style("color", p.accentColor);
        loadPlayerSvg(g, p.svgName);
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