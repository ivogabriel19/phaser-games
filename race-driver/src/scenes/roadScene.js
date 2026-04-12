export default class roadScene extends Phaser.Scene {
  constructor() {
    super('roadScene');
  }

  preload() {
    this.load.image('car', 'assets/f1_sprite_256.png');
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;

    // ── Parámetros del camino ───────────────────────────────────────
    this.segLen   = 200;   // unidades de mundo por segmento
    this.drawDist = 100;   // segmentos visibles
    this.camDepth = 150;   // distancia focal
    this.camH     = 300;   // altura de cámara sobre la pista
    this.roadHW   = 400;   // semiancho de la pista

    // ── Construir circuito ──────────────────────────────────────────
    this.segs = [];
    this.buildCircuit();
    this.numSegs    = this.segs.length;
    this.circuitLen = this.numSegs * this.segLen;

    // ── Estado del jugador ──────────────────────────────────────────
    this.pos      = 0;
    this.speed    = 0;
    this.maxSpd   = this.segLen * 6;   // ~300 km/h
    this.playerX  = 0;
    this.accelVal = 0;
    this.brakeVal = 0;

    // ── Gráficos ────────────────────────────────────────────────────
    this.gfx    = this.add.graphics();
    this.hudGfx = this.add.graphics().setDepth(20);

    this.carImg = this.add.image(this.W / 2, this.H - 80, 'car');
    this.carImg.setScale(0.6).setDepth(10);

    // ── HUD ─────────────────────────────────────────────────────────
    const ts = { fontFamily: 'monospace', stroke: '#000', strokeThickness: 3 };
    this.speedText = this.add.text(20, 16, '0 km/h', {
      ...ts, fontSize: '24px', color: '#ffffff',
    }).setDepth(20);
    this.add.text(20, 52, 'ACCEL', { ...ts, fontSize: '11px', color: '#44ff44' }).setDepth(20);
    this.add.text(20, 72, 'BRAKE', { ...ts, fontSize: '11px', color: '#ff4444' }).setDepth(20);

    // ── Controles WASD ──────────────────────────────────────────────
    this.keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONSTRUCCIÓN DEL CIRCUITO (óvalo)
  //
  // Cada segmento tiene:
  //   curve    → desplazamiento acumulado en render (>0 = curva derecha)
  //   worldX/Z → posición 2D real para el minimapa
  //
  // Geometría del óvalo:
  //   Recta 1 → Semiciclo derecha → Recta 2 → Semiciclo derecha
  //   El circuito cierra exactamente en (0,0).
  //
  // Radio de los semiciclos: r = segLen / (π / TURN)
  // Desplazamiento X entre rectas: 2r
  // ═══════════════════════════════════════════════════════════════════
  buildCircuit() {
    const STRAIGHT   = 100;            // segmentos por recta
    const TURN       = 100;            // segmentos por semiciclo
    const CURVE_RENDER = 0.045;        // fuerza visual de la curva

    const sections = [
      { count: STRAIGHT, curve: 0,            dAngle: 0 },
      { count: TURN,     curve: CURVE_RENDER, dAngle: Math.PI / TURN },
      { count: STRAIGHT, curve: 0,            dAngle: 0 },
      { count: TURN,     curve: CURVE_RENDER, dAngle: Math.PI / TURN },
    ];

    let wx = 0, wz = 0, angle = 0;

    for (const sec of sections) {
      for (let i = 0; i < sec.count; i++) {
        this.segs.push({ curve: sec.curve, worldX: wx, worldZ: wz });
        // Avanzar posición real en el mundo
        wx    += Math.sin(angle) * this.segLen;
        wz    += Math.cos(angle) * this.segLen;
        angle += sec.dAngle;
      }
    }

    // Bounding box para el minimapa
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of this.segs) {
      if (s.worldX < minX) minX = s.worldX;
      if (s.worldX > maxX) maxX = s.worldX;
      if (s.worldZ < minZ) minZ = s.worldZ;
      if (s.worldZ > maxZ) maxZ = s.worldZ;
    }
    this.mmMinX = minX; this.mmMaxX = maxX;
    this.mmMinZ = minZ; this.mmMaxZ = maxZ;
  }

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════
  update(_time, delta) {
    const dt = delta / 1000;

    // Velocidad
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

    // Avanzar posición en el circuito (cíclico)
    this.pos = (this.pos + this.speed * dt) % this.circuitLen;

    this.drawRoad();
    this.drawHUD();

    this.carImg.x = this.W / 2 + this.playerX * 280;
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER DEL CAMINO PSEUDO-3D
  //
  // Primera pasada (cerca → lejos): acumula el offset de curva en
  // pantalla (dx/x), calcula proyección perspectiva de cada tira.
  //
  // Segunda pasada (lejos → cerca): dibuja con algoritmo del pintor.
  // ═══════════════════════════════════════════════════════════════════
  drawRoad() {
    this.gfx.clear();

    const horizon = this.H / 2;
    const subOff  = this.pos % this.segLen;
    const segBase = Math.floor(this.pos / this.segLen);

    // ── 1ª pasada: calcula geometría de cada tira ──
    const strips = new Array(this.drawDist + 1).fill(null);
    let x = 0, dx = 0;

    for (let n = 0; n <= this.drawDist; n++) {
      const si  = (segBase + n) % this.numSegs;
      const seg = this.segs[si];

      const dFar  = (n + 1) * this.segLen - subOff;
      const dNear = n       * this.segLen - subOff;

      if (dFar > 0) {
        const sFar  = this.camDepth / dFar;
        const sNear = dNear > 0 ? Math.min(this.camDepth / dNear, 2) : 2;

        strips[n] = {
          si,
          yFar:  horizon + this.camH * sFar,
          yNear: Math.min(this.H, horizon + this.camH * sNear),
          // cx: centro del camino en pantalla = W/2 + curva acumulada - offset lateral del jugador
          cx:    this.W / 2 + x - this.playerX * 100,
          wFar:  this.roadHW * sFar,
          wNear: this.roadHW * sNear,
        };
      }

      // Acumular desplazamiento de curva para el siguiente segmento
      dx += seg.curve;
      x  += dx;
    }

    // ── Cielo ──
    this.gfx.fillStyle(0x4488cc);
    this.gfx.fillRect(0, 0, this.W, horizon);

    // ── 2ª pasada: dibuja de lejos a cerca ──
    for (let n = this.drawDist; n >= 0; n--) {
      const s = strips[n];
      if (!s) continue;
      if (s.yFar  >= this.H)    continue;
      if (s.yNear <= horizon)   continue;

      const { si, yFar, yNear, cx, wFar, wNear } = s;
      const alt = (si % 6) < 3;

      // Pasto
      this.gfx.fillStyle(alt ? 0x228b22 : 0x1a7a1a);
      this.gfx.fillRect(0, yFar, this.W, yNear - yFar);

      // Asfalto
      this.quad(alt ? 0x666666 : 0x555555,
        cx - wNear, yNear,  cx + wNear, yNear,
        cx + wFar,  yFar,   cx - wFar,  yFar);

      // Bordillos (alternando blanco/rojo)
      const rum = alt ? 0xffffff : 0xcc0000;
      this.quad(rum,
        cx - wNear * 1.08, yNear,  cx - wNear, yNear,
        cx - wFar,         yFar,   cx - wFar * 1.08, yFar);
      this.quad(rum,
        cx + wNear,        yNear,  cx + wNear * 1.08, yNear,
        cx + wFar * 1.08,  yFar,   cx + wFar,  yFar);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HUD: velocidad, barras accel/brake, minimapa
  // ═══════════════════════════════════════════════════════════════════
  drawHUD() {
    this.accelVal = Phaser.Math.Linear(this.accelVal, this.keys.up.isDown   ? 1 : 0, 0.25);
    this.brakeVal = Phaser.Math.Linear(this.brakeVal, this.keys.down.isDown ? 1 : 0, 0.25);

    const kmh = Math.round(this.speed / this.maxSpd * 300);
    this.speedText.setText(kmh + ' km/h');

    this.hudGfx.clear();

    // Barras
    const BX = 58, BW = 110, BH = 12;
    this.hudGfx.fillStyle(0x003300);
    this.hudGfx.fillRect(BX, 50, BW, BH);
    this.hudGfx.fillStyle(0x44ff44);
    this.hudGfx.fillRect(BX, 50, this.accelVal * BW, BH);
    this.hudGfx.fillStyle(0x330000);
    this.hudGfx.fillRect(BX, 70, BW, BH);
    this.hudGfx.fillStyle(0xff4444);
    this.hudGfx.fillRect(BX, 70, this.brakeVal * BW, BH);

    this.drawMinimap();
  }

  // ═══════════════════════════════════════════════════════════════════
  // MINIMAPA
  //
  // Dibuja el trazado completo del circuito escalado para caber en
  // un rectángulo en la esquina inferior derecha.
  // El punto rojo indica la posición actual del jugador.
  // ═══════════════════════════════════════════════════════════════════
  drawMinimap() {
    const MW = 150, MH = 130;
    const MX = this.W - MW - 15;
    const MY = this.H - MH - 15;

    // Escala uniforme para que el óvalo quepa centrado
    const rangeX = this.mmMaxX - this.mmMinX;
    const rangeZ = this.mmMaxZ - this.mmMinZ;
    const scale  = Math.min(MW / rangeX, MH / rangeZ) * 0.86;

    const midSX = MX + MW / 2;
    const midSZ = MY + MH / 2;
    const midWX = (this.mmMinX + this.mmMaxX) / 2;
    const midWZ = (this.mmMinZ + this.mmMaxZ) / 2;

    const toSX = wx => midSX + (wx - midWX) * scale;
    const toSZ = wz => midSZ + (wz - midWZ) * scale;

    // Panel de fondo semitransparente
    this.hudGfx.fillStyle(0x000000, 0.55);
    this.hudGfx.fillRoundedRect(MX - 6, MY - 6, MW + 12, MH + 12, 6);

    // Trazado del circuito
    this.hudGfx.lineStyle(2, 0xffffff, 0.9);
    this.hudGfx.beginPath();
    for (let i = 0; i < this.segs.length; i++) {
      const sx = toSX(this.segs[i].worldX);
      const sz = toSZ(this.segs[i].worldZ);
      i === 0 ? this.hudGfx.moveTo(sx, sz) : this.hudGfx.lineTo(sx, sz);
    }
    this.hudGfx.closePath();
    this.hudGfx.strokePath();

    // Punto del jugador
    const si   = Math.floor(this.pos / this.segLen) % this.numSegs;
    const pseg = this.segs[si];
    this.hudGfx.fillStyle(0xff2222, 1);
    this.hudGfx.fillCircle(toSX(pseg.worldX), toSZ(pseg.worldZ), 4);
  }

  // ─── utilidad: trapezoide relleno ──────────────────────────────────
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
