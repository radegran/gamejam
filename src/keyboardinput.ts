import { Player, KeyboardMap } from "./defs";

type KeyboardInput = ReturnType<typeof createKeyboardInput>;

export const bindPlayerKeyboardInput = (player:Player, keyMap:KeyboardMap, keyboardInput:KeyboardInput) => {
    keyboardInput.onKeyDown(keyMap.right, () => { player.input.rotateRight = true; });
    keyboardInput.onKeyUp(keyMap.right, () => { player.input.rotateRight = false; });
    keyboardInput.onKeyDown(keyMap.left, () => { player.input.rotateLeft = true; });
    keyboardInput.onKeyUp(keyMap.left, () => { player.input.rotateLeft = false; });
    keyboardInput.onKeyDown(keyMap.up, () => { player.input.jump = true; });
    keyboardInput.onKeyUp(keyMap.up, () => { player.input.jump = false; });
};

export function createKeyboardInput() {
    
    let addedHandlers = Array<any>();

    const onKeyDown = (keyCode:number, callback:()=>void) => {

        let handler = (e:KeyboardEvent) => {
            if (e.keyCode === keyCode) {
                callback();
            }
        };

        add("keydown", handler);
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