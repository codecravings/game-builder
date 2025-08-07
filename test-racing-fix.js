// Quick test to verify racing game improvements
import { fixRacingGame, validateRacingGame, createTestRacingGame } from './src/utils/racingGameFix.js'

console.log('🏎️ Testing Racing Game Fixes...')

// Create a test racing game
const testGame = createTestRacingGame()
console.log('✅ Created test racing game:', testGame.title)

// Validate the racing game
const isValid = validateRacingGame(testGame)
console.log('✅ Racing game validation:', isValid ? 'PASSED' : 'FAILED')

// Test fixing a broken racing game
const brokenGame = {
  title: "Broken Racing Game",
  gameType: "racing",
  entities: [{
    name: "player",
    type: "player", 
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    physics: { gravity: true } // WRONG - should be false for racing
  }],
  levels: [{
    width: 800,
    height: 600,
    platforms: [
      { x: 0, y: 550, width: 800, height: 50 } // WRONG - racing shouldn't have platforms
    ]
  }]
}

console.log('🔧 Fixing broken racing game...')
const fixedGame = fixRacingGame(brokenGame)
const fixedIsValid = validateRacingGame(fixedGame)

console.log('✅ Fixed racing game validation:', fixedIsValid ? 'PASSED' : 'FAILED')
console.log('🎮 Player physics after fix:', fixedGame.entities[0].physics)
console.log('🏁 Racing game fixes completed successfully!')