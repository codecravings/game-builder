// Quick fix for your existing "Neon Velocity" game
console.log('🔧 Fixing your existing racing game...');

// If you have the game data available, run this in console:
function fixExistingRacingGame(gameData) {
  console.log('🏎️ Original game data:', gameData);
  
  // Find the player entity
  const player = gameData.entities?.find(e => e.type === 'player');
  
  if (player) {
    console.log('🔧 Fixing player physics...');
    
    // Force racing physics
    player.physics = {
      ...player.physics,
      gravity: false,
      maxSpeed: 8,
      acceleration: 0.4,
      braking: 0.6,
      turning: 0.3,
      drift: 0.1
    };
    
    // Force racing properties
    player.currentSpeed = 0;
    player.steeringAngle = 0;
    player.facingAngle = 0;
    
    // Ensure good position
    player.x = player.x || 100;
    player.y = player.y || 400;
    
    // Force emoji rendering
    if (!player.emoji) {
      player.emoji = '🏎️';
    }
    player.renderMode = 'emoji';
    
    console.log('✅ Player fixed:', player);
  }
  
  // Normalize game type for detection
  if (gameData.gameType && gameData.gameType.toLowerCase().includes('racer')) {
    gameData.gameType = 'racing'; // Set to standard type
    console.log('✅ Game type normalized to "racing"');
  }
  
  return gameData;
}

// Instructions
console.log(`
🎯 To fix your current game:

1. In console, find your game data (look for the game object)
2. Run: fixExistingRacingGame(yourGameData)
3. Or manually set these properties:

player.physics = {
  gravity: false,
  maxSpeed: 8,
  acceleration: 0.4,
  braking: 0.6,
  turning: 0.3
};
player.currentSpeed = 0;
player.steeringAngle = 0;
player.facingAngle = 0;

4. The new detection should now work with "Endless Arcade Racer"
`);

// Export the function globally
if (typeof window !== 'undefined') {
  window.fixExistingRacingGame = fixExistingRacingGame;
}