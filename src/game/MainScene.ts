import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private starLayers: { group: Phaser.GameObjects.Group, factor: number }[] = [];
  private meteors!: Phaser.Physics.Arcade.Group;
  
  private score = 0;
  private isRunning = false;
  private lastPlatformY = 0;
  private maxHeight = 0;
  
  private isGameOverSequence = false;
  private fallDuration = 0;
  private readonly FALL_THRESHOLD_MS = 1500; 

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  private jumpCount = 0;

  constructor() {
    super('MainScene');
  }

  preload() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    
    // Player - Space Suit Style
    graphics.fillStyle(0x3b82f6);
    graphics.fillRoundedRect(0, 0, 40, 40, 8);
    graphics.fillStyle(0xffffff);
    graphics.fillRect(10, 8, 20, 12);
    graphics.generateTexture('player', 40, 40);
    graphics.clear();

    // Platform - Space Metal
    graphics.fillStyle(0x334155);
    graphics.fillRoundedRect(0, 0, 100, 20, 2);
    graphics.fillStyle(0x64748b);
    graphics.fillRect(0, 8, 100, 4);
    graphics.generateTexture('platform', 100, 20);
    graphics.clear();

    // Obstacle - Plasma
    graphics.fillStyle(0xf43f5e);
    graphics.beginPath();
    graphics.moveTo(16, 0);
    graphics.lineTo(32, 32);
    graphics.lineTo(0, 32);
    graphics.closePath();
    graphics.fillPath();
    graphics.generateTexture('obstacle', 32, 32);
    graphics.clear();

    // Star
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(2, 2, 2);
    graphics.generateTexture('star', 4, 4);

    // Meteor
    graphics.fillStyle(0x78350f);
    graphics.beginPath();
    graphics.moveTo(10, 0);
    graphics.lineTo(30, 5);
    graphics.lineTo(40, 20);
    graphics.lineTo(30, 35);
    graphics.lineTo(10, 40);
    graphics.lineTo(0, 20);
    graphics.closePath();
    graphics.fillPath();
    graphics.generateTexture('meteor', 40, 40);
    graphics.clear();
  }

  create() {
    const { width, height } = this.scale;

    this.createStarfield(width, height);

    this.platforms = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.group();
    this.meteors = this.physics.add.group();

    this.player = this.physics.add.sprite(width / 2, height - 100, 'player');
    this.player.setBounce(0.1);
    this.player.setDepth(100);
    this.player.body.setGravityY(1800);

    this.physics.add.collider(this.player, this.platforms, undefined, (p, plat) => {
        if (this.isGameOverSequence) return false;
        const playerBody = (p as any).body;
        return playerBody.velocity.y > 0 && (playerBody.y + playerBody.height) <= (plat as any).y + 10;
    });
    
    this.physics.add.overlap(this.player, this.obstacles, () => this.handleCollision(), undefined, this);
    this.physics.add.overlap(this.player, this.meteors, () => this.handleCollision(), undefined, this);

    this.cameras.main.startFollow(this.player, true, 0, 0.1, 0, 100);
    this.cameras.main.setBounds(0, -10000000, width, 10000000 + height);

    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
    }

    this.input.on('pointerdown', () => {
        if (this.isRunning && !this.isGameOverSequence) {
          this.handleJumpInput();
        }
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.handleJumpInput());
    this.input.keyboard?.on('keydown-W', () => this.handleJumpInput());

    this.time.addEvent({
      delay: 4000,
      callback: () => this.spawnMeteor(),
      loop: true
    });

    this.stopGame();
  }

  private createStarfield(width: number, height: number) {
    const counts = [80, 40, 20];
    const factors = [0.02, 0.08, 0.2];
    const scales = [0.4, 0.7, 1.1];
    const alphas = [0.2, 0.5, 0.8];

    for (let i = 0; i < 3; i++) {
      const group = this.add.group();
      for (let j = 0; j < counts[i]; j++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const star = this.add.image(x, y, 'star');
        star.setScrollFactor(0); // Manually handle infinite scroll
        star.setScale(scales[i]);
        star.setAlpha(alphas[i]);
        star.setDepth(i);
        group.add(star);
      }
      this.starLayers.push({ group, factor: factors[i] });
    }
  }

  private spawnMeteor() {
    if (!this.isRunning) return;
    const { width } = this.scale;
    const camY = this.cameras.main.scrollY;
    
    const side = Math.random() > 0.5;
    const startX = side ? -50 : width + 50;
    const startY = camY + Phaser.Math.Between(-100, 300);
    
    const meteor = this.meteors.create(startX, startY, 'meteor') as Phaser.Physics.Arcade.Sprite;
    meteor.setDepth(50);
    (meteor.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    meteor.setAngularVelocity(Phaser.Math.Between(50, 150));
    
    const targetX = side ? width + 100 : -100;
    const targetY = startY + Phaser.Math.Between(100, 500);
    this.physics.moveTo(meteor, targetX, targetY, Phaser.Math.Between(200, 350));

    const emitter = this.add.particles(0, 0, 'star', {
        speed: 20,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.4, end: 0 },
        lifespan: 800,
        follow: meteor,
        tint: 0xffa500
    });
    meteor.setData('emitter', emitter);
  }

  private handleJumpInput() {
    if (!this.isRunning || this.isGameOverSequence) return;
    if (this.player.body.touching.down) {
      this.jump(false);
      this.jumpCount = 1;
    } else if (this.jumpCount === 1) {
      this.jump(true);
      this.jumpCount = 2;
    }
  }

  update(time: number, delta: number) {
    const { width, height } = this.scale;
    const camY = this.cameras.main.scrollY;

    // Star parallax & infinite loop
    this.starLayers.forEach((layer) => {
      layer.group.getChildren().forEach((child: any) => {
        const star = child as Phaser.GameObjects.Image;
        // Position based on camera + parallax factor
        const offset = (camY * layer.factor) % height;
        // Wrap star vertical position
        let displayY = (star.getData('startY') || star.y) - offset;
        if (!star.getData('startY')) star.setData('startY', star.y);
        
        while (displayY < 0) displayY += height;
        while (displayY > height) displayY -= height;
        
        star.y = displayY;
      });
    });

    if (!this.isRunning && !this.isGameOverSequence) return;

    if (this.isGameOverSequence) {
      if (this.player.y > camY + height + 500) {
        this.isGameOverSequence = false;
        this.physics.pause();
      }
      return; 
    }

    if (this.player.y > camY + height + 100 && this.isRunning) {
      this.fallDuration += delta;
      if (this.fallDuration > this.FALL_THRESHOLD_MS) {
        this.handleCollision();
        this.fallDuration = 0;
      }
    } else {
      this.fallDuration = 0;
    }

    if (this.player.body.touching.down) this.jumpCount = 0;

    let vx = 0;
    const pointer = this.input.activePointer;
    const leftPressed = (this.cursors?.left.isDown) || (this.wasd?.left.isDown) || (pointer.isDown && pointer.x < width / 2);
    const rightPressed = (this.cursors?.right.isDown) || (this.wasd?.right.isDown) || (pointer.isDown && pointer.x >= width / 2);

    if (leftPressed) vx = -400;
    else if (rightPressed) vx = 400;
    this.player.setVelocityX(vx);

    const margin = 20;
    if (this.player.x < -margin) this.player.x = width + margin;
    else if (this.player.x > width + margin) this.player.x = -margin;

    const currentHeight = Math.floor((height - 100 - this.player.y) / 10);
    if (currentHeight > this.maxHeight) {
        this.maxHeight = currentHeight;
        this.score = this.maxHeight;
        this.game.events.emit('SCORE_UP', this.score);
    }

    if (this.player.y > camY + height + 600) this.handleCollision();

    while (this.lastPlatformY > this.player.y - height) this.spawnPlatform();

    this.platforms.getChildren().forEach((child) => {
        if ((child as any).y > camY + height + 500) child.destroy();
    });
    
    this.obstacles.getChildren().forEach((child) => {
        const obs = child as Phaser.Physics.Arcade.Sprite;
        const speed = obs.getData('moveSpeed') as number;
        if (speed) {
            obs.x += speed * (delta / 1000);
            if (obs.x < 30 || obs.x > width - 30) obs.setData('moveSpeed', -speed);
        }
        if (obs.y > camY + height + 500) obs.destroy();
    });

    this.meteors.getChildren().forEach((child) => {
        const meteor = child as Phaser.Physics.Arcade.Sprite;
        if (meteor.y > camY + height + 500 || meteor.x < -150 || meteor.x > width + 150) {
            const emitter = meteor.getData('emitter');
            if (emitter) emitter.destroy();
            meteor.destroy();
        }
    });
  }

  private jump(isHigh: boolean) {
    const velocity = isHigh ? -1200 : -950;
    this.player.setVelocityY(velocity);
    this.game.events.emit('PLAYER_JUMP');
    
    if (isHigh) {
        this.player.setTint(0x60a5fa);
        this.time.delayedCall(200, () => this.player.clearTint());
        
        const emitter = this.add.particles(this.player.x, this.player.y + 20, 'star', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 10,
            emitting: false
        });
        emitter.explode();
        this.time.delayedCall(500, () => emitter.destroy());
    }

    this.tweens.add({
      targets: this.player,
      scaleX: isHigh ? 0.6 : 0.7,
      scaleY: isHigh ? 1.4 : 1.3,
      duration: 100,
      yoyo: true
    });
  }

  startGame() {
    const { width, height } = this.scale;
    this.isRunning = true;
    this.isGameOverSequence = false;
    this.score = 0;
    this.maxHeight = 0;
    this.jumpCount = 0;
    this.fallDuration = 0;
    
    this.physics.resume();
    this.player.clearTint();
    this.player.setVisible(true);
    this.player.setAlpha(1);
    this.player.setPosition(width / 2, height - 120);
    this.player.setVelocity(0, 0);
    this.player.setScale(1);
    
    this.platforms.clear(true, true);
    this.obstacles.clear(true, true);
    this.meteors.clear(true, true);
    
    const ground = this.platforms.create(width / 2, height - 20, 'platform') as Phaser.Physics.Arcade.Sprite;
    ground.setDisplaySize(width * 2, 40);
    ground.refreshBody();
    
    this.lastPlatformY = height - 120;
    for (let i = 0; i < 15; i++) this.spawnPlatform();
    
    this.cameras.main.scrollY = 0;
    this.cameras.main.startFollow(this.player, true, 0, 0.1, 0, 100);
  }

  stopGame() {
    this.isRunning = false;
    this.isGameOverSequence = false;
    this.player.setVisible(false);
    this.physics.pause();
    this.platforms.clear(true, true);
    this.obstacles.clear(true, true);
    this.meteors.clear(true, true);
  }

  private spawnPlatform() {
    const { width } = this.scale;
    this.lastPlatformY -= Phaser.Math.Between(160, 240);
    const x = Phaser.Math.Between(60, width - 60);
    const plat = this.platforms.create(x, this.lastPlatformY, 'platform') as Phaser.Physics.Arcade.Sprite;
    plat.refreshBody();

    if (this.score > 15) {
        const difficulty = Math.min(0.6, 0.15 + (this.score / 1000));
        if (Math.random() < difficulty) {
            const obsX = x + Phaser.Math.Between(-30, 30);
            const obs = this.obstacles.create(obsX, this.lastPlatformY - 26, 'obstacle');
            obs.setImmovable(true);
            obs.body.allowGravity = false;
            obs.setDepth(5);
            if (this.score > 100 && Math.random() < 0.4) {
                const moveSpeed = Phaser.Math.Between(100, 250) * (Math.random() > 0.5 ? 1 : -1);
                obs.setData('moveSpeed', moveSpeed);
                obs.setTint(0xffd700);
            }
        }
    }
  }

  private handleCollision() {
    if (!this.isRunning || this.isGameOverSequence) return;
    this.isRunning = false;
    this.isGameOverSequence = true;
    this.player.setTint(0xff4444);
    this.player.setVelocityY(-600);
    this.player.setVelocityX(Phaser.Math.Between(-200, 200));
    this.cameras.main.shake(250, 0.01);
    this.cameras.main.stopFollow();
    this.game.events.emit('GAME_OVER', this.score);
    this.game.events.emit('SHOW_BUTTONS');
  }
}