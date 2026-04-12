export default class roadScene extends Phaser.Scene {
  constructor() {
    super('roadScene');
  }

  preload() {
    this.load.image('car', 'assets/f1_sprite_256.png');
  }

  create() {
    this.W = this.scale.width;   // 800
    this.H = this.scale.height;  // 600

    // ── Parámetros del camino ───────────────────────────────────────
    this.segLen   = 200;   // unidades de mundo por segmento
    this.numSegs  = 500;   // total de segmentos (cíclico → camino infinito)
    this.drawDist = 150;   // cuántos segmentos se dibujan
    this.camDepth = 150;   // distancia focal (unidades de mundo)
    this.camH     = 300;   // altura de cámara sobre la pista
    this.roadHW   = 400;   // semiancho de la pista en unidades de mundo

    // Segmentos planos (camino recto, sin curvas)
    this.segs = Array.from({ length: this.numSegs }, (_, i) => ({ i }));

    // ── Estado del jugador ──────────────────────────────────────────
    this.pos     = 0;                    // posición Z de la cámara
    this.speed   = 0;
    this.maxSpd  = this.segLen * 6;     // 6 segmentos/seg (~240 km/h)
    this.playerX = 0;                   // desplazamiento lateral (−1 … +1)

    // ── Gráficos ────────────────────────────────────────────────────
    this.gfx = this.add.graphics();

    this.carImg = this.add.image(this.W / 2, this.H - 80, 'car');
    this.carImg.setScale(0.6);
    this.carImg.setDepth(10);

    // ── Controles WASD ──────────────────────────────────────────────
    this.keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update(_time, delta) {
    const dt = delta / 1000;

    // Aceleración / frenada / rozamiento
    if (this.keys.up.isDown)
      this.speed = Math.min(this.speed + this.maxSpd * 2 * dt, this.maxSpd);
    else if (this.keys.down.isDown)
      this.speed = Math.max(this.speed - this.maxSpd * 3 * dt, 0);
    else
      this.speed = Math.max(this.speed - this.maxSpd * dt, 0);

    // Dirección lateral
    if (this.keys.left.isDown)  this.playerX -= 2 * dt;
    if (this.keys.right.isDown) this.playerX += 2 * dt;
    this.playerX = Phaser.Math.Clamp(this.playerX, -1.5, 1.5);

    this.pos += this.speed * dt;

    this.drawRoad();

    // El sprite del auto se mueve lateralmente sobre la pantalla
    this.carImg.x = this.W / 2 + this.playerX * 280;
  }

  // ────────────────────────────────────────────────────────────────
  // Renderizado pseudo-3D (proyección perspectiva por tira)
  //
  // Para la tira n (n=0 es el segmento donde está la cámara,
  // n=drawDist es el más lejano):
  //   dFar  = profundidad del borde lejano  → proyecta arriba en pantalla
  //   dNear = profundidad del borde cercano → proyecta abajo en pantalla
  //   escala = camDepth / profundidad
  //   screenY = horizonte + camH * escala
  // ────────────────────────────────────────────────────────────────
  drawRoad() {
    this.gfx.clear();

    const horizon = this.H / 2;
    const subOff  = this.pos % this.segLen;          // offset dentro del segmento actual
    const segBase = Math.floor(this.pos / this.segLen);

    // Cielo
    this.gfx.fillStyle(0x4488cc);
    this.gfx.fillRect(0, 0, this.W, horizon);

    // Dibuja de lejos a cerca (algoritmo del pintor)
    for (let n = this.drawDist; n >= 0; n--) {
      const dFar  = (n + 1) * this.segLen - subOff;
      const dNear = n       * this.segLen - subOff;

      if (dFar <= 0) continue; // tira completamente detrás de la cámara

      const sFar  = this.camDepth / dFar;
      // Cuando dNear ≤ 0 (borde cercano está detrás de la cámara),
      // usamos escala 2 para que la tira llegue hasta el borde inferior.
      const sNear = dNear > 0 ? Math.min(this.camDepth / dNear, 2) : 2;

      const yFar  = horizon + this.camH * sFar;
      const yNear = Math.min(this.H, horizon + this.camH * sNear);

      if (yFar  >= this.H)    continue; // tira por debajo de la pantalla
      if (yNear <= horizon)   continue; // tira por encima del horizonte

      const wFar  = this.roadHW * sFar;
      const wNear = this.roadHW * sNear;
      const cx    = this.W / 2;

      // Colores alternados cada 3 segmentos
      const si  = (segBase + n) % this.numSegs;
      const alt = (si % 6) < 3;

      // ── Pasto (franja completa de pantalla) ──
      this.gfx.fillStyle(alt ? 0x228b22 : 0x1a7a1a);
      this.gfx.fillRect(0, yFar, this.W, yNear - yFar);

      // ── Asfalto ──
      this.quad(alt ? 0x666666 : 0x555555,
        cx - wNear, yNear,  cx + wNear, yNear,
        cx + wFar,  yFar,   cx - wFar,  yFar);

      // ── Bordillos ──
      const rumble = alt ? 0xffffff : 0xcc0000;
      this.quad(rumble,
        cx - wNear * 1.2, yNear,  cx - wNear, yNear,
        cx - wFar,        yFar,   cx - wFar * 1.2, yFar);
      this.quad(rumble,
        cx + wNear,       yNear,  cx + wNear * 1.2, yNear,
        cx + wFar * 1.2,  yFar,   cx + wFar, yFar);
    }
  }

  quad(color, x1, y1, x2, y2, x3, y3, x4, y4) {
    this.gfx.fillStyle(color);
    this.gfx.beginPath();
    this.gfx.moveTo(x1, y1);
    this.gfx.lineTo(x2, y2);
    this.gfx.lineTo(x3, y3);
    this.gfx.lineTo(x4, y4);
    this.gfx.closePath();
    this.gfx.fillPath();
  }
}
