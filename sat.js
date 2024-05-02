console.log('Script for SAT demo')

////////////////////////////////////////////////////
// settings / globals
////////////////////////////////////////////////////

const Settings = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    canvasWidth: 800,
    canvasHeight: 600
}

////////////////////////////////////////////////////
// inputs 
////////////////////////////////////////////////////

const Input = {
    state: {
        mousePos: {x: 0, y: 0},
        mouseDown: false,
        mouseWheel: 0
    },
    initialize(canvas){
        canvas.addEventListener('mousedown', (event) => {
            this.state.mouseDown = true
        })
        canvas.addEventListener('mouseup', (event) => {
            this.state.mouseDown = false
        })
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            this.state.mousePos.x = event.clientX - rect.left
            this.state.mousePos.y = event.clientY - rect.top
            this.state.mouseWheel = 0
        })
        canvas.addEventListener('wheel', (event) => {
            this.state.mouseWheel = event.deltaY
        })
    }
}

////////////////////////////////////////////////////
// utilities
////////////////////////////////////////////////////

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

////////////////////////////////////////////////////
// entities
////////////////////////////////////////////////////

class Entity {
    constructor({ x = 0, y = 0, width = 10, height = 10, angle = 0 } = {}) {
        this.x = x
        this.y = y
        this.height = height
        this.width = width 
        this.angle = angle 
        this.fillColor = '#000'
        this.strokeColor = '#000'
    }
    update(input) {
        const hover = this.containsPoint(input.mousePos)
        const click = input.mouseDown
        this.fillColor = hover ? '#666' : '#000'
        this.strokeColor = hover ? 'blue' : '#000'
        if(hover && Math.abs(input.mouseWheel) > 1){
            this.angle += input.mouseWheel * 0.01
        }
        if(click && hover){
            this.x = input.mousePos.x
            this.y = input.mousePos.y
        }
    }
    draw(ctx) {
        ctx.fillStyle = this.fillColor
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.lineWidth = 2
        ctx.strokeStyle = this.strokeColor
        ctx.beginPath()
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height)
        ctx.fill()
        ctx.stroke()
        ctx.restore() 

        this.drawVertices(ctx)
        this.drawEdgePoints(ctx)
        this.drawCenter(ctx)
        this.drawNormals(ctx)
    }
    handleCollision() {
        this.strokeColor = 'red'
    }
    getVertices() { // for collision detect
        const vertices = []; 
        const angle = this.angle;
        const corners = [
            { x: -this.width / 2, y: -this.height / 2 },
            { x: this.width / 2, y: -this.height / 2 },
            { x: this.width / 2, y: this.height / 2 },
            { x: -this.width / 2, y: this.height / 2 }
        ]
        corners.forEach(corner => {
            const rotatedX = this.x + (corner.x * Math.cos(angle) - corner.y * Math.sin(angle))
            const rotatedY = this.y + (corner.x * Math.sin(angle) + corner.y * Math.cos(angle))
            vertices.push({ x: rotatedX, y: rotatedY })
        })
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

    getVertices() { // for collision detect
        const vertices = []; 
        const angle = this.angle;
        const corners = [
            { x: -this.width / 2, y: -this.height / 2 },
            { x: this.width / 2, y: -this.height / 2 },
            { x: this.width / 2, y: this.height / 2 },
            { x: -this.width / 2, y: this.height / 2 }
        ]
        corners.forEach(corner => {
            const rotatedX = this.x + (corner.x * Math.cos(angle) - corner.y * Math.sin(angle))
            const rotatedY = this.y + (corner.x * Math.sin(angle) + corner.y * Math.cos(angle))
            vertices.push({ x: rotatedX, y: rotatedY })
        })
        return vertices
    }
    getEdges(){
        const vertices = this.getVertices()
        const edges = []
        for (let i = 0; i < vertices.length; i++) {
            const nextIndex = (i + 1) % vertices.length;
            const midpoint = {
                x: (vertices[i].x + vertices[nextIndex].x) / 2,
                y: (vertices[i].y + vertices[nextIndex].y) / 2
            };
            const dx = vertices[nextIndex].x - vertices[i].x
            const dy = vertices[nextIndex].y - vertices[i].y
            const angleRadians = Math.atan2(dy, dx)
            const edge = {
                start: vertices[i],
                end: vertices[nextIndex],
                midpoint: midpoint,
                angle: angleRadians
            }
            edges.push(edge)
        }
        return edges
    }
    getCenter(){
        const vertices = this.getVertices()
        return vertices.reduce((acc, v) => ({ x: acc.x + v.x / vertices.length, y: acc.y + v.y / vertices.length }), { x: 0, y: 0 })
    }
    getNormalLines(length){
        const edges = this.getEdges();
        const normalLines = []
        edges.forEach(edge => {
            const normalAngle = edge.angle + Math.PI / 2; // rotate pi/2 radians (90deg)
            // endpoint 20px length
            const normalX = Math.cos(normalAngle) * length;
            const normalY = Math.sin(normalAngle) * length;
            // startpoint
            const startX = edge.midpoint.x;
            const startY = edge.midpoint.y;
            normalLines.push({startX: startX, startY: startY, normalX: normalX, normalY: normalY, normalAngle: normalAngle})
        });
        return normalLines
    }

    drawVertices(ctx) {
        const vertices = this.getVertices()
        vertices.forEach(vertex => {
            ctx.lineWidth = 1
            ctx.strokeStyle = '#00ff00'
            ctx.beginPath()
            ctx.arc(vertex.x, vertex.y, 4, 0, Math.PI * 2)
            ctx.stroke()
        })
    }
    drawEdgePoints(ctx){
        const edges = this.getEdges()
        ctx.strokeStyle = '#0000ff'
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < edges.length; i++) {
            ctx.beginPath()
            ctx.arc(edges[i].midpoint.x, edges[i].midpoint.y, 4, 0, Math.PI * 2)
            ctx.stroke()
            ctx.fillText(edges[i].angle.toFixed(2), edges[i].midpoint.x + 5, edges[i].midpoint.y - 5)
        }
    }
    drawCenter(ctx){
        const center = this.getCenter()
        ctx.fillStyle = '#0000ff'
        ctx.beginPath()
        ctx.arc(center.x, center.y, 4, 0, Math.PI * 2)
        ctx.fill()
    }
    drawNormals(ctx) {
        const normals = this.getNormalLines(20)
        ctx.strokeStyle = '#ff00ff'; 
        normals.forEach(normal => {
            ctx.beginPath();
            ctx.moveTo(normal.startX, normal.startY);
            ctx.lineTo(normal.startX + normal.normalX, normal.startY + normal.normalY);
            ctx.stroke();
        });
    }
}

const entities = []

const addEntity = (args) => {
    const entity = new Entity(args)
    entities.push(entity)
    return entity 
}


////////////////////////////////////////////////////
// Extending Normals out to Canvas Edge
////////////////////////////////////////////////////


// const percentLine = (line, percentage) => {
//     const { startX, startY, endX, endY } = line;
//     const point = {
//         x: startX + (endX - startX) * percentage / 100,
//         y: startY + (endY - startY) * percentage / 100
//     };
//     return point;
// }

const drawExtendedNormalLines = (ctx, entity, settings) => {
    const normalLines = entity.getNormalLines(20); // get normal lines with initial length
    normalLines.forEach(line => {
        const extendedEnd = extendLineToCanvasEdge(line, settings.canvasWidth, settings.canvasHeight);
        // draw the dashed line
        ctx.strokeStyle = '#ff00ff'
        ctx.setLineDash([5, 5]); // dashed line
        ctx.beginPath();
        ctx.moveTo(line.startX, line.startY);
        ctx.lineTo(extendedEnd.x, extendedEnd.y);
        ctx.stroke();
        ctx.setLineDash([]); // reset
        // circle at the canvas edge
        ctx.fillStyle = '#ff00ff'
        ctx.beginPath();
        ctx.arc(extendedEnd.x, extendedEnd.y, 4, 0, Math.PI * 2);
        ctx.fill();
        // midpoint circle 
        const midpoint = {
            x: (line.startX + extendedEnd.x) / 2,
            y: (line.startY + extendedEnd.y) / 2
        }
        ctx.strokeStyle = '#ff00ff'
        ctx.beginPath();
        ctx.arc(midpoint.x, midpoint.y, 4, 0, Math.PI * 2);
        ctx.stroke();


        // quarterpoint circle (between mid and edge point)
        const quarterpoint = {
            x: (midpoint.x + extendedEnd.x) / 2,
            y: (midpoint.y + extendedEnd.y) / 2
        }
        ctx.strokeStyle = '#0000ff'
        ctx.beginPath();
        ctx.arc(quarterpoint.x, quarterpoint.y, 4, 0, Math.PI * 2);
        ctx.stroke();

        const perpLength = 20
        const perpAngle = line.normalAngle + Math.PI / 2;
        const perpLineA = {
            x: quarterpoint.x + perpLength * Math.cos(perpAngle),
            y: quarterpoint.y + perpLength * Math.sin(perpAngle)
        }
        const perpLineB = {
            x: quarterpoint.x - perpLength * Math.cos(perpAngle),
            y: quarterpoint.y - perpLength * Math.sin(perpAngle)
        }

        // need to pas in both quarterpoint and perpLine a/b
        // const perpLineAExt = extendLineToCanvasEdge(perpLineA, settings.canvasWidth, settings.canvasHeight)
        // const perpLineBExt = extendLineToCanvasEdge(perpLineB, settings.canvasWidth, settings.canvasHeight)

        ctx.strokeStyle = '#0000ff';
        ctx.setLineDash([3, 3]); // dashed line
        ctx.beginPath();
        ctx.moveTo(quarterpoint.x, quarterpoint.y);
        ctx.lineTo(perpLineA.x, perpLineA.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(quarterpoint.x, quarterpoint.y);
        ctx.lineTo(perpLineB.x, perpLineB.y);
        ctx.stroke();

        ctx.setLineDash([]); // reset



    });
}

const extendLineToCanvasEdge = (line, canvasWidth, canvasHeight) => {
    const { startX, startY, normalX, normalY } = line;
    let minDist = Infinity;
    let closestIntersection = null;

    // calculate intersections with each canvas edge
    if (normalX !== 0) {
        let tRight = (canvasWidth - startX) / normalX;
        let yRight = startY + tRight * normalY;
        if (yRight >= 0 && yRight <= canvasHeight && tRight > 0) {
            let dist = tRight * Math.hypot(normalX, normalY);
            if (dist < minDist) {
                minDist = dist;
                closestIntersection = { x: canvasWidth, y: yRight };
            }
        }

        let tLeft = -startX / normalX;
        let yLeft = startY + tLeft * normalY;
        if (yLeft >= 0 && yLeft <= canvasHeight && tLeft > 0) {
            let dist = tLeft * Math.hypot(normalX, normalY);
            if (dist < minDist) {
                minDist = dist;
                closestIntersection = { x: 0, y: yLeft };
            }
        }
    }

    if (normalY !== 0) {
        let tBottom = (canvasHeight - startY) / normalY;
        let xBottom = startX + tBottom * normalX;
        if (xBottom >= 0 && xBottom <= canvasWidth && tBottom > 0) {
            let dist = tBottom * Math.hypot(normalX, normalY);
            if (dist < minDist) {
                minDist = dist;
                closestIntersection = { x: xBottom, y: canvasHeight };
            }
        }

        let tTop = -startY / normalY;
        let xTop = startX + tTop * normalX;
        if (xTop >= 0 && xTop <= canvasWidth && tTop > 0) {
            let dist = tTop * Math.hypot(normalX, normalY);
            if (dist < minDist) {
                minDist = dist;
                closestIntersection = { x: xTop, y: 0 };
            }
        }
    }

    return closestIntersection;
};




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
Utilities.fps.refreshLoop()

addEntity({x: 260, y: 200, height: 120, width: 80, angle: 0})
addEntity({x: 520, y: 230, height: 140, width: 70, angle: 2.35})

function gameLoop() {

    Settings.ctx.clearRect(0, 0, Settings.canvasWidth, Settings.canvasHeight)

    // entities.forEach(entity => {  entity.update(Input.state) }) 

    entities.forEach(entity => {
        entity.update(Input.state);
        drawExtendedNormalLines(Settings.ctx, entity, Settings);
    });

    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            if (checkCollision(entities[i], entities[j])) {
                entities[i].handleCollision(entities[j])
                entities[j].handleCollision(entities[i])
            }
        }
    }

    entities.forEach(entity => { entity.draw(Settings.ctx) })

    Utilities.fps.draw(Settings.ctx, ('x: '+Input.state.mousePos.x +', y:'+Input.state.mousePos.y))

    requestAnimationFrame(gameLoop)
}


gameLoop()
