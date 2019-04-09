import SVG from "svgjs";
import { Point, LayerDefinition, HeightMap, VIEWPORT_WIDTH } from "./defs";

export type ViewPort = ReturnType<typeof createViewPort>;

export const createViewPort = (mainSvgId:string, layers:Array<LayerDefinition>, heightMap:HeightMap) => {
    let element:HTMLElement = document.getElementById(mainSvgId);
    let s = SVG(element);

    s.viewbox({
        x: -VIEWPORT_WIDTH / 2,
        y: -VIEWPORT_WIDTH / 2,
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_WIDTH
    });
    let zoomLevel = 1;

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

        let layerBounds = heightMap.bounds();
        let forSweingPartitions = 1;
        
        layers.forEach(layer => {
            let layerSvg = s.select("#" + layer.id).get(0);
            layerSvg.style("transform-origin", (p.x - (layerBounds.width + forSweingPartitions)/2) + "px " + (p.y) + "px");
            layerSvg.scale(layer.scale);
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
        adjustLayerPerspectives
    };
};