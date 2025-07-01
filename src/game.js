import Snake from "./Snake.js";
import MyEmitter from "./MyEmitter.js";

export const snakes = new Map();
export const worldRadius = 3000;
let inited = false;
const cellSize = 40; // розмір комірки, трохи більший за тіло змійки
let spatialGrid = new Map();
let foodSpatialGrid = new Map();
export const food = new Map(); // key: id, value: { x, y }
let foodId = 0;
let spawnFoodTime = 0;

const snakeSkins = ["dotted", "flame", "ice", "stripes", "orb", "dots", "glitch", "demon", "simple"];

export const emitter = new MyEmitter();



export function createSnake(id) {
    const angle = Math.random() * 2 * Math.PI;
    const p = [
        Math.cos(angle) * Math.random() * worldRadius * .8,
        Math.sin(angle) * Math.random() * worldRadius * .8
    ]
    const snake = new Snake(p);
    snake.id = id;
    snake.skin = snakeSkins[Math.floor(Math.random() * snakeSkins.length)];
    
    snakes.set(id, snake);

    return snake;
}

export function removeSnake(id) {
    snakes.delete(id);
    emitter.emit("kill-snake", id)
}

export function killSnake(snake) {
    const spread = 10; // розкид навколо точок

    for (let i = 0; i < snake.tail.length; i++) {
        const base = snake.tail[i];

        const pieces = 1 + Math.floor(2 + Math.random() * 3);
        for (let j = 0; j < pieces; j++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spread;

            const p = {
                x: base.x + Math.cos(angle) * radius,
                y: base.y + Math.sin(angle) * radius
            };

            food.set(foodId++, p);
            emitter.emit("spawn-food", { id: foodId - 1, pos: p });
        }
    }

    removeSnake(snake.id);
}


function spawnRandomFood() {
    const angle = Math.random() * 2 * Math.PI;
    const p = {
        x: Math.cos(angle) * Math.random() * worldRadius,
        y: Math.sin(angle) * Math.random() * worldRadius
    }
    food.set(foodId++, p);
    emitter.emit("spawn-food", { id: foodId, pos: p})
}

function eatFood(id) {
    food.delete(id);
    emitter.emit("eat-food", id);
}

function getCellKey(x, y) {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return `${cx},${cy}`;
}

function buildSpatialGrid() {
    spatialGrid.clear();

    for (const s of snakes.values()) {
        for (let i = 2; i < s.tail.length; i++) {
            const p = s.tail[i];
            const key = getCellKey(p.x, p.y);

            if (!spatialGrid.has(key)) {
                spatialGrid.set(key, []);
            }

            spatialGrid.get(key).push({ snake: s, point: p });
        }
    };
}

function calculateCollision() {
    buildSpatialGrid();

    const collisionDistance = 16;

    for (const snake of snakes.values()) {
        const head = snake.tail[0];
        const cx = Math.floor(head.x / cellSize);
        const cy = Math.floor(head.y / cellSize);

        // 3×3 сусідніх комірки
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const points = spatialGrid.get(key);
                if (!points) continue;

                for (const { snake: otherSnake, point } of points) {
                    if (otherSnake === snake) continue;

                    const dx = head.x - point.x;
                    const dy = head.y - point.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < collisionDistance * collisionDistance) {
                        killSnake(snake);
                        return;
                    }
                }
            }
        }
    };
}

function buildSpatialGridFood() {
    foodSpatialGrid.clear();

    for (const [id, pos] of food) {
        const key = getCellKey(pos.x, pos.y);
        if (!foodSpatialGrid.has(key)) {
            foodSpatialGrid.set(key, []);
        }
        foodSpatialGrid.get(key).push({ id, ...pos });
    }
}

function calculateCollisionFood() {
    buildSpatialGridFood();

    const collisionDistance = 20;

    for (const snake of snakes.values()) {
        const head = snake.tail[0];
        const cx = Math.floor(head.x / cellSize);
        const cy = Math.floor(head.y / cellSize);

        // 3×3 сусідніх комірки
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const points = foodSpatialGrid.get(key);
                
                if (!points) continue;

                for (const point of points) {
                    const dx = head.x - point.x;
                    const dy = head.y - point.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < collisionDistance * collisionDistance) {
                        eatFood(point.id);
                        snake.addLength(.15);
                    }
                }
            }
        }
    };
}



function update(dt) {
    for (const s of snakes.values()) {
        s.update(dt);

        const h = s.tail[0];
        const distSq = h.x * h.x + h.y * h.y;
        
        if(distSq > worldRadius * worldRadius) {
            queueMicrotask(() => { // queueMicrotask або "const toKill = [];" щоб відкласти видалення не ламаючи цикл
                killSnake(s);
            })
        }
    }

    calculateCollision();
    calculateCollisionFood();

    spawnFoodTime += dt;

    if(spawnFoodTime >= .1) {
        spawnFoodTime = 0;
        spawnRandomFood();
    }
}


export function initGame() {
    if(inited) return;
    inited = true;
    

    let lastTime = Date.now();

    setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;

        update(deltaTime);
    }, 16); // ~60 FPS


    for (let i = 0; i < 5000; i++) {
        spawnRandomFood();
    }
}
