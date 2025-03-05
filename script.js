document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const difficultyScreen = document.getElementById('difficulty-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over');
    const game = document.getElementById('game');
    const player = document.getElementById('player');
    const shootSound = document.getElementById('shoot-sound');
    const explosionSound = document.getElementById('explosion-sound');

    // Game Constants
    const PLAYER_SPEED = 10;
    const BULLET_WIDTH = 4;
    const BULLET_SPEED = 10;
    const ENEMY_WIDTH = 40;
    const ENEMY_HEIGHT = 40;
    const ENEMY_SPEED = 5;
    const ENEMY_COLUMNS = 6;
    const ENEMY_SPACING = 10;
    const ENEMY_DROP_DISTANCE = 50;
    const ENEMY_MOVE_INTERVAL = 40;
    const INITIAL_ROWS = 1;
    const MAX_ROWS = 4;
    const SHOOT_COOLDOWN = 100;

    // Game State
    const gameState = {
        width: 0,
        height: 0,
        playerX: 0,
        currentRows: INITIAL_ROWS,
        enemies: [],
        enemyDirection: 1,
        isGameOver: false,
        moveEnemiesInterval: null,
        difficultyLevel: 1,
        keys: {}
    };

    // Difficulty Settings
    const difficulties = [
        { id: 'normal', health: 1 },
        { id: 'medium', health: 5 },
        { id: 'hard', health: 10 }
    ];
    let selectedDifficultyIndex = 0;

    // ====================================
    // Event Listeners
    // ====================================
    
    // Difficulty Selection Click Events
    difficulties.forEach((difficulty, index) => {
        document.getElementById(difficulty.id).addEventListener('click', () => {
            setDifficulty(index);
            startGame();
        });
    });
    
    // Keyboard Input Events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // ====================================
    // Game Functions
    // ====================================
    
    function handleKeyDown(e) {
        gameState.keys[e.key] = true;
        
        // Handle difficulty screen navigation
        if (difficultyScreen.style.display !== 'none') {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                selectedDifficultyIndex = (selectedDifficultyIndex - 1 + difficulties.length) % difficulties.length;
                setDifficulty(selectedDifficultyIndex);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                selectedDifficultyIndex = (selectedDifficultyIndex + 1) % difficulties.length;
                setDifficulty(selectedDifficultyIndex);
            } else if (e.key === ' ' || e.key === 'Enter') {
                startGame();
            }
        }

        // Close the browser window on escape key
        if (e.key === 'Escape') {
            window.close();
        }
    }

    function handleKeyUp(e) {
        gameState.keys[e.key] = false;
    }

    function setDifficulty(index) {
        selectedDifficultyIndex = index;
        gameState.difficultyLevel = difficulties[index].health;
        
        difficulties.forEach((difficulty, idx) => {
            document.getElementById(difficulty.id).classList.toggle('selected', idx === index);
        });
    }

    function startGame() {
        difficultyScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        gameState.isGameOver = false;

        // Calculate game dimensions
        const gameRect = game.getBoundingClientRect();
        gameState.width = gameRect.width;
        gameState.height = gameRect.height;
        gameState.playerX = gameState.width / 2 - player.offsetWidth / 2;

        initializeGame();
    }

    function initializeGame() {
        // Position player
        updatePlayerPosition();

        // Initialize enemies
        initializeEnemies(gameState.currentRows);

        // Start enemy movement
        startEnemyMovement();
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    function initializeEnemies(rows) {
        // Clear existing enemies
        gameState.enemies.forEach(enemy => enemy.remove());
        gameState.enemies = [];
        
        // Calculate starting X position to center enemies
        const totalEnemyWidth = ENEMY_COLUMNS * (ENEMY_WIDTH + ENEMY_SPACING) - ENEMY_SPACING;
        const startX = (gameState.width - totalEnemyWidth) / 2;
        
        // Create enemies
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < ENEMY_COLUMNS; col++) {
                createEnemy(startX + col * (ENEMY_WIDTH + ENEMY_SPACING), 40 + row * 50);
            }
        }
    }
    
    function createEnemy(x, y) {
        const enemy = document.createElement('canvas');
        enemy.width = ENEMY_WIDTH;
        enemy.height = ENEMY_HEIGHT;
        enemy.classList.add('enemy');
        enemy.style.left = x + 'px';
        enemy.style.top = y + 'px';
        
        // Load enemy image
        const context = enemy.getContext('2d');
        const img = new Image();
        img.src = 'alien.png';
        img.onload = () => {
            context.drawImage(img, 0, 0, ENEMY_WIDTH, ENEMY_HEIGHT);
        };
        
        // Set enemy health based on difficulty
        enemy.health = gameState.difficultyLevel;
        
        game.appendChild(enemy);
        gameState.enemies.push(enemy);
    }

    function gameLoop() {
        if (gameState.isGameOver) return;
        
        handlePlayerMovement();
        handleShooting();
        
        requestAnimationFrame(gameLoop);
    }
    
    function handlePlayerMovement() {
        // Move player based on key state
        if (gameState.keys['ArrowLeft'] && gameState.playerX > 0) {
            gameState.playerX -= PLAYER_SPEED;
        } else if (gameState.keys['ArrowRight'] && gameState.playerX < gameState.width - player.offsetWidth) {
            gameState.playerX += PLAYER_SPEED;
        }
        
        updatePlayerPosition();
    }
    
    function updatePlayerPosition() {
        player.style.left = gameState.playerX + 'px';
    }
    
    function handleShooting() {
        if (gameState.keys[' '] && !gameState.keys.shooting) {
            shoot();
        }
    }

    function playSound(soundElement) {
        // Clone the audio element to allow overlapping sounds
        const sound = soundElement.cloneNode();
        sound.play();
    }

    function shoot() {
        gameState.keys.shooting = true;
        
        // Create bullet
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');
        
        // Position bullet
        const playerRect = player.getBoundingClientRect();
        const gameRect = game.getBoundingClientRect();
        const bulletLeft = playerRect.left + (playerRect.width / 2) - (BULLET_WIDTH / 2) - gameRect.left;
        
        bullet.style.left = bulletLeft + 'px';
        bullet.style.bottom = '50px';
        game.appendChild(bullet);
        
        // Play shoot sound
        playSound(shootSound);
        
        // Move bullet and check collisions
        const bulletInterval = setInterval(() => {
            moveBullet(bullet, bulletInterval);
        }, 20);
        
        // Reset shooting cooldown
        setTimeout(() => {
            gameState.keys.shooting = false;
        }, SHOOT_COOLDOWN);
    }
    
    function moveBullet(bullet, bulletInterval) {
        const bulletBottom = parseInt(bullet.style.bottom);
        
        // Remove bullet if it goes off screen
        if (bulletBottom > gameState.height) {
            clearInterval(bulletInterval);
            bullet.remove();
            return;
        }
        
        // Move bullet upward
        bullet.style.bottom = (bulletBottom + BULLET_SPEED) + 'px';
        
        // Check for collisions with enemies
        checkBulletCollisions(bullet, bulletInterval);
    }
    
    function checkBulletCollisions(bullet, bulletInterval) {
        const bulletRect = bullet.getBoundingClientRect();
        
        for (let i = 0; i < gameState.enemies.length; i++) {
            const enemy = gameState.enemies[i];
            const enemyRect = enemy.getBoundingClientRect();
            
            // Check collision
            if (isColliding(bulletRect, enemyRect)) {
                clearInterval(bulletInterval);
                bullet.remove();
                
                // Calculate hit position relative to enemy
                const hitX = bulletRect.left - enemyRect.left;
                const hitY = bulletRect.top - enemyRect.top;
                
                // Damage enemy
                damageEnemy(enemy, hitX, hitY);
                
                // Check if enemy is destroyed
                if (enemy.health <= 0) {
                    enemy.remove();
                    gameState.enemies.splice(i, 1);
                    playSound(explosionSound);
                    
                    // Check for level completion
                    checkLevelCompletion();
                }
                
                break;
            }
        }
    }
    
    function isColliding(rect1, rect2) {
        return (
            rect1.left < rect2.right &&
            rect1.right > rect2.left &&
            rect1.top < rect2.bottom &&
            rect1.bottom > rect2.top
        );
    }

    function damageEnemy(enemy, x, y) {
        const context = enemy.getContext('2d');
        context.clearRect(x - 10, y - 10, 20, 20);
        enemy.health -= 1;
    }
    
    function checkLevelCompletion() {
        if (gameState.enemies.length === 0) {
            if (gameState.currentRows < MAX_ROWS) {
                // Advance to next level with more enemies
                gameState.currentRows *= 2;
                initializeEnemies(gameState.currentRows);
            } else {
                // Player won the game
                endGame(true);
            }
        }
    }
    
    function startEnemyMovement() {
        // Clear any existing interval
        if (gameState.moveEnemiesInterval) {
            clearInterval(gameState.moveEnemiesInterval);
        }
        
        // Start new movement interval
        gameState.moveEnemiesInterval = setInterval(moveEnemies, ENEMY_MOVE_INTERVAL);
    }

    function moveEnemies() {
        if (gameState.enemies.length === 0 || gameState.isGameOver) return;
        
        // Move all enemies horizontally
        gameState.enemies.forEach(enemy => {
            const enemyX = parseInt(enemy.style.left);
            enemy.style.left = (enemyX + ENEMY_SPEED * gameState.enemyDirection) + 'px';
        });
        
        // Check if any enemy hit the wall
        const leftMostEnemy = Math.min(...gameState.enemies.map(enemy => parseInt(enemy.style.left)));
        const rightMostEnemy = Math.max(...gameState.enemies.map(enemy => parseInt(enemy.style.left)));
        
        // If an enemy hits the wall, change direction and move down
        if (leftMostEnemy <= 0 || rightMostEnemy >= gameState.width - ENEMY_WIDTH) {
            gameState.enemyDirection *= -1;
            
            // Move all enemies down
            gameState.enemies.forEach(enemy => {
                const enemyY = parseInt(enemy.style.top);
                enemy.style.top = (enemyY + ENEMY_DROP_DISTANCE) + 'px';
            });
            
            // Check if enemies reached the bottom
            checkEnemyReachedBottom();
        }
    }
    
    function checkEnemyReachedBottom() {
        const bottomMostEnemy = Math.max(...gameState.enemies.map(enemy => parseInt(enemy.style.top) + ENEMY_HEIGHT));
        
        if (bottomMostEnemy >= gameState.height - ENEMY_HEIGHT) {
            endGame(false);
        }
    }
    
    function endGame(playerWon) {
        gameState.isGameOver = true;
        
        if (gameState.moveEnemiesInterval) {
            clearInterval(gameState.moveEnemiesInterval);
        }
        
        if (playerWon) {
            // Show victory screen
            gameOverScreen.style.display = 'flex';
            gameScreen.style.position = 'relative';
        } else {
            // Show game over screen for loss
            alert("Game over. The enemies have reached the bottom.");
        }
    }
});