import { Point, PointCallback} from "./defs";
import SVG from "svgjs";
import { stringify } from "querystring";

export function KeyboardInput() {
    
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