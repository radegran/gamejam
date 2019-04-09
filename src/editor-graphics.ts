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
    let path = editGroup.select(".heightPaths").get(0);
    if (path) {
        path.remove();
    }

    let multiplier = Math.min(scale, 1) * (heights.smoothEnabled() ? 5 : 1);
    let maxDepth = -10000;
    let points = heights.count() * multiplier;
    
    let parts = heights.count() / 20;
    let partList = [];

    for (let partIx = 0; partIx < parts; partIx++) {

        let startIx = Math.floor(points * partIx / parts);
        let endIx = Math.floor(points * (partIx + 1) / parts);

        let part = new Array(endIx - startIx);
        // "<=" constraint for overlapping parts
        for (let ix = startIx; ix <= endIx; ix++) {            
            let x = ix / multiplier;
            let h = heights.get(x);
            maxDepth = Math.max(maxDepth, h);
            part[ix - startIx] = [x, h];
        }
        partList.push(part);
    }

    let polylines = editGroup.group().addClass("heightPaths");

    partList.forEach(part => {
        // Close the path for each part
        const slightoverlap = 1;
        part.push([part[part.length-1][0] + slightoverlap, maxDepth+1]);
        part.push([part[0][0], maxDepth+1]);
        part.push([part[0][0], part[0][1]]);

        polylines.group().polyline(part)// .stroke({width: 0.1, color:"#aa6666"})
        .fill("#ffaaaa");    
    });    
};