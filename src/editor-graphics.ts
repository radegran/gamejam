import SVG from "svgjs";
import { smooth } from "./util";
import { LayerDefinition } from "./defs";

// export const updateHeightDots = (editGroup:SVG.G, heights:Array<number>) => {
//     let circles = editGroup.select(".dot");
//     heights.forEach((h, index) => {
//         let e = circles.get(index);
//         if (!e) {
//             e = editGroup.circle(0.1)
//             .addClass("dot")
//             .translate(index, h)
//             .fill("red");
//         }
//         e.translate(index, h);
//     })
// };

export type PathDrawer = ReturnType<typeof createPathDrawer>;

export const createPathDrawer = (s:SVG.Doc, heights:Array<number>, layers:Array<LayerDefinition>) => {

    layers.sort((a, b) => a.scale - b.scale);

    const drawAllLayers = () => {
        drawLayerWithScale((_) => true);
    };


    const drawLayerWithScale = (predicate:(scale:number) => boolean) => {
        layers.forEach(def => {
            if (predicate(def.scale)) {
                let group = getEditGroup(s, def.id, def.scale);
                drawHeightPath(group, heights);
            }
        });
    };

    return {
        drawAllLayers,
        drawLayerWithScale
    };
};

export const drawHeightPaths = (s:SVG.Doc, heights:Array<number>)=> {
    let backgroundGroup = getEditGroup(s, "background-layer", 0.3).opacity(0.5);
    let foregroundGroup = getEditGroup(s, "foreground-layer", 1.3).opacity(0.5);
    drawHeightPath(backgroundGroup, heights);    
    drawHeightPathPlayerLayer(s, heights);
    drawHeightPath(foregroundGroup, heights);    
};

export const drawHeightPathPlayerLayer = (s:SVG.Doc, heights:Array<number>) => {
    let editGroup = getEditGroup(s, "player-layer", 1);
    drawHeightPath(editGroup, heights);    
};

const getEditGroup = (s:SVG.Doc, id:string, scale:number):SVG.G => {
    let editGroup = s.select("#" + id).get(0) as SVG.G;
    if (editGroup == null) {
        editGroup = s.group().id(id);
    }
    return editGroup;
};

const drawHeightPath = (editGroup:SVG.G, heights:Array<number>) => {
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