
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


document.addEventListener("DOMContentLoaded", async () => {

    function startGame() {
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
        let id;
        let player;
        let playerPos = {...zero};
        let cameraOffset = {...zero};
        let pointer = {...zero};
        let worldRadius = 3000;
        let pattern = null;
        let started = false;

        const img = new Image();
        img.src = './assets/hex image.png'; // або .svg, але бажано растроване
        
        img.onload = () => {
            pattern = ctx.createPattern(img, 'repeat');
        };
        

        socket.addEventListener('open', () => {
            console.log('WebSocket зʼєднання встановлено');
            socket.send(JSON.stringify({
                type: "start",
                name: getCookie('name')
            }));
        });

        socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "start") {
                id = data.id;
                for (const s of data.snakes) {
                    snakes.set(s.id, s);
                }
            
                player = snakes.get(id);
                worldRadius = data.worldRadius;
                for (const f of data.food) {
                    food.set(f.id, { x: f.x, y: f.y, color: getRandomColor(), pulseValue: Math.random(), pulse: true });
                }
                started = true;
            } else if (data.type === "food-spawn") {
                food.set(data.id, { x: data.pos.x, y: data.pos.y, color: getRandomColor(), pulseValue: Math.random(), pulse: true });
            } else if (data.type === "food-remove") {
                food.delete(data.id);
            } else if (data.type === "kill-snake") {
                snakes.delete(data.id);
            } else if (data.type === "snakes") {
                for (const s of data.snakes) {
                    snakes.set(s.id, s);
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

        let lastTime = Date.now();
        setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;
    
            render(deltaTime);
        }, 16);



        function render(dt) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if(!started) {
                ctx.fillStyle = "#000";
                ctx.font = "32px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
                return;
            }
        
            if(player) {
                const head = player.tail[0]; // голова
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

        
            // === Перемістити всю сцену ===
            ctx.setTransform(1, 0, 0, 1, 0, 0); // скинути попередню трансформацію
            ctx.translate(cameraOffset.x, cameraOffset.y);    // зрушити все, щоб гравець був у центрі


            const plateSize = Math.max(canvas.width, canvas.height) + 200; 
            const cx = Math.floor(playerPos.x - plateSize / 2);
            const cy = Math.floor(playerPos.y - plateSize / 2);
            ctx.fillStyle = pattern;
            ctx.fillRect(cx, cy, plateSize, plateSize);
            

            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
            ctx.fill();


            
            for (const f of food.values()) {
                if(f.pulseValue > 1) f.pulse = false;
                if(f.pulseValue < 0) f.pulse = true;


                if(f.pulse) f.pulseValue += dt * 2;
                else f.pulseValue -= dt;

                const pulseValue = 3 + f.pulseValue * 3;

                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.ellipse(f.x, f.y, pulseValue, pulseValue, 0, 0, Math.PI * 2);
                ctx.fill();
            }


            for (const s of snakes.values()) {
                const snake = s.tail;
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
        }

        

        

        function setupCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        setupCanvas();
        window.addEventListener("resize", setupCanvas);
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

        const saveName = () => {
            if (!nameInput.value.trim()) return;
            document.cookie = `name=${nameInput.value}`;
            modal.setAttribute('hidden', '');
            startGame();
        }

        nameInput.addEventListener("input", function (e) {
            if (nameInput.value.trim()) setNameBtn.classList.add('done');
            else setNameBtn.classList.remove('done');
        });

        nameInput.addEventListener("keydown", function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                saveName();
            }
        });

        setNameBtn.addEventListener("click", saveName);
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