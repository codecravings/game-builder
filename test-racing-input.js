// Test script to verify racing input is working
console.log('🏁 RACING INPUT TEST SCRIPT');
console.log('----------------------------');

// Wait for game engine to be available
function waitForGameEngine() {
  if (window.gameEngine) {
    console.log('✅ Game engine found!');
    testRacingInput();
  } else {
    console.log('⏳ Waiting for game engine...');
    setTimeout(waitForGameEngine, 1000);
  }
}

function testRacingInput() {
  const engine = window.gameEngine;
  
  console.log('🎮 GAME ENGINE INSPECTION:');
  console.log('- Game Type:', engine.gameData.gameType);
  console.log('- Player exists:', !!engine.player);
  console.log('- Keys set size:', engine.keys.size);
  console.log('- Current keys:', Array.from(engine.keys));
  
  if (engine.player) {
    console.log('🏎️ PLAYER INSPECTION:');
    console.log('- Position:', { x: engine.player.x, y: engine.player.y });
    console.log('- Physics:', engine.player.physics);
    console.log('- Current Speed:', engine.player.currentSpeed);
    console.log('- Steering Angle:', engine.player.steeringAngle);
    console.log('- Facing Angle:', engine.player.facingAngle);
    console.log('- Velocity:', engine.player.velocity);
  }
  
  console.log('');
  console.log('🔥 KEYBOARD INPUT TEST:');
  console.log('Press arrow keys or WASD and watch for:');
  console.log('1. "🎮 KEY DOWN:" logs');
  console.log('2. "🎮 Racing input detected:" logs');
  console.log('3. "🚨 INPUT DEBUG:" logs');
  console.log('4. Car movement on screen');
  console.log('');
  console.log('If you see key logs but no movement, the physics might need adjustment.');
}

// Start the test
waitForGameEngine();

// Also set up a manual trigger
window.testRacingInput = testRacingInput;

console.log('💡 TIP: If game engine is already loaded, run: testRacingInput()');