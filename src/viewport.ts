import SVG from "svgjs";

export type ViewPort = ReturnType<typeof createViewPort>;

export const createViewPort = (mainSvgId:string) => {
    let element:HTMLElement = document.getElementById(mainSvgId);
    let s = SVG(element);

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

    return {
        zoom,
        zoomLevel: () => { return zoomLevel; }
    };
};