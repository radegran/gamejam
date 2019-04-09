import SVG from "svgjs";
import { Point, LayerDefinition, HeightMap } from "./defs";

export type ViewPort = ReturnType<typeof createViewPort>;

export const createViewPort = (mainSvgId:string, layers:Array<LayerDefinition>, heightMap:HeightMap) => {
    let element:HTMLElement = document.getElementById(mainSvgId);
    let s = SVG(element);

    s.viewbox({
        x:-5,
        y:-10,
        width:20,
        height:20
    });
    let zoomLevel = 1;

    const zoom = (factor:number) => {
        let v = s.viewbox();
        zoomLevel *= factor;
        let newWidth = zoomLevel * 20;

        s.viewbox({
            x:v.x + (v.width - newWidth)/2,
            y:v.y + (v.width - newWidth)/2,
            width: newWidth,
            height: newWidth
        });
    };

    const adjustLayerPerspectives = (p:Point) => {

        let layerBounds = heightMap.bounds();

        layers.forEach(layer => {
            let layerSvg = s.select("#" + layer.id).get(0);
            layerSvg.style("transform-origin", (p.x - layerBounds.width/2) + "px " + (p.y) + "px");
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