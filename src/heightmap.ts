import { HeightMap } from "./defs";

export const createHeightMap = (size:number) : HeightMap => {
    
    let maxValue:number = 0;
    let minValue:number = 0;
    let heightMap = new Array(size);
    let smooth:any;
    let smoothEnabled_ = false;
    
    for (let i = 0; i < size; i++) {
        heightMap[i] = 0;
    }

    const get = (x:number) => {
        x = Math.max(0, Math.min(heightMap.length-1, x));
        if (smoothEnabled_) {
            return getSmoothValue(x);
        }
        else {
            let floor = Math.floor(x);
            if (floor === x) {
                return heightMap[x];
            }
            
            let fraq = x - floor;
            return (1-fraq)*heightMap[floor] + (fraq)*heightMap[floor+1];
        }
        return smoothEnabled_ ? getSmoothValue(x) : heightMap[Math.round(x)];
    };

    const getSmoothValue = (x:number) => smooth(x);

    const setAll = (valueFromIndex:(index:number) => number) => {
        minValue = 10e9;
        maxValue = -10e9;
        for (let i = 0; i < size; i++) {
            let val = valueFromIndex(i);
            minValue = Math.min(minValue, val);
            maxValue = Math.max(maxValue, val);
            heightMap[i] = val;
        }
        // @ts-ignore
        smooth = window.Smooth(heightMap);
    };

    const length = () => heightMap.length;

    const clone = () => {
        let copy = createHeightMap(size);
        copy.setAll((i:number) => get(i));
        copy.smoothEnabled(smoothEnabled_);
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

    const smoothEnabled = (enable?:boolean) => {
        if (enable === undefined) {
            return smoothEnabled_;
        }
        smoothEnabled_ = enable;
    };

    const serialize = () => {
        return JSON.stringify(heightMap);
    };

    return {
        setAll,
        get,
        count: length,
        clone,
        bounds,
        smoothEnabled: smoothEnabled,
        serialize
    };
};
