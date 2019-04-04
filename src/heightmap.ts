import { HeightMap } from "./defs";

export const createHeightMap = (size:number) : HeightMap => {
    
    let maxValue:number = 0;
    let minValue:number = 0;
    let heightMap = new Array(size);
    
    for (let i = 0; i < size; i++) {
        heightMap[i] = 0;
    }

    const get = (index:number) => {
        let ix = Math.max(0, Math.min(heightMap.length-1, index));
        return heightMap[ix];
    };

    const setAll = (valueFromIndex:(index:number) => number) => {
        minValue = 10e9;
        maxValue = -10e9;
        for (let i = 0; i < size; i++) {
            let val = valueFromIndex(i);
            minValue = Math.min(minValue, val);
            maxValue = Math.max(maxValue, val);
            heightMap[i] = val;
        }
    };

    const length = () => heightMap.length;

    const clone = () => {
        let copy = createHeightMap(size);
        copy.setAll((i:number) => get(i));
        return copy;
    };

    const bounds = () => {
        return {
            x:0,
            y:minValue,
            width: heightMap.length - 1,
            height:maxValue - minValue 
        };
    };

    return {
        setAll,
        get,
        count: length,
        clone,
        bounds
    };
};