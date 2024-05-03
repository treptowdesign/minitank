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
        ctx.fillStyle = this.fillColor;
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.strokeColor;
        ctx.beginPath();
        const vertices = this.getVertices();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        // ctx.fill();
        ctx.stroke();

        this.drawVertices(ctx)
        this.drawEdgePoints(ctx)
        this.drawCenter(ctx)
        this.drawNormals(ctx)
        // this.getDrawTestPoint(ctx)
    }
    handleCollision() {
        this.strokeColor = 'red'
    }
    getVertices() {
        const vertices = [];
        const angle = this.angle;
        const radius = Math.sqrt(3) * this.height / 3; // Radius of the circumcircle
        for (let i = 0; i < 3; i++) {
            const theta = angle + (i * 2 * Math.PI) / 3;
            const x = this.x + radius * Math.cos(theta);
            const y = this.y + radius * Math.sin(theta);
            vertices.push({ x: x, y: y });
        }
        return vertices;
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
            const normalAngle = edge.angle - Math.PI / 2; // rotate pi/2 radians (90deg)
            // const normalAngle = edge.angle + Math.PI / 2; // rotate pi/2 radians (90deg) other way
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

    getDrawTestPoint(ctx){
        const vertices = this.getVertices()
        // let testPoints = [];
        for (let i = 0; i < vertices.length; i++) {
            const next = i + 1 === vertices.length ? 0 : i + 1;
            const edge = { x: vertices[next].x - vertices[i].x, y: vertices[next].y - vertices[i].y };
            const normal = { x: -edge.y, y: edge.x };
            // testPoints.push(normal);
            ctx.strokeStyle = 'green'
            ctx.beginPath()
            ctx.arc(this.x + edge.x, this.y + edge.y, 4, 0, Math.PI * 2)
            ctx.stroke()
            ctx.strokeStyle = 'orange'
            ctx.beginPath()
            ctx.arc(this.x + normal.x, this.y + normal.y, 4, 0, Math.PI * 2)
            ctx.stroke()

        }
        // return testPoints;
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
            // ctx.fillText(edges[i].angle.toFixed(2), edges[i].midpoint.x + 5, edges[i].midpoint.y - 5)
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

const drawAxisLines = (ctx, entity, settings) => {

    const normalLines = entity.getNormalLines(20); // get normal lines with initial length

    normalLines.forEach(line => {
        const extendedEnd = extendLineToCanvasEdge(line, settings.canvasWidth, settings.canvasHeight);
        // draw the dashed line
        ctx.strokeStyle = '#ccc'
        ctx.setLineDash([5, 5]); // dashed line
        ctx.beginPath();
        ctx.moveTo(line.startX, line.startY);
        ctx.lineTo(extendedEnd.x, extendedEnd.y);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // circle at the canvas edge
        ctx.fillStyle = '#ccc'
        ctx.beginPath();
        ctx.arc(extendedEnd.x, extendedEnd.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // midpoint circle 
        const midpoint = {
            x: (line.startX + extendedEnd.x) / 2,
            y: (line.startY + extendedEnd.y) / 2
        }
        ctx.strokeStyle = '#ccc'
        ctx.beginPath();
        ctx.arc(midpoint.x, midpoint.y, 4, 0, Math.PI * 2);
        ctx.stroke();

        // quarterpoint circle (between mid and edge point)
        // const quarterpoint = {
        //     x: (midpoint.x + extendedEnd.x) / 2,
        //     y: (midpoint.y + extendedEnd.y) / 2
        // }
        // ctx.strokeStyle = '#0000ff'
        // ctx.beginPath();
        // ctx.arc(quarterpoint.x, quarterpoint.y, 4, 0, Math.PI * 2);
        // ctx.stroke();

        const perpLength = 20
        const perpAngle = line.normalAngle + Math.PI / 2;
        const perpLineA = {
            startX: midpoint.x,
            startY: midpoint.y,
            normalX: perpLength * Math.cos(perpAngle),
            normalY: perpLength * Math.sin(perpAngle)
        }
        const perpLineB = {
            startX: midpoint.x,
            startY: midpoint.y,
            normalX: -perpLength * Math.cos(perpAngle),
            normalY: -perpLength * Math.sin(perpAngle)
        }

        const perpLineAExt = extendLineToCanvasEdge(perpLineA, settings.canvasWidth, settings.canvasHeight)
        const perpLineBExt = extendLineToCanvasEdge(perpLineB, settings.canvasWidth, settings.canvasHeight)

        ctx.strokeStyle = '#0000ff';
        
        ctx.setLineDash([3, 3]); // dashed line

        ctx.beginPath();
        ctx.moveTo(perpLineAExt.x, perpLineAExt.y);
        ctx.lineTo(perpLineBExt.x, perpLineBExt.y);
        ctx.stroke();

        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(perpLineAExt.x, perpLineAExt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(perpLineBExt.x, perpLineBExt.y, 4, 0, Math.PI * 2);
        ctx.fill();

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




const generateRandomHexColor = () => {
    // Generate random values for red, green, and blue components
    const red = Math.floor(Math.random() * 256); // Random value between 0 and 255
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
  
    // Convert each component to hexadecimal and pad with zeros if necessary
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');
  
    // Concatenate the components into a hex color string
    const hexColor = `#${redHex}${greenHex}${blueHex}`;
  
    return hexColor;
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
Utilities.fps.refreshLoop()

// addEntity({x: 260, y: 200, height: 120, width: 80, angle: 0})
// addEntity({x: 520, y: 230, height: 140, width: 70, angle: 2.35})

addEntity({x: 260, y: 200, height: 90, angle: 0})
addEntity({x: 520, y: 230, height: 110, angle: 2.35})


// const colorArray = [
//     'cyan', 'red', 'orange', 'pink', 'gray', 'purple'
// ]

const colorArray = [
    generateRandomHexColor(), 
    generateRandomHexColor(), 
    generateRandomHexColor(), 
    generateRandomHexColor(), 
    generateRandomHexColor(), 
    generateRandomHexColor()
]

function gameLoop() {

    Settings.ctx.clearRect(0, 0, Settings.canvasWidth, Settings.canvasHeight)

    // entities.forEach(entity => {  entity.update(Input.state) }) 

    entities.forEach(entity => {entity.update(Input.state)})

    // entities.forEach(entity => {
    //     entity.update(Input.state)
    //     drawAxisLines(Settings.ctx, entity, Settings)
    // })

    // display the entity normals 
    let displayVertices = []
    let displayAxes = []
    entities.forEach(entity => {
        displayVertices.push(entity)
        displayAxes.push(...getAxes(entity.getVertices()))
    })
    displayAxes.flat() // flatten array to one level 
    displayAxes.forEach((axis, index) => {
        // console.log(index)
        const vertColor = colorArray[index]

        axis.x = Settings.canvasWidth/2 + axis.x // all relative so need to center on screen to see
        axis.y = Settings.canvasHeight/2 + axis.y // all relative so need to center on screen to see
        Settings.ctx.fillStyle = vertColor;
        Settings.ctx.beginPath();
        Settings.ctx.arc(axis.x, axis.y, 6, 0, Math.PI * 2);
        Settings.ctx.fill();
        displayVertices.forEach(body => { // loop thru entities 
            body.getVertices().forEach(v => { // loop thru vertices
                // const color = generateRandomHexColor()
                const pt = { x: v.x, y: v.y }
                Settings.ctx.strokeStyle = vertColor;
                Settings.ctx.beginPath();
                Settings.ctx.arc(Math.sqrt(pt.x * axis.x), Math.sqrt(pt.y * axis.y), 4, 0, Math.PI * 2);
                Settings.ctx.stroke();
            })
        })


    })



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
