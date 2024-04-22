console.log('Script for SAT demo')

const Settings = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    canvasWidth: 800,
    canvasHeight: 600
}

const Input = {
    mousePos: {x: 0, y: 0},
    mouseDown: false,
    initialize(canvas){
        const that = this
        canvas.addEventListener('mousedown', function(event) {
            console.log('MouseDown')
        })
        canvas.addEventListener('mousedown', function(event) {
            console.log('MouseUp')
        })
        canvas.addEventListener('mousemove', function(event) {
            const rect = canvas.getBoundingClientRect();
            that.mousePos.x = event.clientX - rect.left;
            that.mousePos.y = event.clientY - rect.top;
        })
    }
}

const Utilities = {
    fps: {
        lastCalledTime: performance.now(),
        current: 0, 
        refreshLoop() {
            const now = performance.now()
            if (!this.lastCalledTime) {
                this.lastCalledTime = now
                this.current = 0
                return
            }
            const delta = (now - this.lastCalledTime) / 1000
            this.lastCalledTime = now
            this.current = 1 / delta
            requestAnimationFrame(this.refreshLoop.bind(this))
        },
        draw(ctx, data){
            ctx.fillStyle = '#333'
            ctx.fillRect(0, 0, 80, 60)
            ctx.fillStyle = '#fff'
            ctx.fillText('FPS: '+this.current.toFixed(2), 10, 20)
            ctx.fillText(data, 10, 40)
        }
    }
}

Utilities.fps.refreshLoop()

class Entity {
    constructor({ x = 0, y = 0, width = 10, height = 10, angle = 0 } = {}) {
        this.x = x
        this.y = y
        this.height = height
        this.width = width 
        this.angle = angle 
        this.color = 'black'
    }
    update() {
        // console.log('UPDATE')
    }
    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
        ctx.restore() 
    }
    handleCollision() {}
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
        });
        return vertices
    }
    containsPoint(point) {
        const vertices = this.getVertices()
        let contains = false
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y
            const xj = vertices[j].x, yj = vertices[j].y
            const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
            if (intersect) contains = !contains
        }
        return contains;
    }
}

const entities = []

const addEntity = (args) => {
    const entity = new Entity(args)
    entities.push(entity)
    return entity 
}

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
// loop 
////////////////////////////////////////////////////

Input.initialize(Settings.canvas)

addEntity({x: 50, y: 100, height: 60, width: 60, angle: 0})
addEntity({x: 150, y: 200, height: 70, width: 40, angle: 1.5})

function gameLoop() {

    Settings.ctx.clearRect(0, 0, Settings.canvasWidth, Settings.canvasHeight)

    entities.forEach(entity => {
        entity.update()
        entity.draw(Settings.ctx)
        if (entity.containsPoint(Input.mousePos)) {
            entity.color = 'red'
        } else {
            entity.color = 'black'
        }
    })

    Utilities.fps.draw(Settings.ctx, ('x: '+Input.mousePos.x +', y:'+Input.mousePos.y))

    requestAnimationFrame(gameLoop)
}

// Game.Input.initialize() // init keybinds 

gameLoop()
