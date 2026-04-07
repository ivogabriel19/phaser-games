export default class roadScene extends Phaser.Scene {
  constructor() {
    super('roadScene');
  }

  create() {
    // CONFIG
    this.width = this.scale.width;
    this.height = this.scale.height;

    this.roadWidth = 2000;
    this.segmentLength = 200;
    this.cameraHeight = 1000;
    this.cameraDepth = 1;
    this.drawDistance = 300;

    this.speed = 0;
    this.maxSpeed = 12000;
    this.acceleration = 200;

    this.position = 0;
    this.playerX = 0; // -1 izquierda, +1 derecha

    this.segments = [];
    this.createRoad();

    this.graphics = this.add.graphics();

    // INPUT
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  // =========================
  // CREAR CAMINO
  // =========================
  createRoad() {
    const total = 500;

    for (let i = 0; i < total; i++) {
      this.segments.push({
        index: i,
        z: i * this.segmentLength,
        curve: 0,
        y: 0
      });
    }

    // 👉 Agregamos curvas suaves
    this.addCurve(50, 100, 0.5);   // derecha
    this.addCurve(150, 100, -0.7); // izquierda
    this.addCurve(300, 150, 1.0);  // curva larga
  }

  addCurve(start, length, curve) {
    for (let i = start; i < start + length; i++) {
      this.segments[i % this.segments.length].curve = curve;
    }
  }

  // =========================
  // UPDATE
  // =========================
  update(time, delta) {
    const dt = delta / 1000;

    // ACELERAR SIEMPRE (tipo arcade)
    this.speed += this.acceleration;
    this.speed = Math.min(this.speed, this.maxSpeed);

    this.position += this.speed * dt;

    // INPUT
    if (this.cursors.left.isDown) {
      this.playerX -= 2 * dt;
    } else if (this.cursors.right.isDown) {
      this.playerX += 2 * dt;
    }

    this.playerX = Phaser.Math.Clamp(this.playerX, -1, 1);

    this.renderRoad();
  }

  // =========================
  // RENDER PSEUDO-3D
  // =========================
  renderRoad() {
    this.graphics.clear();

    let baseIndex = Math.floor(this.position / this.segmentLength) % this.segments.length;

    let x = 0;
    let dx = 0;

    let maxY = this.height;

    for (let n = 0; n < this.drawDistance; n++) {
      let segment = this.segments[(baseIndex + n) % this.segments.length];

      let prevSegment = this.segments[(baseIndex + n - 1 + this.segments.length) % this.segments.length];

      let z = segment.z - (this.position % this.segmentLength);
      let scale = this.cameraDepth / z;

      let screenX = (this.width / 2) + (scale * (x + this.playerX * this.roadWidth));
      let screenY = (this.height / 2) - (scale * this.cameraHeight);
      let screenW = scale * this.roadWidth;

      let prevZ = prevSegment.z - (this.position % this.segmentLength);
      let prevScale = this.cameraDepth / prevZ;

      let prevX = (this.width / 2) + (prevScale * (x - dx + this.playerX * this.roadWidth));
      let prevY = (this.height / 2) - (prevScale * this.cameraHeight);
      let prevW = prevScale * this.roadWidth;

      if (screenY >= maxY) continue;
      maxY = screenY;

      this.drawSegment(
        prevX, prevY, prevW,
        screenX, screenY, screenW,
        n
      );

      dx += segment.curve;
      x += dx;
    }
  }

  // =========================
  // DIBUJAR SEGMENTO
  // =========================
  drawSegment(x1, y1, w1, x2, y2, w2, n) {
    const grassColor = (Math.floor(n / 3) % 2) ? 0x10aa10 : 0x009a00;
    const roadColor = (Math.floor(n / 3) % 2) ? 0x555555 : 0x666666;
    const rumbleColor = 0xff0000;

    // GRASS
    this.graphics.fillStyle(grassColor);
    this.graphics.fillRect(0, y2, this.width, y1 - y2);

    // RUMBLE IZQ
    this.drawQuad(rumbleColor,
      x1 - w1 * 1.2, y1,
      x1 - w1, y1,
      x2 - w2, y2,
      x2 - w2 * 1.2, y2
    );

    // RUMBLE DER
    this.drawQuad(rumbleColor,
      x1 + w1, y1,
      x1 + w1 * 1.2, y1,
      x2 + w2 * 1.2, y2,
      x2 + w2, y2
    );

    // ROAD
    this.drawQuad(roadColor,
      x1 - w1, y1,
      x1 + w1, y1,
      x2 + w2, y2,
      x2 - w2, y2
    );
  }

  drawQuad(color, x1, y1, x2, y2, x3, y3, x4, y4) {
    this.graphics.fillStyle(color);
    this.graphics.beginPath();
    this.graphics.moveTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.lineTo(x3, y3);
    this.graphics.lineTo(x4, y4);
    this.graphics.closePath();
    this.graphics.fillPath();
  }
}