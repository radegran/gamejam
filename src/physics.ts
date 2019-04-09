import { GameData, Point, GRAVITY, PLAYER_HEIGHT } from "./defs";

const vecToCenter = (player:GameData["player"]) => {
    return scale(p(-Math.sin(player.angle), -Math.cos(player.angle)), PLAYER_HEIGHT/2);
};

const getAngularAcceleration = (gameData:GameData) => {
    if (gameData.player.touchesGround) {
        return 0;
    }
    if (gameData.input.rotateRight) {
        return -1;
    }
    if (gameData.input.rotateLeft) {
        return 1;
    }
    return -Math.sign(gameData.player.angleVel);
};

export const stepState = (dt:number, gameData:GameData) => {
    let player = gameData.player;
    let heightMap = gameData.heightMap;
    
    let angleAcc = getAngularAcceleration(gameData);
    player.angleVel += 20*angleAcc * dt/1000;
    player.angleVel = Math.max(-10, Math.min(10, player.angleVel));

    let angleDiff = player.angleVel * dt/1000;
    let centerBeforeAngleChange = vecToCenter(player);
    player.angle += angleDiff;
    let centerAfterAngleChange = vecToCenter(player);

    player.pos = add(player.pos, sub(centerBeforeAngleChange, centerAfterAngleChange));
    
    let pos = player.pos;
    let vel = player.vel;
    
    vel.y += GRAVITY * dt/1000;
    
    pos.x += vel.x * dt/1000;
    pos.y += vel.y * dt/1000;
    
    let delta = 1;
    let slope = (heightMap.get(pos.x + delta/2) - heightMap.get(pos.x - delta/2))/delta;
    let groundNormal = p(slope, -delta);
        
    const throughGround = pos.y - heightMap.get(pos.x);
    if (throughGround > -0.1 && gameData.input.jump) {
        player.vel = add(vel, scale(norm(groundNormal), 1));
    } 
    else if (throughGround > 0) {
        pos.y -= throughGround;
        
        let groundTangentUnit = norm(p(delta, slope));
        let movingTowardsGround = dot(vel, groundNormal) < 0;
        
        if (movingTowardsGround) {
            // Tangentize velocity
            let newVel = scale(groundTangentUnit, dot(vel, groundTangentUnit));
            vel.x = newVel.x;
            vel.y = newVel.y;

            // Tangentize angle
            player.angle = -Math.atan(slope/delta);
            player.angleVel = 0;
        }
    }

    let playerCenter = add(pos, vecToCenter(player));
    let lookAheadOffset = 10 * Math.atan(vel.x / 10);
    let playerCenterLookAhead = add(playerCenter, p(lookAheadOffset, 0));

    gameData.camFocus = add(scale(playerCenterLookAhead, 1/30),
                            scale(gameData.camFocus, 29/30));
    gameData.player.touchesGround = throughGround > -0.1;
};

const magnitude = (vec:Point) => {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
};

const add = (vec1:Point, vec2:Point) => p(vec1.x + vec2.x, vec1.y + vec2.y);

const sub = (vec1:Point, vec2:Point) => p(vec1.x - vec2.x, vec1.y - vec2.y);

const dot = (vec1:Point, vec2:Point) => vec1.x * vec2.x + vec1.y * vec2.y;

const scale = (vec:Point, scalar:number) => p(vec.x * scalar, vec.y * scalar);

const norm = (vec:Point) => scale(vec, 1/magnitude(vec));

const p = (x:number, y:number) => ({x, y});