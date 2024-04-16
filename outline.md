# Game Outline 

Game 
- Settings
- Entity 
- Input 
- Utilities 
- Physics / Action: collision handlers etc
- Game Loop 



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