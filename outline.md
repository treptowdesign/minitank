# Game Outline 

Game 
- Settings
- Entity 
- Input 
- Utilities 
- Physics / Action: collision handlers etc
- Game Loop 


# Next ToDos 
- Enemy Line of Sight and Movement options 
- Map & terrain features 

Game.Enemy = class extends Game.Entity {
    constructor(args) {
        super(args);
        this.sightRange = 200; // enemy sight distance
        this.sightAngle = Math.PI / 4; // 45 degrees in either direction from the facing angle
    }

    isInLineOfSight(target) {
        const vertices = target.getVertices();

        return vertices.some(vertex => {
            const dx = vertex.x - this.x;
            const dy = vertex.y - this.y;
            const distanceToVertex = Math.sqrt(dx * dx + dy * dy);

            if (distanceToVertex > this.sightRange) {
                return false;
            }

            const angleToVertex = Math.atan2(dy, dx);
            const deltaAngle = Math.abs(this.angle - angleToVertex);

            return deltaAngle < this.sightAngle / 2;
        });
    }

    update() {
        // ... 
        if (this.isInLineOfSight(Game.player)) {
            // react to player in sight
        }
    }
};

# Avoids system...
// avoids
        if(this.avoids.length){
            const minAngle = this.angle - (this.fov / 2)
            const maxAngle = this.angle + (this.fov / 2)
            for(let a = 0; a < this.avoids.length; a++){
                const avoidAngle = Math.atan2(this.avoids[a].y - this.y, this.avoids[a].x - this.x)
                if(avoidAngle >= minAngle && avoidAngle <= maxAngle){
                    const target = (maxAngle - avoidAngle) > (avoidAngle - minAngle) ? minAngle : maxAngle
                    // this.destinationPoint = {
                    //     x: this.getZone(1).radius * Math.cos(target), 
                    //     y: this.getZone(1).radius * Math.sin(target)
                    // }
                }
            }
        }


# Notes

- Separating Axis Theorem

// Collisions Loop (All entities)
    console.log(Game.entities.length)
    for (let i = 0; i < Game.entities.length; i++) {
        for (let j = i + 1; j < Game.entities.length; j++) {
            if (checkCollision(Game.entities[i], Game.entities[j])) {
                Game.entities[i].handleCollision(Game.entities[j])
                Game.entities[j].handleCollision(Game.entities[i])
            }
        }
    }


# Quad Tree example

https://codepen.io/MatthewWid/pen/pBxGKj?editors=0010


# normalize angle 

const normalizeAngle = (angle) => {
    return (angle + (2 * Math.PI)) % (2 * Math.PI) 
}


const normalizeAngle2 = (angle) => {
    angle = angle % (2 * Math.PI)
    if (angle < 0) {
        angle += 2 * Math.PI
    }
    return angle;
}