// ============================================
// CombatSystem - Pro 2D Fighting Game Physics & Mechanics
// Backward movement fix, Energy Beam, Hitstop,
// Super Art EX Moves, Air Juggles, Wall Bounces
// ============================================
class CombatSystem {
    constructor(p1, p2, stage, camera, audio, particles) {
        this.p1 = p1;
        this.p2 = p2;
        this.stage = stage;
        this.camera = camera;
        this.audio = audio;
        this.particles = particles;

        // Physics
        this.gravity = -28;
        this.walkSpeed = 4.5;
        this.dashSpeed = 14;
        this.jumpForce = 12.5;

        // Mechanics & Hitstop
        this.hitstopTimer = 0;
        this.superFreezeTimer = 0;

        // Round management
        this.roundState = 'intro';
        this.roundTimer = 60;
        this.roundNumber = 1;
        this.maxRounds = 3;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.stateTimer = 0;
        this.koSlowMo = 1;

        // Start positions
        this.p1StartX = -2.5;
        this.p2StartX = 2.5;
    }

    // ============================
    // MAIN UPDATE
    // ============================
    update(dt, input) {
        if (this.superFreezeTimer > 0) {
            this.superFreezeTimer -= dt;
            if (this.superFreezeTimer <= 0) {
                this._hideSuperScreen();
            }
            return;
        }

        if (this.hitstopTimer > 0) {
            this.hitstopTimer -= dt;
            return;
        }

        const effectiveDt = dt * this.koSlowMo;

        switch (this.roundState) {
            case 'intro':
                this._updateIntro(dt);
                break;
            case 'fighting':
                this._updateFighting(effectiveDt, input);
                break;
            case 'ko':
                this._updateKO(dt);
                break;
            case 'round_end':
                this._updateRoundEnd(dt);
                break;
            case 'victory':
                break;
        }
    }

    startRound() {
        this.p1.reset(this.p1StartX);
        this.p2.reset(this.p2StartX);
        this.p1.facingRight = true;
        this.p2.facingRight = false;
        this.roundTimer = 60;
        this.koSlowMo = 1;
        this.roundState = 'intro';
        this.stateTimer = 2.0;

        this._showRoundScreen();
        if (this.audio && this.audio.play) this.audio.play('round_start');
    }

    _updateIntro(dt) {
        this.stateTimer -= dt;
        if (this.stateTimer <= 1.0 && this.stateTimer > 0.5) {
            const fightText = document.getElementById('fight-text');
            if (fightText) fightText.style.display = 'block';
        }
        if (this.stateTimer <= 0) {
            this.roundState = 'fighting';
            this._hideRoundScreen();
        }
    }

    _updateFighting(dt, input) {
        this.roundTimer -= dt;
        if (this.roundTimer <= 0) {
            this.roundTimer = 0;
            this._timeUp();
            return;
        }

        this._processInput(this.p1, 'p1', this.p2, input, dt);
        this._processInput(this.p2, 'p2', this.p1, input, dt);

        this._applyPhysics(this.p1, dt);
        this._applyPhysics(this.p2, dt);

        this.p1.faceOpponent(this.p2.position.x);
        this.p2.faceOpponent(this.p1.position.x);

        this._checkHit(this.p1, this.p2);
        this._checkHit(this.p2, this.p1);

        this._pushApart();

        if (this.p1.health <= 0) this._triggerKO(this.p2, this.p1);
        else if (this.p2.health <= 0) this._triggerKO(this.p1, this.p2);
    }

    _updateKO(dt) {
        this.stateTimer -= dt;
        this.koSlowMo = Math.max(0.2, this.stateTimer / 2);

        this._applyPhysics(this.p1, dt * this.koSlowMo);
        this._applyPhysics(this.p2, dt * this.koSlowMo);

        if (this.stateTimer <= 0) {
            this._hideKOScreen();
            this.roundState = 'round_end';
            this.stateTimer = 2;
        }
    }

    _updateRoundEnd(dt) {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            if (this.p1Wins >= 2) {
                this.roundState = 'victory';
                this._showVictory('JIN WINS MATCH!');
            } else if (this.p2Wins >= 2) {
                this.roundState = 'victory';
                this._showVictory('PAUL WINS MATCH!');
            } else {
                this.roundNumber++;
                this.startRound();
            }
        }
    }

    _triggerKO(winner, loser) {
        this.roundState = 'ko';
        this.stateTimer = 3;
        this.koSlowMo = 0.3;

        if (winner === this.p1) this.p1Wins++;
        else this.p2Wins++;

        if (this.audio && this.audio.play) {
            this.audio.play('ko');
            this.audio.play('cheer');
        }
        if (this.camera && this.camera.shake) this.camera.shake(2.0, 0.6);
        if (this.particles && this.particles.emit) {
            this.particles.emit('ko_explosion', loser.position.clone().add(new THREE.Vector3(0, 1.5, 0)), new THREE.Vector3(0, 1, 0), 35);
        }

        this._showKOScreen(winner === this.p1 ? 'JIN' : 'PAUL');

        const container = document.getElementById('game-container');
        if (container) {
            container.classList.add('screen-shake');
            setTimeout(() => container.classList.remove('screen-shake'), 600);
        }
    }

    _timeUp() {
        if (this.p1.health >= this.p2.health) this._triggerKO(this.p1, this.p2);
        else this._triggerKO(this.p2, this.p1);
    }

    // ============================
    // INPUT & BACKWARD MOVEMENT FIX & ENERGY BEAM
    // ============================
    _processInput(player, playerId, opponent, input, dt) {
        if (player.state === 'ko' || player.state === 'hit' || player.state === 'juggled') return;

        const isSp1 = input.isPressed(playerId, 'special1');
        const isSp2 = input.isPressed(playerId, 'special2');
        const isPunch = input.isPressed(playerId, 'lpunch') || input.isPressed(playerId, 'rpunch');
        const isBeam = input.consumePress(playerId, 'beam') || input.isHeld(playerId, 'beam');

        // === 💥 ENERGY BEAM ATTACK TRIGGER ===
        if (isBeam || (isSp1 && isPunch)) {
            if (!player.isAttacking) {
                player.startAttack('energy_beam', true);
                this._announce('ENERGY BEAM BLAST!');
                if (this.audio && this.audio.play) this.audio.play('special_hit');
                if (this.camera && this.camera.shake) this.camera.shake(1.0, 0.4);
                if (this.particles && this.particles.emit) {
                    this.particles.emit('beam_blast', player.position.clone().add(new THREE.Vector3(player.facingDirection * 1.5, 1.8, 0)), new THREE.Vector3(player.facingDirection, 0, 0), 20);
                }
                return;
            }
        }

        // === SUPER ART EX TRIGGER ===
        if ((isSp1 && isSp2) || (isSp1 && input.isHeld(playerId, 'special2')) || (isSp2 && input.isHeld(playerId, 'special1'))) {
            if (player.meter >= 100 && !player.isAttacking) {
                player.startAttack('super', true);
                this.superFreezeTimer = 0.6;
                this._showSuperScreen(player.name + ' SUPER ART!');
                if (this.audio && this.audio.play) {
                    this.audio.play('ko');
                    this.audio.play('cheer');
                }
                if (this.camera && this.camera.shake) this.camera.shake(1.2, 0.4);
                return;
            }
        }

        // === AERIAL JUMP ATTACKS ===
        if (!player.isGrounded) {
            if (input.consumePress(playerId, 'lpunch') || input.consumePress(playerId, 'rpunch')) {
                player.startAttack('jump_punch');
                this._announce('JUMP PUNCH!');
            } else if (input.consumePress(playerId, 'lkick') || input.consumePress(playerId, 'rkick')) {
                player.startAttack('jump_kick');
                this._announce('FLYING KICK!');
            } else if (input.consumePress(playerId, 'special1') || input.consumePress(playerId, 'special2')) {
                player.startAttack('jump_special');
                this._announce('AIR DIVE SPIKE!');
            }
            return;
        }

        // === BACKWARD MOVEMENT & BLOCKING FIX ===
        const isHoldingBack = this._isHoldingBack(player, playerId, input);
        if (isHoldingBack) {
            player.state = 'blocking';
        } else if (player.state === 'blocking' && !isHoldingBack) {
            player.state = 'idle';
        }

        // === MOVEMENT (LEFT / RIGHT) ===
        let moveX = 0;
        if (input.isHeld(playerId, 'right')) moveX += 1;
        if (input.isHeld(playerId, 'left')) moveX -= 1;

        if (moveX !== 0 && player.isGrounded && !player.isAttacking) {
            player.velocity.x = moveX * this.walkSpeed;
            if (player.state !== 'blocking') {
                player.state = 'walking';
            }
        } else if (player.isGrounded && player.state === 'walking' && !player.isAttacking) {
            player.state = 'idle';
            player.velocity.x = 0;
        }

        // Dash
        const dash = input.getDash(playerId);
        if (dash !== 0 && player.isGrounded && !player.isAttacking) {
            player.velocity.x = dash * this.dashSpeed;
            player.state = 'dashing';
            if (this.audio && this.audio.play) this.audio.play('dash');
            if (this.particles && this.particles.emit) {
                this.particles.emit('dust', player.position.clone(), new THREE.Vector3(-dash, 0.5, 0), 5);
            }
            setTimeout(() => {
                if (player.state === 'dashing') player.state = 'idle';
            }, 200);
        }

        // Crouch
        if (input.isHeld(playerId, 'crouch') && player.isGrounded && !player.isAttacking) {
            player.state = 'crouching';
            player.velocity.x = 0;
        } else if (player.state === 'crouching' && !input.isHeld(playerId, 'crouch')) {
            player.state = 'idle';
        }

        // Jump
        if (input.consumePress(playerId, 'jump') && player.isGrounded && !player.isAttacking) {
            player.velocity.y = this.jumpForce;
            player.isGrounded = false;
            player.state = 'jumping';
            if (this.audio && this.audio.play) this.audio.play('jump');
            return;
        }

        // === GROUND ATTACKS & COMBOS ===
        if (input.consumePress(playerId, 'lpunch')) {
            if (player.isAttacking && player.attackName === 'jab') {
                player.startAttack('straight', true);
                this._announce('1-2 COMBINATION!');
            } else {
                player.startAttack('jab');
            }
        } else if (input.consumePress(playerId, 'rpunch')) {
            if (player.isAttacking && player.attackName === 'jab') {
                player.startAttack('straight', true);
                this._announce('1-2 COMBINATION!');
            } else {
                player.startAttack('straight');
            }
        } else if (input.consumePress(playerId, 'special1')) {
            player.startAttack('special1');
        } else if (input.consumePress(playerId, 'lkick')) {
            player.startAttack('lkick');
        } else if (input.consumePress(playerId, 'rkick')) {
            if (player.isAttacking && player.attackName === 'lkick') {
                player.startAttack('rkick', true);
                this._announce('DEMON SCISSORS!');
            } else {
                player.startAttack('rkick');
            }
        } else if (input.consumePress(playerId, 'special2')) {
            if (player.isAttacking && player.attackName === 'lkick') {
                player.startAttack('special2', true);
                this._announce('HAMMER RAMPAGE!');
            } else {
                player.startAttack('special2');
            }
        }
    }

    _isHoldingBack(player, playerId, input) {
        if (player.facingRight) return input.isHeld(playerId, 'left');
        else return input.isHeld(playerId, 'right');
    }

    // ============================
    // PHYSICS & WALL BOUNCE
    // ============================
    _applyPhysics(player, dt) {
        if (!player.isGrounded) {
            player.velocity.y += this.gravity * dt;
        }

        player.position.x += player.velocity.x * dt;
        player.position.y += player.velocity.y * dt;

        player.position.z = 0;
        player.velocity.z = 0;

        if (player.position.y <= 0) {
            player.position.y = 0;
            if (!player.isGrounded) {
                player.isGrounded = true;
                if (player.state === 'jumping' || player.state === 'juggled' || player.state === 'wallbounce') {
                    player.state = 'idle';
                }
                if (this.audio && this.audio.play) this.audio.play('land');
            }
            player.velocity.y = 0;
        }

        if (player.isGrounded && player.state !== 'walking' && player.state !== 'dashing' && player.state !== 'blocking') {
            player.velocity.x *= 0.85;
            if (Math.abs(player.velocity.x) < 0.1) player.velocity.x = 0;
        }

        const bounds = this.stage.getBounds();
        const minX = bounds.minX + 0.5;
        const maxX = bounds.maxX - 0.5;

        if (player.position.x <= minX) {
            player.position.x = minX;
            if ((player.state === 'hit' || player.state === 'juggled') && Math.abs(player.velocity.x) > 4 && !player.isWallBounced) {
                player.triggerWallBounce(1);
                this._announce('WALL BOUNCE!');
                if (this.audio && this.audio.play) {
                    this.audio.play('counter_hit');
                    this.audio.play('cheer');
                }
                if (this.particles && this.particles.emit) {
                    this.particles.emit('dust', player.position.clone(), new THREE.Vector3(1, 0.5, 0), 12);
                }
            }
        } else if (player.position.x >= maxX) {
            player.position.x = maxX;
            if ((player.state === 'hit' || player.state === 'juggled') && Math.abs(player.velocity.x) > 4 && !player.isWallBounced) {
                player.triggerWallBounce(-1);
                this._announce('WALL BOUNCE!');
                if (this.audio && this.audio.play) {
                    this.audio.play('counter_hit');
                    this.audio.play('cheer');
                }
                if (this.particles && this.particles.emit) {
                    this.particles.emit('dust', player.position.clone(), new THREE.Vector3(-1, 0.5, 0), 12);
                }
            }
        }
    }

    // ============================
    // HIT DETECTION & HITSTOP
    // ============================
    _checkHit(attacker, defender) {
        if (attacker.attackPhase !== 'active') {
            attacker.hitConfirmed = false;
            return;
        }
        if (attacker.hitConfirmed) return;

        const hb = attacker.getWorldHitbox();
        if (!hb) return;

        const db = defender.getBodyBox();

        if (hb.x < db.x + db.w &&
            hb.x + hb.w > db.x &&
            hb.y < db.y + db.h &&
            hb.y + hb.h > db.y) {

            attacker.hitConfirmed = true;

            const contactX = (Math.max(hb.x, db.x) + Math.min(hb.x + hb.w, db.x + db.w)) / 2;
            const contactY = (Math.max(hb.y, db.y) + Math.min(hb.y + hb.h, db.y + db.h)) / 2;
            const contactPt = new THREE.Vector3(contactX, contactY, 0);
            const hitDir = new THREE.Vector3(attacker.facingDirection, 0.5, 0);

            attacker.addMeter(14);

            if (defender.state === 'blocking') {
                const pushDir = attacker.facingDirection;
                defender.takeBlockDamage(hb.damage, pushDir * hb.knockback);
                this.hitstopTimer = 0.04;
                if (this.audio && this.audio.play) this.audio.play('block');
                if (this.particles && this.particles.emit) this.particles.emit('block_spark', contactPt, hitDir, 5);
                if (this.camera && this.camera.shake) this.camera.shake(0.15, 0.1);
                return;
            }

            let damage = hb.damage;
            let isCounter = false;
            if (defender.isAttacking && defender.attackPhase === 'startup') {
                damage = Math.floor(damage * 1.5);
                isCounter = true;
                this._announce('COUNTER HIT!');
            } else if (defender.state === 'juggled') {
                this._announce(attacker.comboCount + 1 + ' HIT JUGGLE!');
            }

            const kbDir = attacker.facingDirection;
            defender.takeDamage(damage, kbDir * hb.knockback, hb.launchY);

            attacker.comboCount++;
            attacker.comboTimer = 1.5;

            this.hitstopTimer = isCounter ? 0.09 : (hb.launchY > 5 ? 0.08 : 0.05);

            if (isCounter) {
                if (this.audio && this.audio.play) {
                    this.audio.play('counter_hit');
                    this.audio.play('cheer');
                }
                if (this.particles && this.particles.emit) this.particles.emit('special_spark', contactPt, hitDir, 18);
                if (this.camera && this.camera.shake) this.camera.shake(0.9, 0.3);
            } else if (hb.sound === 'special_hit' || hb.sound === 'ko') {
                if (this.audio && this.audio.play) {
                    this.audio.play('special_hit');
                    if (hb.launchY > 8) this.audio.play('cheer');
                }
                if (this.particles && this.particles.emit) this.particles.emit('special_spark', contactPt, hitDir, 14);
                if (this.camera && this.camera.shake) this.camera.shake(0.7, 0.25);

                if (attacker.type === 'jin' && attacker.attackName === 'special1') {
                    if (this.particles && this.particles.emit) this.particles.emit('lightning', contactPt, hitDir, 10);
                }
            } else {
                if (this.audio && this.audio.play) this.audio.play(hb.sound || 'punch_light');
                if (this.particles && this.particles.emit) this.particles.emit('hit_spark', contactPt, hitDir, 8);
                if (this.camera && this.camera.shake) this.camera.shake(0.35, 0.15);
            }
        } else {
            if (attacker.attackTimer <= 0.02 && !attacker.hitConfirmed) {
                if (this.audio && this.audio.play) this.audio.play('whiff');
            }
        }
    }

    _pushApart() {
        const minDist = 1.2;
        const dx = this.p1.position.x - this.p2.position.x;
        const dist = Math.abs(dx);
        if (dist < minDist && dist > 0) {
            const push = (minDist - dist) / 2;
            const dir = dx > 0 ? 1 : -1;
            this.p1.position.x += push * dir;
            this.p2.position.x -= push * dir;
        }
    }

    _announce(text) {
        const ann = document.getElementById('announcer-text');
        if (!ann) return;
        ann.textContent = text;
        ann.style.display = 'block';
        ann.classList.remove('announcePop');
        void ann.offsetWidth;
        ann.classList.add('announcePop');

        clearTimeout(this._annTimer);
        this._annTimer = setTimeout(() => {
            ann.style.display = 'none';
        }, 1200);
    }

    _showSuperScreen(title) {
        const screen = document.getElementById('super-screen');
        const text = document.getElementById('super-announce-text');
        if (screen) screen.style.display = 'flex';
        if (text) text.textContent = title;
    }

    _hideSuperScreen() {
        const screen = document.getElementById('super-screen');
        if (screen) screen.style.display = 'none';
    }

    _showRoundScreen() {
        const screen = document.getElementById('round-screen');
        const text = document.getElementById('round-text');
        const fightText = document.getElementById('fight-text');
        if (screen) { screen.style.display = 'flex'; screen.classList.add('active'); }
        if (text) text.textContent = 'ROUND ' + this.roundNumber;
        if (fightText) fightText.style.display = 'none';
    }

    _hideRoundScreen() {
        const screen = document.getElementById('round-screen');
        if (screen) { screen.style.display = 'none'; screen.classList.remove('active'); }
    }

    _showKOScreen(winnerName) {
        const screen = document.getElementById('ko-screen');
        const winText = document.getElementById('winner-text');
        if (screen) { screen.style.display = 'flex'; screen.classList.add('active'); }
        if (winText) winText.textContent = winnerName + ' WINS THE ROUND';
    }

    _hideKOScreen() {
        const screen = document.getElementById('ko-screen');
        if (screen) { screen.style.display = 'none'; screen.classList.remove('active'); }
    }

    _showVictory(text) {
        const screen = document.getElementById('victory-screen');
        const victoryText = document.getElementById('victory-text');
        if (screen) { screen.style.display = 'flex'; screen.classList.add('active'); }
        if (victoryText) victoryText.textContent = text;
    }

    _hideVictory() {
        const screen = document.getElementById('victory-screen');
        if (screen) { screen.style.display = 'none'; screen.classList.remove('active'); }
    }

    reset() {
        this.roundNumber = 1;
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.koSlowMo = 1;
        this.hitstopTimer = 0;
        this.superFreezeTimer = 0;
        this._hideVictory();
        this._hideKOScreen();
        this._hideRoundScreen();
        this._hideSuperScreen();
        this.startRound();
    }
}

window.CombatSystem = CombatSystem;
