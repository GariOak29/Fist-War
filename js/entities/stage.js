// ============================================
// Stage - Stadium Arena & Animated Audience
// Stadium bleachers, Jumbotron LED screen, light towers,
// and 3D cheering crowd spectators, 360 environment
// ============================================
class Stage {
    constructor(scene) {
        this.scene = scene;
        this.bounds = { minX: -12.5, maxX: 12.5 };
        this.group = new THREE.Group();
        this.audienceMembers = [];
        this.neonStrips = [];
        this.rotatingLights = [];
        this.fogBeams = [];

        this._buildFloorAndRopes();
        this._buildStadiumBleachers();
        this._buildCeilingAndTruss();
        this._buildJumbotron();
        this._buildFloodlightsAndBeams();
        this._buildAudience();
        this._buildNeonStrips();
        this._buildParticles();
        this._setupLighting();

        scene.add(this.group);

        scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);
        scene.background = new THREE.Color(0x050510);
    }

    _buildFloorAndRopes() {
        // Build Elevated Fighting Platform (Top surface at y = 0)
        const platformGeo = new THREE.BoxGeometry(30, 1.25, 16);
        const platformMat = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.9, metalness: 0.1 });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.y = -0.625;
        platform.receiveShadow = true;
        this.group.add(platform);

        // LED edges for platform
        const edgeGeoX = new THREE.BoxGeometry(30.2, 0.1, 0.1);
        const edgeGeoZ = new THREE.BoxGeometry(0.1, 0.1, 16.2);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        
        const edgeFront = new THREE.Mesh(edgeGeoX, edgeMat);
        edgeFront.position.set(0, 0.01, 8);
        this.group.add(edgeFront);
        
        const edgeBack = new THREE.Mesh(edgeGeoX, edgeMat);
        edgeBack.position.set(0, 0.01, -8);
        this.group.add(edgeBack);
        
        const edgeLeft = new THREE.Mesh(edgeGeoZ, edgeMat);
        edgeLeft.position.set(-15, 0.01, 0);
        this.group.add(edgeLeft);
        
        const edgeRight = new THREE.Mesh(edgeGeoZ, edgeMat);
        edgeRight.position.set(15, 0.01, 0);
        this.group.add(edgeRight);

        // Ring Mat
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#080811';
        ctx.fillRect(0, 0, 1024, 1024);

        // Grid
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 1024; i += 64) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
        }

        // Fighting ring logo
        ctx.strokeStyle = '#ff2255';
        ctx.lineWidth = 12;
        ctx.beginPath(); ctx.arc(512, 512, 350, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ff2255';
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IRON FIST', 512, 480);
        ctx.font = 'bold 54px sans-serif';
        ctx.fillText('WORLD CHAMPIONSHIP', 512, 550);

        const texture = new THREE.CanvasTexture(canvas);
        const floorGeo = new THREE.PlaneGeometry(28, 14);
        const floorMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.6,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.01; // On top of platform surface
        floor.receiveShadow = true;
        this.group.add(floor);

        // Outer floor (dark ground below platform)
        const outerGeo = new THREE.PlaneGeometry(100, 100);
        const outerMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 1.0 });
        const outerFloor = new THREE.Mesh(outerGeo, outerMat);
        outerFloor.rotation.x = -Math.PI / 2;
        outerFloor.position.y = -1.25;
        this.group.add(outerFloor);

        // Arena ring barrier (posts and ropes)
        const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });
        
        // Turnbuckle pads materials
        const padRedMat = new THREE.MeshStandardMaterial({ color: 0xdd1111, roughness: 0.7 });
        const padBlueMat = new THREE.MeshStandardMaterial({ color: 0x1111dd, roughness: 0.7 });

        // Left and Right Ring Posts
        const postPositions = [
            [-13, -6], [13, -6]
        ];

        postPositions.forEach((pos, idx) => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(pos[0], 1.25, pos[1]);
            this.group.add(post);

            // Add turnbuckle pads to posts
            const padGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8);
            const padMat = (pos[0] < 0) ? padRedMat : padBlueMat;
            const pad = new THREE.Mesh(padGeo, padMat);
            pad.position.set(pos[0], 1.25, pos[1]);
            this.group.add(pad);
        });

        // Ropes (3 levels)
        for (let y = 0.6; y <= 2.0; y += 0.7) {
            // Back rope
            const backRope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 26), ropeMat);
            backRope.rotation.z = Math.PI / 2;
            backRope.position.set(0, y, -6);
            this.group.add(backRope);

            // Left rope
            const leftRope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 12), ropeMat);
            leftRope.rotation.x = Math.PI / 2;
            leftRope.position.set(-13, y, 0);
            this.group.add(leftRope);

            // Right rope
            const rightRope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 12), ropeMat);
            rightRope.rotation.x = Math.PI / 2;
            rightRope.position.set(13, y, 0);
            this.group.add(rightRope);
        }
    }

    _buildStadiumBleachers() {
        const bleacherMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.8 });
        const railingMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, metalness: 0.8 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.9 });

        // Helper to build a section
        const buildSection = (rotY, offsetX, offsetZ) => {
            const sectionGroup = new THREE.Group();
            for (let tier = 0; tier < 6; tier++) {
                const zPos = -10 - tier * 2.5;
                const yPos = 1 + tier * 1.5;

                const bench = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 2.5), bleacherMat);
                bench.position.set(0, yPos, zPos);
                sectionGroup.add(bench);

                const railing = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 0.1), railingMat);
                railing.position.set(0, yPos + 0.9, zPos + 1.2);
                sectionGroup.add(railing);
            }
            sectionGroup.rotation.y = rotY;
            sectionGroup.position.set(offsetX, 0, offsetZ);
            this.group.add(sectionGroup);
        };

        // Back, Left, Right, Front bleachers
        buildSection(0, 0, 0); // Back
        buildSection(Math.PI / 2, 0, 0); // Right
        buildSection(-Math.PI / 2, 0, 0); // Left
        
        // Walls (360 enclose)
        const wallR = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 2), wallMat);
        wallR.position.set(28, 15, 0);
        wallR.rotation.y = -Math.PI / 2;
        this.group.add(wallR);

        const wallL = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 2), wallMat);
        wallL.position.set(-28, 15, 0);
        wallL.rotation.y = Math.PI / 2;
        this.group.add(wallL);

        const wallB = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 2), wallMat);
        wallB.position.set(0, 15, -28);
        this.group.add(wallB);

        const wallF = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 2), wallMat);
        wallF.position.set(0, 15, 28);
        this.group.add(wallF);

        // Entrance tunnels (dark boxes) at corners
        const tunnelMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const corners = [
            [-22, -22], [22, -22], [-22, 22], [22, 22]
        ];
        corners.forEach(pos => {
            const tunnel = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), tunnelMat);
            tunnel.position.set(pos[0], 4, pos[1]);
            tunnel.rotation.y = Math.PI / 4;
            this.group.add(tunnel);
        });

        // Animated Back Banners
        this.bannerGroup = new THREE.Group();
        this.bannerGroup.position.set(0, 5, -12.5);
        this.group.add(this.bannerGroup);

        this.bannerCanvas = document.createElement('canvas');
        this.bannerCanvas.width = 1024;
        this.bannerCanvas.height = 128;
        this.bannerCtx = this.bannerCanvas.getContext('2d');
        this.bannerTex = new THREE.CanvasTexture(this.bannerCanvas);
        
        const bannerGeo = new THREE.PlaneGeometry(40, 3);
        const bannerMat = new THREE.MeshBasicMaterial({ map: this.bannerTex, side: THREE.DoubleSide });
        const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
        this.bannerGroup.add(bannerMesh);
    }

    _updateBanners(time) {
        if (!this.bannerCtx || !this.bannerTex) return;
        const ctx = this.bannerCtx;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, 1024, 128);
        
        const offset = (time * 150) % 1024;
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 64px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('>>> NEXT BATTLE: TOURNAMENT FINALS <<<', 1024 - offset, 85);
        ctx.fillText('>>> NEXT BATTLE: TOURNAMENT FINALS <<<', 1024 - offset + 1024, 85);
        
        this.bannerTex.needsUpdate = true;
    }

    _buildCeilingAndTruss() {
        // Ceiling plane
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0 });
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 28;
        this.group.add(ceiling);

        // Overhead truss grid
        const trussMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, wireframe: true });
        for (let i = -20; i <= 20; i += 10) {
            const trussX = new THREE.Mesh(new THREE.BoxGeometry(50, 1, 1), trussMat);
            trussX.position.set(0, 25, i);
            this.group.add(trussX);

            const trussZ = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 50), trussMat);
            trussZ.position.set(i, 25, 0);
            this.group.add(trussZ);
        }
    }

    _buildJumbotron() {
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });

        // 4-sided jumbotron in the center above the ring
        const jumbotronGroup = new THREE.Group();
        jumbotronGroup.position.set(0, 20, 0);
        this.group.add(jumbotronGroup);

        this.jumbotronCanvas = document.createElement('canvas');
        this.jumbotronCanvas.width = 512;
        this.jumbotronCanvas.height = 256;
        this.jumbotronCtx = this.jumbotronCanvas.getContext('2d');
        this.jumbotronTex = new THREE.CanvasTexture(this.jumbotronCanvas);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.jumbotronTex });

        // 4 screens
        for (let i = 0; i < 4; i++) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 0.5), frameMat);
            const screen = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 5.5), screenMat);
            screen.position.z = 0.26;
            
            const side = new THREE.Group();
            side.add(frame);
            side.add(screen);
            side.position.z = 6;
            
            const wrapper = new THREE.Group();
            wrapper.rotation.y = i * Math.PI / 2;
            wrapper.add(side);
            jumbotronGroup.add(wrapper);
        }
    }

    _buildFloodlightsAndBeams() {
        const trussMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8 });
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Volumetric beam material
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        // 4 Towers in corners
        const positions = [
            [-18, -18], [18, -18], [-18, 18], [18, 18]
        ];

        positions.forEach((pos, idx) => {
            const x = pos[0];
            const z = pos[1];

            // Vertical truss tower
            const tower = new THREE.Mesh(new THREE.BoxGeometry(1.5, 22, 1.5), trussMat);
            tower.position.set(x, 11, z);
            this.group.add(tower);

            // Lamp head aiming at center
            const lampHead = new THREE.Group();
            lampHead.position.set(x, 22, z);
            lampHead.lookAt(0, 0, 0);

            const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), trussMat);
            const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), lampMat);
            glow.position.z = 0.51;
            lampHead.add(box);
            lampHead.add(glow);

            // Volumetric Cone
            const coneGeo = new THREE.ConeGeometry(8, 35, 16, 1, true);
            coneGeo.translate(0, -17.5, 0);
            coneGeo.rotateX(Math.PI / 2);
            
            // Colored beams
            const colors = [0xffddaa, 0xaaddff, 0xffaadd, 0xaaffaa];
            const bMat = beamMat.clone();
            bMat.color.setHex(colors[idx]);

            const beam = new THREE.Mesh(coneGeo, bMat);
            lampHead.add(beam);
            this.fogBeams.push({ mesh: beam, phase: Math.random() * Math.PI * 2 });

            this.group.add(lampHead);
        });
    }

    _buildAudience() {
        const shirtColors = [
            0xd32f2f, 0x1976d2, 0x388e3c, 0xfbc02d, 0x7b1fa2,
            0xe64a19, 0x0097a7, 0x5d4037, 0x455a64, 0xe91e63, 0xffffff, 0x222222
        ];
        const skinColors = [0xffcc99, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];

        const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        const armGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);

        const populateSection = (rotY, offsetX, offsetZ) => {
            const sectionGroup = new THREE.Group();
            for (let tier = 0; tier < 5; tier++) {
                const zPos = -10 - tier * 2.5;
                const baseY = 1.3 + tier * 1.5;
                const countOnTier = 28 - tier; 

                for (let i = 0; i < countOnTier; i++) {
                    const xPos = -16 + (i / (countOnTier - 1)) * 32 + (Math.random() - 0.5) * 0.5;

                    const shirtMat = new THREE.MeshStandardMaterial({
                        color: shirtColors[Math.floor(Math.random() * shirtColors.length)],
                        roughness: 0.6
                    });
                    const skinMat = new THREE.MeshStandardMaterial({
                        color: skinColors[Math.floor(Math.random() * skinColors.length)],
                        roughness: 0.6
                    });

                    const spectatorGroup = new THREE.Group();
                    spectatorGroup.position.set(xPos, baseY, zPos);

                    const body = new THREE.Mesh(bodyGeo, shirtMat);
                    body.position.y = 0.3;
                    spectatorGroup.add(body);

                    const head = new THREE.Mesh(headGeo, skinMat);
                    head.position.y = 0.75;
                    spectatorGroup.add(head);

                    const armR = new THREE.Mesh(armGeo, skinMat);
                    armR.position.set(0.32, 0.3, 0);
                    spectatorGroup.add(armR);

                    const armL = new THREE.Mesh(armGeo, skinMat);
                    armL.position.set(-0.32, 0.3, 0);
                    spectatorGroup.add(armL);

                    sectionGroup.add(spectatorGroup);

                    this.audienceMembers.push({
                        group: spectatorGroup,
                        body: body,
                        head: head,
                        armR: armR,
                        armL: armL,
                        baseY: baseY,
                        cheerPhase: Math.random() * Math.PI * 2,
                        cheerSpeed: 3 + Math.random() * 5,
                        cheerIntensity: 0.4 + Math.random() * 0.6
                    });
                }
            }
            sectionGroup.rotation.y = rotY;
            sectionGroup.position.set(offsetX, 0, offsetZ);
            this.group.add(sectionGroup);
        };

        populateSection(0, 0, 0); // Back
        populateSection(Math.PI / 2, 0, 0); // Right
        populateSection(-Math.PI / 2, 0, 0); // Left
            }

    _buildNeonStrips() {
        const createNeon = (length, rotY, x, y, z) => {
            const geo = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.z = Math.PI / 2;
            mesh.rotation.y = rotY;
            mesh.position.set(x, y, z);
            this.group.add(mesh);
            this.neonStrips.push({ mesh, baseHue: Math.random() });
        };

        // Ring edges
        createNeon(26, 0, 0, 0.2, -6.5);
        createNeon(26, 0, 0, 0.2, 6.5);
        createNeon(13, Math.PI/2, -13.5, 0.2, 0);
        createNeon(13, Math.PI/2, 13.5, 0.2, 0);

        // Wall trims
        createNeon(56, 0, 0, 14, -27.5);
        createNeon(56, Math.PI/2, -27.5, 14, 0);
        createNeon(56, Math.PI/2, 27.5, 14, 0);
    }

    _buildParticles() {
        const particleCount = 400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xffaa55,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }

    _setupLighting() {
        const ambient = new THREE.AmbientLight(0x1a1a3a, 1.2);
        this.scene.add(ambient);

        // Center ring spotlight
        const centerSpot = new THREE.SpotLight(0xffffff, 3.0);
        centerSpot.position.set(0, 24, 0);
        centerSpot.angle = Math.PI / 4;
        centerSpot.penumbra = 0.5;
        centerSpot.castShadow = true;
        this.scene.add(centerSpot);

        // Colored rim lights (rotating)
        const createSpot = (color, x, z) => {
            const spot = new THREE.SpotLight(color, 4.0);
            spot.position.set(x, 15, z);
            spot.angle = Math.PI / 6;
            spot.penumbra = 0.8;
            
            const target = new THREE.Object3D();
            target.position.set(0, 0, 0);
            this.scene.add(target);
            spot.target = target;
            
            this.scene.add(spot);
            this.rotatingLights.push({ light: spot, target: target, anglePhase: Math.random() * Math.PI * 2 });
        };

        createSpot(0xff0055, -15, -15);
        createSpot(0x00aaff, 15, -15);
        createSpot(0xaa00ff, -15, 15);
        createSpot(0x00ffaa, 15, 15);
    }

    update(dt) {
        const time = performance.now() * 0.001;

        this._updateBanners(time);

        // Animate audience
        for (let i = 0; i < this.audienceMembers.length; i++) {
            const member = this.audienceMembers[i];
            const s = Math.sin(time * member.cheerSpeed + member.cheerPhase);
            const c = Math.cos(time * member.cheerSpeed * 0.8 + member.cheerPhase);

            member.group.position.y = member.baseY + Math.max(0, s) * 0.15 * member.cheerIntensity;
            member.armR.rotation.z = -0.5 - (s + 1) * 0.8 * member.cheerIntensity;
            member.armL.rotation.z = 0.5 + (s + 1) * 0.8 * member.cheerIntensity;
            member.head.rotation.y = c * 0.3;
            member.head.rotation.x = s * 0.15;
        }

        // Animate Jumbotron
        if (this.jumbotronCtx && this.jumbotronTex) {
            const ctx = this.jumbotronCtx;
            ctx.fillStyle = '#050515';
            ctx.fillRect(0, 0, 512, 256);

            const hue = (time * 50) % 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 15;
            
            const txtOffset = Math.sin(time * 2) * 10;
            ctx.fillText('WORLD CHAMPIONSHIP', 256, 100 + txtOffset);
            
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText(time % 2 < 1 ? 'FIGHT!' : 'ROUND 1', 256, 170 + txtOffset);

            this.jumbotronTex.needsUpdate = true;
        }

        // Animate Neon Strips
        for (let i = 0; i < this.neonStrips.length; i++) {
            const strip = this.neonStrips[i];
            const hue = (time * 0.2 + strip.baseHue) % 1.0;
            strip.mesh.material.color.setHSL(hue, 1.0, 0.5);
        }

        // Animate Volumetric Beams
        for (let i = 0; i < this.fogBeams.length; i++) {
            const beam = this.fogBeams[i];
            beam.mesh.material.opacity = 0.15 + Math.sin(time * 3 + beam.phase) * 0.05;
        }

        // Animate Rotating Spotlights
        for (let i = 0; i < this.rotatingLights.length; i++) {
            const rl = this.rotatingLights[i];
            const radius = 8;
            const speed = 1.5;
            rl.target.position.x = Math.sin(time * speed + rl.anglePhase) * radius;
            rl.target.position.z = Math.cos(time * speed + rl.anglePhase) * radius;
        }

        // Animate Particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 0.02; // drift down
                positions[i] += Math.sin(time + positions[i+1]) * 0.01; // drift side
                
                if (positions[i + 1] < 0) {
                    positions[i + 1] = 20;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    getBounds() {
        return this.bounds;
    }
}

window.Stage = Stage;
