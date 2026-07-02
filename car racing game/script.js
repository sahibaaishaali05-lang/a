const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreText = document.getElementById('finalScoreText');
const startScreen = document.getElementById('startScreen');

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

let gameRunning = false;
let score = 0;
let gameSpeed = 4.5;
let roadOffset = 0;
let frameCount = 0;

const ROAD_WIDTH = 280;
const ROAD_X = (CANVAS_WIDTH - ROAD_WIDTH) / 2;

const images = {
    road: new Image(),
    grass: new Image(),
    player: new Image(),
    enemy: new Image()
};

const player = {
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 130,
    width: 50,
    height: 90,
    speed: 6.5
};

let enemies = [];
let particles = [];
const keys = {};

// Load Images
function loadImages() {
    const list = [
        {key: 'road', src: 'images/road.png'},
        {key: 'grass', src: 'images/grass.png'},
        {key: 'player', src: 'images/player.png'},
        {key: 'enemy', src: 'images/enemy.png'}
    ];
    
    list.forEach(item => {
        images[item.key].onload = () => {};
        images[item.key].src = item.src;
    });
}

// Spawn Enemy
function spawnEnemy() {
    const lanes = [ROAD_X + 45, ROAD_X + 115, ROAD_X + 185, ROAD_X + 245];
    const lane = Math.floor(Math.random() * lanes.length);
    
    enemies.push({
        x: lanes[lane] - 25,
        y: -90,
        width: 50,
        height: 90,
        speed: gameSpeed + Math.random() * 1.2
    });
}

function checkCollision(a, b) {
    return !(a.x + a.width < b.x || a.x > b.x + b.width || 
             a.y + a.height < b.y || a.y > b.y + b.height);
}

function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x + Math.random() * 40 - 20,
            y: y + Math.random() * 60 - 30,
            vx: Math.random() * 9 - 4.5,
            vy: Math.random() * 8 - 7,
            life: 40,
            color: Math.random() > 0.5 ? "#ff8800" : "#ff2222"
        });
    }
}

// FIXED Background - No Black Box
function drawBackground() {
    // Base background
    ctx.fillStyle = "#0f2a0f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const offset = roadOffset % CANVAS_HEIGHT;

    // Grass Left & Right
    ctx.drawImage(images.grass, 0, offset - CANVAS_HEIGHT, ROAD_X, CANVAS_HEIGHT);
    ctx.drawImage(images.grass, 0, offset, ROAD_X, CANVAS_HEIGHT);
    
    const rightGrassX = ROAD_X + ROAD_WIDTH;
    ctx.drawImage(images.grass, rightGrassX, offset - CANVAS_HEIGHT, CANVAS_WIDTH - rightGrassX, CANVAS_HEIGHT);
    ctx.drawImage(images.grass, rightGrassX, offset, CANVAS_WIDTH - rightGrassX, CANVAS_HEIGHT);

    // Road
    ctx.drawImage(images.road, ROAD_X, offset - CANVAS_HEIGHT, ROAD_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(images.road, ROAD_X, offset, ROAD_WIDTH, CANVAS_HEIGHT);
}

function drawPlayer() {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffff";
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    ctx.restore();
}

function drawEnemies() {
    for (let e of enemies) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff4444";
        ctx.drawImage(images.enemy, e.x, e.y, e.width, e.height);
        ctx.restore();
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 8, 8);
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
}

function update() {
    if (!gameRunning) return;
    
    frameCount++;
    roadOffset += gameSpeed;

    // Player movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;

    player.x = Math.max(ROAD_X + 25, Math.min(ROAD_X + ROAD_WIDTH - player.width - 25, player.x));

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed;

        if (e.y > CANVAS_HEIGHT + 50) {
            enemies.splice(i, 1);
            score += 12;
            continue;
        }

        if (checkCollision(player, e)) {
            createExplosion(player.x + 25, player.y + 45);
            gameOver();
            return;
        }
    }

    if (frameCount % 52 === 0) spawnEnemy();
    if (frameCount % 380 === 0 && gameSpeed < 13) gameSpeed += 0.35;

    scoreDisplay.textContent = `SCORE: ${String(Math.floor(score)).padStart(5, '0')}`;
}

function render() {
    drawBackground();
    drawEnemies();
    drawPlayer();
    drawParticles();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    finalScoreText.textContent = `SCORE: ${String(Math.floor(score)).padStart(5, '0')}`;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    enemies = [];
    particles = [];
    score = 0;
    gameSpeed = 4.5;
    roadOffset = 0;
    frameCount = 0;
    player.x = CANVAS_WIDTH / 2 - 25;
    gameOverScreen.classList.add('hidden');
    gameRunning = true;
}

function startGame() {
    startScreen.classList.add('hidden');
    gameRunning = true;
}

// Controls
function setupControls() {
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
}

function setupTouchControls() {
    const container = document.querySelector('.game-container');
    
    const leftBtn = document.createElement('button');
    const rightBtn = document.createElement('button');
    
    leftBtn.textContent = '←';
    rightBtn.textContent = '→';
    
    const btnStyle = {position:'absolute', bottom:'45px', width:'75px', height:'75px', fontSize:'42px', 
                     background:'rgba(255,255,255,0.18)', color:'white', border:'4px solid rgba(255,255,255,0.5)', 
                     borderRadius:'50%', zIndex:'300'};
    
    Object.assign(leftBtn.style, btnStyle, {left: '35px'});
    Object.assign(rightBtn.style, btnStyle, {right: '35px'});
    
    container.append(leftBtn, rightBtn);

    leftBtn.addEventListener('touchstart', e => {e.preventDefault(); keys['ArrowLeft'] = true;});
    leftBtn.addEventListener('touchend', e => {e.preventDefault(); keys['ArrowLeft'] = false;});
    
    rightBtn.addEventListener('touchstart', e => {e.preventDefault(); keys['ArrowRight'] = true;});
    rightBtn.addEventListener('touchend', e => {e.preventDefault(); keys['ArrowRight'] = false;});
}

function init() {
    loadImages();
    setupControls();
    setupTouchControls();
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    requestAnimationFrame(gameLoop);
}

init();