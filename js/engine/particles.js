// ============================================
// ParticleSystem - 3D Hit FX, Sparks, Lightning & Energy Beam
// ============================================
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];

        this.boxGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.sphereGeo = new THREE.SphereGeometry(0.2, 8, 8);

        this.materials = {
            hit_spark: new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending }),
            block_spark: new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, blending: THREE.AdditiveBlending }),
            special_spark: new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, blending: THREE.AdditiveBlending }),
            dust: new THREE.MeshBasicMaterial({ color: 0x887766, transparent: true }),
            ko_explosion: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, blending: THREE.AdditiveBlending }),
            lightning: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, blending: THREE.AdditiveBlending }),
            beam_aura: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, blending: THREE.AdditiveBlending }),
            beam_blast: new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, blending: THREE.AdditiveBlending }),
            beam_charge: new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, blending: THREE.AdditiveBlending }),
            impact_flash: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending }),
            aura_effect: new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending })
        };
    }

    emit(type, position, direction, count = 10) {
        const mat = this.materials[type] || this.materials.hit_spark;
        
        const useSphere = ['beam_charge', 'impact_flash', 'beam_aura', 'beam_blast', 'aura_effect'].includes(type);
        const geo = useSphere ? this.sphereGeo : this.boxGeo;

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geo, mat.clone());
            mesh.position.copy(position);

            let vel = new THREE.Vector3(
                direction.x * Math.random() * 6 + (Math.random() - 0.5) * 4,
                direction.y * Math.random() * 6 + (Math.random() - 0.5) * 4 + 1,
                (Math.random() - 0.5) * 2
            );

            let life = 0.5 + Math.random() * 0.5;
            let scaleMult = 1.0;
            let gravity = 9.8;
            let isImplosion = false;

            if (type === 'dust') {
                life = 0.3 + Math.random() * 0.3;
            } else if (type === 'beam_aura') {
                vel.multiplyScalar(2.0);
                life = 0.4 + Math.random() * 0.4;
                scaleMult = 2.0;
                gravity = 0;
            } else if (type === 'beam_blast') {
                vel.multiplyScalar(3.0);
                life = 0.6 + Math.random() * 0.4;
                scaleMult = 3.0;
                gravity = 0;
            } else if (type === 'ko_explosion') {
                vel.multiplyScalar(2.5);
                life = 1.0 + Math.random() * 1.0;
                scaleMult = 3 + Math.random() * 3;
            } else if (type === 'beam_charge') {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4
                );
                mesh.position.add(offset);
                vel = offset.clone().negate().multiplyScalar(2.0); 
                life = 0.5;
                scaleMult = 1.5;
                gravity = 0;
                isImplosion = true;
            } else if (type === 'impact_flash') {
                vel.multiplyScalar(4.0);
                life = 0.2 + Math.random() * 0.2;
                scaleMult = 4.0;
                gravity = 0;
            } else if (type === 'aura_effect') {
                vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 3 + 1,
                    (Math.random() - 0.5) * 2
                );
                life = 0.4 + Math.random() * 0.3;
                scaleMult = 1.5;
                gravity = -2;
            }

            mesh.scale.setScalar(scaleMult);
            this.scene.add(mesh);

            this.particles.push({
                mesh: mesh,
                velocity: vel,
                life: life,
                maxLife: life,
                type: type,
                gravity: gravity,
                scaleMult: scaleMult,
                isImplosion: isImplosion
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.mesh.position.addScaledVector(p.velocity, dt);

            if (p.gravity !== 0 && !p.isImplosion) {
                p.velocity.y -= p.gravity * dt;
            }

            p.life -= dt;
            const ratio = Math.max(0, p.life / p.maxLife);

            p.mesh.material.opacity = ratio;
            p.mesh.scale.setScalar(p.scaleMult * ratio);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
}

window.ParticleSystem = ParticleSystem;
