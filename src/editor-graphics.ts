import SVG from "svgjs";
import { smooth } from "./util";

export const updateHeightDots = (editGroup:SVG.G, heights:Array<number>) => {
    let circles = editGroup.select(".dot");
    heights.forEach((h, index) => {
        let e = circles.get(index);
        if (!e) {
            e = editGroup.circle(0.1)
            .addClass("dot")
            .translate(index, h)
            .fill("red");
        }
        e.translate(index, h);
    })
};

export const drawHeightPath = (editGroup:SVG.G, heights:Array<number>) => {
    let path = editGroup.select(".heightPath").get(0);
    if (path) {
        path.remove();
    }

    let multiplier = 10;
    let detailedPath = new Array((heights.length) * multiplier);

    let maxDepth = -10000;
    for (let ix = 0; ix < heights.length; ix++) {            
        let j = 0;
        while(j < multiplier) {
            let x = ix + j/multiplier;
            let h = smooth(x, heights);
            maxDepth = Math.max(maxDepth, h);
            detailedPath[multiplier*ix + j] = [x, h];
            j++;
        }
    }

    detailedPath[0][1] = maxDepth;
    detailedPath[detailedPath.length-1][1] = maxDepth;
    editGroup.polyline(detailedPath)
        .addClass("heightPath")
        .fill("#ffaaaa")
        .stroke({width:0.1, color: "red"});
};