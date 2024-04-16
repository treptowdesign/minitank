////////////////////////////////////////////////////
// main game object
////////////////////////////////////////////////////
console.log('MiniTanks v0.04') 
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
        constructor({ x = 0, y = 0, width = 10, height = 10, angle = 0 } = {}) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width 
            this.angle = angle
        }
        update() {}
        draw(ctx) {}
        handleCollision(){}
        getVertices() { // for collision detect
            const vertices = []; 
            const angle = this.angle;
            const corners = [
                { x: -this.width / 2, y: -this.height / 2 },
                { x: this.width / 2, y: -this.height / 2 },
                { x: this.width / 2, y: this.height / 2 },
                { x: -this.width / 2, y: this.height / 2 }
            ];
            corners.forEach(corner => {
                const rotatedX = this.x + (corner.x * Math.cos(angle) - corner.y * Math.sin(angle))
                const rotatedY = this.y + (corner.x * Math.sin(angle) + corner.y * Math.cos(angle))
                vertices.push({ x: rotatedX, y: rotatedY })
                // draw corners...
                // let ctx = Game.Settings.ctx
                // ctx.fillStyle = 'green'
                // ctx.beginPath()
                // ctx.arc(rotatedX, rotatedY, 1, 0, 2 * Math.PI);
                // ctx.fill()
            });
            return vertices
        }
    },
    entities: [],
    addEntity(entity) {
        this.entities.push(entity)
    },
    removeEntity(entity) {
        const index = this.entities.indexOf(entity)
        if (index > -1) { this.entities.splice(index, 1) }
    }
}
////////////////////////////////////////////////////
// enemy class
////////////////////////////////////////////////////
Game.Enemy = class extends Game.Entity{
    constructor({ x, y, angle, width = 30, height = 15 } = {}) {
        super({ x, y, width, height, angle })
        this.type = 'enemy'
        this.color = 'orange'
    }
    update() {
        // enemy movement...
    }
    draw() {
        let ctx = Game.Settings.ctx
        ctx.fillStyle = this.color
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
        ctx.restore() 
    }
    handleCollision(other){
        this.color = 'green'
    }
}

Game.createEnemy = function(args) {
    const enemy = new Game.Enemy(args)
    this.addEntity(enemy)
    return enemy
}

////////////////////////////////////////////////////
// bullet class
////////////////////////////////////////////////////
Game.Bullet = class extends Game.Entity{
    constructor({ x, y, angle, speed = 10, size = 4 } = {}) {
        super({ x, y, width: size, height: size, angle })
        this.type = 'bullet'
        this.speed = speed
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed
        // offmap removal
        if (this.x < 0 || this.x > Game.Settings.canvasWidth || this.y < 0 || this.y > Game.Settings.canvasHeight) {
            Game.removeEntity(this)
        }
    }
    draw() {
        let ctx = Game.Settings.ctx
        ctx.fillStyle = 'red'
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
        ctx.restore()
    }
    handleCollision(other){
        // console.log('Bullet Hit!!')
        Game.removeEntity(this) // remove bullet on hit!
    }
}

Game.createBullet = function(args) {
    const bullet = new Game.Bullet(args)
    this.addEntity(bullet)
    return bullet
}

////////////////////////////////////////////////////
// player class
////////////////////////////////////////////////////
Game.Player = class extends Game.Entity {
    constructor({ x, y, width = 16, height = 10, angle = 0, speed = 0} = {}) {
        super({ x, y, width, height, angle })
        this.type = 'player'
        this.speed = speed
        this.turretAngle = 0
        this.friction = 0.98
        this.rotationSpeed = 0.01
        this.acceleration = 0.03
        this.maxSpeed = 4
    }
    update() {
        let keys = Game.Input.keys

        // apply inputs
        if(keys.ArrowLeft) { this.angle -= this.rotationSpeed }
        if(keys.ArrowRight) { this.angle += this.rotationSpeed }
        if(keys.ArrowUp) { this.speed += this.acceleration }
        if(keys.ArrowDown) { this.speed -= this.acceleration }
        if(keys.KeyA) { this.turretAngle -= this.rotationSpeed }
        if(keys.KeyD) { this.turretAngle += this.rotationSpeed }
        if(keys.Space) { this.fireBullet() }

        // friction & speed
        this.speed *= this.friction
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed
        } else if (this.speed < -this.maxSpeed) {
            this.speed = -this.maxSpeed
        }

        // update pos
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed
    }
    draw() {
        let ctx = Game.Settings.ctx

        // tank
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.fillStyle = 'black'
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
        ctx.fillStyle = 'yellow'
        ctx.arc(0, 0, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // turret draw
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle + this.turretAngle)
        ctx.beginPath()
        ctx.moveTo(this.width / 2, 0)
        ctx.lineTo(this.width + 4, 0)
        ctx.lineWidth = 3
        ctx.strokeStyle = 'black'
        ctx.stroke()
        ctx.restore()
    }
    fireBullet() {
        Game.createBullet({x: this.x, y: this.y, angle: (this.angle + this.turretAngle)})
    }
    handleCollision(other){
       //  console.log('Player Hit')
    }
}

Game.createPlayer = function(args) { // instantiates, adds to entities array, and returns (for any other use)
    const player = new Game.Player(args)
    this.addEntity(player)
    return player
}

////////////////////////////////////////////////////
// helpers - not used yet, maybe move to Utilities...
////////////////////////////////////////////////////

// Math.clamp = function(value, min, max) {
//     return Math.min(Math.max(value, min), max);
// };

////////////////////////////////////////////////////
// collision detection 
////////////////////////////////////////////////////

const projectAxis = (vertices, axis) => {
    let min = Infinity;
    let max = -Infinity;
    vertices.forEach(vertex => {
        const projection = vertex.x * axis.x + vertex.y * axis.y;
        min = Math.min(min, projection);
        max = Math.max(max, projection);
    });
    return { min, max };
}

const overlap = (proj1, proj2) => {
    return proj1.max > proj2.min && proj2.max > proj1.min;
}

const getAxes = (vertices) => {
    let axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const next = i + 1 === vertices.length ? 0 : i + 1;
        const edge = { x: vertices[next].x - vertices[i].x, y: vertices[next].y - vertices[i].y };
        const normal = { x: -edge.y, y: edge.x };
        axes.push(normal);
    }
    return axes;
}

const checkCollision = (entity1, entity2) => {
    const vertices1 = entity1.getVertices();
    const vertices2 = entity2.getVertices();

    const axes = [
        ...getAxes(vertices1),
        ...getAxes(vertices2)
    ];

    for (let i = 0; i < axes.length; i++) {
        const axis = axes[i];
        const projection1 = projectAxis(vertices1, axis);
        const projection2 = projectAxis(vertices2, axis);
        if (!overlap(projection1, projection2)) {
            return false; // no collision 
        }
    }
    return true; // collision detected
}


////////////////////////////////////////////////////
// game loop
////////////////////////////////////////////////////

Game.createPlayer({x: (Game.Settings.canvasWidth / 2), y: (Game.Settings.canvasHeight / 2), angle: 0})

Game.createEnemy({x: 150, y: 100, angle: -0.2})
Game.createEnemy({x: 600, y: 100, angle: 0.7})
Game.createEnemy({x: 400, y: 500, angle: 0.45})

function gameLoop() {
    // Clear Canvas
    Game.Settings.ctx.clearRect(0, 0, Game.Settings.canvasWidth, Game.Settings.canvasHeight)
    // Update Entities 
    Game.entities.forEach(entity => entity.update())
    // Collisions Loop(s) 
    const bulletEntities = Game.entities.filter((e) => { return e.type == 'bullet' })
    const enemyEntities = Game.entities.filter((e) => { return e.type == 'enemy' })
    if(bulletEntities.length && enemyEntities.length){
        for (let i = 0; i < bulletEntities.length; i++) {
            for (let j = 0; j < enemyEntities.length; j++) {
                if (checkCollision(bulletEntities[i], enemyEntities[j])) {
                    bulletEntities[i].handleCollision(enemyEntities[j])
                    enemyEntities[j].handleCollision(bulletEntities[i])
                }
            }
        }
    }
    // Draw Entities
    Game.entities.forEach(entity => entity.draw())
    requestAnimationFrame(gameLoop)
}

Game.Input.initialize() // init keybinds 

gameLoop()
