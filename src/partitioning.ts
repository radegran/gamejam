import { Point, LayerDefinition } from "./defs";
import SVG from "svgjs";

export interface Partition {
    left: number,
    right: number
};

export const getPartitionLeftRight = (canvasWidth:number) => (canvasLeft:number, canvasRight:number, scale:number) => {

    canvasLeft -= canvasWidth / 2;
    canvasRight -= canvasWidth / 2;

    let partitionLeft = Math.floor(canvasLeft / canvasWidth / scale) - Math.ceil(1 / scale);
    let partitionRight = Math.floor(canvasRight / canvasWidth / scale) + Math.ceil(1 / scale);

    return {
        left: partitionLeft,
        right: partitionRight
    };
};

export const setupPartitions = (canvasWidth:number, viewPortWidth:number, layers:Array<LayerDefinition>, s:SVG.Doc) => {
    
    let partitionTransitions:{[key:string]:Array<()=>void>} = {};
    //let svgLevelWidth = heightMap.count();
    let partitionSvgWidth = viewPortWidth;

    const partitionKey = (from:number, to:number) => from + "->" + to;

    const addPartitionTransition = (from:number, to:number, showHideAction:() => void) => {
        let key = partitionKey(from, to);
        let transition = partitionTransitions[key];
        if (transition === undefined) {
            transition = [];
            partitionTransitions[key] = transition;
        }
        transition.push(showHideAction);
    }

    const svgPointToPartitionNum = (p:Point) => {
        return Math.floor(p.x / partitionSvgWidth);
    };

    const applyTransitionUsingPartitions = (pFrom:number, pTo:number) => {
        if (pFrom !== pTo) {
            let direction = Math.sign(pTo - pFrom);

            for (let pNext = pFrom; pNext !== pTo; pNext += direction) {
                let transition = partitionTransitions[partitionKey(pNext, pNext + direction)];
                if (!!transition) {
                    transition.forEach(action => action());
                }
            }
        }
    };

    const applyTransition = (svgFromPoint:Point, svgToPoint:Point) => {
        let partitionFrom = svgPointToPartitionNum(svgFromPoint); 
        let partitionTo = svgPointToPartitionNum(svgToPoint);
        applyTransitionUsingPartitions(partitionFrom, partitionTo);
    };

    const showAction = (g:SVG.G) => () => g.show(); 
    const hideAction = (g:SVG.G) => () => g.hide(); 
  
    const register = (g:SVG.G, canvasLeft:number, canvasRight:number, scale:number) => {
        let { left, right } = getPartitionLeftRight(canvasWidth)(canvasLeft, canvasRight, scale)

        addPartitionTransition(right, right + 1, hideAction(g));
        addPartitionTransition(right + 1, right, showAction(g));
        addPartitionTransition(left, left - 1, hideAction(g));
        addPartitionTransition(left - 1, left, showAction(g));
    };

    // prepare culling
    layers.forEach(layer => {
        let layerSvg = s.select("#" + layer.id).get(0) as SVG.G;
        let all = layerSvg.select("g");
        for (let i = 0; i < all.length(); i++) {
            let g = all.get(i) as SVG.G;
            if (g.select("g").length() === 0) {
                // g has no child groups
                let rect = g.node.getBoundingClientRect();
                register(g, rect.left, rect.right, layer.scale);
                g.hide();
            }
        }
    });

    // make initial transitions to make items visible from start
    let t = -100;
    while (t < 0) {
        applyTransitionUsingPartitions(t, t+1);
        t++;
    }

    return applyTransition;
}