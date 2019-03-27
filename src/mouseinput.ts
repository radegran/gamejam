import { Point, PointCallback} from "./defs";
import SVG from "svgjs";

interface DragOperationSettings {
    onMouseMove: PointCallback,
    onMouseUp: () => void
};

export function MouseInput(mainSvg:any) {
    const helperPoint = mainSvg.createSVGPoint();
    const s = SVG(mainSvg);

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
        s.on("mousedown", (e:MouseEvent) => {
            let svgPoint = domPoint2svgPoint(event2domPoint(e));
            callback(svgPoint);
        });
    };

    const startDragOperation = (settings:DragOperationSettings) => {
        let deviceMapper = createDeviceMapper();

        const mouseMove = (e:MouseEvent) => {
            settings.onMouseMove(deviceMapper(event2domPoint(e)));
        };

        const mouseUp = () => {
            s.off("mousemove", mouseMove);
            s.off("mouseup", mouseUp);
            settings.onMouseUp();
        };

        s.on("mousemove", mouseMove);
        s.on("mouseup", mouseUp);    
    };

    const off = () => {
        throw "TODO"
    };

    return {
        onMouseDown,
        startDragOperation,
        off
    };
};