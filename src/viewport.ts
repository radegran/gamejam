import SVG from "svgjs";
import { Point } from "./defs";

export type ViewPort = ReturnType<typeof createViewPort>;

export const createViewPort = (mainSvgId:string) => {
    let element:HTMLElement = document.getElementById(mainSvgId);
    let s = SVG(element);

    let zoomLevel = 1;

    const zoom = (factor:number) => {
        let v = s.viewbox();
        zoomLevel *= factor;
        let newWidth = zoomLevel * 20;

        s.viewbox({
            x:v.x + (v.width - newWidth)/2,
            y:v.y + (v.width - newWidth)/2,
            width: newWidth,
            height: newWidth
        });
    };

    const location = (p?:Point) => {
        let v = s.viewbox();
        if (!!p) {
            s.viewbox({
                x: p.x,
                y: p.y, 
                width: v.width, 
                height:v.height
            });    
        }
        else
        {
            return v;
        }
    }

    return {
        zoom,
        zoomLevel: () => { return zoomLevel; },
        location
    };
};