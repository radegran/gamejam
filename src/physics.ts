import { GameData, Point, GRAVITY, PLAYER_HEIGHT, Player, HeightMap, PLAYER_WIDTH, VIEWPORT_WIDTH } from "./defs";
import { isStillInTheGame, timeSinceOnlyOnPlayerStillInTheGame, playersSortByRoundWinner } from "./util";
import { placePlayersOnGround } from "./heightmap";

const vecToCenter = (player:Player) => {
    return scale(p(-Math.sin(player.angle), -Math.cos(player.angle)), PLAYER_HEIGHT/2);
};

const getAngularAcceleration = (player:Player) => {
    let input = player.input;
    if (player.touchesGround) {
        return 0;
    }
    if (input.rotateRight) {
        return -1;
    }
    if (input.rotateLeft) {
        return 1;
    }
    return -Math.sign(player.angleVel);
};

const stepPlayerState = (dt:number, player:Player, heightMap:HeightMap) => {

    let angleAcc = getAngularAcceleration(player);
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
    if (throughGround > -0.1 && player.input.jump) {
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
    
    player.touchesGround = throughGround > -0.1;
};

const proj = (vec:Point, onVec:Point) => scale(onVec, dot(vec, onVec));

export const reflect = (vec: Point, normal:Point) => {
    let tangent = p(-normal.y, normal.x);
    let vecProjTangent = proj(vec, tangent);
    let vecProjNormal = proj(vec, normal);
    let result = add(vecProjTangent, scale(vecProjNormal, -1));
    return result;
};

export const collidePlayerPair = (p1:Player, p2:Player) => {
    let diff = sub(p2.pos, p1.pos);
    let dist = magnitude(diff);
    if (dist < PLAYER_WIDTH * 0.7) {
        let velDiff = sub(p1.vel, p2.vel);
        if (dot(velDiff, diff) > 0) {
            // collision!
            let normDiff = scale(diff, 1/dist);
            p1.vel = add(p1.vel, reflect(velDiff, normDiff));
            p2.vel = sub(p2.vel, reflect(velDiff, normDiff));
        }
    }
};

const collidePlayers = (players:Array<Player>) => {
    let numPlayers = players.length;
    players.forEach((p1, p1i) => {
        for (let p2i = p1i + 1; p2i < numPlayers; p2i++) {
            let p2 = players[p2i];
            collidePlayerPair(p1, p2);
        }
    });
};

const calcCamFocus = (player:Player, gameData:GameData) => {
    
    let playerCenter = add(player.pos, vecToCenter(player));
    let currentFocus = gameData.camFocus;

    let W = 5 + Math.pow(2, 10*(timeSinceOnlyOnPlayerStillInTheGame(gameData) / 1000));

    return add(scale(playerCenter, 1/W),
               scale(currentFocus, (W-1)/W));
};

const calcPlayerLead = (players:Array<Player>) => {
    let lead = players[0];
    players.forEach(p => {
        if (p.pos.x > lead.pos.x) {
            lead = p;
        }
    });
    return lead;
};

export const stepState = (dt:number, gameData:GameData) => {
    gameData.elapsedTime += dt;

    let remainingPlayers = gameData.players.filter(isStillInTheGame);

    remainingPlayers.forEach(p => stepPlayerState(dt, p, gameData.heightMap));

    collidePlayers(remainingPlayers);
    
    let playerLead = calcPlayerLead(remainingPlayers);

    gameData.camFocus = calcCamFocus(playerLead, gameData);

    let f = gameData.camFocus;
    remainingPlayers.forEach(p => {
        if (p.accentColor === playerLead.accentColor) {
            return;
        }

        if (p.pos.x < f.x - 0.9*VIEWPORT_WIDTH/2 ||
            p.pos.y > f.y + 0.9*VIEWPORT_WIDTH/2) {
                p.droppedOutTime = gameData.elapsedTime;

                if (remainingPlayers.length == 2) {
                    // We have a winner
                    let playersCopy = playersSortByRoundWinner(gameData.players);
                    playersCopy.forEach((p, i) => {
                        p.score = p.score + playersCopy.length - i - 1;
                        if (p.score >= 10) {
                            gameData.isGameOver = true;
                        }
                    });
                }
            }
    });

    if (remainingPlayers.length === 1) {
        if (timeSinceOnlyOnPlayerStillInTheGame(gameData) > 3000) {
            // Round is done, scores have been shown!
            
            if (!gameData.isGameOver) {
                gameData.players.forEach(p => p.droppedOutTime = -1);
                placePlayersOnGround(gameData.players, gameData.heightMap, gameData.camFocus.x);
            }

        }
    }
};

const magnitude = (vec:Point) => {
    return Math.sqrt(vec.x*vec.x + vec.y*vec.y);
};

const add = (vec1:Point, vec2:Point) => p(vec1.x + vec2.x, vec1.y + vec2.y);

const sub = (vec1:Point, vec2:Point) => p(vec1.x - vec2.x, vec1.y - vec2.y);

const dot = (vec1:Point, vec2:Point) => vec1.x * vec2.x + vec1.y * vec2.y;

const scale = (vec:Point, scalar:number) => p(vec.x * scalar, vec.y * scalar);

const norm = (vec:Point) => scale(vec, 1/magnitude(vec));

export const p = (x:number, y:number) => ({x, y});