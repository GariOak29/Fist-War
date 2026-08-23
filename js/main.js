// ============================================
// Main Game Loop - IRON FIST 2D Pro Fighter
// Manages render loop, home menu options, character selection,
// CPU AI integration, input ticks, HUD updates, and window resize
// ============================================
(function() {
    'use strict';

    window.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('game-container') || document.body;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        // Initialize systems
        const cameraCtrl = new CameraController(window.innerWidth / window.innerHeight);
        const input = new InputManager();
        const audio = new AudioManager();
        const particles = new ParticleSystem(scene);
        const stage = new Stage(scene);

        // Characters
        const p1 = new Character({
            name: 'Jin', type: 'jin',
            color1: 0x1a237e, color2: 0x283593
        }, scene);

        const p2 = new Character({
            name: 'Paul', type: 'paul',
            color1: 0xbf360c, color2: 0xe65100
        }, scene);

        // Combat system
        const combat = new CombatSystem(p1, p2, stage, cameraCtrl, audio, particles);

        // CPU Controllers
        let gameMode = 'pvp'; // 'pvp' | 'pvc' | 'cvc'
        let aiDifficulty = 'normal'; // 'easy' | 'normal' | 'hard'
        const cpu1 = new CPUController('p1', aiDifficulty);
        const cpu2 = new CPUController('p2', aiDifficulty);

        let gameState = 'title'; // 'title'|'playing'|'paused'
        let lastTime = performance.now();

        // HUD Elements
        const hudElements = {
            p1Name: document.querySelector('.p1-name'),
            p2Name: document.querySelector('.p2-name'),
            p1Health: document.getElementById('p1-health'),
            p2Health: document.getElementById('p2-health'),
            p1Ghost: document.getElementById('p1-health-ghost'),
            p2Ghost: document.getElementById('p2-health-ghost'),
            p1Meter: document.getElementById('p1-meter'),
            p2Meter: document.getElementById('p2-meter'),
            p1MeterText: document.getElementById('p1-meter-text'),
            p2MeterText: document.getElementById('p2-meter-text'),
            timer: document.getElementById('timer'),
            roundIndicator: document.getElementById('round-indicator'),
            p1Combo: document.getElementById('p1-combo-display'),
            p2Combo: document.getElementById('p2-combo-display'),
            p1ComboCount: document.getElementById('p1-combo-count'),
            p2ComboCount: document.getElementById('p2-combo-count'),
            p1Wins: document.getElementById('p1-wins'),
            p2Wins: document.getElementById('p2-wins'),
            startScreen: document.getElementById('start-screen'),
            moveList: document.getElementById('move-list'),
            controlsInfo: document.getElementById('controls-info'),
            aiDiffSection: document.getElementById('ai-difficulty-section'),
            p1CharSelect: document.getElementById('p1-char-select'),
            p2CharSelect: document.getElementById('p2-char-select'),
            startFightBtn: document.getElementById('start-fight-btn')
        };

        // ============================================
        // HOME MENU OPTIONS SETUP
        // ============================================
        // Mode Buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                gameMode = btn.dataset.mode;

                if (gameMode === 'pvc' || gameMode === 'cvc') {
                    if (hudElements.aiDiffSection) hudElements.aiDiffSection.style.display = 'flex';
                } else {
                    if (hudElements.aiDiffSection) hudElements.aiDiffSection.style.display = 'none';
                }
            });
        });

        // Difficulty Buttons
        const diffButtons = document.querySelectorAll('.diff-btn');
        diffButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                diffButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                aiDifficulty = btn.dataset.diff;
                cpu1.setDifficulty(aiDifficulty);
                cpu2.setDifficulty(aiDifficulty);
            });
        });

        // Character Select Dropdowns
        if (hudElements.p1CharSelect) {
            hudElements.p1CharSelect.addEventListener('change', (e) => {
                e.stopPropagation();
                p1.setType(e.target.value);
                if (hudElements.p1Name) hudElements.p1Name.textContent = p1.name.toUpperCase();
            });
        }
        if (hudElements.p2CharSelect) {
            hudElements.p2CharSelect.addEventListener('change', (e) => {
                e.stopPropagation();
                p2.setType(e.target.value);
                if (hudElements.p2Name) hudElements.p2Name.textContent = p2.name.toUpperCase();
            });
        }

        // Start Match Button
        if (hudElements.startFightBtn) {
            hudElements.startFightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                startGame();
            });
        }

        let p1GhostHealth = 100;
        let p2GhostHealth = 100;

        function startGame() {
            if (hudElements.p1Name) hudElements.p1Name.textContent = p1.name.toUpperCase();
            if (hudElements.p2Name) hudElements.p2Name.textContent = p2.name.toUpperCase();

            if (gameState === 'title') {
                gameState = 'playing';
                if (hudElements.startScreen) {
                    hudElements.startScreen.style.display = 'none';
                    hudElements.startScreen.classList.remove('active');
                }
                combat.startRound();
            } else if (combat.roundState === 'victory') {
                combat.reset();
            }
        }

        // KEY LISTENERS
        window.addEventListener('keydown', (e) => {
            if (audio.ctx && audio.ctx.state === 'suspended') {
                audio.ctx.resume().catch(() => {});
            }

            if (e.key === 'Enter' || e.key === ' ') {
                startGame();
            }

            if (e.key === 'p' || e.key === 'P') {
                if (gameState === 'playing') gameState = 'paused';
                else if (gameState === 'paused') gameState = 'playing';
            }

            if (e.key === 'r' || e.key === 'R') {
                if (gameState === 'playing' || gameState === 'paused') {
                    combat.reset();
                    gameState = 'playing';
                }
            }

            if (e.key === 'm' || e.key === 'M') {
                if (hudElements.moveList) {
                    const isVisible = hudElements.moveList.style.display !== 'none';
                    hudElements.moveList.style.display = isVisible ? 'none' : 'block';
                }
            }
        });

        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.setSize(w, h);
            cameraCtrl.resize(w, h);
        });

        function updateHUD() {
            if (!hudElements.p1Health) return;

            const h1 = Math.max(0, p1.health);
            const h2 = Math.max(0, p2.health);
            hudElements.p1Health.style.width = h1 + '%';
            hudElements.p2Health.style.width = h2 + '%';

            p1GhostHealth += (h1 - p1GhostHealth) * 0.05;
            p2GhostHealth += (h2 - p2GhostHealth) * 0.05;
            if (hudElements.p1Ghost) hudElements.p1Ghost.style.width = Math.max(h1, p1GhostHealth) + '%';
            if (hudElements.p2Ghost) hudElements.p2Ghost.style.width = Math.max(h2, p2GhostHealth) + '%';

            const m1 = Math.min(100, Math.floor(p1.meter));
            const m2 = Math.min(100, Math.floor(p2.meter));

            if (hudElements.p1Meter) {
                hudElements.p1Meter.style.width = m1 + '%';
                if (m1 >= 100) hudElements.p1Meter.classList.add('full');
                else hudElements.p1Meter.classList.remove('full');
            }
            if (hudElements.p2Meter) {
                hudElements.p2Meter.style.width = m2 + '%';
                if (m2 >= 100) hudElements.p2Meter.classList.add('full');
                else hudElements.p2Meter.classList.remove('full');
            }

            if (hudElements.p1MeterText) {
                hudElements.p1MeterText.textContent = m1 >= 100 ? '⚡ HEAT MAX! ⚡' : 'HEAT ' + m1 + '%';
            }
            if (hudElements.p2MeterText) {
                hudElements.p2MeterText.textContent = m2 >= 100 ? '🔥 HEAT MAX! 🔥' : 'HEAT ' + m2 + '%';
            }

            if (hudElements.timer) {
                hudElements.timer.textContent = Math.ceil(Math.max(0, combat.roundTimer));
            }

            if (hudElements.roundIndicator) {
                hudElements.roundIndicator.textContent = 'ROUND ' + combat.roundNumber;
            }

            if (p1.comboCount >= 2) {
                hudElements.p1Combo.style.display = 'block';
                hudElements.p1ComboCount.textContent = p1.comboCount;
            } else {
                hudElements.p1Combo.style.display = 'none';
            }

            if (p2.comboCount >= 2) {
                hudElements.p2Combo.style.display = 'block';
                hudElements.p2ComboCount.textContent = p2.comboCount;
            } else {
                hudElements.p2Combo.style.display = 'none';
            }

            if (hudElements.p1Wins) hudElements.p1Wins.textContent = '★'.repeat(combat.p1Wins);
            if (hudElements.p2Wins) hudElements.p2Wins.textContent = '★'.repeat(combat.p2Wins);
        }

        function gameLoop() {
            requestAnimationFrame(gameLoop);

            const now = performance.now();
            let dt = (now - lastTime) / 1000;
            lastTime = now;

            if (dt > 1 / 20) dt = 1 / 20;

            if (gameState === 'playing') {
                // Apply CPU inputs depending on game mode
                if (gameMode === 'pvc') {
                    input.setSimulatedInput('p2', cpu2.update(dt, p2, p1, combat));
                } else if (gameMode === 'cvc') {
                    input.setSimulatedInput('p1', cpu1.update(dt, p1, p2, combat));
                    input.setSimulatedInput('p2', cpu2.update(dt, p2, p1, combat));
                }

                combat.update(dt, input);
                p1.update(dt);
                p2.update(dt);
                particles.update(dt);
                stage.update(dt);
                cameraCtrl.update(p1.position, p2.position, dt);
                input.endFrame();
                updateHUD();
            } else if (gameState === 'title') {
                p1.position.set(-2.5, 0, 0);
                p2.position.set(2.5, 0, 0);
                p1.facingRight = true;
                p2.facingRight = false;
                p1.update(dt);
                p2.update(dt);
                cameraCtrl.update(p1.position, p2.position, dt);
                input.endFrame();
            } else if (gameState === 'paused') {
                input.endFrame();
            }

            renderer.render(scene, cameraCtrl.camera);
        }

        // Start loop
        gameLoop();

        window.Game = {
            scene, renderer, combat, p1, p2,
            camera: cameraCtrl, audio, input, particles, stage,
            restart: () => { combat.reset(); gameState = 'playing'; }
        };
    });
})();
