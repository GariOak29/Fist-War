// ============================================
// CameraController - 2D Side-View Camera
// Locks to Z-axis, tracks fighters on X, zooms by distance
// ============================================
class CameraController {
    constructor(aspect) {
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
        this.camera.position.set(0, 3, 14);
        this.camera.lookAt(0, 2, 0);

        this.targetPos = new THREE.Vector3(0, 3, 14);
        this.baseY = 2.5;
        this.minZ = 10;
        this.maxZ = 20;
        this.smoothSpeed = 4;

        // Shake state
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
        this.shakeDuration = duration;
    }

    update(p1, p2, dt) {
        if (!p1 || !p2) return;

        // Midpoint between fighters
        const midX = (p1.x + p2.x) / 2;
        const midY = Math.max(0, (p1.y + p2.y) / 2);
        const distance = Math.abs(p1.x - p2.x);

        // Camera Z: further fighters = further camera
        const targetZ = Math.max(this.minZ, Math.min(this.maxZ, distance * 0.9 + 8));
        const targetX = THREE.MathUtils.clamp(midX, -8, 8);
        const targetY = this.baseY + midY * 0.3;

        // Smooth lerp
        this.camera.position.x += (targetX - this.camera.position.x) * this.smoothSpeed * dt;
        this.camera.position.y += (targetY - this.camera.position.y) * this.smoothSpeed * dt;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.smoothSpeed * dt;

        // Apply camera shake
        if (this.shakeTimer > 0) {
            const progress = this.shakeTimer / this.shakeDuration;
            const intensity = this.shakeIntensity * progress;
            this.camera.position.x += (Math.random() - 0.5) * intensity;
            this.camera.position.y += (Math.random() - 0.5) * intensity * 0.6;
            this.shakeTimer -= dt;
        }

        // Always look straight at z=0 plane (never rotate)
        this.camera.lookAt(
            this.camera.position.x,
            this.camera.position.y - 0.5,
            0
        );
    }
}

window.CameraController = CameraController;
