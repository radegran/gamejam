import { getPartitionLeftRight, Partition } from "./partitioning";
import { createVerify } from "crypto";
import { Point, Player } from "./defs";
import { reflect, p, collidePlayerPair } from "./physics";

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

const testReflect = () => {
    const verifyEqual = (p1: Point, p2:Point) => {
        if (p1.x !== p2.x || p1.y !== p2.y) {
            console.log(p1.x + "," + p1.y + " not equal to " + p2.x + "," + p2.y);
        }
    };

    verifyEqual(p(-1, 0), reflect(p(1, 0), p(1, 0)));
    verifyEqual(p(10, -10), reflect(p(10, 10), p(0, 1)));
    verifyEqual(p(0, -10), reflect(p(10, 0), p(1/Math.sqrt(2), 1/Math.sqrt(2))));
};

const testCollide = () => {
    const verifyEqual = (p1: Point, p2:Point) => {
        if (p1.x !== p2.x || p1.y !== p2.y) {
            console.log(p1.x + "," + p1.y + " not equal to " + p2.x + "," + p2.y);
        }
    };

    const makePlayer = (pos:Point, vel:Point) => {
        let p:Player = {
            droppedOutTime: 1e14,
            accentColor:"a",
            pos,
            vel,
            score: 0,
            angle: 0,
            angleVel: 0,
            touchesGround: false,
            input: {
                rotateLeft: false,
                rotateRight: false,
                jump: false
            }
        }
        return p;
    };

    let p1 = makePlayer(p(0, 0), p(1, 0));
    let p2 = makePlayer(p(0.1, 0), p(0, 0));
    collidePlayerPair(p1, p2);
    verifyEqual(p1.vel, p(0, 0));
    verifyEqual(p2.vel, p(1, 0));
};

export const test = () => {
    testPartitions();
    testReflect();
    testCollide();
};