document.addEventListener('DOMContentLoaded', () => {
    const difficultyScreen = document.getElementById('difficulty-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over');
    const game = document.getElementById('game');
    const player = document.getElementById('player');
    const shootSoundTemplate = document.getElementById('shoot-sound');
    const explosionSoundTemplate = document.getElementById('explosion-sound');

    const playerSpeed = 10;
    const bulletWidth = 4; // Assuming bullet width is 4px
    let gameWidth = 0;
    let gameHeight = 0;
    const enemyWidth = 40;
    const enemyHeight = 40;
    const enemySpeed = 5;
    const initialRows = 1; // Initial number of rows
    const maxRows = 8; // Maximum number of rows
    let currentRows = initialRows; // Current number of rows
    let enemies = [];
    let direction = 1;

    let playerX = 0;

    let difficulty = 1; // Default to easy

    // Track the state of keys
    const keys = {};

    // Difficulty selection
    const difficulties = ['normal', 'medium', 'hard'];
    let selectedDifficultyIndex = 0;

    document.getElementById('normal').addEventListener('click', () => {
        setDifficulty(0);
        startGame();
    });
    document.getElementById('medium').addEventListener('click', () => {
        setDifficulty(1);
        startGame();
    });
    document.getElementById('hard').addEventListener('click', () => {
        setDifficulty(2);
        startGame();
    });

    function setDifficulty(index) {
        selectedDifficultyIndex = index;
        difficulty = [1, 5, 10][index];
        difficulties.forEach((id, idx) => {
            document.getElementById(id).classList.toggle('selected', idx === index);
        });
    }

    // Handle keyboard events for difficulty selection
    document.addEventListener('keydown', (e) => {
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
    });

    function startGame() {
        difficultyScreen.style.display = 'none';
        gameScreen.style.display = 'block';

        // Calculate game dimensions after rendering
        const gameRect = game.getBoundingClientRect();
        gameWidth = gameRect.width;
        gameHeight = gameRect.height;
        playerX = gameWidth / 2 - player.offsetWidth / 2;

        console.log('Game Width:', gameWidth);
        console.log('Game Height:', gameHeight);
        console.log('Initial Player X:', playerX);

        initializeGame();
    }

    function initializeGame() {
        // Initialize player position
        player.style.left = playerX + 'px';

        // Initialize the first set of enemies
        initializeEnemies(currentRows);

        // Start the game loop
        requestAnimationFrame(gameLoop);
    }

    function initializeEnemies(rows) {
        enemies.forEach(enemy => enemy.remove()); // Remove existing enemies
        enemies = [];
        const startX = (gameWidth - (6 * (enemyWidth + 10) - 10)) / 2; // Calculate starting X position to center enemies
        console.log('Start X for Enemies:', startX);
        for (let row = 0; row < rows; row++) {
            for (let i = 0; i < 6; i++) {
                const enemy = document.createElement('canvas');
                enemy.width = enemyWidth;
                enemy.height = enemyHeight;
                enemy.classList.add('enemy');
                enemy.style.left = startX + i * (enemyWidth + 10) + 'px';
                enemy.style.top = 40 + row * 50 + 'px';
                const context = enemy.getContext('2d');
                const img = new Image();
                img.src = 'alien.png';
                img.onload = () => {
                    context.drawImage(img, 0, 0, enemyWidth, enemyHeight);
                };
                enemy.health = difficulty;
                game.appendChild(enemy);
                enemies.push(enemy);
            }
        }
    }

    // Handle keydown and keyup events to track key states
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Game loop to handle movement and shooting
    function gameLoop() {
        // Move player
        if (keys['ArrowLeft'] && playerX > 0) {
            playerX -= playerSpeed;
        } else if (keys['ArrowRight'] && playerX < gameWidth - player.offsetWidth) {
            playerX += playerSpeed;
        }
        player.style.left = playerX + 'px';

        // Shoot
        if (keys[' ']) {
            shoot();
        }

        requestAnimationFrame(gameLoop);
    }

    function playShootSound() {
        const shootSound = new Audio('shoot.mp3');
        shootSound.play();
    }

    function playExplosionSound() {
        const explosionSound = new Audio('explosion.mp3');
        explosionSound.play();
    }

    function shoot() {
        if (!keys.shooting) {
            keys.shooting = true;
            const bullet = document.createElement('div');
            bullet.classList.add('bullet');
            const playerRect = player.getBoundingClientRect();
            const gameRect = game.getBoundingClientRect();
            const bulletLeft = playerRect.left + (playerRect.width / 2) - (bulletWidth / 2) - gameRect.left - 2; // Adjust left position

            bullet.style.left = bulletLeft + 'px'; // Center the bullet
            bullet.style.bottom = '50px'; // Start at the player's top position
            game.appendChild(bullet);

            // Play shoot sound
            playShootSound();

            const bulletInterval = setInterval(() => {
                const bulletBottom = parseInt(bullet.style.bottom);
                if (bulletBottom > game.offsetHeight) {
                    clearInterval(bulletInterval);
                    bullet.remove();
                } else {
                    bullet.style.bottom = bulletBottom + 10 + 'px';

                    // Check for collision with enemies
                    enemies.forEach((enemy, index) => {
                        const enemyRect = enemy.getBoundingClientRect();
                        const bulletRect = bullet.getBoundingClientRect();

                        if (
                            bulletRect.left < enemyRect.right &&
                            bulletRect.right > enemyRect.left &&
                            bulletRect.top < enemyRect.bottom &&
                            bulletRect.bottom > enemyRect.top
                        ) {
                            clearInterval(bulletInterval);
                            bullet.remove();
                            damageEnemy(enemy, bulletRect.left - enemyRect.left, bulletRect.top - enemyRect.top);
                            if (enemy.health <= 0) {
                                enemy.remove();
                                enemies.splice(index, 1);
                                // Play explosion sound
                                playExplosionSound();

                                // Check if all enemies are eliminated
                                if (enemies.length === 0) {
                                    if (currentRows < maxRows) {
                                        currentRows *= 2; // Double the number of rows
                                        initializeEnemies(currentRows); // Initialize new enemies
                                    } else {
                                        gameOver();
                                    }
                                }
                            }
                        }
                    });
                }
            }, 20);

            setTimeout(() => keys.shooting = false, 100); // Increase rate of fire by reducing the cooldown
        }
    }

    function damageEnemy(enemy, x, y) {
        const context = enemy.getContext('2d');
        context.clearRect(x - 10, y - 10, 20, 20); // Clear a 20x20 area to simulate more obvious damage
        enemy.health -= 1;
    }

    function gameOver() {
        gameOverScreen.style.display = 'flex';
        gameScreen.style.position = 'relative';
    }

    // Move enemies
    const moveEnemiesInterval = setInterval(() => {
        let minY = Infinity;
        enemies.forEach((enemy) => {
            let enemyX = parseInt(enemy.style.left);
            enemyX += enemySpeed * direction;
            enemy.style.left = enemyX + 'px';
            let enemyY = parseInt(enemy.style.top);
            minY = Math.min(minY, enemyY);
        });

        // Change direction if any enemy hits the wall
        const leftMostEnemy = Math.min(...enemies.map((enemy) => parseInt(enemy.style.left)));
        const rightMostEnemy = Math.max(...enemies.map((enemy) => parseInt(enemy.style.left)));

        if (leftMostEnemy <= 0 || rightMostEnemy >= gameWidth - enemyWidth) {
            direction *= -1;
            enemies.forEach((enemy) => {
                let enemyY = parseInt(enemy.style.top);
                enemy.style.top = enemyY + 20 + 'px'; // Smaller vertical increment
            });
        }

        // Check if enemies have reached the bottom of the game area
        const bottomMostEnemy = Math.max(...enemies.map((enemy) => parseInt(enemy.style.top)));
        if (bottomMostEnemy >= gameHeight - enemyHeight) {
            alert("Game over. The enemies have reached the bottom.");
            clearInterval(moveEnemiesInterval);
        }
    }, 50); // Adjust this value to control the rate of fall
});
