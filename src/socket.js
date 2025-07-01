import WebSocket, { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createSnake, removeSnake, initGame, snakes, worldRadius, food, emitter } from './game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default function initSocket(server) {
    const wss = new WebSocketServer({
        server
        /* port: 3001,
        host: '0.0.0.0' */
    })

    wss.on('connection', async ws => {
        ws.id = Date.now().toString() + "_" + Math.floor(Math.random() * 1e7);


        ws.on('message', async raw => {
            try {
                let msg;
                try {
                    msg = JSON.parse(raw.toString());
                } catch (err) {
                    console.error('Invalid JSON:', raw);
                    return;
                }

                if(msg.type === "start") {
                    ws.snake = createSnake(ws.id);
                    ws.snake.name = msg.name;
                    ws.name = msg.name;
                    initGame();

                    ws.send(JSON.stringify({
                        type: 'start',
                        id: ws.id,
                        snakes: Array.from(snakes.entries()).map(([id, snake]) => ({ id, ...snake })),
                        worldRadius,
                        food: Array.from(food.entries()).map(([id, pos]) => ({ id, ...pos }))
                    }));
                } else if(msg.type === "mouse down") {
                    ws.snake.fast();
                } else if(msg.type === "mouse up") {
                    ws.snake.slow();
                } else if(msg.type === "mouse move") {
                    ws.snake.rotate(msg.pointer);
                }
                
            } catch (err) {
                console.error('Помилка в обробці повідомлення:', err);

                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Сталася помилка на сервері'
                }));
            }
        })

        ws.on('close', () => {
            console.log(`Зʼєднання з клієнтом ${ws.id} закрито`);
            removeSnake(ws.snake);
        });

        ws.on('error', err => {
            console.error('WebSocket помилка:', err);
            removeSnake(ws.snake);
        });
    })


    emitter.on("kill-snake", (id) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if(!client.name) return;
    
                client.send(JSON.stringify({
                    type: "kill-snake",
                    id
                }));
            }
        });
    })

    emitter.on("spawn-food", (f) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if(!client.name) return;
    
                client.send(JSON.stringify({
                    type: "food-spawn",
                    ...f
                }));
            }
        });
    })

    emitter.on("eat-food", (id) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if(!client.name) return;
    
                client.send(JSON.stringify({
                    type: "food-remove",
                    id
                }));
            }
        });
    })


    setInterval(() => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if(!client.name) return;
    
                client.send(JSON.stringify({
                    type: "snakes",
                    snakes: Array.from(snakes.entries()).map(([id, snake]) => ({ id, ...snake }))
                }));
            }
        });
    }, 16)
}