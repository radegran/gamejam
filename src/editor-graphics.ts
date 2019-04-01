import SVG from "svgjs";
import { smooth } from "./util";
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

    let multiplier = 10;
    let detailedPath = new Array((heights.count()) * multiplier);

    let maxDepth = -10000;
    for (let ix = 0; ix < heights.count(); ix++) {            
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