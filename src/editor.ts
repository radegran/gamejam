import SVG from "svgjs";
import { PathDrawer } from "./editor-graphics";
import { isCloseToPath } from "./util";
import { Point, LayerDefinition, GameData } from "./defs";
import { createViewPort, ViewPort } from "./viewport";
import { MouseInput } from "./mouseinput";
import { KeyboardInput } from "./keyboardinput";

const decayedWeight = (zoomLevel:number) => (distFromFocus:number) => {
    let adjustedDist = distFromFocus / zoomLevel;
    return Math.pow(1.05, -adjustedDist*adjustedDist);
};

export const Editor = (gamedata:GameData, viewPort:ViewPort, pathDrawer:PathDrawer) => {

    let editorVisible = true;
    let heightMap = gamedata.heightMap;
    let mainSvg:HTMLElement = document.getElementById("mainsvg");
    let s = SVG(mainSvg);

    let mouseInput = MouseInput(mainSvg);
    let keyboardInput = KeyboardInput();

    const startChangeHeights = (pDown:Point) => {
        let ixFrom = 0;
        let ixTo = heightMap.count();
        let heightMapCopy = heightMap.clone();
        let calcWeight = decayedWeight(viewPort.zoomLevel());

        mouseInput.startDragOperation({
            onMouseMove: (pMove:Point) => {
                let yDiff = pMove.y - pDown.y;
                heightMap.setAll((ix:number) => heightMapCopy.get(ix) + yDiff * calcWeight(ix - pDown.x));
                pathDrawer.drawLayerWithScale(scale => scale === 1);
                //updateHeightDots(editGroup, heightMap);
            },
            onMouseUp: () => {
                s.select(".dot").each((i, m) => m[i].remove());
                pathDrawer.drawAllLayers();
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
        let tolerance = viewPort.zoomLevel()/2;
        if (isCloseToPath(pDown, heightMap, tolerance))
        {
           startChangeHeights(pDown);
        }
        else
        {
            startPanning(pDown);
        }
    };

    const onWheel = (e:WheelEvent) => {
        viewPort.zoom(e.deltaY > 0 ? 1/1.1 : 1.1)
    };

    const show = () => {
        pathDrawer.drawAllLayers();
        mouseInput.onMouseDown(onMouseDown);
        window.addEventListener("wheel", onWheel);
        editorVisible = true;
        //editGroup.show();
    };

    const hide = () => {
        mouseInput.off();
        keyboardInput.off();
        window.removeEventListener("wheel", onWheel);
        editorVisible = false;
        //editGroup.hide();
    };

    const toggle = (visible?:boolean) => {
        if (visible !== undefined) {
            visible ? show() : hide();
        }
        else {
            editorVisible ? hide() : show();
        }
        return editorVisible;
    };

    const getHeightMap = () => {
        return heightMap.clone();
    }

    return {
        toggle,
        getHeightMap
    };
};
