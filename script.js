////////////////////////////////////////////////////
// main game object
////////////////////////////////////////////////////
console.log('MiniTanks v0.001')
const Game = {
    Settings: {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        canvasWidth: 800,
        canvasHeight: 600
    },
    Input: {
        keys: {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            Space: false,
            KeyA: false,
            KeyD: false
        },
        initialize() {
            document.addEventListener('keydown', (event) => {
                if (this.keys.hasOwnProperty(event.code)) {
                    this.keys[event.code] = true;
                }
            });
            document.addEventListener('keyup', (event) => {
                if (this.keys.hasOwnProperty(event.code)) {
                    this.keys[event.code] = false;
                }
            });
        }
    },
    Entity: class {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        update() {}
        draw(ctx) {}
    },
    entities: [],
    addEntity(entity) {
        this.entities.push(entity)
        console.log(this.entities)
    },
    removeEntity(entity) {
        const index = this.entities.indexOf(entity)
        if (index > -1) {
            this.entities.splice(index, 1)
        }
    }
}

////////////////////////////////////////////////////
// bullet class
////////////////////////////////////////////////////
Game.Bullet = class extends Game.Entity{
    constructor(x, y, vx, vy) {
        super(x, y);
        this.type = 'bullet',
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // offmap removal
        if (this.x < 0 || this.x > Game.Settings.canvasWidth || this.y < 0 || this.y > Game.Settings.canvasHeight) {
            Game.removeEntity(this);
        }
    }
    draw() {
        let ctx = Game.Settings.ctx;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

Game.createBullet = function(x, y, vx, vy) {
    const bullet = new Game.Bullet(x, y, vx, vy);
    this.addEntity(bullet);
    return bullet;
}

////////////////////////////////////////////////////
// player class
////////////////////////////////////////////////////
Game.Player = class extends Game.Entity {
    constructor(x, y, speed) {
        super(x, y);
        this.type = 'player',
        this.speed = speed,
        this.width = 16;
        this.height = 10;
        this.angle = 0;
        this.turretAngle = 0,
        this.friction = 0.98,
        this.rotationSpeed = 0.01,
        this.acceleration = 0.03,
        this.maxSpeed = 4
    }
    update() {
        let keys = Game.Input.keys;

        // apply inputs
        if(keys.ArrowLeft) { this.angle -= this.rotationSpeed; }
        if(keys.ArrowRight) { this.angle += this.rotationSpeed; }
        if(keys.ArrowUp) { this.speed += this.acceleration; }
        if(keys.ArrowDown) { this.speed -= this.acceleration; }

        if(keys.KeyA) { this.turretAngle -= this.rotationSpeed; }
        if(keys.KeyD) { this.turretAngle += this.rotationSpeed; }

        if (keys.Space) {
            console.log('FIRE');
            this.fireBullet();
        }

        // friction & speed
        this.speed *= this.friction;
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        } else if (this.speed < -this.maxSpeed) {
            this.speed = -this.maxSpeed;
        }

        // update pos
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    draw() {
        let ctx = Game.Settings.ctx;

        // tank
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'black';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = 'yellow';
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // turret draw
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + this.turretAngle);
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width + 4, 0);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black'; 
        ctx.stroke();
        ctx.restore();
    }
    fireBullet() {
        const speed = 10; // bullet speed
        const vx = Math.cos(this.angle + this.turretAngle) * speed;
        const vy = Math.sin(this.angle + this.turretAngle) * speed;
        Game.createBullet(this.x, this.y, vx, vy);
    }
}

Game.createPlayer = function() { // instantiates, adds to entities array, and returns (for any other use)
    const player = new Game.Player(this.Settings.canvasWidth / 2, this.Settings.canvasHeight / 2, 0);
    this.addEntity(player);
    return player; 
}


////////////////////////////////////////////////////
// game loop
////////////////////////////////////////////////////

Game.createPlayer()

function gameLoop() {
    Game.Settings.ctx.clearRect(0, 0, Game.Settings.canvasWidth, Game.Settings.canvasHeight)
    Game.entities.forEach(entity => entity.update())
    Game.entities.forEach(entity => entity.draw())
    requestAnimationFrame(gameLoop)
}

Game.Input.initialize()

gameLoop()
