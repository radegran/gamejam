import SVG from "svgjs";
import { LayerDefinition, HeightMap } from "./defs";

export type PathDrawer = ReturnType<typeof createPathDrawer>;

export const createPathDrawer = (s:SVG.Doc, heights:HeightMap, layers:Array<LayerDefinition>) => {

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

const getEditGroup = (s:SVG.Doc, id:string, scale:number):SVG.G => {
    let editGroup = s.select("#" + id).get(0) as SVG.G;
    if (editGroup == null) {
        editGroup = s.group().id(id).opacity(scale === 1 ? 1 : 0.3);
    }
    return editGroup;
};

const drawHeightPath = (editGroup:SVG.G, heights:HeightMap) => {
    let path = editGroup.select(".heightPath").get(0);
    if (path) {
        path.remove();
    }

    let multiplier = heights.smoothEnabled() ? 10 : 1;
    let detailedPath = new Array((heights.count()) * multiplier);

    let maxDepth = -10000;
    for (let ix = 0; ix < heights.count(); ix++) {            
        let j = 0;
        while(j < multiplier) {
            let x = ix + j/multiplier;
            let h = heights.get(x);
            maxDepth = Math.max(maxDepth, h);
            detailedPath[multiplier*ix + j] = [x, h];
            j++;
        }
    }

    // Close the path
    detailedPath.push([detailedPath[detailedPath.length-1][0], maxDepth+1]);
    detailedPath.push([detailedPath[0][0], maxDepth+1]);
    detailedPath.push([detailedPath[0][0], detailedPath[0][1]]);

    editGroup.polyline(detailedPath)
        .addClass("heightPath")
        .fill("#ffaaaa")
        .stroke({width:0.1, color: "red"});
};