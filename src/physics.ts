import { GameData, Point } from "./defs";
import { smooth } from "./util";

export const stepState = (dt:number, gameData:GameData) => {
    let pos = gameData.player.pos;
    let vel = gameData.player.vel;
    
    const gravity = 10;
    vel.y += dt/1000 * gravity;
    
    pos.x += vel.x*dt/1000;
    pos.y += vel.y*dt/1000;
    
    let throughGround =  pos.y - smooth(pos.x, gameData.heightMap);
    if (throughGround > 0) {
        pos.y -= throughGround;
        
        let delta = 1;
        let slope = (smooth(pos.x + delta/2, gameData.heightMap) - smooth(pos.x - delta/2, gameData.heightMap))/delta;
        let groundTangentUnit = norm(p(delta, slope));
        let groundNormal = p(slope, -delta);
        let movingTowardsGround = dot(vel, groundNormal) < 0;
        
        if (movingTowardsGround) {
            let newVel = scale(groundTangentUnit, dot(vel, groundTangentUnit));
            vel.x = newVel.x;
            vel.y = newVel.y;
        }
    }
};

const magnitude = (vec:Point) => {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
};

const dot = (vec1:Point, vec2:Point) => vec1.x * vec2.x + vec1.y * vec2.y;

const scale = (vec:Point, scalar:number) => p(vec.x * scalar, vec.y * scalar);

const norm = (vec:Point) => scale(vec, 1/magnitude(vec));

const p = (x:number, y:number) => ({x, y});