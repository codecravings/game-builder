# 🎮 AI Game Engine: Because Making Games Should Be as Easy as Ordering Pizza

> *"It works on my machine... sometimes"* - Every developer ever

Welcome to the most ambitious, slightly chaotic, but genuinely innovative AI-powered game engine! This project combines the power of DeepSeek AI, DALL-E 3, and good old-fashioned determination to create games that may or may not work as intended.

## 🚀 What This Thing Actually Does

- **🤖 AI Game Generation**: Tell DeepSeek what game you want, and it'll generate a complete game concept faster than you can say "runtime error"
- **🎨 Smart Asset Generation**: DALL-E 3 creates game assets with intelligent request limiting (because we're not made of money)
- **🎯 Game Preview**: Watch your creations come to life in a Phaser.js-powered preview (results may vary)
- **🔧 AI-Powered Improvements**: Don't like something? Tell the AI to fix it and pray to the debugging gods
- **💾 Save/Load System**: Because nobody wants to lose their beautiful, slightly broken creations

## 🏗️ Tech Stack (AKA "The Usual Suspects")

- **Frontend**: React + TypeScript (because we like our errors typed)
- **Backend**: Python + FastAPI (fast enough for our modest expectations)
- **Game Engine**: Phaser.js (when it cooperates)
- **AI**: DeepSeek API (the real MVP here)
- **Asset Generation**: DALL-E 3 (limited to 5 requests per game to preserve sanity and wallet)
- **Rendering**: Pygame + some prayers

## 🎯 Current Status: "It's Complicated"

### ✅ What's Working (Mostly)
- AI game concept generation (surprisingly good!)
- DALL-E integration with smart request limiting
- Save/load functionality 
- Game improvement interface
- Python backend that doesn't crash (usually)
- Entity creation and physics (when the stars align)

### 🚧 What's "In Progress" (AKA The Fun Stuff)
- [ ] **Entity Rendering**: Currently showing rectangles instead of epic sprites (hey, minimalism is trendy!)
- [ ] **Color Management**: Entities sometimes forget what color they're supposed to be
- [ ] **Emoji Integration**: Because what's a ninja without proper emoji representation? 🥷
- [ ] **Game Types**: Racing games that actually race, platformers that actually platform
- [ ] **Collision Detection**: Making things bump into each other properly
- [ ] **Sound System**: Silent games are so last century
- [ ] **Mobile Export**: For when you want to show off your creations on the go

### 🐛 Known "Features" (Not Bugs, Features!)
- Sometimes entities play hide and seek (they're still there, just invisible)
- The Python backend occasionally needs a pep talk to start working
- Racing games might have existential crises about which direction is forward
- JSON parsing can be as unpredictable as the weather

## 🚀 Getting Started (Buckle Up!)

### Prerequisites
- Node.js (the newer, the better)
- Python 3.8+ (because we're not savages)
- A sense of humor (absolutely critical)
- Patience (legendary amounts recommended)

### Installation

```bash
# Clone this beautiful disaster
git clone https://github.com/codecravings/game-builder.git
cd game-builder

# Frontend setup
npm install
npm run dev

# Backend setup (in a new terminal, because we're fancy)
cd python_backend
pip install -r requirements.txt
python main.py

# Cross your fingers and visit http://localhost:3001
```

### API Keys Setup
You'll need to add your own API keys (because sharing is caring, but not API keys):

1. **Frontend Keys**: Copy `.env.example` to `.env` and add your keys:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

2. **Backend Keys**: Copy `python_backend/config.example.py` to `python_backend/config.py`:
   ```bash
   cp python_backend/config.example.py python_backend/config.py
   # Edit config.py with your actual API keys
   ```

Required API keys:
- DeepSeek API key (for game generation)
- OpenAI API key (for DALL-E 3 assets)

## 🎮 How to Use This Magnificent Beast

1. **Generate a Game**: Describe your dream game to the AI ("Make me a ninja game with spinning blades!")
2. **Watch the Magic**: DeepSeek creates entities, DALL-E generates assets (up to 5 per game)
3. **Preview Your Creation**: See your game come to life (definitions of "life" may vary)
4. **Improve with AI**: Not happy? Tell the AI what to fix
5. **Save Your Masterpiece**: Because even broken things deserve preservation

## 🤝 Contributing

Found a bug? Got an improvement? Want to make rectangles actually look like the sprites they're supposed to be? Contributions welcome!

Areas where help would be appreciated:
- Entity rendering (making things visible is apparently harder than expected)
- Game physics fine-tuning
- Mobile compatibility
- General "make it work better" improvements
- Documentation (because even chaos needs documentation)

## 📝 License

MIT License - because sharing is caring, and maybe someone can make this work better than I can!

## 🎉 Acknowledgments

- The React team for making frontend development slightly less painful
- The Phaser.js team for a game engine that works (when I use it correctly)
- DeepSeek for creating an AI that's surprisingly good at game design
- Coffee, for making this project possible
- Stack Overflow, for being there when things got weird

## 🔮 Future Plans (AKA "The Dream")

- Make entities actually visible without requiring a degree in debugging
- Add more game types (puzzle games, RPGs, probably something involving cats)
- Improve AI to understand that "make it more fun" is a valid design request
- World domination (after I fix the rendering issues)

---

*"Building a game engine is like trying to solve a Rubik's cube while blindfolded, on a rollercoaster, during an earthquake. But hey, at least the AI part works!"*

**Status**: Chaotically functional 🎯  
**Last Updated**: When something broke and needed fixing  
**Next Update**: When I figure out why rectangles are so stubborn about being visible