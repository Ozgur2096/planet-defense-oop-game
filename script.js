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
    if (this.game.debug) {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
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
    if (this.game.debug) {
      context.beginPath();
      context.arc(0, 0, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
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
  shoot() {
    const projectile = this.game.getProjectile();
    if (projectile)
      projectile.start(
        this.x + this.radius * this.aim[0],
        this.y + this.radius * this.aim[1],
        this.aim[0],
        this.aim[1]
      );
  }
}

class Projectile {
  constructor(game) {
    this.game = game;
    this.x;
    this.y;
    this.radius = 5;
    this.speedX = 1;
    this.speedY = 1;
    this.speedModifier = 5;
    this.free = true;
  }
  start(x, y, speedX, speedY) {
    this.free = false;
    this.x = x;
    this.y = y;
    this.speedX = speedX * this.speedModifier;
    this.speedY = speedY * this.speedModifier;
  }
  reset() {
    this.free = true;
  }
  draw(context) {
    if (!this.free) {
      context.save();
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = 'gold';
      context.fill();
      context.restore();
    }
  }
  update() {
    if (!this.free) {
      this.x += this.speedX;
      this.y += this.speedY;
    }
    // reset if outside the visible game area
    if (
      this.x < 0 ||
      this.x > this.game.width ||
      this.y < 0 ||
      this.y > this.game.height
    ) {
      this.reset();
    }
  }
}

class Enemy {
  constructor(game) {
    this.game = game;
    this.x = 100;
    this.y = 100;
    this.radius = 40;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    this.speedX = 0;
    this.speedY = 0;
    this.collided = false;
    this.free = true;
  }
  start() {
    this.free = false;
    this.collided = false;
    this.frameX = 0;
    this.lives = this.maxLives;
    this.frameY = Math.floor(Math.random() * 4);
    if (Math.random() < 0.5) {
      this.x = Math.random() * this.game.width;
      this.y =
        Math.random() < 0.5 ? -this.radius : this.game.height + this.radius;
    } else {
      this.x =
        Math.random() < 0.5 ? -this.radius : this.game.width + this.radius;
      this.y = Math.random() * this.game.height;
    }
    const aim = this.game.calcAim(this, this.game.planet);
    this.speedX = aim[0];
    this.speedY = aim[1];
  }
  reset() {
    this.free = true;
  }
  hit(damage) {
    this.lives -= damage;
    if (this.lives >= 1) this.frameX++;
    // this.frameX = this.maxLives - this.lives;
  }
  draw(context) {
    if (!this.free) {
      context.save();
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x - this.radius,
        this.y - this.radius,
        this.width,
        this.height
      );
      if (this.game.debug) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.stroke();
        context.fillText(this.lives, this.x, this.y);
      }
      context.restore();
    }
  }
  update() {
    if (!this.free) {
      this.x -= this.speedX;
      this.y -= this.speedY;
      // check collision enemy / planet
      if (this.game.checkCollision(this, this.game.planet) && this.lives >= 1) {
        this.lives = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.collided = true;
        this.game.playerLives--;
        // this.reset();
      }
      // check collision enemy / player
      if (this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
        this.lives = 0;
        this.collided = true;
        this.game.playerLives--;
        // this.reset();
      }
      // check collision enemy / projectile
      this.game.projectilePool.forEach(projectile => {
        if (
          !projectile.free &&
          this.game.checkCollision(this, projectile) &&
          this.lives >= 1
        ) {
          projectile.reset();
          this.hit(1);
        }
      });
      // sprite animation
      if (this.lives < 1 && this.game.spriteUpdate) this.frameX++;
      if (this.frameX > this.maxFrame) {
        this.reset();
        if (!this.collided) {
          this.game.score += this.maxLives;
        }
      }
    }
  }
}

class Asteroid extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById('asteroid');
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 7;
    this.lives = 1;
    this.maxLives = this.lives;
  }
}

class LobsterMorph extends Enemy {
  constructor(game) {
    super(game);
    this.image = document.getElementById('lobster-morph');
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 14;
    this.lives = 8;
    this.maxLives = this.lives;
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.height = this.canvas.height;
    this.width = this.canvas.width;
    this.planet = new Planet(this);
    this.player = new Player(this);
    this.debug = false;

    this.projectilePool = [];
    this.numberOfProjectiles = 20;
    this.createProjectilePool();

    this.enemyPool = [];
    this.numberOfEnemies = 20;
    this.createEnemyPool();

    this.enemyPool[0].start();
    this.enemyTimer = 0;
    this.enemyInterval = 1700;

    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 150;

    this.score = 0;
    this.winningScore = 50;
    this.playerLives = 5;

    this.mouse = {
      x: 0,
      y: 0,
    };
    // event listeners
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
    });
    window.addEventListener('mousedown', e => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      this.player.shoot();
    });
    window.addEventListener('keyup', e => {
      if (e.key === 'd') this.debug = !this.debug;
      else if (e.key === 'a') this.player.shoot();
    });
  }
  render(context, deltaTime) {
    this.planet.draw(context);
    this.drawStatusText(context);
    this.player.draw(context);
    this.player.update();
    this.projectilePool.forEach(projectile => {
      projectile.draw(context);
      projectile.update();
    });
    this.enemyPool.forEach(enemy => {
      enemy.draw(context);
      enemy.update();
    });
    //periodically activate an enemy
    if (!this.gameOver) {
      if (this.enemyTimer < this.enemyInterval) {
        this.enemyTimer += deltaTime;
      } else {
        this.enemyTimer = 0;
        const enemy = this.getEnemy();
        if (enemy) enemy.start();
      }
    }
    // periodically update sprites
    if (this.spriteTimer < this.spriteInterval) {
      this.spriteTimer += deltaTime;
      this.spriteUpdate = false;
    } else {
      this.spriteTimer = 0;
      this.spriteUpdate = true;
    }
    // win / lose condition
    if (this.score >= this.winningScore || this.playerLives < 1) {
      this.gameOver = true;
    }
  }
  drawStatusText(context) {
    context.font = '30px sans-serif';
    context.fillStyle = 'white';
    context.fillText('Score ' + this.score, 200, 200);

    for (let i = 0; i < this.playerLives; i++) {
      context.fillRect(220 + 15 * i, 260, 10, 30);
    }

    if (this.gameOver) {
      context.textAlign = 'center';
      let message1;
      let message2;
      if (this.score >= this.winningScore) {
        message1 = 'You win!';
        message2 = 'Your score is ' + this.score;
      } else {
        message1 = 'You lose!';
        message2 = 'Your score is ' + this.score;
      }
      context.font = '100px sans-serif';
      context.fillText(message1, this.width * 0.5, 300);
      context.fillText(message2, this.width * 0.5, 400);
    }
  }
  calcAim(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const aimX = dx / distance;
    const aimY = dy / distance;
    return [aimX, aimY, dx, dy];
  }
  checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);
    const sumOfRadii = a.radius + b.radius;
    return distance < sumOfRadii;
  }
  createProjectilePool() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectilePool.push(new Projectile(this));
    }
  }
  getProjectile() {
    for (let i = 0; i < this.projectilePool.length; i++) {
      if (this.projectilePool[i].free) return this.projectilePool[i];
    }
  }
  createEnemyPool() {
    for (let i = 0; i < this.numberOfEnemies; i++) {
      let randomNumber = Math.random();
      if (randomNumber > 0.25) {
        this.enemyPool.push(new Asteroid(this));
      } else {
        this.enemyPool.push(new LobsterMorph(this));
      }
    }
  }
  getEnemy() {
    for (let i = 0; i < this.enemyPool.length; i++) {
      if (this.enemyPool[i].free) return this.enemyPool[i];
    }
  }
}

window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.height = window.screen.height;
  canvas.width = window.screen.width;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  const game = new Game(canvas);
  game.render(ctx);

  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime);
    window.requestAnimationFrame(animate);
  }
  this.window.requestAnimationFrame(animate);
});
