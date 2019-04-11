import SVG from "svgjs";
import { Point, LayerDefinition, HeightMap, VIEWPORT_WIDTH } from "./defs";

export type ViewPort = ReturnType<typeof createViewPort>;

export const createViewPort = (s:SVG.Doc, layers:Array<LayerDefinition>, heightMap:HeightMap) => {
    
    let zoomLevel = 1;

    s.viewbox({
        x: -VIEWPORT_WIDTH / 2,
        y: -VIEWPORT_WIDTH / 2,
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_WIDTH
    });

    const zoom = (factor:number) => {
        let v = s.viewbox();
        zoomLevel *= factor;
        let newWidth = zoomLevel * VIEWPORT_WIDTH;

        s.viewbox({
            x:v.x + (v.width - newWidth)/2,
            y:v.y + (v.width - newWidth)/2,
            width: newWidth,
            height: newWidth
        });
    };

    const adjustLayerPerspectives = (p:Point) => {
        layers.forEach(layer => {
            let layerSvg = s.select("#" + layer.id).get(0);
            layerSvg.scale(layer.scale, layer.scale, 0, 0);
            layerSvg.translate(p.x*(1-layer.scale), p.y*(1-layer.scale));
        });
    };

    const resetLayerPerspectives = () => {
        layers.forEach(layer => {
            let layerSvg = s.select("#" + layer.id).get(0);
            layerSvg.matrix(1, 0, 0, 1, 0, 0);
        });
    };

    const location = (p?:Point) => {
        let v = s.viewbox();
        if (!!p) {
            s.viewbox({
                x: p.x - v.width/2,
                y: p.y - v.height/2, 
                width: v.width, 
                height:v.height
            });

            adjustLayerPerspectives(p);
        }
        else
        {
            return {x:v.x + v.width/2, y:v.y + v.height/2};
        }
    }

    const setGetZoomLevel = (level?:number) => {
        if (level === undefined) {
            return zoomLevel;
        }
        zoomLevel = level;
        zoom(1);
    };

    const width = () => {
        return s.viewbox().width;
    };

    return {
        width,
        zoom,
        zoomLevel: setGetZoomLevel,
        location,
        adjustLayerPerspectives,
        resetLayerPerspectives
    };
};