export default class Snake {
    constructor(position) {
        this.dirMove = [0, -1];
        this.targetAngle = 0;
        this.length = 5;
        this.segmentLength = 20;
        this.maxSpeed = 320;
        this.minSpeed = 200;
        this.speed = this.minSpeed;
        this.fastMove = false;
        this.tail = new Array(this.length);
        for (let i = 0; i < this.tail.length; i++) {
            this.tail[i] = {
                x: position[0],
                y: position[1] + i * this.segmentLength
            }
        }
    }

    fast() {
        this.speed = this.maxSpeed;
        this.fastMove = true;
    }

    slow() {
        this.speed = this.minSpeed;
        this.fastMove = false;
    }

    rotate(pointer) {
        const head = this.tail[0];
        const dx = pointer.x - head.x;
        const dy = pointer.y - head.y;
        this.targetAngle = Math.atan2(dy, dx); // Кут до курсора
    }
     
    

    addLength(p) {
        this.length += p;
    }

    update(dt) {
        const head = this.tail[0];
    
        // 1. Обчислити поточний кут руху
        const currentAngle = Math.atan2(this.dirMove[1], this.dirMove[0]);
    
        // 2. Знайти різницю між кутами
        let delta = this.targetAngle - currentAngle;
    
        // 3. Нормалізувати різницю (-PI до PI)
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    
        // 4. Обмежити максимальне обертання
        const turnSpeed = 5; // радіанів за секунду
        const maxDelta = turnSpeed * dt;
    
        if (Math.abs(delta) > maxDelta) {
            delta = Math.sign(delta) * maxDelta;
        }
    
        // 5. Новий кут після обертання
        const newAngle = currentAngle + delta;
    
        // 6. Оновити напрям руху
        this.dirMove[0] = Math.cos(newAngle);
        this.dirMove[1] = Math.sin(newAngle);
    
        // 7. Рух голови
        head.x += this.dirMove[0] * this.speed * dt;
        head.y += this.dirMove[1] * this.speed * dt;




        if(this.fastMove && this.length > 5) {
            this.length -= dt * .7;
        }

        while(Math.floor(this.length) > this.tail.length) {
            this.tail.push({
                x: this.tail[this.tail.length - 1].x + Math.random(),
                y: this.tail[this.tail.length - 1].y
            })
        }

        if(Math.floor(this.length) < this.tail.length) {
            this.tail.splice(Math.floor(this.length));
        }




        // Логіка стабільної довжини змійки
        for (let i = 1; i < this.tail.length; i++) {
            let prev = this.tail[i - 1];
            let point = this.tail[i];

            let dx = prev.x - point.x;
            let dy = prev.y - point.y;

            // Нормалізуємо вектор і ставимо точку на segmentLength від prev
            let angle = Math.atan2(dy, dx);
            point.x = prev.x - Math.cos(angle) * this.segmentLength;
            point.y = prev.y - Math.sin(angle) * this.segmentLength;
        }
    }
}