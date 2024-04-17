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



# Notes

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