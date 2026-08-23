// ============================================
// CPU AI Controller - Fighting Game AI
// Handles Player vs CPU & CPU vs CPU gameplay
// Supports Easy, Normal, and Hard difficulty levels
// ============================================
class CPUController {
    constructor(playerId, difficulty = 'normal') {
        this.playerId = playerId; // 'p1' or 'p2'
        this.difficulty = difficulty; // 'easy' | 'normal' | 'hard'
        this.actionTimer = 0;
        this.currentAction = null;
        this.simulatedInput = {
            left: false, right: false, jump: false, crouch: false,
            lpunch: false, rpunch: false, lkick: false, rkick: false,
            special1: false, special2: false, beam: false
        };
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    update(dt, selfPlayer, oppPlayer, combat) {
        this.actionTimer -= dt;

        // Reset frame triggers
        this.simulatedInput.lpunch = false;
        this.simulatedInput.rpunch = false;
        this.simulatedInput.lkick = false;
        this.simulatedInput.rkick = false;
        this.simulatedInput.special1 = false;
        this.simulatedInput.special2 = false;
        this.simulatedInput.beam = false;
        this.simulatedInput.jump = false;

        if (selfPlayer.state === 'ko' || selfPlayer.state === 'hit' || selfPlayer.state === 'juggled') {
            this.simulatedInput.left = false;
            this.simulatedInput.right = false;
            return this.simulatedInput;
        }

        const dist = Math.abs(selfPlayer.position.x - oppPlayer.position.x);
        const selfX = selfPlayer.position.x;
        const oppX = oppPlayer.position.x;
        const toOpponent = oppX > selfX ? 'right' : 'left';
        const awayFromOpponent = oppX > selfX ? 'left' : 'right';

        // Reaction frequencies based on difficulty
        const reactionInterval = this.difficulty === 'easy' ? 0.4 : (this.difficulty === 'normal' ? 0.2 : 0.08);
        const blockProbability = this.difficulty === 'easy' ? 0.25 : (this.difficulty === 'normal' ? 0.6 : 0.85);

        // Defensive Blocking reaction if opponent is attacking
        if (oppPlayer.isAttacking && Math.random() < blockProbability && dist < 5) {
            this.simulatedInput.left = (awayFromOpponent === 'left');
            this.simulatedInput.right = (awayFromOpponent === 'right');
            return this.simulatedInput;
        }

        if (this.actionTimer <= 0) {
            this.actionTimer = reactionInterval + Math.random() * 0.15;

            // Reset movement
            this.simulatedInput.left = false;
            this.simulatedInput.right = false;
            this.simulatedInput.crouch = false;

            // Decision Tree
            if (dist > 5) {
                // Far range: Move closer or use Beam
                if (Math.random() < 0.35 && selfPlayer.meter >= 25) {
                    this.simulatedInput.beam = true;
                } else {
                    this.simulatedInput[toOpponent] = true;
                    if (Math.random() < 0.15) this.simulatedInput.jump = true;
                }
            } else if (dist <= 5 && dist > 2.0) {
                // Mid range: Dash, Jump attack, or Beam
                const rand = Math.random();
                if (rand < 0.4) {
                    this.simulatedInput[toOpponent] = true;
                } else if (rand < 0.65) {
                    this.simulatedInput.beam = true;
                } else if (rand < 0.85) {
                    this.simulatedInput.special1 = true;
                } else {
                    this.simulatedInput.jump = true;
                }
            } else {
                // Close range: Melee combat, combos & Super
                if (selfPlayer.meter >= 100 && Math.random() < 0.7) {
                    this.simulatedInput.special1 = true;
                    this.simulatedInput.special2 = true; // Super combo trigger
                } else {
                    const attacks = ['lpunch', 'rpunch', 'lkick', 'rkick', 'special1', 'special2', 'beam'];
                    const chosen = attacks[Math.floor(Math.random() * attacks.length)];
                    this.simulatedInput[chosen] = true;

                    // Add occasional jump or crouch
                    if (Math.random() < 0.2) this.simulatedInput.crouch = true;
                    if (Math.random() < 0.15) this.simulatedInput.jump = true;
                }
            }
        }

        return this.simulatedInput;
    }
}

window.CPUController = CPUController;
