
function getCookie(name) {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1] || null;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getCellKey(x, y, cellSize = 40) {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    return `${cx},${cy}`;
}

function buildSpatialGridFood(food, foodSpatialGrid, cellSize = 40) {
    foodSpatialGrid.clear();

    for (const [id, pos] of food) {
        const key = getCellKey(pos.x, pos.y, cellSize);
        if (!foodSpatialGrid.has(key)) {
            foodSpatialGrid.set(key, []);
        }
        foodSpatialGrid.get(key).push({ id, ...pos });
    }
}

function generateFoodSprites() {

    const food = [];
    for (let i = 0; i < 100; i++) {
        const foodSprite = document.createElement('canvas');
        foodSprite.width = foodSprite.height = 20;
        const spriteCtx = foodSprite.getContext('2d');
        
        const r = Math.random() * 255;
        const g = Math.random() * 255;
        const b = Math.random() * 255;

        spriteCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;
        spriteCtx.shadowColor = `rgba(${r}, ${g}, ${b}, 1)`;
        spriteCtx.shadowBlur = 10;
        spriteCtx.beginPath();
        spriteCtx.arc(10, 10, 6, 0, Math.PI * 2);
        spriteCtx.fill();

        food.push(foodSprite);
    }

    return food;
}



document.addEventListener("DOMContentLoaded", async () => {

    const socket = new WebSocket(`ws://${location.host}`);
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let zero = {
        x: 0,
        y: 0
    };

    const snakes = new Map();
    const food = new Map();
    let foodSpatialGrid = new Map();
    /* const foodSprites = generateFoodSprites(); */
    let id;
    let player;
    let playerPos = { ...zero };
    let cameraOffset = { ...zero };
    let pointer = { ...zero };
    let worldRadius = 3000;
    let pattern = null;

    let started = false;
    let interval;

    const img = new Image();
    img.src = './assets/hex image.png';

    img.onload = () => {
        pattern = ctx.createPattern(img, 'repeat');
    };


    socket.addEventListener('open', () => {
        console.log('WebSocket зʼєднання встановлено');
    });
    
    let lastWS = performance.now();
    socket.addEventListener('message', (event) => {
        const now = performance.now();
        const intervalTime = now - lastWS;
        lastWS = now;
    
        /* if (intervalTime < 10) {
            console.warn("⚠ WS interval", intervalTime.toFixed(1), "ms");
        } */

        const data = JSON.parse(event.data);

        if (data.type === "start") {
            id = data.id;
            for (const s of data.snakes) {
                
                if(snakes.has(s.id)) {
                    const snake = snakes.get(s.id);
                    snake.name = s.name;
                    snake.skin = s.skin;
                    snake.tail = s.tail;
                } else {
                    snakes.set(s.id, {...s, tailInterpolation: s.tail});
                    
                }
            }

            player = snakes.get(id);
            worldRadius = data.worldRadius;
            for (const f of data.food) {
                food.set(f.id,
                    {
                        x: f.x,
                        y: f.y,
                        /* colorIndex: Math.floor(Math.random() * foodSprites.length), */
                        color: {
                            r: Math.random() * 255,
                            g: Math.random() * 255,
                            b: Math.random() * 255,
                        },
                        pulseValue: Math.random(),
                        pulse: true
                    });
            }


            started = true;
            let lastTime = Date.now();
            interval = setInterval(() => {
                const now = Date.now();
                const deltaTime = (now - lastTime) / 1000;
                lastTime = now;
                if (deltaTime > 0.05) console.warn(`[CLIENT] Δt=${deltaTime.toFixed(3)}s — frame skip or lag`);

                render(deltaTime);
            }, 16);
        }

        if(!started) return;
        
        if (data.type === "food-spawn") {
            food.set(data.id,
                {
                    x: data.x,
                    y: data.y,
                    /* colorIndex: Math.floor(Math.random() * foodSprites.length), */
                    color: {
                        r: Math.random() * 255,
                        g: Math.random() * 255,
                        b: Math.random() * 255,
                    },
                    pulseValue: Math.random(),
                    pulse: true
                });
        } else if (data.type === "food-remove") {
            food.delete(data.id);
        } else if (data.type === "kill-snake") {
            snakes.delete(data.id);

            if(data.id === id) stopGame();
        } else if (data.type === "snakes") {
            for (const s of data.snakes) {
                if(snakes.has(s.id)) {
                    const snake = snakes.get(s.id);
                    snake.name = s.name;
                    snake.skin = s.skin;
                    snake.tail = s.tail;

                    while(snake.tail.length > snake.tailInterpolation.length) {
                        snake.tailInterpolation.push({...snake.tail[snake.tailInterpolation.length]});
                    }
                    if(snake.tail.length < snake.tailInterpolation.length) {
                        snake.tailInterpolation.splice(snake.tail.length - snake.tailInterpolation.length);
                    }
                } else {
                    snakes.set(s.id, {...s, tailInterpolation: s.tail});
                    
                }
            }

            player = snakes.get(id);
        }
    });

    socket.addEventListener('close', () => {
        console.log('Зʼєднання закрито');
    });

    socket.addEventListener('error', (error) => {
        console.error('Сталася помилка:', error);
    });




    window.addEventListener("mousemove", e => {
        pointer = {
            x: e.pageX,
            y: e.pageY
        }
    });
    window.addEventListener("touchmove", e => {
        pointer = {
            x: e.pageX,
            y: e.pageY
        }
    });

    let isMouseDown = false;

    window.addEventListener('mousedown', () => {
        isMouseDown = true;
        socket.send(JSON.stringify({
            type: "mouse down"
        }));
    });

    window.addEventListener('mouseup', () => {
        isMouseDown = false;
        socket.send(JSON.stringify({
            type: "mouse up"
        }));
    });


    let frameTimes = [];
    function render(dt) {
        const start = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!started) {
            ctx.fillStyle = "#000";
            ctx.font = "32px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
            return;
        }

        if (player) {
            const head = player.tailInterpolation[0]; // голова
            playerPos.x = head.x;
            playerPos.y = head.y;
            cameraOffset.x = canvas.width / 2 - head.x;
            cameraOffset.y = canvas.height / 2 - head.y;

            const worldPoint = {
                x: pointer.x - cameraOffset.x,
                y: pointer.y - cameraOffset.y
            }


            socket.send(JSON.stringify({
                type: "mouse move",
                pointer: worldPoint
            }));
        }

        
        for (const s of snakes.values()) {
            const target = s.tail;
            const interp = s.tailInterpolation;
        
            for (let i = 0; i < target.length; i++) {
                interp[i].x = lerp(interp[i].x, target[i].x, 0.3);
                interp[i].y = lerp(interp[i].y, target[i].y, 0.3);
            }
        }
        


        // === Перемістити всю сцену ===
        ctx.setTransform(1, 0, 0, 1, 0, 0); // скинути попередню трансформацію
        ctx.translate(cameraOffset.x, cameraOffset.y);    // зрушити все, щоб гравець був у центрі


        const plateSize = Math.max(canvas.width, canvas.height) + 200;
        const cx = Math.floor(playerPos.x - plateSize / 2);
        const cy = Math.floor(playerPos.y - plateSize / 2);
        ctx.fillStyle = pattern;
        ctx.fillRect(cx, cy, plateSize, plateSize);



        drawFood(dt);


        for (const s of snakes.values()) {
            const snake = s.tailInterpolation;
            const widthFactor = 16;

            switch (s.skin) {
                case "dotted": drawDottedSnake(ctx, snake, widthFactor); break;
                case "flame": drawFlameSnake(ctx, snake, widthFactor); break;
                case "ice": drawIceSnake(ctx, snake, widthFactor); break;
                case "stripes": drawStripedSnake(ctx, snake, widthFactor); break;
                case "orb": drawOrbSnake(ctx, snake, widthFactor); break;
                case "dots": drawDotsSnake(ctx, snake, widthFactor); break;
                case "glitch": drawGlitchSnake(ctx, snake, widthFactor); break;
                case "demon": drawDemonSnake(ctx, snake, widthFactor); break;
                default: drawSimpleSnake(ctx, snake, widthFactor); break;
            }


            // Малюємо нікнейм, якщо це не поточний гравець
            if (s.id !== id) {
                const head = snake[0];
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;

                // обводка для контрасту
                ctx.strokeText(s.name, head.x, head.y - 15);
                ctx.fillText(s.name, head.x, head.y - 15);
            }
        };


        ctx.beginPath();
        ctx.strokeStyle = '#7670f380';
        ctx.lineWidth = 1500;
        ctx.ellipse(0, 0, worldRadius + ctx.lineWidth / 2, worldRadius + ctx.lineWidth / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#514cb2';
        ctx.lineWidth = 30;
        ctx.ellipse(0, 0, worldRadius + ctx.lineWidth / 2, worldRadius + ctx.lineWidth / 2, 0, 0, Math.PI * 2);
        ctx.stroke();


        // === Скинути трансформацію після рендеру ===
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const end = performance.now();
        const time = end - start;
        /* frameTimes.push(time);
    
        if (frameTimes.length > 100) frameTimes.shift();
        const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length; */

        
        console.log(`Render time: ${time.toFixed(2)}ms`);
        if (time > 16.6) console.warn(`⚠️ Render time: ${time.toFixed(2)}ms`);
        /* if (avg > 16.6) {
            console.warn(`⚠️ Render avg: ${avg.toFixed(2)}ms`);
        } */
    }

    function drawFood(dt) {
        const startPerformance = performance.now();

        const cellSize = canvas.width / 2;
        buildSpatialGridFood(food, foodSpatialGrid, cellSize);
        
        const cx = Math.floor(playerPos.x / cellSize);
        const cy = Math.floor(playerPos.y / cellSize);
        ctx.shadowBlur = 10;

        // 3×3 сусідніх комірки
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const points = foodSpatialGrid.get(key);
                
                if (!points) continue;

                for (const f of points) {
                    const dx = f.x - playerPos.x;
                    const dy = f.y - playerPos.y;
                    const viewRadius = cellSize + 20;
                    if (dx * dx + dy * dy > viewRadius * viewRadius) continue;

                    /* const foodSprite = foodSprites[f.colorIndex];
                    ctx.drawImage(foodSprite, f.x - 10, f.y - 10); */

                    
                    /* if (f.pulseValue > 1) f.pulse = false;
                    if (f.pulseValue < 0) f.pulse = true;
        
        
                    if (f.pulse) f.pulseValue += dt * 2;
                    else f.pulseValue -= dt;
        
                    const pulseValue = 3 + f.pulseValue * 3; */
        
                    ctx.beginPath();
                    /* ctx.globalAlpha = 0.3 + f.pulseValue; */
                    ctx.fillStyle = `rgb(${f.color.r}, ${f.color.g}, ${f.color.b})`;
                    ctx.shadowColor = `rgb(${f.color.r}, ${f.color.g}, ${f.color.b})`;
                    ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.globalAlpha = 1;
        ctx.shadowColor = "#b7acd1";
        ctx.shadowBlur = 0;
        
        const endPerformance = performance.now();
        const timePerformance = endPerformance - startPerformance;
        console.log(timePerformance);
    }

    function setupCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    setupCanvas();
    window.addEventListener("resize", setupCanvas);



    function startGame() {
        const nameInput = document.getElementById('name-input');
        if (!nameInput.value.trim()) return;
        const modal = document.getElementById('set-name-modal');
        document.cookie = `name=${nameInput.value}`;
        modal.setAttribute('hidden', '');

        socket.send(JSON.stringify({
            type: "start",
            name: getCookie('name')
        }));
    }

    function stopGame() {
        console.log("stop game");
        
        setTimeout(() => {
            started = false;
            clearInterval(interval);

            const modal = document.getElementById('set-name-modal');
            modal.removeAttribute('hidden');
        }, 3000);
    }







    try {
        const modal = document.getElementById('set-name-modal');
        const nameInput = document.getElementById('name-input');
        const setNameBtn = document.getElementById('set-name-btn');

        if (getCookie('name')) {
            nameInput.value = getCookie('name');
            if (nameInput.value.trim()) setNameBtn.classList.add('done');
            else setNameBtn.classList.remove('done');
        }

        if (!getCookie('name')) {
            modal.removeAttribute('hidden');
        }

        nameInput.addEventListener("input", function (e) {
            if (nameInput.value.trim()) setNameBtn.classList.add('done');
            else setNameBtn.classList.remove('done');
        });

        nameInput.addEventListener("keydown", function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                startGame();
            }
        });

        setNameBtn.addEventListener("click", startGame);
    } catch (error) {
        console.error(error);
    }


    try {
        document.addEventListener("input", function (event) {
            if (event.target.matches(".textarea-autosize")) {
                const textarea = event.target;
                textarea.style.height = "auto";
                textarea.style.height = textarea.scrollHeight + "px";
            }
        });
    } catch (error) {
        console.error(error);
    }



})