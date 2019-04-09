import { getPartitionLeftRight, Partition } from "./partitioning";

const testPartitions = () => {

    const verify = (message:string, partition:Partition, left:number, right:number) => {
        if (partition.left !== left || partition.right !== right) {
            console.log(message + ": " + partition.left + "," + partition.right + "  expected " + left + "," + right);
        }
    };

    let get = getPartitionLeftRight(500);
    verify(
        "screen width, offset 0.5", 
        get(250, 749, 1), -1, 1);
    verify(
        "screen width*1.5, offset 0", 
        get(0, 749, 1), -2, 1);
    verify(
        "screen width*2, offset 1.5", 
        get(750, 1750, 1), 0, 4);
    verify(
        "screen width, offset 1.5", 
        get(250 + 10*500, 250 + 11*500, 1), 9, 12);
    // scale 0.5
    verify(
        "screen width*10, offset 0, scale 0.5", 
        get(250, 500*10, 0.5), -2, 21);
        
}

export const test = () => {
    testPartitions();
};