// Comprehensive Game Templates for AI Game Engine
// This file contains detailed templates for every game type

export interface GameTemplate {
  id: string
  name: string
  description: string
  gameType: string
  difficulty: 'Beginner' | 'Medium' | 'Advanced' | 'Expert'
  estimatedPlayTime: string
  mechanics: string[]
  template: any
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'flappy_bird',
    name: 'Flappy Bird',
    description: 'Classic tap-to-fly game with endless scrolling obstacles',
    gameType: 'flappy',
    difficulty: 'Beginner',
    estimatedPlayTime: '5-10 minutes',
    mechanics: ['tap_controls', 'endless_scrolling', 'obstacle_avoidance', 'scoring'],
    template: {
      title: "Flappy Adventure",
      description: "Tap to fly through endless obstacles and achieve the highest score!",
      gameType: "flappy",
      entities: [
        {
          name: "player",
          type: "player",
          x: 100,
          y: 300,
          width: 32,
          height: 32,
          color: "#FFD700",
          emoji: "🐦",
          renderMode: "emoji",
          physics: {
            gravity: true,
            gravityForce: 1.2,
            jumpForce: 18,
            moveSpeed: 0, // No horizontal movement
            airControl: 0
          },
          controls: {
            jump: "Space"
          },
          health: 1
        }
      ],
      levels: [
        {
          name: "Endless Sky",
          width: 9999,
          height: 600,
          background: "#87CEEB",
          platforms: [], // No platforms, only pipes
          obstacles: [
            {
              type: "pipe_pair",
              x: 400,
              gap: 150,
              topHeight: 200,
              bottomHeight: 200,
              width: 60,
              color: "#228B22",
              scrollSpeed: 3
            }
          ],
          collectibles: [
            {
              type: "star",
              x: 450,
              y: 275,
              points: 1,
              color: "#FFD700",
              width: 20,
              height: 20
            }
          ],
          effects: {
            autoScroll: true,
            scrollSpeed: 3,
            infiniteGeneration: true
          }
        }
      ],
      gameLogic: {
        winCondition: "endless_survival",
        loseCondition: "collision_or_fall",
        scoring: {
          pipesPassed: 1,
          collectibles: 5,
          timeBonus: false
        },
        specialMechanics: {
          pipeGeneration: "Automatically generate pipe pairs",
          tapControls: "Single tap/click to flap wings",
          endlessScrolling: "World moves continuously right to left"
        }
      }
    }
  },

  {
    id: 'tetris_puzzle',
    name: 'Tetris/Puzzle',
    description: 'Block-falling puzzle game with line clearing mechanics',
    gameType: 'tetris',
    difficulty: 'Medium',
    estimatedPlayTime: '15-30 minutes',
    mechanics: ['block_rotation', 'line_clearing', 'increasing_speed', 'puzzle_solving'],
    template: {
      title: "Block Master",
      description: "Arrange falling blocks to clear lines and achieve high scores!",
      gameType: "puzzle",
      entities: [
        {
          name: "current_piece",
          type: "tetromino",
          x: 160,
          y: 0,
          width: 32,
          height: 32,
          color: "#FF6B6B",
          shape: "I",
          rotation: 0,
          physics: {
            gravity: true,
            gravityForce: 0.5,
            moveSpeed: 32, // Grid-based movement
            rotatable: true
          },
          controls: {
            left: "ArrowLeft",
            right: "ArrowRight",
            rotate: "ArrowUp",
            drop: "ArrowDown"
          }
        }
      ],
      levels: [
        {
          name: "Classic Mode",
          width: 320,
          height: 640,
          background: "#1A1A2E",
          grid: {
            width: 10,
            height: 20,
            cellSize: 32
          },
          platforms: [], // Grid-based, no traditional platforms
          gameBoard: Array(20).fill(null).map(() => Array(10).fill(0)),
          effects: {
            gridLines: true,
            lineFlash: true,
            levelProgression: true
          }
        }
      ],
      gameLogic: {
        winCondition: "level_progression",
        loseCondition: "board_full",
        scoring: {
          singleLine: 100,
          doubleLine: 300,
          tripleLine: 500,
          tetris: 800,
          levelMultiplier: true
        },
        specialMechanics: {
          tetrominoShapes: "7 different piece types (I, O, T, S, Z, J, L)",
          lineClearring: "Clear complete horizontal lines",
          levelProgression: "Speed increases every 10 lines",
          nextPiecePreview: "Show upcoming pieces"
        }
      }
    }
  },

  {
    id: 'space_shooter',
    name: 'Space Shooter',
    description: 'Fast-paced shooting game with waves of enemies',
    gameType: 'shooter',
    difficulty: 'Medium',
    estimatedPlayTime: '20-40 minutes',
    mechanics: ['8_way_movement', 'shooting', 'enemy_waves', 'power_ups', 'boss_battles'],
    template: {
      title: "Galactic Defender",
      description: "Pilot your spaceship through waves of alien enemies in epic space battles!",
      gameType: "shooter",
      entities: [
        {
          name: "player",
          type: "player",
          x: 400,
          y: 500,
          width: 48,
          height: 48,
          color: "#00FFFF",
          emoji: "🚀",
          renderMode: "emoji",
          physics: {
            gravity: false,
            moveSpeed: 8,
            airControl: 1
          },
          abilities: {
            shooting: true,
            boostDash: true
          },
          controls: {
            move: "WASD",
            shoot: "Space",
            boost: "Shift"
          },
          health: 5,
          maxHealth: 5,
          weaponType: "laser",
          fireRate: 0.2
        }
      ],
      levels: [
        {
          name: "Asteroid Field",
          width: 800,
          height: 600,
          background: "#0D1B2A",
          platforms: [], // Space has no platforms
          enemies: [
            {
              name: "alien_fighter",
              type: "enemy",
              x: 400,
              y: 100,
              width: 32,
              height: 32,
              color: "#FF4444",
              emoji: "👾",
              renderMode: "emoji",
              health: 2,
              movePattern: "zigzag",
              weaponType: "plasma",
              fireRate: 1.0
            }
          ],
          obstacles: [
            {
              type: "asteroid",
              x: 200,
              y: 150,
              width: 64,
              height: 64,
              color: "#8B4513",
              health: 3,
              destructible: true
            }
          ],
          collectibles: [
            {
              type: "power_up",
              subtype: "rapid_fire",
              x: 300,
              y: 200,
              points: 0,
              color: "#FFD700",
              effect: "increase_fire_rate"
            }
          ],
          waves: [
            {
              number: 1,
              enemies: 5,
              type: "basic_fighters",
              spawnDelay: 1.0
            },
            {
              number: 2,
              enemies: 8,
              type: "mixed",
              spawnDelay: 0.8
            }
          ]
        }
      ],
      gameLogic: {
        winCondition: "defeat_all_waves",
        loseCondition: "health_reaches_zero",
        scoring: {
          enemyDestroyed: 10,
          asteroidDestroyed: 5,
          waveBonus: 100,
          accuracyBonus: true
        },
        specialMechanics: {
          eightWayMovement: "Full directional control in space",
          autoFire: "Hold to continuous fire",
          enemyWaves: "Progressive difficulty with wave system",
          powerUps: "Temporary weapon and ability upgrades",
          screenWrap: "Ships can wrap around screen edges"
        }
      }
    }
  },

  {
    id: 'platformer',
    name: 'Classic Platformer',
    description: 'Jump and run adventure with collectibles and enemies',
    gameType: 'platformer',
    difficulty: 'Medium',
    estimatedPlayTime: '30-60 minutes',
    mechanics: ['jumping', 'running', 'collecting', 'combat', 'level_progression'],
    template: {
      title: "Hero's Journey",
      description: "Run, jump, and battle through multiple worlds to save the kingdom!",
      gameType: "platformer",
      entities: [
        {
          name: "player",
          type: "player",
          x: 100,
          y: 400,
          width: 32,
          height: 48,
          color: "#4ECDC4",
          emoji: "🏃",
          renderMode: "emoji",
          physics: {
            gravity: true,
            gravityForce: 0.8,
            jumpForce: 16,
            moveSpeed: 6,
            airControl: 0.7,
            friction: 0.8
          },
          abilities: {
            doubleJump: true,
            dash: true,
            wallJump: false
          },
          health: 3,
          maxHealth: 3,
          lives: 3
        }
      ],
      levels: [
        {
          name: "Green Hills Zone",
          width: 2400,
          height: 800,
          background: "#87CEEB",
          platforms: [
            { x: 0, y: 750, width: 2400, height: 50, color: "#228B22", type: "ground" },
            { x: 300, y: 650, width: 150, height: 20, color: "#8FBC8F", type: "grass" },
            { x: 600, y: 550, width: 100, height: 20, color: "#8FBC8F", type: "grass" },
            { x: 900, y: 450, width: 200, height: 20, color: "#8FBC8F", type: "grass" },
            { x: 1200, y: 350, width: 150, height: 20, color: "#8FBC8F", type: "grass" }
          ],
          collectibles: [
            { type: "coin", x: 350, y: 600, points: 10, color: "#FFD700", width: 20, height: 20 },
            { type: "coin", x: 650, y: 500, points: 10, color: "#FFD700", width: 20, height: 20 },
            { type: "gem", x: 1250, y: 300, points: 50, color: "#FF69B4", width: 24, height: 24 }
          ],
          enemies: [
            {
              name: "goomba",
              type: "enemy",
              x: 500,
              y: 700,
              width: 32,
              height: 32,
              color: "#8B4513",
              emoji: "🍄",
              renderMode: "emoji",
              health: 1,
              movePattern: "patrol",
              patrolRange: 100
            }
          ],
          traps: [
            { type: "spikes", x: 800, y: 730, width: 64, height: 20, damage: 1, color: "#696969" }
          ],
          goal: { x: 2200, y: 650, width: 64, height: 100, color: "#FFD700", type: "flag" }
        }
      ],
      gameLogic: {
        winCondition: "reach_goal",
        loseCondition: "lives_depleted",
        scoring: {
          collectibles: 10,
          enemies: 25,
          timeBonus: true,
          perfectBonus: 100
        },
        specialMechanics: {
          jumpOnEnemies: "Stomp enemies to defeat them",
          movingPlatforms: "Some platforms move in patterns",
          secretAreas: "Hidden paths and bonus rooms",
          checkpoints: "Respawn points throughout levels"
        }
      }
    }
  },

  {
    id: 'racing',
    name: 'Racing Game',
    description: 'High-speed racing with multiple tracks and opponents',
    gameType: 'racing',
    difficulty: 'Advanced',
    estimatedPlayTime: '45-90 minutes',
    mechanics: ['steering', 'speed_control', 'track_navigation', 'opponent_ai', 'lap_system'],
    template: {
      title: "Speed Racer Championship",
      description: "Race against AI opponents on challenging tracks to become the champion!",
      gameType: "racing",
      entities: [
        {
          name: "player_car",
          type: "player",
          x: 150,               // Start further left
          y: 400,               // Middle of track  
          width: 48,            // Make wider
          height: 24,           // Make shorter (car proportions)
          color: "#FF0000",
          emoji: "🏎️",
          renderMode: "emoji",
          physics: {
            gravity: false,     // CRITICAL: No gravity
            maxSpeed: 10,       // Reasonable max speed
            acceleration: 0.4,  // Good acceleration
            braking: 0.6,       // Good braking
            turning: 0.25,      // Good turning
            drift: 0.1
          },
          abilities: {
            boost: true
          },
          // Initialize racing properties
          currentSpeed: 0,
          steeringAngle: 0,
          facingAngle: 0,
          controls: {
            accelerate: "ArrowUp",
            brake: "ArrowDown", 
            turnLeft: "ArrowLeft",
            turnRight: "ArrowRight",
            boost: "Space"
          }
        }
      ],
      levels: [
        {
          name: "Circuit City",
          width: 1600,
          height: 1200,
          background: "#2F4F4F",
          track: {
            type: "circuit",
            laps: 3,
            checkpoints: [
              { x: 400, y: 100, width: 100, height: 50 },
              { x: 1200, y: 300, width: 100, height: 50 },
              { x: 1200, y: 900, width: 100, height: 50 },
              { x: 400, y: 900, width: 100, height: 50 }
            ],
            startLine: { x: 350, y: 500, width: 100, height: 50 }
          },
          trackBounds: [
            // Track boundaries as platforms
            { x: 200, y: 50, width: 1200, height: 20, color: "#8B4513", type: "barrier" },
            { x: 200, y: 950, width: 1200, height: 20, color: "#8B4513", type: "barrier" }
          ],
          opponents: [
            {
              name: "ai_racer_1",
              type: "ai_car",
              x: 430,
              y: 500,
              width: 24,
              height: 48,
              color: "#0000FF",
              emoji: "🏁",
              renderMode: "emoji",
              aiType: "aggressive",
              difficulty: "medium"
            }
          ],
          collectibles: [
            { type: "boost", x: 800, y: 200, effect: "speed_boost", duration: 3, color: "#FFFF00" },
            { type: "shield", x: 600, y: 600, effect: "protection", duration: 5, color: "#00FFFF" }
          ]
        }
      ],
      gameLogic: {
        winCondition: "finish_first",
        loseCondition: "finish_last_multiple_times",
        scoring: {
          position: [100, 80, 60, 40, 20],
          fastestLap: 50,
          perfectLap: 25
        },
        specialMechanics: {
          lapSystem: "Complete multiple laps to finish race",
          drifting: "Brake while turning for drift bonuses",
          slipstream: "Follow behind cars for speed boost",
          trackHazards: "Oil spills and obstacles slow you down"
        }
      }
    }
  },

  {
    id: 'fighting',
    name: 'Fighting Game',
    description: 'Combat system with combos and special moves',
    gameType: 'fighting',
    difficulty: 'Advanced',
    estimatedPlayTime: '30-60 minutes',
    mechanics: ['combat_system', 'combo_attacks', 'special_moves', 'blocking', 'health_management'],
    template: {
      title: "Warriors Arena",
      description: "Master different fighting styles and defeat opponents in epic battles!",
      gameType: "fighting",
      entities: [
        {
          name: "player_fighter",
          type: "player",
          x: 200,
          y: 400,
          width: 48,
          height: 72,
          color: "#4169E1",
          emoji: "🥋",
          renderMode: "emoji",
          physics: {
            gravity: true,
            gravityForce: 0.6,
            jumpForce: 12,
            moveSpeed: 4,
            airControl: 0.5
          },
          combat: {
            health: 100,
            maxHealth: 100,
            attackPower: 15,
            defense: 5,
            combos: [
              { input: ["punch", "punch", "kick"], damage: 25, name: "Basic Combo" },
              { input: ["down", "forward", "punch"], damage: 30, name: "Fireball" }
            ]
          },
          controls: {
            left: "ArrowLeft",
            right: "ArrowRight",
            jump: "ArrowUp",
            duck: "ArrowDown",
            punch: "KeyJ",
            kick: "KeyK",
            block: "KeyL"
          }
        }
      ],
      levels: [
        {
          name: "Dojo Arena",
          width: 800,
          height: 600,
          background: "#8B4513",
          platforms: [
            { x: 0, y: 550, width: 800, height: 50, color: "#654321", type: "ground" }
          ],
          opponent: {
            name: "master_fighter",
            type: "ai_fighter",
            x: 600,
            y: 400,
            width: 48,
            height: 72,
            color: "#DC143C",
            emoji: "🥊",
            renderMode: "emoji",
            combat: {
              health: 100,
              maxHealth: 100,
              attackPower: 12,
              defense: 8,
              aiStyle: "balanced",
              specialMoves: ["uppercut", "spinning_kick"]
            }
          },
          boundaries: {
            left: 50,
            right: 750,
            knockoutZones: false
          }
        }
      ],
      gameLogic: {
        winCondition: "defeat_opponent",
        loseCondition: "health_depleted",
        rounds: 3,
        roundTime: 99,
        scoring: {
          perfectRound: 1000,
          combo: 50,
          specialMove: 100,
          timeBonus: true
        },
        specialMechanics: {
          comboSystem: "Chain attacks for increased damage",
          blocking: "Reduce incoming damage",
          counterAttacks: "Perfect timing for bonus damage",
          specialMeter: "Build energy for powerful special moves",
          juggling: "Keep opponent airborne with combos"
        }
      }
    }
  },

  {
    id: 'endless_runner',
    name: 'Endless Runner',
    description: 'Auto-running game with obstacles and power-ups',
    gameType: 'endless_runner',
    difficulty: 'Beginner',
    estimatedPlayTime: '10-20 minutes',
    mechanics: ['auto_running', 'jumping', 'sliding', 'obstacle_avoidance', 'power_ups'],
    template: {
      title: "Temple Rush",
      description: "Run endlessly through ancient temples, avoiding traps and collecting treasures!",
      gameType: "endless_runner",
      entities: [
        {
          name: "runner",
          type: "player",
          x: 150,
          y: 400,
          width: 32,
          height: 48,
          color: "#DAA520",
          emoji: "🏃‍♂️",
          renderMode: "emoji",
          physics: {
            gravity: true,
            gravityForce: 1.0,
            jumpForce: 16,
            moveSpeed: 6, // Constant forward movement
            airControl: 0.3
          },
          abilities: {
            slide: true,
            doubleJump: false
          },
          controls: {
            jump: "Space",
            slide: "ArrowDown"
          },
          health: 1, // One-hit gameplay
          score: 0,
          distance: 0
        }
      ],
      levels: [
        {
          name: "Ancient Temple",
          width: 99999, // Infinite
          height: 600,
          background: "#8B4513",
          platforms: [
            { x: 0, y: 550, width: 99999, height: 50, color: "#CD853F", type: "ground" }
          ],
          obstaclePatterns: [
            {
              type: "ground_spike",
              x: 400,
              y: 530,
              width: 40,
              height: 20,
              pattern: "regular",
              spacing: 300
            },
            {
              type: "hanging_log",
              x: 600,
              y: 450,
              width: 20,
              height: 100,
              pattern: "swing",
              timing: 2.0
            },
            {
              type: "pit",
              x: 800,
              y: 550,
              width: 80,
              height: 50,
              pattern: "gap",
              spacing: 500
            }
          ],
          collectibles: [
            {
              type: "coin",
              pattern: "trail",
              spacing: 50,
              points: 1,
              color: "#FFD700"
            },
            {
              type: "power_up",
              subtype: "magnet",
              pattern: "rare",
              spacing: 800,
              duration: 10,
              color: "#FF69B4"
            }
          ],
          effects: {
            autoScroll: true,
            scrollSpeed: 6,
            speedIncrease: 0.01, // Gradual speed increase
            parallaxLayers: 3
          }
        }
      ],
      gameLogic: {
        winCondition: "endless_survival",
        loseCondition: "collision",
        scoring: {
          distance: 1, // Per unit moved
          coins: 10,
          powerUpActivation: 25,
          nearMiss: 5 // Close calls with obstacles
        },
        specialMechanics: {
          autoRunning: "Character runs automatically",
          obstacleGeneration: "Procedural obstacle placement",
          speedProgression: "Game gradually gets faster",
          powerUps: "Temporary abilities like invincibility",
          achievements: "Distance and score milestones"
        }
      }
    }
  },

  {
    id: 'tower_defense',
    name: 'Tower Defense',
    description: 'Strategic placement of defensive structures',
    gameType: 'tower_defense',
    difficulty: 'Advanced',
    estimatedPlayTime: '45-90 minutes',
    mechanics: ['tower_placement', 'resource_management', 'wave_defense', 'strategic_planning'],
    template: {
      title: "Castle Defense",
      description: "Strategically place towers to defend your castle from waves of enemies!",
      gameType: "tower_defense",
      entities: [], // Towers are placed dynamically
      levels: [
        {
          name: "Castle Approach",
          width: 1200,
          height: 800,
          background: "#228B22",
          path: [
            { x: 0, y: 400 },
            { x: 200, y: 400 },
            { x: 200, y: 200 },
            { x: 600, y: 200 },
            { x: 600, y: 600 },
            { x: 1000, y: 600 },
            { x: 1000, y: 400 },
            { x: 1200, y: 400 }
          ],
          spawnPoint: { x: 0, y: 400 },
          castle: { x: 1200, y: 350, width: 100, height: 100, health: 20 },
          buildableAreas: [
            { x: 100, y: 100, width: 80, height: 80 },
            { x: 300, y: 300, width: 80, height: 80 },
            { x: 500, y: 100, width: 80, height: 80 },
            { x: 700, y: 400, width: 80, height: 80 },
            { x: 800, y: 200, width: 80, height: 80 }
          ],
          waves: [
            {
              number: 1,
              enemies: [
                { type: "goblin", count: 10, health: 2, speed: 2, reward: 5 }
              ],
              spawnDelay: 1.0
            },
            {
              number: 2,
              enemies: [
                { type: "goblin", count: 8, health: 2, speed: 2, reward: 5 },
                { type: "orc", count: 3, health: 5, speed: 1.5, reward: 10 }
              ],
              spawnDelay: 0.8
            }
          ]
        }
      ],
      towerTypes: [
        {
          name: "Archer Tower",
          cost: 10,
          damage: 3,
          range: 100,
          fireRate: 1.0,
          projectileType: "arrow",
          upgrades: [
            { level: 2, cost: 15, damage: 5, range: 120 },
            { level: 3, cost: 25, damage: 8, range: 140, special: "pierce" }
          ]
        },
        {
          name: "Cannon Tower",
          cost: 20,
          damage: 8,
          range: 80,
          fireRate: 0.5,
          projectileType: "cannonball",
          special: "splash_damage",
          upgrades: [
            { level: 2, cost: 30, damage: 12, splashRadius: 60 },
            { level: 3, cost: 50, damage: 18, splashRadius: 80 }
          ]
        },
        {
          name: "Magic Tower",
          cost: 30,
          damage: 5,
          range: 120,
          fireRate: 0.8,
          projectileType: "magic_bolt",
          special: "slow_effect",
          upgrades: [
            { level: 2, cost: 40, damage: 7, slowDuration: 3 },
            { level: 3, cost: 60, damage: 10, special: "freeze" }
          ]
        }
      ],
      gameLogic: {
        winCondition: "survive_all_waves",
        loseCondition: "castle_destroyed",
        currency: "gold",
        startingGold: 50,
        scoring: {
          enemyKilled: 1,
          waveCompleted: 100,
          castleHealthRemaining: 50
        },
        specialMechanics: {
          towerPlacement: "Click on buildable areas to place towers",
          towerUpgrades: "Spend gold to upgrade existing towers",
          enemyPathing: "Enemies follow predetermined path",
          waveProgression: "Each wave gets progressively harder",
          resourceManagement: "Balance spending on new towers vs upgrades"
        }
      }
    }
  }
]

// Helper function to get template by game type
export function getGameTemplate(gameTypeId: string): GameTemplate | undefined {
  return GAME_TEMPLATES.find(template => template.id === gameTypeId)
}

// Helper function to get all templates for a difficulty level
export function getTemplatesByDifficulty(difficulty: string): GameTemplate[] {
  return GAME_TEMPLATES.filter(template => template.difficulty === difficulty)
}

// Helper function to customize template based on user options
export function customizeTemplate(template: GameTemplate, options: any): any {
  const customized = JSON.parse(JSON.stringify(template.template)) // Deep clone
  
  // Apply visual style
  if (options.visualStyle === 'pixel') {
    // Reduce entity sizes for pixel art
    customized.entities.forEach((entity: any) => {
      entity.width = Math.max(16, entity.width * 0.75)
      entity.height = Math.max(16, entity.height * 0.75)
    })
  }
  
  // Apply theme colors
  const themeColors: { [key: string]: string[] } = {
    fantasy: ['#8B4513', '#228B22', '#FFD700', '#DEB887'],
    scifi: ['#00FFFF', '#8A2BE2', '#FF1493', '#C0C0C0'],
    cyberpunk: ['#FF0080', '#00FFFF', '#8000FF', '#00FF88'],
    space: ['#191970', '#4B0082', '#8A2BE2', '#FFFFFF'],
    nature: ['#228B22', '#8FBC8F', '#32CD32', '#98FB98']
  }
  
  if (options.theme && themeColors[options.theme]) {
    const colors = themeColors[options.theme]
    customized.entities.forEach((entity: any, index: number) => {
      entity.color = colors[index % colors.length]
    })
  }
  
  // Apply complexity modifications
  if (options.complexity === 'simple') {
    // Reduce enemies and obstacles
    customized.levels.forEach((level: any) => {
      if (level.enemies) level.enemies = level.enemies.slice(0, 1)
      if (level.traps) level.traps = level.traps.slice(0, 1)
      if (level.waves) level.waves = level.waves.slice(0, 2)
    })
  } else if (options.complexity === 'epic') {
    // Add more content
    customized.levels.forEach((level: any) => {
      if (level.collectibles) {
        level.collectibles.push({
          type: "bonus",
          x: level.width * 0.8,
          y: level.height * 0.3,
          points: 100,
          color: "#FF69B4",
          width: 32,
          height: 32,
          special: true
        })
      }
    })
  }
  
  return customized
}

export default GAME_TEMPLATES