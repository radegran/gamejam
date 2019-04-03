import { GameData, Point, GRAVITY, PLAYER_HEIGHT } from "./defs";
import { smooth } from "./util";

export const stepState = (dt:number, gameData:GameData) => {
    
    let player = gameData.player;
    
    let angleAcc = gameData.input.rotateRight ? -1 : gameData.input.rotateLeft ? 1 : -Math.sign(player.angleVel);
    player.angleVel += 6*angleAcc * dt/1000;
    player.angleVel = Math.max(-10, Math.min(10, player.angleVel));

    let pos = player.pos;
    let vel = player.vel;
    player.angle += player.angleVel * dt/1000;

    vel.y += GRAVITY * dt/1000;
    
    pos.x += vel.x * dt/1000;
    pos.y += vel.y * dt/1000;
    
    let angleVec = p(Math.sin(player.angle), Math.cos(player.angle));
    let feetPos = add(pos, scale(angleVec, PLAYER_HEIGHT/2));

    let throughGround = feetPos.y - smooth(feetPos.x, gameData.heightMap);
    if (throughGround > 0) {
        pos.y -= throughGround;
        
        let delta = 1;
        let slope = (smooth(pos.x + delta/2, gameData.heightMap) - smooth(pos.x - delta/2, gameData.heightMap))/delta;
        let groundTangentUnit = norm(p(delta, slope));
        let groundNormal = p(slope, -delta);
        let movingTowardsGround = dot(vel, groundNormal) < 0;
        
        if (movingTowardsGround) {
            // Tangentize velocity
            let newVel = scale(groundTangentUnit, dot(vel, groundTangentUnit));
            vel.x = newVel.x;
            vel.y = newVel.y;

            // Tangentize angle
            player.angle = -Math.atan(slope/delta);
        }
    }
};

const magnitude = (vec:Point) => {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
};

const add = (vec1:Point, vec2:Point) => p(vec1.x + vec2.x, vec1.y + vec2.y);

const dot = (vec1:Point, vec2:Point) => vec1.x * vec2.x + vec1.y * vec2.y;

const scale = (vec:Point, scalar:number) => p(vec.x * scalar, vec.y * scalar);

const norm = (vec:Point) => scale(vec, 1/magnitude(vec));

const p = (x:number, y:number) => ({x, y});