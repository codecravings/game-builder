// Debug your current "Neon Velocity" game
console.log('🔍 Debugging your current racing game...');

// Add this to browser console to inspect your game data
function debugCurrentGame() {
  // Try to find the game engine instance
  const canvas = document.querySelector('canvas');
  if (canvas && canvas.gameEngine) {
    const engine = canvas.gameEngine;
    console.log('🎮 Found game engine:', engine);
    console.log('📊 Game data:', engine.gameData);
    console.log('🏎️ Player entity:', engine.player);
    console.log('🎯 Entities:', engine.gameData.entities);
    
    if (engine.player) {
      console.log('🔧 Player physics:', engine.player.physics);
      console.log('⚡ Player velocity:', engine.player.velocity);
      console.log('📍 Player position:', { x: engine.player.x, y: engine.player.y });
      console.log('🏁 Racing properties:', {
        currentSpeed: engine.player.currentSpeed,
        steeringAngle: engine.player.steeringAngle,
        facingAngle: engine.player.facingAngle
      });
    }
    
    return engine;
  } else {
    console.log('❌ Game engine not found on canvas');
    return null;
  }
}

// Auto-run inspection
setTimeout(() => {
  console.log('🚀 Auto-inspecting game...');
  debugCurrentGame();
}, 2000);

// Make available globally
if (typeof window !== 'undefined') {
  window.debugCurrentGame = debugCurrentGame;
  
  // Also try to fix the game if found
  window.quickFixRacing = function() {
    const engine = debugCurrentGame();
    if (engine && engine.player) {
      console.log('🔧 Quick-fixing racing properties...');
      
      // Force racing physics
      engine.player.physics = {
        ...engine.player.physics,
        gravity: false,
        maxSpeed: 8,
        acceleration: 0.5,
        braking: 0.7,
        turning: 0.3,
        drift: 0.1
      };
      
      // Force racing properties  
      engine.player.currentSpeed = 0;
      engine.player.steeringAngle = 0;
      engine.player.facingAngle = 0;
      
      // Ensure emoji
      if (!engine.player.emoji) {
        engine.player.emoji = '🏎️';
      }
      engine.player.renderMode = 'emoji';
      
      console.log('✅ Racing properties fixed!');
      console.log('🏎️ Try arrow keys now...');
      
      return engine.player;
    }
  };
}

console.log(`
🎯 DEBUGGING COMMANDS:
- debugCurrentGame() - Inspect current game
- quickFixRacing() - Force fix racing properties
- Look for racing debug logs when pressing arrow keys
`);