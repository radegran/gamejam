import { Player, PlayerDef } from "./defs";

type KeyboardInput = ReturnType<typeof createKeyboardInput>;

export const bindPlayerKeyboardInput = (players:Array<Player>, playerDefs:Array<PlayerDef>, keyboardInput:KeyboardInput) => {
    players.forEach((player, i) => {
        let keyMap = playerDefs[i].keyMap;
        keyboardInput.onKeyDown(keyMap.right, () => { player.input.rotateRight = true; });
        keyboardInput.onKeyUp(keyMap.right, () => { player.input.rotateRight = false; });
        keyboardInput.onKeyDown(keyMap.left, () => { player.input.rotateLeft = true; });
        keyboardInput.onKeyUp(keyMap.left, () => { player.input.rotateLeft = false; });
        keyboardInput.onKeyDown(keyMap.up, () => { player.input.jump = true; });
        keyboardInput.onKeyUp(keyMap.up, () => { player.input.jump = false; });
    });
};

export function createKeyboardInput() {
    
    let addedHandlers = Array<any>();
    let currentKeysDown:any = {};

    const onKeyDown = (keyCode:number, callback:()=>void) => {

        let handlerDown = (e:KeyboardEvent) => {
            if (e.keyCode === keyCode) {
                if (currentKeysDown[keyCode]) {
                    return;
                }
                currentKeysDown[keyCode] = true;
                callback();
            }
        };

        let handlerUp = (e:KeyboardEvent) => {
            if (e.keyCode === keyCode) {
                currentKeysDown[keyCode] = false;
            }
        };

        add("keydown", handlerDown);
        add("keyup", handlerUp);
    };

    const onKeyUp = (keyCode:number, callback:()=>void) => {

        let handler = (e:KeyboardEvent) => {
            if (e.keyCode === keyCode) {
                callback();
            }
        };

        add("keyup", handler);
    };

    const add = (eventName:string, handler:any) => {
        addedHandlers.push([eventName, handler]);
        window.addEventListener(eventName, handler);
    };

    const off = () => {
        currentKeysDown = {};
        let kvp = addedHandlers.pop();
        while (!!kvp) {
            window.removeEventListener(kvp[0], kvp[1]);
            kvp = addedHandlers.pop();
        }
    };

    return {
        onKeyDown,
        onKeyUp,
        off
    };
};