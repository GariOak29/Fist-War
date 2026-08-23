// ============================================
// InputManager - 2D Fighting Game Input
// P1: WASD + UIOJKL + B (Energy Beam)
// P2: Arrows + Numpad (or 7/8/9/4/5/6/0) + 0 (Energy Beam)
// Double-tap dash detection, no Z-axis
// ============================================
class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.lastTapTime = {};
        this.dashEvents = { p1: 0, p2: 0 };
        this.dashThreshold = 220;

        // P1 key-to-action mapping
        this.p1Map = {
            'w': 'jump', 's': 'crouch', 'a': 'left', 'd': 'right',
            'u': 'lpunch', 'i': 'rpunch', 'o': 'special1',
            'j': 'lkick', 'k': 'rkick', 'l': 'special2',
            'b': 'beam'
        };

        // P2 key-to-action mapping
        this.p2Map = {
            'ArrowUp': 'jump', 'ArrowDown': 'crouch',
            'ArrowLeft': 'left', 'ArrowRight': 'right',
            'Numpad4': 'lpunch', 'Numpad5': 'rpunch', 'Numpad6': 'special1',
            'Numpad1': 'lkick', 'Numpad2': 'rkick', 'Numpad3': 'special2',
            'Numpad0': 'beam', '0': 'beam', ',': 'beam',
            '7': 'lpunch', '8': 'rpunch', '9': 'special1',
            '4': 'lkick', '5': 'rkick', '6': 'special2'
        };

        this._setup();
    }

    _setup() {
        window.addEventListener('keydown', (e) => {
            const keysToTrack = this._getKeysFromEvent(e);
            keysToTrack.forEach(key => {
                if (!this.keys[key]) {
                    this.justPressed[key] = true;
                    this._detectDash(key);
                }
                this.keys[key] = true;
            });

            if (e.key && typeof e.key === 'string' && e.key.startsWith('Arrow')) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            const keysToTrack = this._getKeysFromEvent(e);
            keysToTrack.forEach(key => {
                this.keys[key] = false;
            });
        });
    }

    _getKeysFromEvent(e) {
        const keys = [];
        if (e.key && e.key.length === 1) {
            keys.push(e.key.toLowerCase());
        } else if (e.key) {
            keys.push(e.key);
        }
        if (e.code) {
            keys.push(e.code);
        }
        return keys;
    }

    _detectDash(key) {
        const now = performance.now();

        if (key === 'a' || key === 'd') {
            const tapKey = 'p1_' + key;
            if (this.lastTapTime[tapKey] && (now - this.lastTapTime[tapKey]) < this.dashThreshold) {
                this.dashEvents.p1 = key === 'd' ? 1 : -1;
            }
            this.lastTapTime[tapKey] = now;
        }

        if (key === 'ArrowLeft' || key === 'ArrowRight') {
            const tapKey = 'p2_' + key;
            if (this.lastTapTime[tapKey] && (now - this.lastTapTime[tapKey]) < this.dashThreshold) {
                this.dashEvents.p2 = key === 'ArrowRight' ? 1 : -1;
            }
            this.lastTapTime[tapKey] = now;
        }
    }

    setSimulatedInput(player, simState) {
        if (!simState) return;
        this.simState = this.simState || {};
        this.simState[player] = Object.assign({}, simState);
    }

    isHeld(player, action) {
        if (this.simState && this.simState[player] && this.simState[player][action]) return true;
        const map = player === 'p1' ? this.p1Map : this.p2Map;
        for (const key in map) {
            if (map[key] === action && this.keys[key]) return true;
        }
        return false;
    }

    isPressed(player, action) {
        if (this.simState && this.simState[player] && this.simState[player][action]) return true;
        const map = player === 'p1' ? this.p1Map : this.p2Map;
        for (const key in map) {
            if (map[key] === action && this.justPressed[key]) {
                return true;
            }
        }
        return false;
    }

    consumePress(player, action) {
        if (this.simState && this.simState[player] && this.simState[player][action]) {
            this.simState[player][action] = false;
            return true;
        }
        const map = player === 'p1' ? this.p1Map : this.p2Map;
        let found = false;
        for (const key in map) {
            if (map[key] === action && this.justPressed[key]) {
                this.justPressed[key] = false;
                found = true;
            }
        }
        return found;
    }

    getDash(player) {
        const dir = this.dashEvents[player];
        this.dashEvents[player] = 0;
        return dir;
    }

    endFrame() {
        this.justPressed = {};
        this.simState = {};
    }
}

window.InputManager = InputManager;
