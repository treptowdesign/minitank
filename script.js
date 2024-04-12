////////////////////////////////////////////////////
// main game object
////////////////////////////////////////////////////
const Game = {
    Settings: {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        canvasWidth: 800,
        canvasHeight: 600
    },
    Entity: class {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        update() {}
        draw(ctx) {}
    },
    Entities: []
}
////////////////////////////////////////////////////
// inputs
////////////////////////////////////////////////////
Game.Input = {
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
};

////////////////////////////////////////////////////
// player
////////////////////////////////////////////////////

Game.Player = class extends Game.Entity {
    constructor(x, y, speed) {
        super(x, y);
        this.speed = speed;
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

        // Movement logic
        if(keys.ArrowLeft) { this.angle -= this.rotationSpeed; }
        if(keys.ArrowRight) { this.angle += this.rotationSpeed; }
        if(keys.ArrowUp) { this.speed += this.acceleration; }
        if(keys.ArrowDown) { this.speed -= this.acceleration; }
        if(keys.KeyA) { this.turretAngle -= this.rotationSpeed; }
        if(keys.KeyD) { this.turretAngle += this.rotationSpeed; }

        // Apply friction and limit speed
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'black';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = 'yellow';
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Turret logic
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
};


////////////////////////////////////////////////////
// game loop
////////////////////////////////////////////////////

Game.player = new Game.Player(Game.Settings.canvasWidth / 2, Game.Settings.canvasHeight / 2, 0);

function gameLoop() {
    Game.Settings.ctx.clearRect(0, 0, Game.Settings.canvasWidth, Game.Settings.canvasHeight);
    Game.player.update();
    Game.player.draw();
    requestAnimationFrame(gameLoop);
}

Game.Input.initialize();

gameLoop();
