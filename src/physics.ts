import { GameData, Point, GRAVITY, PLAYER_HEIGHT, Player, HeightMap, PLAYER_WIDTH, VIEWPORT_WIDTH, Resources } from "./defs";
import { isStillInTheGame, timeSinceOnlyOnPlayerStillInTheGame, playersSortByRoundWinner } from "./util";
import { resetPlayersOnGround } from "./heightmap";

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

const stepPlayerState = (dt:number, player:Player, heightMap:HeightMap, resources:Resources) => {

    let pos = player.pos;
    let vel = player.vel;
    const input = player.input;
    
    // step physics
    vel.y += GRAVITY * dt/1000;    
    pos = add(pos, scale(vel, dt/1000));

    // env
    const delta = 1;
    const slope = (heightMap.get(pos.x + delta/2) - heightMap.get(pos.x - delta/2))/delta;
    const groundNormal = p(slope, -delta);
    const groundTangentUnit = norm(p(delta, slope));
    const tangentAngle = -Math.atan(slope/delta);
    const throughGround = pos.y - heightMap.get(pos.x);
    
    // collide ground
    if (throughGround >= 0) {
        player.hasJumped = false;
        pos.y -= throughGround;
                
        let velDotGroundNormal = dot(vel, groundNormal);
        let movingTowardsGround = velDotGroundNormal < 0;
        
        if (movingTowardsGround) {        
            // Tangentize velocity
            let newVel = scale(groundTangentUnit, dot(vel, groundTangentUnit));
            vel.x = newVel.x;
            vel.y = newVel.y;
        }

        if (input.jump) {
            resources.sounds.jump();
            player.hasJumped = true;
            let jumpVec = scale(norm(groundNormal), 5);
            let slowDownVec = scale(groundTangentUnit, -1/4);
            vel = add(vel, add(jumpVec, slowDownVec));            
        } else {
            // Tangentize angle when not jumping
            let W = 5;
            player.angle = 1/W * tangentAngle + (W-1)/W * player.angle;
            player.angleVel = 0;
        }
    } else {
        // air time!
        if (player.hasJumped) {
            let targetAngle = input.rotateLeft ? Math.PI/6 :
            input.rotateRight ? -Math.PI/6 :
            0;
            
            player.angleVel = 10*(targetAngle - player.angle);
            
            let angleDiff = player.angleVel * dt/1000;
            let toCenterBeforeAngleChange = vecToCenter(player);
            player.angle += angleDiff;
            let toCenterAfterAngleChange = vecToCenter(player);
        
            pos = add(pos, sub(toCenterBeforeAngleChange, toCenterAfterAngleChange));
        }
    }
    
    acceleratePlayerRightLeft(player, throughGround, groundTangentUnit, dt);

    player.touchesGround = throughGround >= 0;
    player.pos = pos;
    player.vel = vel;
};

const acceleratePlayerRightLeft = (player:Player, throughGround:number, groundTangentUnit:Point, dt:number) => {

    // 0 -> go right
    // 1 -> go tangent
    let W = Math.max(-1, Math.min(0, throughGround)) + 1;

    let direction = add(scale(groundTangentUnit, W),
                        scale(p(1, 0), (1 - W)));

    let maxThrottle = 10;
    let arrowAcc = 10;
    if (player.input.rotateRight) {
        player.vel.x += Math.max(0, Math.sign(maxThrottle - player.vel.x)) * direction.x * arrowAcc*dt/1000;
        player.vel.y += Math.max(0, Math.sign(maxThrottle - player.vel.y)) * direction.y * arrowAcc*dt/1000;
    }
    if (player.input.rotateLeft) {
        player.vel.x -= Math.max(0, Math.sign(maxThrottle + player.vel.x)) * direction.x * arrowAcc*dt/1000;
        player.vel.y -= Math.max(0, Math.sign(maxThrottle + player.vel.y)) * direction.y * arrowAcc*dt/1000;
    }
};

const stepPlayerState_orig = (dt:number, player:Player, heightMap:HeightMap) => {

    let angleAcc = getAngularAcceleration(player);
    player.angleVel += 20*angleAcc * dt/1000;
    player.angleVel = Math.max(-10, Math.min(10, player.angleVel));

    let angleDiff = player.angleVel * dt/1000;
    let toCenterBeforeAngleChange = vecToCenter(player);
    player.angle += angleDiff;
    let toCenterAfterAngleChange = vecToCenter(player);

    player.pos = add(player.pos, sub(toCenterBeforeAngleChange, toCenterAfterAngleChange));
    
    let pos = player.pos;
    let vel = player.vel;
    
    vel.y += GRAVITY * dt/1000;
    
    pos.x += vel.x * dt/1000;
    pos.y += vel.y * dt/1000;
    
    let delta = 1;
    let slope = (heightMap.get(pos.x + delta/2) - heightMap.get(pos.x - delta/2))/delta;
    let groundNormal = p(slope, -delta);
        
    const posCenter = add(pos, toCenterAfterAngleChange);
    const centerThroughGround = posCenter.y - heightMap.get(posCenter.y);
    const throughGround = pos.y - heightMap.get(pos.x);

    if (throughGround >= 0) {
        pos.y -= throughGround;
        
        let groundTangentUnit = norm(p(delta, slope));
        let movingTowardsGround = dot(vel, groundNormal) < 0;
        
        let flip360Forward = false;
        let tangentAngle = -Math.atan(slope/delta);

        if (movingTowardsGround) {
            // Tangentize velocity
            let newVel = scale(groundTangentUnit, dot(vel, groundTangentUnit));
            vel.x = newVel.x;
            vel.y = newVel.y;

            let airTimeRevolutions = Math.round((player.angle - tangentAngle) / (2*Math.PI));
            flip360Forward = airTimeRevolutions === -1;
            player.angle += -airTimeRevolutions * 2*Math.PI;
        }

        if (player.input.jump) {
            let jumpVec = scale(norm(groundNormal), 5);
            let slowDownVec = scale(groundTangentUnit, -1/4);
            player.vel = add(player.vel, add(jumpVec, slowDownVec));            
        } else {
            // Tangentize angle when not jumping
            let W = 5;
            player.angle = 1/W * tangentAngle + (W-1)/W * player.angle;
            player.angleVel = 0;
        }

        if (player.input.rotateRight) {
            player.vel = add(player.vel, p(2*dt/1000, 0));
        }
        if (player.input.rotateLeft) {
            player.vel = add(player.vel, p(-2*dt/1000, 0));
        }
    }
    
    player.touchesGround = throughGround >= 0;
};

const proj = (vec:Point, onVec:Point) => scale(onVec, dot(vec, onVec));

export const reflect = (vec: Point, normal:Point) => {
    let tangent = p(-normal.y, normal.x);
    let vecProjTangent = proj(vec, tangent);
    let vecProjNormal = proj(vec, normal);
    let result = add(vecProjTangent, scale(vecProjNormal, -1));
    return result;
};

export const collidePlayerPair = (p1:Player, p2:Player, resources:Resources) => {
    let diff = sub(p2.pos, p1.pos);
    let dist = magnitude(diff);
    if (dist < PLAYER_WIDTH * 0.7) {
        let velDiff = sub(p1.vel, p2.vel);
        if (dot(velDiff, diff) > 0) {
            // collision!
            resources.sounds.collide();
            let normDiff = scale(diff, 1/dist);
            p1.vel = add(p1.vel, reflect(velDiff, normDiff));
            p2.vel = sub(p2.vel, reflect(velDiff, normDiff));
        }
    }
};

const collidePlayers = (players:Array<Player>, resources:Resources) => {
    let numPlayers = players.length;
    players.forEach((p1, p1i) => {
        for (let p2i = p1i + 1; p2i < numPlayers; p2i++) {
            let p2 = players[p2i];
            collidePlayerPair(p1, p2, resources);
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

export const stepState = (dt:number, gameData:GameData, resources:Resources) => {
    gameData.elapsedTime += dt;

    let remainingPlayers = gameData.players.filter(isStillInTheGame);

    remainingPlayers.forEach(p => stepPlayerState(dt, p, gameData.heightMap, resources));

    collidePlayers(remainingPlayers, resources);
    
    let playerLead = calcPlayerLead(remainingPlayers);

    if (playerLead.pos.x > gameData.heightMap.count()) {
        resources.sounds.startGame();
        resetPlayersOnGround(gameData.players, gameData.heightMap, 1);
        return;
    }

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

                    if (gameData.isGameOver) {
                        resources.sounds.gameover();
                    } else {
                        resources.sounds.roundover();
                    }
                }
            }
    });

    if (remainingPlayers.length === 1) {
        if (timeSinceOnlyOnPlayerStillInTheGame(gameData) > 3000) {
            // Round is done, scores have been shown!
            
            if (!gameData.isGameOver) {
                resetPlayersOnGround(gameData.players, gameData.heightMap, gameData.camFocus.x);
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