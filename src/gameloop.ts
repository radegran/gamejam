import { createKeyboardInput } from "./keyboardinput";
import { GameData, Resources } from "./defs";

export const GameLoop = (updateGameState:(dt:number, gameData:GameData, resources:Resources)=>void ,updateGameView:(gameData:GameData)=>void, resources:Resources) => {

    const keyboard = createKeyboardInput();
    const TIME_STEP = 10; 
    let gameData:GameData;
    let animationFrameTimeout:any = null;
    let previousTime:number = -1;

    const onFrame = () => {
        let now = Date.now();
        while (previousTime + TIME_STEP < now) {
            previousTime += TIME_STEP;
            updateGameState(TIME_STEP, gameData, resources);
        }

        updateGameView(gameData);
        animationFrameTimeout = window.requestAnimationFrame(onFrame);
    };

    const start = (g:GameData) => {
        gameData = g;
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