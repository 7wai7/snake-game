
const hornsImage = new Image();
hornsImage.src = './assets/horns.png';
hornsImage.onload = () => {
    hornsImage.loaded = true;
};

const tailImage = new Image();
tailImage.src = './assets/devil_tail.png';
tailImage.onload = () => {
    tailImage.loaded = true;
};



function drawDotsSnake(ctx, snake, widthFactor) {
    for (let i = 0; i < snake.length; i++) {
        const p = snake[i];
        const radius = widthFactor * (snake.length - i) / snake.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius / 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${(i / snake.length) * 360}, 80%, 60%)`;
        ctx.fill();
    }
}

function drawGlitchSnake(ctx, snake, widthFactor) {
    for (let i = 1; i < snake.length - 1; i++) {
        const p1 = snake[i - 1];
        const p2 = snake[i];
        ctx.beginPath();
        ctx.moveTo(p1.x + (Math.random() - 0.5) * 5, p1.y + (Math.random() - 0.5) * 5);
        ctx.lineTo(p2.x + (Math.random() - 0.5) * 5, p2.y + (Math.random() - 0.5) * 5);
        ctx.strokeStyle = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
        ctx.lineWidth = widthFactor * 0.8;
        ctx.stroke();
    }
}        

function drawDottedSnake(ctx, snake, widthFactor) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        ctx.beginPath();
        ctx.fillStyle = i % 2 === 0 ? "#fff" : "#ccc"; // чергування кольорів
        ctx.arc(seg.x, seg.y, widthFactor / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawIceSnake(ctx, snake, widthFactor) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);

    for (let i = 1; i < snake.length - 1; i++) {
        const xc = 0.5 * (snake[i].x + snake[i + 1].x);
        const yc = 0.5 * (snake[i].y + snake[i + 1].y);
        ctx.quadraticCurveTo(snake[i].x, snake[i].y, xc, yc);

        const alpha = 0.3 + 0.7 * (1 - i / snake.length);
        ctx.strokeStyle = `rgba(150, 255, 255, ${alpha})`;
        ctx.lineWidth = widthFactor;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xc, yc);
    }

    ctx.lineTo(snake[snake.length - 1].x, snake[snake.length - 1].y);
    ctx.stroke();
}

function drawFlameSnake(ctx, snake, widthFactor) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);

    for (let i = 1; i < snake.length - 1; i++) {
        const xc = 0.5 * (snake[i].x + snake[i + 1].x);
        const yc = 0.5 * (snake[i].y + snake[i + 1].y);
        ctx.quadraticCurveTo(snake[i].x, snake[i].y, xc, yc);

        const h = 20 + Math.random() * 20 + (i / snake.length) * 60;
        ctx.strokeStyle = `hsl(${h}, 100%, 50%)`;
        ctx.lineWidth = widthFactor * (snake.length - i) / snake.length;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xc, yc);
    }

    ctx.lineTo(snake[snake.length - 1].x, snake[snake.length - 1].y);
    ctx.stroke();
}

function drawStripedSnake(ctx, snake, widthFactor) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        ctx.beginPath();
        ctx.fillStyle = i % 4 < 2 ? "#444" : "#aaa";
        ctx.arc(seg.x, seg.y, widthFactor * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawOrbSnake(ctx, snake, widthFactor) {
    for (let i = 0; i < snake.length; i++) {
        const seg = snake[i];
        const radius = widthFactor * 0.4;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 150, ${(1 - i / snake.length) * 0.8})`;
        ctx.shadowColor = "#ffff88";
        ctx.shadowBlur = 10;
        ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawDemonSnake(ctx, snake, widthFactor) {
    // Основне тіло з темно-червоною заливкою і чорною обводкою
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);

    for (let i = 1; i < snake.length - 1; i++) {
        const xc = 0.5 * (snake[i].x + snake[i + 1].x);
        const yc = 0.5 * (snake[i].y + snake[i + 1].y);
        ctx.quadraticCurveTo(snake[i].x, snake[i].y, xc, yc);
        ctx.lineWidth = widthFactor * (snake.length - i) / snake.length;
        ctx.strokeStyle = "#8b0000"; // темно-червоний
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xc, yc);
    }

    ctx.lineTo(snake[snake.length - 1].x, snake[snake.length - 1].y);
    ctx.lineWidth = widthFactor * 0.2;
    ctx.strokeStyle = "#8b0000";
    ctx.stroke();

    // Обводка (чорна поверх тіла)
    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);
    for (let i = 1; i < snake.length - 1; i++) {
        const xc = 0.5 * (snake[i].x + snake[i + 1].x);
        const yc = 0.5 * (snake[i].y + snake[i + 1].y);
        ctx.quadraticCurveTo(snake[i].x, snake[i].y, xc, yc);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#000";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xc, yc);
    }
    ctx.lineTo(snake[snake.length - 1].x, snake[snake.length - 1].y);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if(hornsImage.loaded) {
        // Роги на голові
        const head = snake[0];
        const neck = snake[1] || head;
        const angle = Math.atan2(head.y - neck.y, head.x - neck.x) + Math.PI / 2;
    
        // Малюємо роги
        const hornSize = 23;
        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(angle);
        ctx.drawImage(hornsImage, -hornSize / 2, -hornSize / 2 - 13, hornSize, hornSize);
        ctx.restore();
    }

    if(tailImage.loaded) {
        // Стріла на хвості
        const tail = snake[snake.length - 1];
        const preTail = snake[snake.length - 2] || tail;
        const tailAngle = Math.atan2(tail.y - preTail.y, tail.x - preTail.x) - Math.PI / 2;
    
        // Малюємо хвіст
        const tailSize = 23;
        ctx.save();
        ctx.translate(tail.x, tail.y);
        ctx.rotate(tailAngle);
        ctx.drawImage(tailImage, -tailSize / 2, -tailSize / 2, tailSize, tailSize);
        ctx.restore();
    }
}

function drawSimpleSnake(ctx, snake, widthFactor) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);

    for (let i = 1; i < snake.length - 1; i++) {
        const xc = 0.5 * (snake[i].x + snake[i + 1].x);
        const yc = 0.5 * (snake[i].y + snake[i + 1].y);
        ctx.quadraticCurveTo(snake[i].x, snake[i].y, xc, yc);
        ctx.lineWidth = widthFactor * (snake.length - i) / snake.length;
        ctx.strokeStyle = `hsl(${(i / snake.length) * 120}, 70%, 50%)`;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(xc, yc);
    }
    ctx.lineTo(snake[snake.length - 1].x, snake[snake.length - 1].y);
    ctx.lineWidth = widthFactor * 0.2;
    ctx.stroke();
}