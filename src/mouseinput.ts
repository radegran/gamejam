import { Point, PointCallback} from "./defs";
import SVG from "svgjs";

interface DragOperationSettings {
    onMouseMove: PointCallback,
    onMouseUp: () => void
};

export function MouseInput(mainSvg:any) {
    const helperPoint = mainSvg.createSVGPoint();
    const s = SVG(mainSvg);
    let internalMouseDownCallback:any;

    const event2domPoint = (e:MouseEvent) : Point => ({x:e.pageX, y:e.pageY});

    const createDeviceMapper = () => {
        let Q = 100;
        let anyPoint = {x:0, y:0};
        let startPoint = domPoint2svgPoint(anyPoint);
        let startPointQ = domPoint2svgPoint({x:anyPoint.x + Q, y:anyPoint.y + Q});

        return (domPoint:Point) => {
            return {
                x: startPoint.x + (startPointQ.x - startPoint.x)*(domPoint.x - anyPoint.x)/Q,
                y: startPoint.y + (startPointQ.y - startPoint.y)*(domPoint.y - anyPoint.y)/Q
            };
        };
    };

    const domPoint2svgPoint = (domPoint:Point) : Point => {
        helperPoint.x = domPoint.x;
        helperPoint.y = domPoint.y;
        return helperPoint.matrixTransform(mainSvg.getScreenCTM().inverse());
    };

    const onMouseDown = (callback:PointCallback) => {
        if (!!internalMouseDownCallback) {
            throw "double trouble callback. (Registered twice)";
        }

        internalMouseDownCallback = (e:MouseEvent) => {
            let svgPoint = domPoint2svgPoint(event2domPoint(e));
            callback(svgPoint);
        };
        s.on("mousedown", internalMouseDownCallback);
    };

    const startDragOperation = (settings:DragOperationSettings) => {
        let deviceMapper = createDeviceMapper();

        const mouseMove = (e:MouseEvent) => {
            settings.onMouseMove(deviceMapper(event2domPoint(e)));
        };

        const mouseUp = () => {
            window.removeEventListener("mousemove", mouseMove, true);
            window.removeEventListener("mouseup", mouseUp, true);
            settings.onMouseUp();
        };

        window.addEventListener("mousemove", mouseMove, true);
        window.addEventListener("mouseup", mouseUp, true);    
    };

    const off = () => {
        s.off("mousedown", internalMouseDownCallback);
        internalMouseDownCallback = null;
    };

    return {
        onMouseDown,
        startDragOperation,
        off
    };
};