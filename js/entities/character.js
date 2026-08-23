// ============================================
// Character - Blocky 3D Fighter (Energy Beam & Facing Fix)
// 3D Energy Beam Attack mesh attached to hands
// Proper local +Z forward extension
// ============================================
class Character {
    constructor(config, scene) {
        this.config = config;
        this.name = config.name || 'Fighter';
        this.type = config.type || 'jin';
        this.scene = scene;

        // Position & physics (Z always 0)
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // State
        this.health = 100;
        this.maxHealth = 100;
        this.meter = 0;
        this.maxMeter = 100;

        this.state = 'idle'; // idle|walking|jumping|crouching|attacking|hit|blocking|ko|dashing|juggled|wallbounce
        this.facingRight = true;
        this.isGrounded = true;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.stunTimer = 0;
        this.hitConfirmed = false;
        this.isWallBounced = false;

        // Attack System
        this.isAttacking = false;
        this.attackPhase = null; // 'startup'|'active'|'recovery'
        this.attackTimer = 0;
        this.attackName = '';
        this.activeHitbox = null;
        this.attackData = {};

        // Animation
        this.animTimer = 0;
        this.idleTimer = 0;
        this.walkCycle = 0;

        // Effects
        this.trailMeshes = [];

        // Build 3D model
        this.mesh = new THREE.Group();
        this._buildModel();
        this._buildBeamMesh();
        scene.add(this.mesh);
    }

    setType(type) {
        this.type = type;
        if (type === 'jin') {
            this.name = 'Jin';
            this.config.color1 = 0x1a237e;
            this.config.color2 = 0x283593;
        } else {
            this.name = 'Paul';
            this.config.color1 = 0xbf360c;
            this.config.color2 = 0xe65100;
        }
        while(this.mesh.children.length > 0){
            this.mesh.remove(this.mesh.children[0]);
        }
        this._buildModel();
        this._buildBeamMesh();
    }

    get facingDirection() {
        return this.facingRight ? 1 : -1;
    }

    // ============================
    // MODEL CONSTRUCTION
    // ============================
    _buildModel() {
        // Character specific colors
        let c1, c2, skin, hairColor, gloveColor, bootColor;
        
        if (this.type === 'jin') {
            c1 = 0x1a237e; // deep blue
            c2 = 0xcc0000; // red accents
            skin = 0xffcc99;
            hairColor = 0x111111;
            gloveColor = 0xcc0000;
            bootColor = 0x111111;
        } else if (this.type === 'paul') {
            c1 = 0xcc3300; // red/orange
            c2 = 0x4e342e; // dark brown accents
            skin = 0xffcc99;
            hairColor = 0xffdd55; // blonde spiky
            gloveColor = 0x222222;
            bootColor = 0x3e2723;
        } else {
            c1 = this.config.color1 || 0x1a237e;
            c2 = this.config.color2 || 0x283593;
            skin = 0xffcc99;
            hairColor = 0x222222;
            gloveColor = c2;
            bootColor = c2;
        }

        this.mat1 = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.5 });
        this.mat2 = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.5 });
        this.matSkin = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 });
        this.matHair = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
        this.matGlove = new THREE.MeshStandardMaterial({ color: gloveColor, roughness: 0.7 });
        this.matBoot = new THREE.MeshStandardMaterial({ color: bootColor, roughness: 0.7 });
        
        this.matEye = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.matEyeGlow = new THREE.MeshBasicMaterial({ color: 0x00ffff, blending: THREE.AdditiveBlending });
        this.matPupil = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.matFistGlow = new THREE.MeshBasicMaterial({ color: 0xff8800, blending: THREE.AdditiveBlending });
        this.matMouth = new THREE.MeshBasicMaterial({ color: 0x331111 });

        this.auraMeshes = [];
        const addAura = (parent, w, h, d, yOffset=0, zOffset=0) => {
            const auraMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
            const aura = new THREE.Mesh(new THREE.BoxGeometry(w*1.25, h*1.25, d*1.25), auraMat);
            aura.position.set(0, yOffset, zOffset);
            aura.visible = false;
            parent.add(aura);
            this.auraMeshes.push(aura);
        };

        // TORSO - Larger proportions
        this.torso = new THREE.Group();
        this.torso.position.y = 2.0;
        this.mesh.add(this.torso);

        const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.6), this.mat1);
        this.torso.add(torsoMesh);
        addAura(this.torso, 1.1, 1.4, 0.6);

        // Belt
        const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 0.65), this.mat2);
        beltMesh.position.y = -0.6;
        this.torso.add(beltMesh);

        // Outfit Details (Gi flap for Jin, Vest look for Paul)
        if (this.type === 'jin') {
            const flap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.1), this.mat1);
            flap.position.set(0, -0.9, 0.3);
            this.torso.add(flap);
        }

        const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), this.mat2);
        emblem.position.set(0, -0.3, 0.31);
        this.torso.add(emblem);

        // HEAD
        this.head = new THREE.Group();
        this.head.position.y = 1.0;
        this.torso.add(this.head);
        
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.65, 0.6), this.matSkin);
        this.head.add(headMesh);
        addAura(this.head, 0.6, 0.65, 0.6);

        // Hair
        if (this.type === 'paul') {
            // Spiky tall hair
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), this.matHair);
            hair.position.y = 0.6;
            this.head.add(hair);
        } else {
            // Standard/Jin hair
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65), this.matHair);
            hair.position.y = 0.35;
            this.head.add(hair);
        }

        // Headband for Jin
        if (this.type === 'jin') {
            const headband = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), this.matGlove);
            headband.position.y = 0.2;
            this.head.add(headband);
        }

        // EYES (+Z) - Slightly larger
        this.eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), this.matEye);
        this.eyeR.position.set(0.16, 0.08, 0.31);
        this.head.add(this.eyeR);

        this.eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), this.matEye);
        this.eyeL.position.set(-0.16, 0.08, 0.31);
        this.head.add(this.eyeL);

        const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.matPupil);
        pupilR.position.set(0.16, 0.08, 0.32);
        this.head.add(pupilR);

        const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), this.matPupil);
        pupilL.position.set(-0.16, 0.08, 0.32);
        this.head.add(pupilL);
        
        // Mouth line
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), this.matMouth);
        mouth.position.set(0, -0.15, 0.31);
        this.head.add(mouth);

        // ARMS - Muscular / Defined shoulders
        const upperArmMat = (this.type === 'paul') ? this.matSkin : this.mat1;

        this.shoulderR = new THREE.Group();
        this.shoulderR.position.set(0.7, 0.5, 0);
        this.torso.add(this.shoulderR);

        // Shoulder pad
        const padR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), this.mat1);
        this.shoulderR.add(padR);

        this.upperArmR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), upperArmMat);
        this.upperArmR.position.y = -0.3;
        this.shoulderR.add(this.upperArmR);
        addAura(this.shoulderR, 0.35, 0.6, 0.35, -0.3);

        this.elbowR = new THREE.Group();
        this.elbowR.position.y = -0.6;
        this.shoulderR.add(this.elbowR);

        this.forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.3), this.matSkin);
        this.forearmR.position.y = -0.27;
        this.elbowR.add(this.forearmR);
        addAura(this.elbowR, 0.3, 0.55, 0.3, -0.27);
        
        // Wristbands/Gloves
        const wristbandR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.32), this.matGlove);
        wristbandR.position.y = -0.45;
        this.elbowR.add(wristbandR);

        this.fistR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), this.matGlove);
        this.fistR.position.y = -0.65;
        this.elbowR.add(this.fistR);
        addAura(this.elbowR, 0.32, 0.32, 0.32, -0.65);

        this.shoulderL = new THREE.Group();
        this.shoulderL.position.set(-0.7, 0.5, 0);
        this.torso.add(this.shoulderL);

        // Shoulder pad
        const padL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), this.mat1);
        this.shoulderL.add(padL);

        this.upperArmL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), upperArmMat);
        this.upperArmL.position.y = -0.3;
        this.shoulderL.add(this.upperArmL);
        addAura(this.shoulderL, 0.35, 0.6, 0.35, -0.3);

        this.elbowL = new THREE.Group();
        this.elbowL.position.y = -0.6;
        this.shoulderL.add(this.elbowL);

        this.forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.3), this.matSkin);
        this.forearmL.position.y = -0.27;
        this.elbowL.add(this.forearmL);
        addAura(this.elbowL, 0.3, 0.55, 0.3, -0.27);
        
        // Wristbands/Gloves
        const wristbandL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.32), this.matGlove);
        wristbandL.position.y = -0.45;
        this.elbowL.add(wristbandL);

        this.fistL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), this.matGlove);
        this.fistL.position.y = -0.65;
        this.elbowL.add(this.fistL);
        addAura(this.elbowL, 0.32, 0.32, 0.32, -0.65);

        // LEGS
        this.hipR = new THREE.Group();
        this.hipR.position.set(0.3, -0.75, 0);
        this.torso.add(this.hipR);

        this.thighR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), this.mat1);
        this.thighR.position.y = -0.35;
        this.hipR.add(this.thighR);
        addAura(this.hipR, 0.4, 0.7, 0.4, -0.35);

        this.kneeR = new THREE.Group();
        this.kneeR.position.y = -0.7;
        this.hipR.add(this.kneeR);

        this.shinR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.35), this.mat1);
        this.shinR.position.y = -0.32;
        this.kneeR.add(this.shinR);
        addAura(this.kneeR, 0.35, 0.65, 0.35, -0.32);

        // Boots
        this.footR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.55), this.matBoot);
        this.footR.position.set(0, -0.65, 0.1);
        this.kneeR.add(this.footR);
        addAura(this.kneeR, 0.38, 0.3, 0.55, -0.65, 0.1);

        this.hipL = new THREE.Group();
        this.hipL.position.set(-0.3, -0.75, 0);
        this.torso.add(this.hipL);

        this.thighL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), this.mat1);
        this.thighL.position.y = -0.35;
        this.hipL.add(this.thighL);
        addAura(this.hipL, 0.4, 0.7, 0.4, -0.35);

        this.kneeL = new THREE.Group();
        this.kneeL.position.y = -0.7;
        this.hipL.add(this.kneeL);

        this.shinL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.35), this.mat1);
        this.shinL.position.y = -0.32;
        this.kneeL.add(this.shinL);
        addAura(this.kneeL, 0.35, 0.65, 0.35, -0.32);

        // Boots
        this.footL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.55), this.matBoot);
        this.footL.position.set(0, -0.65, 0.1);
        this.kneeL.add(this.footL);
        addAura(this.kneeL, 0.38, 0.3, 0.55, -0.65, 0.1);
    }

    // ============================
    // 3D ENERGY BEAM MESH
    // Glowing Cylinder extending along local +Z
    // ============================
    _buildBeamMesh() {
        this.beamGroup = new THREE.Group();
        this.beamGroup.position.set(0, 2.0, 0);

        // Core glowing cylinder
        const coreGeo = new THREE.CylinderGeometry(0.3, 0.3, 14, 16);
        coreGeo.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending });
        this.beamCoreCyl = new THREE.Mesh(coreGeo, coreMat);
        this.beamCoreCyl.position.z = 7;
        this.beamGroup.add(this.beamCoreCyl);

        // Mid glow cylinder
        const midGeo = new THREE.CylinderGeometry(0.6, 0.8, 14, 16);
        midGeo.rotateX(Math.PI / 2);
        const midMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
        this.beamMidCyl = new THREE.Mesh(midGeo, midMat);
        this.beamMidCyl.position.z = 7;
        this.beamGroup.add(this.beamMidCyl);

        // Outer glow cylinder
        const outerGeo = new THREE.CylinderGeometry(1.0, 1.2, 14, 16);
        outerGeo.rotateX(Math.PI / 2);
        const outerMat = new THREE.MeshBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        this.beamOuterCyl = new THREE.Mesh(outerGeo, outerMat);
        this.beamOuterCyl.position.z = 7;
        this.beamGroup.add(this.beamOuterCyl);

        // Rotating energy rings
        this.beamRings = [];
        const ringGeo = new THREE.TorusGeometry(1.2, 0.1, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, blending: THREE.AdditiveBlending });
        for(let i=0; i<4; i++) {
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.z = 2 + i * 3.5;
            this.beamGroup.add(ring);
            this.beamRings.push(ring);
        }

        // Energy Sphere Blast at origin (charging sphere)
        const chargeGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const chargeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        this.beamCharge = new THREE.Mesh(chargeGeo, chargeMat);
        this.beamCharge.position.z = 0.5;
        this.beamGroup.add(this.beamCharge);

        // Impact sphere at tip
        const impactGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const impactMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
        this.beamImpact = new THREE.Mesh(impactGeo, impactMat);
        this.beamImpact.position.z = 14.0;
        this.beamGroup.add(this.beamImpact);

        this.beamGroup.visible = false;
        this.mesh.add(this.beamGroup);
    }

    faceOpponent(opponentX) {
        if (this.state === 'attacking' || this.state === 'hit' || this.state === 'ko' || this.state === 'juggled') return;
        this.facingRight = opponentX > this.position.x;
    }

    // ============================
    // ATTACK SYSTEM
    // ============================
    startAttack(name, forceCancel = false) {
        if (this.state === 'hit' || this.state === 'ko' || this.state === 'blocking' || this.state === 'juggled') return;

        if (this.isAttacking && !forceCancel) {
            if (this.attackPhase === 'active' || this.attackPhase === 'recovery') {
                // Combo cancel allowed
            } else {
                return;
            }
        }

        this.isAttacking = true;
        this.state = 'attacking';
        this.attackName = name;
        this.attackPhase = 'startup';
        this.hitConfirmed = false;

        const attacks = this._getAttackTable();
        this.attackData = attacks[name] || attacks['jab'];
        this.attackTimer = this.attackData.startup;

        if (name === 'super') {
            this.meter = 0;
        }
    }

    _getAttackTable() {
        return {
            'jab': {
                startup: 0.04, active: 0.08, recovery: 0.08,
                hitbox: { oz: 1.0, oy: 1.8, w: 0.8, h: 0.4 },
                damage: 6, knockback: 1.5, launchY: 0, type: 'high',
                sound: 'punch_light'
            },
            'straight': {
                startup: 0.07, active: 0.1, recovery: 0.14,
                hitbox: { oz: 1.3, oy: 1.7, w: 1.0, h: 0.5 },
                damage: 12, knockback: 3.5, launchY: 1, type: 'high',
                sound: 'punch_heavy'
            },
            'lkick': {
                startup: 0.06, active: 0.1, recovery: 0.12,
                hitbox: { oz: 1.0, oy: 0.5, w: 1.0, h: 0.5 },
                damage: 8, knockback: 2, launchY: 0, type: 'low',
                sound: 'kick_light'
            },
            'rkick': {
                startup: 0.1, active: 0.1, recovery: 0.18,
                hitbox: { oz: 1.2, oy: 1.5, w: 1.2, h: 0.6 },
                damage: 14, knockback: 4, launchY: 2, type: 'high',
                sound: 'kick_heavy'
            },
            'special1': {
                // EWGF / Phoenix Smasher Launcher
                startup: 0.12, active: 0.12, recovery: 0.25,
                hitbox: { oz: 1.6, oy: 1.6, w: 1.4, h: 1.0 },
                damage: 24, knockback: 5, launchY: 14, type: 'mid',
                sound: 'special_hit'
            },
            'special2': {
                startup: 0.1, active: 0.15, recovery: 0.22,
                hitbox: { oz: 1.4, oy: 1.2, w: 1.5, h: 0.8 },
                damage: 18, knockback: 6, launchY: 3, type: 'mid',
                sound: 'kick_heavy'
            },
            'super': {
                // SUPER ART EX MOVE
                startup: 0.25, active: 0.2, recovery: 0.4,
                hitbox: { oz: 2.0, oy: 1.6, w: 2.0, h: 1.4 },
                damage: 42, knockback: 10, launchY: 16, type: 'mid',
                sound: 'ko'
            },

            // === 💥 ENERGY BEAM ATTACK 💥 ===
            'energy_beam': {
                startup: 0.18, active: 0.35, recovery: 0.3,
                hitbox: { oz: 0.5, oy: 1.8, w: 14.0, h: 1.8 }, // Starts close to hit properly, extends 14 units
                damage: 28, knockback: 12, launchY: 6, type: 'beam',
                sound: 'special_hit'
            },

            // Aerial Attacks
            'jump_punch': {
                startup: 0.04, active: 0.15, recovery: 0.1,
                hitbox: { oz: 1.1, oy: 1.2, w: 1.1, h: 0.8 },
                damage: 10, knockback: 2.5, launchY: -2, type: 'high',
                sound: 'punch_heavy'
            },
            'jump_kick': {
                startup: 0.05, active: 0.18, recovery: 0.1,
                hitbox: { oz: 1.3, oy: 0.8, w: 1.3, h: 1.0 },
                damage: 15, knockback: 4, launchY: -4, type: 'mid',
                sound: 'kick_heavy'
            },
            'jump_special': {
                startup: 0.08, active: 0.2, recovery: 0.15,
                hitbox: { oz: 1.4, oy: 0.5, w: 1.5, h: 1.2 },
                damage: 20, knockback: 5, launchY: -8, type: 'overhead',
                sound: 'special_hit'
            }
        };
    }

    addMeter(amount) {
        this.meter = Math.min(this.maxMeter, this.meter + amount);
    }

    getWorldHitbox() {
        if (!this.activeHitbox) return null;
        const hb = this.activeHitbox;
        const dir = this.facingDirection;
        const worldX = this.position.x + hb.oz * dir;
        const worldY = this.position.y + hb.oy;
        return {
            x: dir > 0 ? worldX : worldX - hb.w,
            y: worldY - hb.h / 2,
            w: hb.w,
            h: hb.h,
            damage: this.attackData.damage,
            knockback: this.attackData.knockback,
            launchY: this.attackData.launchY,
            type: this.attackData.type,
            sound: this.attackData.sound
        };
    }

    getBodyBox() {
        return {
            x: this.position.x - 0.5,
            y: this.position.y,
            w: 1.0,
            h: 2.5
        };
    }

    // ============================
    // DAMAGE & JUGGLE
    // ============================
    takeDamage(amount, knockbackX, launchY = 0) {
        this.health = Math.max(0, this.health - amount);
        this.addMeter(amount * 0.8);

        this.velocity.x = knockbackX;
        this.isAttacking = false;
        this.activeHitbox = null;
        if (this.beamGroup) this.beamGroup.visible = false;

        if (this.health <= 0) {
            this.state = 'ko';
            this.velocity.x = knockbackX * 1.5;
            this.velocity.y = Math.max(6, launchY);
        } else if (launchY > 3 || (!this.isGrounded && launchY >= 0)) {
            this.state = 'juggled';
            this.velocity.y = Math.max(8, launchY);
            this.isGrounded = false;
            this.stunTimer = 0.6;
        } else if (launchY < 0) {
            this.state = 'hit';
            this.velocity.y = -6;
            this.stunTimer = 0.4;
        } else {
            this.state = 'hit';
            this.stunTimer = 0.25 + amount * 0.008;
        }
    }

    takeBlockDamage(amount, pushback) {
        this.health = Math.max(0, this.health - Math.floor(amount * 0.12));
        this.addMeter(amount * 0.4);
        this.velocity.x = pushback * 0.5;
        this.stunTimer = 0.12;
    }

    triggerWallBounce(bounceDir) {
        this.state = 'wallbounce';
        this.isWallBounced = true;
        this.velocity.x = bounceDir * 9;
        this.velocity.y = 8;
        this.stunTimer = 0.5;
    }

    // ============================
    // UPDATE
    // ============================
    update(dt) {
        this.idleTimer += dt;
        this.mesh.position.copy(this.position);

        this.mesh.rotation.y = this.facingRight ? Math.PI / 2 : -Math.PI / 2;

        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.comboCount = 0;
        }

        if (this.state === 'hit' || this.state === 'juggled' || this.state === 'wallbounce') {
            this.stunTimer -= dt;
            if (this.isGrounded && this.stunTimer <= 0) {
                this.state = 'idle';
                this.isWallBounced = false;
            }
        }

        if (this.isAttacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                if (this.attackPhase === 'startup') {
                    this.attackPhase = 'active';
                    this.activeHitbox = this.attackData.hitbox;
                    this.attackTimer = this.attackData.active;
                } else if (this.attackPhase === 'active') {
                    this.attackPhase = 'recovery';
                    this.activeHitbox = null;
                    this.attackTimer = this.attackData.recovery;
                } else {
                    this.isAttacking = false;
                    this.attackPhase = null;
                    this.activeHitbox = null;
                    if (this.beamGroup) this.beamGroup.visible = false;
                    this.state = this.isGrounded ? 'idle' : 'jumping';
                }
            }
        } else {
            if (this.beamGroup) this.beamGroup.visible = false;
        }

        this._animate(dt);
        this._updateEffects(dt);
    }
    
    _updateEffects(dt) {
        // Trails
        for(let i=this.trailMeshes.length-1; i>=0; i--) {
            const t = this.trailMeshes[i];
            t.life -= dt;
            if(t.life <= 0) {
                this.scene.remove(t.mesh);
                t.mesh.material.dispose();
                t.mesh.geometry.dispose();
                this.trailMeshes.splice(i, 1);
            } else {
                t.mesh.material.opacity = t.life * 2;
                t.mesh.scale.setScalar(1.0 + (0.3 - t.life));
            }
        }

        // Emit trail when dashing or moving fast
        if (Math.abs(this.velocity.x) > 6 || this.state === 'dashing') {
            if (this.scene && Math.random() < 0.4) {
                const trailGeo = new THREE.BoxGeometry(1.0, 2.5, 0.6);
                const trailMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
                const trail = new THREE.Mesh(trailGeo, trailMat);
                trail.position.copy(this.position);
                trail.position.y += 1.25;
                trail.rotation.copy(this.mesh.rotation);
                this.scene.add(trail);
                this.trailMeshes.push({mesh: trail, life: 0.3});
            }
        }

        // Visual states
        const isSpecialAttack = this.isAttacking && ['special1', 'special2', 'super', 'energy_beam'].includes(this.attackName);
        const isPunchAttack = this.isAttacking && ['jab', 'straight', 'jump_punch', 'special1'].includes(this.attackName);

        // Update Auras
        if (this.auraMeshes) {
            const showAura = this.isAttacking && this.attackPhase !== 'recovery';
            this.auraMeshes.forEach(m => {
                m.visible = showAura;
                if (showAura) {
                    m.scale.setScalar(1.0 + Math.sin(this.idleTimer * 20) * 0.05);
                }
            });
        }

        // Update Eyes
        if (this.eyeR && this.eyeL) {
            this.eyeR.material = isSpecialAttack ? this.matEyeGlow : this.matEye;
            this.eyeL.material = isSpecialAttack ? this.matEyeGlow : this.matEye;
        }

        // Update Fists
        if (this.fistR && this.fistL) {
            this.fistR.material = (isPunchAttack || isSpecialAttack) ? this.matFistGlow : this.mat2;
            this.fistL.material = (isPunchAttack || isSpecialAttack) ? this.matFistGlow : this.mat2;
        }
    }

    // ============================
    // ANIMATION
    // ============================
    _animate(dt) {
        const lerpSpeed = 16;
        const l = (cur, tgt) => cur + (tgt - cur) * Math.min(1, lerpSpeed * dt);

        if (this.state === 'ko') {
            this.torso.rotation.x = l(this.torso.rotation.x, -1.0);
            this.head.rotation.x = l(this.head.rotation.x, 0.6);
            this.shoulderL.rotation.z = l(this.shoulderL.rotation.z, 0.6);
            this.shoulderR.rotation.z = l(this.shoulderR.rotation.z, -0.6);
            return;
        }

        if (this.state === 'juggled' || this.state === 'wallbounce') {
            this.torso.rotation.x = l(this.torso.rotation.x, -0.5);
            this.hipR.rotation.x = l(this.hipR.rotation.x, 0.6);
            this.hipL.rotation.x = l(this.hipL.rotation.x, -0.6);
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, -1.0);
            this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, -1.0);
            return;
        }

        if (this.state === 'hit') {
            this.torso.rotation.x = l(this.torso.rotation.x, -0.35);
            this.head.rotation.x = l(this.head.rotation.x, 0.4);
            this._resetLimbs(dt, lerpSpeed);
            return;
        }

        if (this.state === 'blocking') {
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, -1.2);
            this.shoulderR.rotation.z = l(this.shoulderR.rotation.z, -0.4);
            this.elbowR.rotation.x = l(this.elbowR.rotation.x, 1.4);
            this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, -1.2);
            this.shoulderL.rotation.z = l(this.shoulderL.rotation.z, 0.4);
            this.elbowL.rotation.x = l(this.elbowL.rotation.x, 1.4);
            this.torso.rotation.x = l(this.torso.rotation.x, 0.1);
            return;
        }

        if (this.state === 'crouching') {
            this.torso.position.y = l(this.torso.position.y, 1.2);
            this.hipL.rotation.x = l(this.hipL.rotation.x, -0.6);
            this.hipR.rotation.x = l(this.hipR.rotation.x, -0.6);
            this.kneeL.rotation.x = l(this.kneeL.rotation.x, 1.2);
            this.kneeR.rotation.x = l(this.kneeR.rotation.x, 1.2);
            this._resetArms(dt, lerpSpeed);
            return;
        }

        this.torso.position.y = l(this.torso.position.y, 1.8);

        if (this.isAttacking) {
            this._animateAttack(dt, l);
            return;
        }

        if (this.state === 'walking') {
            this.walkCycle += dt * 8;
            const s = Math.sin(this.walkCycle);
            this.hipR.rotation.x = l(this.hipR.rotation.x, s * 0.5);
            this.hipL.rotation.x = l(this.hipL.rotation.x, -s * 0.5);
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, -s * 0.3);
            this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, s * 0.3);
            this.torso.rotation.x = l(this.torso.rotation.x, 0);
            this.head.rotation.x = l(this.head.rotation.x, 0);
            return;
        }

        // Stance
        const breathe = Math.sin(this.idleTimer * 2.5) * 0.03;

        this.torso.rotation.x = l(this.torso.rotation.x, breathe);
        this.head.rotation.x = l(this.head.rotation.x, -breathe * 0.5);

        this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, -0.6);
        this.shoulderR.rotation.z = l(this.shoulderR.rotation.z, -0.2);
        this.elbowR.rotation.x = l(this.elbowR.rotation.x, 1.2);

        this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, -0.4);
        this.shoulderL.rotation.z = l(this.shoulderL.rotation.z, 0.2);
        this.elbowL.rotation.x = l(this.elbowL.rotation.x, 1.2);

        this.hipR.rotation.x = l(this.hipR.rotation.x, 0);
        this.hipL.rotation.x = l(this.hipL.rotation.x, 0);
        this.kneeR.rotation.x = l(this.kneeR.rotation.x, 0);
        this.kneeL.rotation.x = l(this.kneeL.rotation.x, 0);
    }

    _animateAttack(dt, l) {
        const phase = this.attackPhase;
        const isActive = phase === 'active';
        const isStartup = phase === 'startup';
        const speed = 28;

        // === 💥 ENERGY BEAM ATTACK ANIMATION 💥 ===
        if (this.attackName === 'energy_beam') {
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, -1.6);
            this.shoulderR.rotation.z = l(this.shoulderR.rotation.z, -0.1);
            this.elbowR.rotation.x = l(this.elbowR.rotation.x, 0.1);

            this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, -1.6);
            this.shoulderL.rotation.z = l(this.shoulderL.rotation.z, 0.1);
            this.elbowL.rotation.x = l(this.elbowL.rotation.x, 0.1);

            this.torso.rotation.x = l(this.torso.rotation.x, isActive ? 0.2 : -0.3);

            if (this.beamGroup) {
                this.beamGroup.visible = true;

                if (isStartup) {
                    this.beamCharge.visible = true;
                    this.beamCoreCyl.visible = false;
                    this.beamMidCyl.visible = false;
                    this.beamOuterCyl.visible = false;
                    this.beamImpact.visible = false;
                    this.beamRings.forEach(r => r.visible = false);

                    const progress = 1.0 - (this.attackTimer / this.attackData.startup);
                    this.beamCharge.scale.setScalar(0.5 + progress * 2.0);
                } else if (isActive) {
                    this.beamCharge.visible = true;
                    this.beamCoreCyl.visible = true;
                    this.beamMidCyl.visible = true;
                    this.beamOuterCyl.visible = true;
                    this.beamImpact.visible = true;
                    this.beamRings.forEach(r => r.visible = true);

                    const pulse = 1 + Math.sin(this.idleTimer * 50) * 0.2;
                    const pulse2 = 1 + Math.cos(this.idleTimer * 40) * 0.3;

                    this.beamCharge.scale.setScalar(1.5 * pulse);
                    
                    this.beamMidCyl.scale.x = pulse;
                    this.beamMidCyl.scale.y = pulse;
                    
                    this.beamOuterCyl.scale.x = pulse2;
                    this.beamOuterCyl.scale.y = pulse2;
                    
                    this.beamImpact.scale.setScalar(pulse);
                    this.beamImpact.rotation.y += dt * 10;
                    this.beamImpact.rotation.z += dt * 10;

                    this.beamRings.forEach((r, i) => {
                        r.rotation.z += dt * (5 + i);
                        r.scale.setScalar(pulse);
                    });
                } else {
                    this.beamCharge.visible = false;
                    this.beamCoreCyl.visible = true;
                    this.beamMidCyl.visible = true;
                    this.beamOuterCyl.visible = true;
                    this.beamImpact.visible = false;
                    this.beamRings.forEach(r => r.visible = false);

                    const progress = this.attackTimer / this.attackData.recovery;
                    this.beamCoreCyl.scale.y = progress;
                    this.beamMidCyl.scale.y = progress;
                    this.beamOuterCyl.scale.y = progress;
                    this.beamCoreCyl.scale.x = progress;
                    this.beamMidCyl.scale.x = progress;
                    this.beamOuterCyl.scale.x = progress;
                }
            }
            return;
        }

        if (this.attackName === 'super') {
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, isActive ? -1.6 : -0.4);
            this.elbowR.rotation.x = l(this.elbowR.rotation.x, isActive ? 0.1 : 1.2);
            this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, isActive ? 0.4 : -0.4);
            this.torso.rotation.x = l(this.torso.rotation.x, isActive ? 0.3 : -0.2);
            this.hipR.rotation.x = l(this.hipR.rotation.x, isActive ? 0.6 : -0.3);
            return;
        }

        // Aerial Attacks
        if (this.attackName === 'jump_punch') {
            this.torso.rotation.x = l(this.torso.rotation.x, 0.3);
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, isActive ? -1.8 : -0.6);
            this.elbowR.rotation.x = l(this.elbowR.rotation.x, isActive ? 0.2 : 1.2);
            this.hipR.rotation.x = l(this.hipR.rotation.x, 0.4);
            this.hipL.rotation.x = l(this.hipL.rotation.x, -0.4);
            return;
        }

        if (this.attackName === 'jump_kick') {
            this.torso.rotation.x = l(this.torso.rotation.x, -0.2);
            this.hipR.rotation.x = l(this.hipR.rotation.x, isActive ? -1.8 : 0);
            this.kneeR.rotation.x = l(this.kneeR.rotation.x, isActive ? 0.1 : 0.8);
            this.hipL.rotation.x = l(this.hipL.rotation.x, 0.5);
            return;
        }

        if (this.attackName === 'jump_special') {
            this.torso.rotation.x = l(this.torso.rotation.x, 0.6);
            this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, isActive ? -2.2 : -0.5);
            this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, isActive ? -2.2 : -0.5);
            this.elbowR.rotation.x = l(this.elbowR.rotation.x, 0.2);
            this.elbowL.rotation.x = l(this.elbowL.rotation.x, 0.2);
            return;
        }

        // Ground Attacks
        switch (this.attackName) {
            case 'jab':
                this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, isActive ? -1.5 : -0.6);
                this.elbowR.rotation.x = l(this.elbowR.rotation.x, isActive ? 0.1 : 1.2);
                this.torso.rotation.y = l(this.torso.rotation.y, isActive ? 0.15 : 0);
                this._resetLeftArm(dt, speed);
                this._resetLegs(dt, speed);
                break;

            case 'straight':
                this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, isActive ? -1.6 : -0.4);
                this.elbowL.rotation.x = l(this.elbowL.rotation.x, isActive ? 0.1 : 1.2);
                this.torso.rotation.y = l(this.torso.rotation.y, isActive ? -0.3 : 0);
                this._resetRightArm(dt, speed);
                this._resetLegs(dt, speed);
                break;

            case 'lkick':
                this.hipR.rotation.x = l(this.hipR.rotation.x, isActive ? -1.2 : 0);
                this.kneeR.rotation.x = l(this.kneeR.rotation.x, isActive ? 0.2 : 0.8);
                this._resetArms(dt, speed);
                break;

            case 'rkick':
                this.hipL.rotation.x = l(this.hipL.rotation.x, isActive ? -1.5 : 0);
                this.kneeL.rotation.x = l(this.kneeL.rotation.x, isActive ? 0.1 : 0.6);
                this.torso.rotation.x = l(this.torso.rotation.x, isActive ? -0.25 : 0);
                this._resetArms(dt, speed);
                break;

            case 'special1':
                this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, isActive ? -2.2 : -0.6);
                this.elbowR.rotation.x = l(this.elbowR.rotation.x, isActive ? 0.2 : 1.2);
                this.torso.position.y = l(this.torso.position.y, isActive ? 2.3 : 1.4);
                this.torso.rotation.x = l(this.torso.rotation.x, isActive ? 0.2 : -0.2);
                this._resetLeftArm(dt, speed);
                this._resetLegs(dt, speed);
                break;

            case 'special2':
                this.hipR.rotation.x = l(this.hipR.rotation.x, isActive ? -1.6 : 0);
                this.kneeR.rotation.x = l(this.kneeR.rotation.x, isActive ? 0.1 : 0.8);
                this.torso.rotation.x = l(this.torso.rotation.x, isActive ? -0.2 : 0);
                this._resetArms(dt, speed);
                break;

            default:
                this._resetLimbs(dt, speed);
        }
    }

    _resetLimbs(dt, speed) {
        this._resetArms(dt, speed);
        this._resetLegs(dt, speed);
    }
    _resetArms(dt, speed) {
        this._resetRightArm(dt, speed);
        this._resetLeftArm(dt, speed);
    }
    _resetRightArm(dt, speed) {
        const l = (c, t) => c + (t - c) * Math.min(1, speed * dt);
        this.shoulderR.rotation.x = l(this.shoulderR.rotation.x, -0.6);
        this.shoulderR.rotation.z = l(this.shoulderR.rotation.z, -0.2);
        this.elbowR.rotation.x = l(this.elbowR.rotation.x, 1.2);
    }
    _resetLeftArm(dt, speed) {
        const l = (c, t) => c + (t - c) * Math.min(1, speed * dt);
        this.shoulderL.rotation.x = l(this.shoulderL.rotation.x, -0.4);
        this.shoulderL.rotation.z = l(this.shoulderL.rotation.z, 0.2);
        this.elbowL.rotation.x = l(this.elbowL.rotation.x, 1.2);
    }
    _resetLegs(dt, speed) {
        const l = (c, t) => c + (t - c) * Math.min(1, speed * dt);
        this.hipR.rotation.x = l(this.hipR.rotation.x, 0);
        this.hipL.rotation.x = l(this.hipL.rotation.x, 0);
        this.kneeR.rotation.x = l(this.kneeR.rotation.x, 0);
        this.kneeL.rotation.x = l(this.kneeL.rotation.x, 0);
    }

    reset(x) {
        this.health = this.maxHealth;
        this.meter = 0;
        this.state = 'idle';
        this.isAttacking = false;
        this.attackPhase = null;
        this.activeHitbox = null;
        this.hitConfirmed = false;
        this.isWallBounced = false;
        if (this.beamGroup) this.beamGroup.visible = false;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.stunTimer = 0;
        this.velocity.set(0, 0, 0);
        this.position.set(x, 0, 0);
        this.isGrounded = true;

        this.torso.rotation.set(0, 0, 0);
        this.torso.position.y = 2.0;
        this.head.rotation.set(0, 0, 0);
        this.shoulderR.rotation.set(-0.6, 0, -0.2);
        this.shoulderL.rotation.set(-0.4, 0, 0.2);
        this.elbowR.rotation.set(1.2, 0, 0);
        this.elbowL.rotation.set(1.2, 0, 0);
        this.hipR.rotation.set(0, 0, 0);
        this.hipL.rotation.set(0, 0, 0);
    }
}

window.Character = Character;
