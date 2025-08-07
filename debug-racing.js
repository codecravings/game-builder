// Quick racing game debug
console.log('🏎️ RACING GAME DEBUG TEST');

// Test racing template
const racingGame = {
  "title": "Speed Test Racing",
  "description": "Simple racing test with working car physics",
  "gameType": "racing",
  "visualStyle": "emoji",
  "theme": "scifi",
  
  "entities": [{
    "name": "player_car",
    "type": "player",
    "x": 100,           // Start at left side
    "y": 400,           // Middle vertically  
    "width": 48,
    "height": 24,
    "color": "#FF0000",
    "emoji": "🏎️",
    "renderMode": "emoji",
    "physics": {
      "gravity": false,        // CRITICAL: No gravity for cars
      "maxSpeed": 10,
      "acceleration": 0.5,
      "braking": 0.8,
      "turning": 0.3,
      "drift": 0.1
    },
    "abilities": {
      "boost": true
    },
    "currentSpeed": 0,
    "steeringAngle": 0,
    "facingAngle": 0,
    "controls": {
      "accelerate": "ArrowUp",
      "brake": "ArrowDown", 
      "turnLeft": "ArrowLeft",
      "turnRight": "ArrowRight",
      "boost": "Space"
    }
  }],
  
  "levels": [{
    "name": "Test Track",
    "width": 1600,
    "height": 800,
    "background": "#2F4F4F",
    "platforms": [],  // Racing games don't need platforms
    "trackBounds": [
      { "x": 0, "y": 100, "width": 1600, "height": 20, "color": "#8B4513", "type": "barrier" },
      { "x": 0, "y": 680, "width": 1600, "height": 20, "color": "#8B4513", "type": "barrier" }
    ],
    "collectibles": [
      { "type": "boost", "x": 400, "y": 400, "points": 0, "color": "#FFFF00", "width": 32, "height": 32, "emoji": "⚡" },
      { "type": "coin", "x": 800, "y": 350, "points": 10, "color": "#FFD700", "width": 24, "height": 24, "emoji": "🪙" }
    ],
    "goal": {
      "x": 1400,
      "y": 350,
      "width": 64,
      "height": 100, 
      "color": "#FFD700",
      "emoji": "🏁",
      "type": "finish_line"
    }
  }],
  
  "gameLogic": {
    "winCondition": "reach_goal",
    "loseCondition": "crash_into_barriers",
    "scoring": {
      "collectibles": 5,
      "timeBonus": true,
      "speedBonus": true
    }
  }
};

console.log('✅ Racing game structure:', JSON.stringify(racingGame, null, 2));

// Test key physics values
console.log('\n🔧 Physics Debug:');
console.log('- Car has gravity:', racingGame.entities[0].physics.gravity);  // Should be FALSE
console.log('- Car max speed:', racingGame.entities[0].physics.maxSpeed);   // Should be > 0
console.log('- Car position:', { x: racingGame.entities[0].x, y: racingGame.entities[0].y });
console.log('- Car initial speed:', racingGame.entities[0].currentSpeed);    // Should be 0

console.log('\n🎮 Controls:');
console.log('- Arrow Up: Accelerate');
console.log('- Arrow Down: Brake'); 
console.log('- Arrow Left/Right: Turn');
console.log('- Space: Boost');

console.log('\n🎯 Expected Behavior:');
console.log('1. Car should appear at (100, 400) as 🏎️ emoji');
console.log('2. Arrow keys should make it move and turn');
console.log('3. No gravity - car should not fall down');
console.log('4. Speed should show in UI');

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testRacingGame = racingGame;
  console.log('\n💡 In browser console, try: testRacingGame');
}