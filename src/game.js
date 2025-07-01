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

            foodId++;
            food.set(foodId, p);
            emitter.emit("spawn-food", { id: foodId, ...p });
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

    foodId++;
    food.set(foodId, p);
    emitter.emit("spawn-food", { id: foodId, ...p })
}

function eatFood(id) {
    food.delete(id);
    emitter.emit("eat-food", id);
}

function getCellKey(x, y, cellSize = 40) {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return `${cx},${cy}`;
}

export function buildSpatialGrid(cellSize) {
    spatialGrid.clear();

    for (const s of snakes.values()) {
        for (let i = 2; i < s.tail.length; i++) {
            const p = s.tail[i];
            const key = getCellKey(p.x, p.y, cellSize);

            if (!spatialGrid.has(key)) {
                spatialGrid.set(key, []);
            }

            spatialGrid.get(key).push({ snake: s, point: p });
        }
    };
}

function calculateCollision() {
    buildSpatialGrid(cellSize);

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


export function getVisibleSnakeSegments(centerSnake, radius = 1500, cellSize = 40) {
    const head = centerSnake.tail[0];
    const cx = Math.floor(head.x / cellSize);
    const cy = Math.floor(head.y / cellSize);
    const result = new Map();

    for (let dx = -Math.ceil(radius / cellSize); dx <= Math.ceil(radius / cellSize); dx++) {
        for (let dy = -Math.ceil(radius / cellSize); dy <= Math.ceil(radius / cellSize); dy++) {
            const key = `${cx + dx},${cy + dy}`;
            const points = spatialGrid.get(key);
            if (!points) continue;

            for (const { snake: otherSnake, point } of points) {
                if (otherSnake.id === centerSnake.id) continue;

                const dx = point.x - head.x;
                const dy = point.y - head.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < radius * radius) {
                    if (!result.has(otherSnake.id)) {
                        result.set(otherSnake.id, {
                            id: otherSnake.id,
                            name: otherSnake.name,
                            skin: otherSnake.skin,
                            tail: []
                        });
                    }
                    result.get(otherSnake.id).tail.push({ x: point.x, y: point.y });
                }
            }
        }
    }

    return Array.from(result.values());
}




function update(dt) {
    const start = performance.now();
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

    
    const end = performance.now();
    const time = end - start;
    if (time > 10) console.warn(`⚠️ Update time: ${time.toFixed(2)}ms`);
}


export function initGame() {
    if(inited) return;
    inited = true;
    

    let lastTime = Date.now();

    setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;
        if (deltaTime > 0.05) console.warn(`[CLIENT] Δt=${deltaTime.toFixed(3)}s — frame skip or lag`);

        update(deltaTime);
    }, 30);


    for (let i = 0; i < 5000; i++) {
        spawnRandomFood();
    }
}
