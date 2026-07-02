// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreText = document.getElementById('finalScoreText');
const startScreen = document.getElementById('startScreen');

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

// Game variables
let gameRunning = false;
let score = 0;
let gameSpeed = 4;
let lastTime = 0;
let frameCount = 0;

// Images
const images = {
    road: new Image(),
    grass: new Image(),
    player: new Image(),
    enemy: new Image()
};

let imagesLoaded = 0;
const totalImages = 4;

// Player
const player = {
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 120,
    width: 50,
    height: 90,
    speed: 6
};

// Road scrolling
let roadOffset = 0;
const ROAD_WIDTH = 280;
const ROAD_X = (CANVAS_WIDTH - ROAD_WIDTH) / 2;

// Arrays
let enemies = [];
let particles = []; // For polish on collision

// Controls
const keys = {};

// Load images
function loadImages() {
    const imageList = [
        { key: 'road', src: 'images/road.png' },
        { key: 'grass', src: 'images/grass.png' },
        { key: 'player', src: 'images/player.png' },
        { key: 'enemy', src: 'images/enemy.png' }
    ];

    imageList.forEach(item => {
        images[item.key].onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                console.log('All images loaded');
            }
        };
        images[item.key].src = item.src;
    });
}

// Spawn enemy
function spawnEnemy() {
    const lanes = [ROAD_X + 40, ROAD_X + 110, ROAD_X + 180, ROAD_X + 240];
    const randomLane = Math.floor(Math.random() * lanes.length);
    
    enemies.push({
        x: lanes[randomLane] - 25,
        y: -80,
        width: 50,
        height: 90,
        speed: gameSpeed + (Math.random() * 1.5 - 0.5)
    });
}

// Collision detection
function checkCollision(rect1, rect2) {
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect1.x > rect2.x + rect2.width ||
        rect1.y + rect1.height < rect2.y ||
        rect1.y > rect2.y + rect2.height
    );
}

// Create explosion particles
function createExplosion(x, y) {
    for (let i = 0; i < 18; i++) {
        particles.push({
            x: x + Math.random() * 40 - 20,
            y: y + Math.random() * 60 - 30,
            vx: Math.random() * 8 - 4,
            vy: Math.random() * 8 - 6,
            life: 35 + Math.random() * 20,
            color: Math.random() > 0.5 ? '#ff8800' : '#ff2200'
        });
    }
}

// Draw background
function drawBackground() {
    // Grass left
    ctx.drawImage(images.grass, 0, 0, ROAD_X, CANVAS_HEIGHT);
    ctx.drawImage(images.grass, 0, -CANVAS_HEIGHT + (roadOffset % CANVAS_HEIGHT), ROAD_X, CANVAS_HEIGHT);
    
    // Grass right
    const rightGrassX = ROAD_X + ROAD_WIDTH;
    ctx.drawImage(images.grass, rightGrassX, 0, CANVAS_WIDTH - rightGrassX, CANVAS_HEIGHT);
    ctx.drawImage(images.grass, rightGrassX, -CANVAS_HEIGHT + (roadOffset % CANVAS_HEIGHT), CANVAS_WIDTH - rightGrassX, CANVAS_HEIGHT);
    
    // Road - tiled scrolling
    const roadY1 = roadOffset % (CANVAS_HEIGHT * 1.5);
    ctx.drawImage(images.road, ROAD_X, roadY1 - CANVAS_HEIGHT * 1.2, ROAD_WIDTH, CANVAS_HEIGHT * 2.2);
    
    const roadY2 = roadY1 - CANVAS_HEIGHT * 1.5;
    ctx.drawImage(images.road, ROAD_X, roadY2, ROAD_WIDTH, CANVAS_HEIGHT * 2.2);
}

// Draw player
function drawPlayer() {
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    ctx.restore();
}

// Draw enemies
function drawEnemies() {
    for (let enemy of enemies) {
        ctx.save();
        ctx.shadowColor = '#f33';
        ctx.shadowBlur = 12;
        ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.restore();
    }
}

// Draw particles
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 7, 7);
        ctx.restore();
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Update game
function update(delta) {
    if (!gameRunning) return;
    
    frameCount++;
    
    // Scroll road
    roadOffset += gameSpeed;
    if (roadOffset > 10000) roadOffset = 0;
    
    // Player movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x += player.speed;
    }
    
    // Clamp player to road
    const minX = ROAD_X + 20;
    const maxX = ROAD_X + ROAD_WIDTH - player.width - 20;
    if (player.x < minX) player.x = minX;
    if (player.x > maxX) player.x = maxX;
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // Remove off-screen enemies and increase score
        if (enemy.y > CANVAS_HEIGHT + 50) {
            enemies.splice(i, 1);
            score += 10;
            continue;
        }
        
        // Collision
        if (checkCollision(player, enemy)) {
            createExplosion(player.x + player.width/2, player.y + player.height/2);
            gameOver();
            return;
        }
    }
    
    // Spawn enemies
    if (frameCount % 55 === 0) {
        spawnEnemy();
    }
    
    // Increase difficulty
    if (frameCount % 420 === 0 && gameSpeed < 12) {
        gameSpeed += 0.4;
    }
    
    // Update score display
    scoreDisplay.textContent = `SCORE: ${String(Math.floor(score)).padStart(5, '0')}`;
}

// Render everything
function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawBackground();
    drawEnemies();
    drawPlayer();
    drawParticles();
}

// Game loop
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    
    update(delta);
    render();
    
    lastTime = timestamp;
    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreText.textContent = `SCORE: ${String(Math.floor(score)).padStart(5, '0')}`;
    gameOverScreen.classList.remove('hidden');
}

// Restart game
function restartGame() {
    // Reset variables
    enemies = [];
    particles = [];
    score = 0;
    gameSpeed = 4;
    roadOffset = 0;
    player.x = CANVAS_WIDTH / 2 - 25;
    
    gameOverScreen.classList.add('hidden');
    gameRunning = true;
}

// Start game
function startGame() {
    startScreen.classList.add('hidden');
    gameRunning = true;
    score = 0;
    gameSpeed = 4;
}

// Keyboard controls
function setupControls() {
    window.addEventListener('keydown', e => {
        keys[e.key] = true;
        
        if (!gameRunning && e.key === 'r' || e.key === 'R') {
            if (!startScreen.classList.contains('hidden')) return;
            restartGame();
        }
    });
    
    window.addEventListener('keyup', e => {
        keys[e.key] = false;
    });
}

// Button listeners
function setupUI() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
}

// Initialize
function init() {
    loadImages();
    setupControls();
    setupUI();
    
    // Initial enemy
    setTimeout(() => {
        if (imagesLoaded === totalImages) {
            spawnEnemy();
        }
    }, 800);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Start the game
init();