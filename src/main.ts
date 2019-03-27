import {Foo} from "./foo";
import SVG from "svgjs";

function Editor() {
 
    interface Point {
        x:number,
        y:number
    };

    let mainSvg:any = document.getElementById("mainsvg");
    let s = SVG(mainSvg);

    const updateSvgElements = (heights:Array<number>) => {
        heights.forEach((h, index) => {
            let e = s.select("#ix-" + index).get(0);
            if (!e) {
                e = s.circle(0.25)
                .id("ix-" + index)
                .addClass("dot")
                .translate(index, h)
                .fill("#ffaa00");
            }
            e.translate(index, h);
        })
    };

    // interpolate
    const smooth = (x:number, heights:Array<number>) => {
        let x1 = Math.floor(x);
        let fraq = x - x1;

        let x0 = Math.max(0, x1-1);
        let x2 = Math.min(heights.length-1, x1+1);
        let x3 = Math.min(heights.length-1, x1+2);

        const cubic = (x:number) => (3*x*x - x*x*x) / 8;

        return cubic(1 - fraq)*heights[x0] +
            cubic(2 - fraq)*heights[x1] +
            cubic(1 + fraq)*heights[x2] +
            cubic(fraq)*heights[x3];
    };

    const drawHeightPath = (heights:Array<number>) => {
        let path = s.select(".heightPath").get(0);
        if (path) {
            path.remove();
        }

        let multiplier = 10;
        let detailedPath = new Array((heights.length) * multiplier);

        for (let ix = 0; ix < heights.length; ix++) {            
            let j = 0;
            while(j < multiplier) {
                let x = ix + j/multiplier;
                detailedPath[multiplier*ix + j] = [x, smooth(x, heights)];
                j++;
            }
        }

        s.polyline(detailedPath)
            .addClass("heightPath")
            .fill("none")
            .stroke({width:0.25, color: "red"});
    };

    let heightMap = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 0];
    drawHeightPath(heightMap);

    const isCloseToPath = (p:Point, heights:Array<number>) => {
        let ix = Math.round(p.x);
        let tolerance = 3;
        if (ix < -tolerance || ix > heights.length + tolerance) {
            return false;
        }
        ix = Math.max(0, Math.min(heights.length-1, ix));
        return Math.abs(heights[ix] - p.y) < 3;
    };

    const startModifyHeightPath = (pDown:Point, deviceMapper:any) => {
        let pDownIx = Math.round(pDown.x);
        let ixFrom = Math.max(pDownIx-10, 0);
        let ixTo = Math.min(pDownIx + 10, heightMap.length);
        let heightMapCopy = [...heightMap];
        
        const mouseMove = (pMove:Point) => {
            let yDiff = pMove.y - pDown.y;
            for (let ix = ixFrom; ix < ixTo; ix++) {
                let w = Math.pow(1.9, -((ix - pDown.x)*(ix - pDown.x)));
                heightMap[ix] = heightMapCopy[ix] + yDiff*w;
            }
            updateSvgElements(heightMap);
        };

        const onMouseMove = (e:MouseEvent) => {
            mouseMove(deviceMapper(event2ScreenPoint(e)));
        };

        const mouseUp = () => {
            s.off("mousemove", onMouseMove);
            s.off("mouseup", mouseUp);
            s.select(".dot").each((i, m) => m[i].remove());
            drawHeightPath(heightMap);
        }

        s.on("mousemove", onMouseMove);
        s.on("mouseup", mouseUp);
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
        if (isCloseToPath(pDown, heightMap))
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

    window.addEventListener("scroll", (e:any) => { console.log(e) }, true);

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
}

function main() {
    Editor();
}

main();