class Planet {
  constructor(game) {
    this.game = game;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.radius = 80;
    this.image = document.getElementById('planet');
  }
  draw(context) {
    context.drawImage(this.image, this.x - 100, this.y - 100);
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.stroke();
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.x = this.game.width / 2;
    this.y = this.game.height / 2;
    this.radius = 40;
    this.image = document.getElementById('spaceship');
    this.aim;
    this.angle = 0;
  }
  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.angle - Math.PI);
    context.drawImage(this.image, 0 - this.radius, 0 - this.radius);
    context.beginPath();
    context.arc(0, 0, this.radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
  update() {
    this.aim = this.game.calcAim(this.game.mouse, this.game.planet);
    this.x =
      this.game.planet.x +
      (this.game.planet.radius + this.radius) * this.aim[0];
    this.y =
      this.game.planet.y +
      (this.game.planet.radius + this.radius) * this.aim[1];
    this.angle = Math.atan2(this.aim[3], this.aim[2]);
  }
}
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.planet = new Planet(this);
    this.player = new Player(this);

    this.mouse = {
      x: 0,
      y: 0,
    };

    window.addEventListener('mousemove', e => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
    });
  }
  render(context) {
    this.planet.draw(context);
    this.player.draw(context);
    this.player.update();
    context.beginPath();
  }
  calcAim(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const aimX = dx / distance;
    const aimY = dy / distance;
    return [aimX, aimY, dx, dy];
  }
}

window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 500;
  canvas.height = 500;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  const game = new Game(canvas);
  game.render(ctx);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx);
    window.requestAnimationFrame(animate);
  }
  this.window.requestAnimationFrame(animate);
});
