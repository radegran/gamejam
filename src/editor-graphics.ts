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
                drawHeightPath(group, heights, def.scale);
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

const drawHeightPath = (editGroup:SVG.G, heights:HeightMap, scale:number) => {
    let path = editGroup.select(".heightPath").get(0);
    if (path) {
        path.remove();
    }

    let multiplier = Math.min(scale, 1) * (heights.smoothEnabled() ? 5 : 1);
    let points = heights.count() * multiplier;
    let detailedPath = new Array(Math.ceil(points));

    let maxDepth = -10000;
    for (let ix = 0; ix < points; ix++) {            
        let x = ix / multiplier;
        let h = heights.get(x);
        maxDepth = Math.max(maxDepth, h);
        detailedPath[ix] = [x, h];
    }

    // Close the path
    detailedPath.push([detailedPath[detailedPath.length-1][0], maxDepth+1]);
    detailedPath.push([detailedPath[0][0], maxDepth+1]);
    detailedPath.push([detailedPath[0][0], detailedPath[0][1]]);

    editGroup.polyline(detailedPath)
        .addClass("heightPath")
        .fill("#ffaaaa");
};