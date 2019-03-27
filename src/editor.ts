import SVG from "svgjs";
import { updateChangeHeightDots, drawHeightPath } from "./editor-graphics";
import { isCloseToPath } from "./util";
import { Point } from "./defs";
import { ViewPort } from "./viewport";

const decayedWeight = (zoomLevel:number) => (distFromFocus:number) => {
    let adjustedDist = distFromFocus / zoomLevel;
    return Math.pow(1.01, -adjustedDist*adjustedDist);
};

export const Editor = (heightMap:Array<number>) => {

    let viewPort = ViewPort("mainsvg");
    let mainSvg:any = document.getElementById("mainsvg");
    let s = SVG(mainSvg);
    
    let editGroup = s.group().id("editgroup").hide();

    const startModifyHeightPath = (pDown:Point, deviceMapper:any) => {
        let pDownIx = Math.round(pDown.x);
        let ixFrom = 0;
        let ixTo = heightMap.length;
        let heightMapCopy = [...heightMap];
        let calcWeight = decayedWeight(viewPort.zoomLevel());
        
        const mouseMove = (pMove:Point) => {
            let yDiff = pMove.y - pDown.y;
            for (let ix = ixFrom; ix < ixTo; ix++) {
                let w = calcWeight(ix - pDown.x);
                heightMap[ix] = heightMapCopy[ix] + yDiff*w;
            }
            updateChangeHeightDots(editGroup, heightMap);
        };

        const onMouseMove = (e:MouseEvent) => {
            mouseMove(deviceMapper(event2ScreenPoint(e)));
        };

        const mouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", mouseUp);
            s.select(".dot").each((i, m) => m[i].remove());
            drawHeightPath(editGroup, heightMap);
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", mouseUp);
    };

    const startPanning = (pDown:Point, deviceMapper:any) => {

        let v = s.viewbox();
        
        const mouseMove = (pMove:Point) => {
            s.viewbox({
                x: v.x - (pMove.x - pDown.x),
                y: v.y - (pMove.y - pDown.y), 
                width: v.width, 
                height:v.height
            });    
        };

        const onMouseMove = (e:MouseEvent) => {
            mouseMove(deviceMapper(event2ScreenPoint(e)));
            return false;
        };

        const mouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove, true);
            window.removeEventListener("mouseup", mouseUp, true);
        }

        window.addEventListener("mousemove", onMouseMove, true);
        window.addEventListener("mouseup", mouseUp, true);    
    };

    const mouseDown = (pDown:Point, deviceMapper:any) => {
        let tolerance = 2/viewPort.zoomLevel()/viewPort.zoomLevel();
        if (isCloseToPath(pDown, heightMap, tolerance))
        {
            startModifyHeightPath(pDown, deviceMapper);
        }
        else 
        {
            startPanning(pDown, deviceMapper);
        }
    };

    window.addEventListener("mousedown", (e:MouseEvent) => {
        let screenPoint = event2ScreenPoint(e);
        mouseDown(screenPoint2Point(screenPoint), createDeviceMapper(screenPoint));
    });

    window.addEventListener("keydown", (e:KeyboardEvent) => { 
        if (e.keyCode == 107) {
            viewPort.zoom(0.8);
        }
        else if (e.keyCode == 109) {
            viewPort.zoom(1.25);
        }
    }, true);

    const createDeviceMapper = (screenPoint:Point) => {
        let Q = 100;
        let startPoint = screenPoint2Point(screenPoint);
        let startPointQ = screenPoint2Point({x:screenPoint.x + Q, y:screenPoint.y + Q});

        return (screenPointCurrent:Point) => {
            return {
                x: startPoint.x + (startPointQ.x - startPoint.x)*(screenPointCurrent.x - screenPoint.x)/Q,
                y: startPoint.y + (startPointQ.y - startPoint.y)*(screenPointCurrent.y - screenPoint.y)/Q
            };
        };
    };

    const event2ScreenPoint = (e:MouseEvent) : Point => ({x:e.pageX, y:e.pageY});

    var helperPoint = mainSvg.createSVGPoint();

    const screenPoint2Point = (screenPoint:Point) : Point => {
        helperPoint.x = screenPoint.x;
        helperPoint.y = screenPoint.y;
        let svgP = helperPoint.matrixTransform(mainSvg.getScreenCTM().inverse());
        return {x:svgP.x, y:svgP.y};
    };

    drawHeightPath(editGroup, heightMap);

    const show = () => {
        editGroup.show();
    };

    const hide = () => {
        editGroup.hide();
    };

    return {
        show,
        hide
    };
}