import { KeyboardInput } from "./keyboardinput";
import { GameData } from "./defs";

export const GameLoop = (updateGame:(dt:number, gameData:GameData)=>void) => {

    let keyboard = KeyboardInput();
    let animationFrameTimeout:any = null;
    let previousTime:number = 0;
    let gameData:GameData;

    const onFrame = () => {
        let now = Date.now();
        let dt = now - previousTime;
        previousTime = now;
        updateGame(dt, gameData);
        animationFrameTimeout = window.requestAnimationFrame(onFrame);
    };

    const start = (g:GameData) => {
        gameData = g;
        //keyboard.onKeyDown()
        previousTime = Date.now();
        onFrame();
    };

    const stop = () => {
        keyboard.off();
        if (!!animationFrameTimeout) {
            window.cancelAnimationFrame(animationFrameTimeout);
            animationFrameTimeout = null;
        }
    };

    return {
        start,
        stop
    };
};