const synths = [];
const notes = ['C4', 'E4', 'G4', 'B4', 'D5', 'F5', 'A5', 'C6', 'E6', 'G6'];

function createSynth() {
    return new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 },
    }).toDestination();
}

let lastSoundTime = 0;
function playBounceSound(index) {
    const now = Tone.now();
    if (now - lastSoundTime > 0.1) {
        // Prevent rapid triggering
        synths[index].triggerAttackRelease(
            notes[index % notes.length],
            '8n',
            now
        );
        lastSoundTime = now;
    }
}

const boxes = [];
let gravityPoint = null;
let gravityEnabled = true;

canvas.addEventListener('mousemove', (event) => {
    if (gravityEnabled) {
        gravityPoint = { x: event.clientX, y: event.clientY };
    }
});

function toggleGravity() {
    gravityEnabled = !gravityEnabled;
    if (!gravityEnabled) {
        gravityPoint = null;
    }
}

function generateBoxes(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        let width = 50,
            height = 50;
        let dx = (Math.random() - 0.5) * 2;
        let dy = (Math.random() - 0.5) * 2;
        let mass = 1;
        let isColliding;

        do {
            isColliding = false;
            x = Math.random() * (canvas.width - width);
            y = Math.random() * (canvas.height - height);

            for (let j = 0; j < boxes.length; j++) {
                if (checkCollision({ x, y, width, height }, boxes[j])) {
                    isColliding = true;
                    break;
                }
            }
        } while (isColliding);

        boxes.push({ x, y, width, height, dx, dy, mass });
        synths.push(createSynth());
    }
}

function drawBoxes() {
    ctx.fillStyle = 'blue';
    boxes.forEach((box) =>
        ctx.fillRect(box.x, box.y, box.width, box.height)
    );

    if (gravityPoint) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(gravityPoint.x, gravityPoint.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function checkCollision(box1, box2) {
    return (
        box1.x < box2.x + box2.width &&
        box1.x + box1.width > box2.x &&
        box1.y < box2.y + box2.height &&
        box1.y + box1.height > box2.y
    );
}

function resolveCollision(box1, box2) {
    let overlapX = Math.min(
        box1.x + box1.width - box2.x,
        box2.x + box2.width - box1.x
    );
    let overlapY = Math.min(
        box1.y + box1.height - box2.y,
        box2.y + box2.height - box1.y
    );

    if (overlapX < overlapY) {
        if (box1.x < box2.x) {
            box1.x -= overlapX / 2;
            box2.x += overlapX / 2;
        } else {
            box1.x += overlapX / 2;
            box2.x -= overlapX / 2;
        }
    } else {
        if (box1.y < box2.y) {
            box1.y -= overlapY / 2;
            box2.y += overlapY / 2;
        } else {
            box1.y += overlapY / 2;
            box2.y -= overlapY / 2;
        }
    }

    let vx1 = box1.dx * 0.8;
    let vy1 = box1.dy * 0.8;
    let vx2 = box2.dx * 0.8;
    let vy2 = box2.dy * 0.8;

    let m1 = box1.mass;
    let m2 = box2.mass;

    box1.dx = ((m1 - m2) / (m1 + m2)) * vx1 + ((2 * m2) / (m1 + m2)) * vx2;
    box2.dx = ((m2 - m1) / (m1 + m2)) * vx2 + ((2 * m1) / (m1 + m2)) * vx1;

    box1.dy = ((m1 - m2) / (m1 + m2)) * vy1 + ((2 * m2) / (m1 + m2)) * vy2;
    box2.dy = ((m2 - m1) / (m1 + m2)) * vy2 + ((2 * m1) / (m1 + m2)) * vy1;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoxes();

    for (let i = 0; i < boxes.length; i++) {
        let box = boxes[i];

        if (gravityPoint && gravityEnabled) {
            let dx = gravityPoint.x - (box.x + box.width / 2);
            let dy = gravityPoint.y - (box.y + box.height / 2);
            let distance = Math.sqrt(dx * dx + dy * dy);
            let force = Math.min(1 / (distance || 1), 0.02);
            box.dx += force * dx;
            box.dy += force * dy;
        }

        box.x += box.dx;
        box.y += box.dy;

        if (box.x + box.width >= canvas.width || box.x <= 0) {
            box.dx *= -1;
            playBounceSound(i);
        }
        if (box.y + box.height >= canvas.height || box.y <= 0) {
            box.dy *= -1;
            playBounceSound(i);
        }

        for (let j = i + 1; j < boxes.length; j++) {
            if (checkCollision(box, boxes[j])) {
                resolveCollision(box, boxes[j]);
                playBounceSound(i);
                playBounceSound(j);
            }
        }
    }

    requestAnimationFrame(update);
}

document.addEventListener(
    'click',
    async () => {
        document.getElementById('click-message').style.display = 'none';
        await Tone.start();
        generateBoxes(10);
        update();
    },
    { once: true }
);