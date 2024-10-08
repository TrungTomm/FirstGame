var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    plugins: {
        files: [
            { type: 'scenePlugin', key: 'SpinePlugin', url: 'SpinePluginDebug.js', sceneKey: 'spine' }
        ]}
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var level =0;
var levelText;

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spine('coin', 'assets/coin/coin-pro.json', 'assets/coin/coin-pma.atlas');
}

function create ()
{
    //Tạo nền
    this.add.image(400, 300, 'sky');

    //Tạo group các nền đất để có thể nhảy lên
    platforms = this.physics.add.staticGroup();

    //Tạo các nền đất
    //Posit vị trí đất dưới cùng theo scale ban đầu là 800.600
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //Tạo các nền đất trên để nhảy
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    //Tạo nhân vật và vị trí xuất hiện
    player = this.physics.add.sprite(100, 450, 'dude');

    //Các thuộc tính vật lý: độ nảy và collide
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //Hoạt ảnh của nhân vật
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //Tạo bàn phím INPUT
    cursors = this.input.keyboard.createCursorKeys();

    //Tạo sao và vị trí của sao
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {

        //Tạo độ nảy random của mỗi ngôi sao
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    //Tạo bomb
    bombs = this.physics.add.group();

    //Chọn tọa độ cho bomb
    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    //Thuộc tính của bomb
    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(0.5);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;

    //Tạo điểm 
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //Tạo Level
    levelText = this.add.text(600, 16, ' level: 0', {fontSize: '32px', fill: '#000'});
    //Collide của các vật thể có trong game
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //Hàm check thu thập sao và chạm phải bomb
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);
    

    // Tạo spine coins
    var coin = this.add.spine(x, 16, 'coin', 'animation', true);

    coin.setSize(280, 280);

    this.physics.add.existing(coin);

    coin.body.setOffset(0, 50);
    coin.body.setVelocity(100, 200);
    coin.body.setBounce(1, 1);
    coin.body.setCollideWorldBounds(true);
    
    coin.setScale(0.2);

}

function update ()
{
    if (gameOver)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //Cập nhật điểm
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0)
    {   
        level += 1;
        levelText.setText('Level: ' + level)
        //Tạo ra sao mới sau khi nhân vật đã thu thập hết tất cả sao
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });
    
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(0.5);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    var endGameText = this.add.text(200, 250, " Game Over ", {
        fontSize: '64px',
        fill: '#000000',
        fontWeight: 'bold'});
}