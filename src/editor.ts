import SVG from "svgjs";
import { updateHeightDots, drawHeightPath } from "./editor-graphics";
import { isCloseToPath } from "./util";
import { Point } from "./defs";
import { createViewPort, ViewPort } from "./viewport";
import { MouseInput } from "./mouseinput";

const decayedWeight = (zoomLevel:number) => (distFromFocus:number) => {
    let adjustedDist = distFromFocus / zoomLevel;
    return Math.pow(1.01, -adjustedDist*adjustedDist);
};

export const Editor = (heightMap:Array<number>) => {

    let viewPort = createViewPort("mainsvg");
    let mainSvg:any = document.getElementById("mainsvg");
    let s = SVG(mainSvg);
    
    let editGroup = s.group().id("editgroup").hide();

    let mouseInput = MouseInput(mainSvg);

    const startChangeHeights = (pDown:Point) => {
        let ixFrom = 0;
        let ixTo = heightMap.length;
        let heightMapCopy = [...heightMap];
        let calcWeight = decayedWeight(viewPort.zoomLevel());

        mouseInput.startDragOperation({
            onMouseMove: (pMove:Point) => {
                let yDiff = pMove.y - pDown.y;
                for (let ix = ixFrom; ix < ixTo; ix++) {
                    let w = calcWeight(ix - pDown.x);
                    heightMap[ix] = heightMapCopy[ix] + yDiff*w;
                }
                updateHeightDots(editGroup, heightMap);
            },
            onMouseUp: () => {
                s.select(".dot").each((i, m) => m[i].remove());
                drawHeightPath(editGroup, heightMap);
            }
        });
    };

    const startPanning = (pDown:Point) => {
        let location = viewPort.location();
        mouseInput.startDragOperation({
            onMouseMove: (pMove:Point) => {
                viewPort.location({
                    x:location.x - (pMove.x - pDown.x),
                    y:location.y - (pMove.y - pDown.y)
                });
            },
            onMouseUp: () => {}
        });
    };

    const onMouseDown = (pDown:Point) => {
        let tolerance = 2*viewPort.zoomLevel();
        if (isCloseToPath(pDown, heightMap, tolerance))
        {
           startChangeHeights(pDown); 
        }
        else 
        {
            startPanning(pDown);
        }
    };

    window.addEventListener("keydown", (e:KeyboardEvent) => { 
        if (e.keyCode == 107) {
            viewPort.zoom(0.8);
        }
        else if (e.keyCode == 109) {
            viewPort.zoom(1.25);
        }
    }, true);

    const show = () => {
        drawHeightPath(editGroup, heightMap);
        mouseInput.onMouseDown(onMouseDown);
        editGroup.show();
    };

    const hide = () => {
        mouseInput.off();
        editGroup.hide();
    };

    return {
        show,
        hide
    };
};
