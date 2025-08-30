// =====================
// Pokémon Matching Game
// =====================

// ----------- Game Configuration -----------
let CARDS = 10; // Number of cards to display
let MAX_POKEMON_ID = 1025; // Maximum Pokémon ID to fetch from the API
const usedIds = new Set(); // To track already used Pokémon IDs

// ----------- Game State -----------
let points = 0; // Matches found
let timerStarted = false; // Whether the timer has started
let timer; // Timer interval
let timeLeft = 120; // Default time per level
let score = 0; // Total game score
let level = 1; // Current level

// ----------- DOM References -----------
let draggableElements = document.querySelector(".draggable-element");
let droppableElements = document.querySelector(".droppable-element");
let wrongMsg = document.querySelector(".wrong");
let scoreElement = document.querySelector(".score");
let difficultySelector = document.querySelector("#difficulty");

// ----------- Pokémon Data -----------
let pokemonFound = []; // List of fetched Pokémon objects
let pokemonNames = []; // Their corresponding names

// Generate unique random number for Pokémon ID
function getUniqueRandomNumber(max) {
  let id;
  do {
    id = Math.floor(Math.random() * max) + 1;
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
}

// Set difficulty settings based on selected level
function setDifficulty(levelSetting) {
  switch (levelSetting) {
    case "easy":
      CARDS = 10 + Math.floor((level - 1) / 2);
      timeLeft = 90;
      break;
    case "medium":
      CARDS = 15 + Math.floor((level - 1) / 2);
      timeLeft = 120;
      break;
    case "hard":
      CARDS = 20 + Math.floor((level - 1) / 2);
      timeLeft = 150;
      break;
    default:
      CARDS = 10;
      timeLeft = 120;
  }
}

// Initialize and start the game
async function initGame() {
  const ids = [];
  usedIds.clear();
  points = 0;
  timerStarted = false;
  updateScore(score);
  updateLevel(level);

  const difficulty = difficultySelector?.value || "medium";
  setDifficulty(difficulty);

  // Fetch unique Pokémon
  while (ids.length < CARDS) {
    const id = getUniqueRandomNumber(MAX_POKEMON_ID);
    ids.push(id);
  }

  try {
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`).then((res) =>
          res.json()
        )
      )
    );

    pokemonFound = results;
    pokemonNames = results.map((p) => p.name);
    renderGame();
  } catch (err) {
    console.error("Error fetching Pokémon:", err);
  }
}

// Render game images and names
function renderGame() {
  setupTimer();

  const shuffledImages = [...pokemonFound].sort(() => Math.random() - 0.5);
  const shuffledNames = [...pokemonNames].sort(() => Math.random() - 0.5);

  // Display Pokémon images
  let imageHTML = "";
  shuffledImages.forEach((pokemon) => {
    imageHTML += `
      <div class="pokemon">
        <img id="${pokemon.name}" draggable="true" class="image" src="${pokemon.sprites.other["official-artwork"].front_shiny}" alt="pokemon">
      </div>`;
  });
  draggableElements.innerHTML = imageHTML;

  // Display Pokémon names
  let nameHTML = "";
  shuffledNames.forEach((name) => {
    nameHTML += `<div class="names"><p>${name}</p></div>`;
  });
  droppableElements.innerHTML = nameHTML;

  // Add drag events
  document.querySelectorAll(".image").forEach((pokemon) => {
    pokemon.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text", e.target.id);
    });
  });

  // Add drop events
  document.querySelectorAll(".names").forEach((name) => {
    name.addEventListener("dragover", (e) => e.preventDefault());

    name.addEventListener("drop", (e) => {
      const draggedName = e.dataTransfer.getData("text");
      const pokemonElement = document.querySelector(`#${draggedName}`);

      // Check if matched
      if (e.target.innerText === draggedName) {
        points++;
        score += 10;
        updateScore(score);
        e.target.innerHTML = "";
        e.target.appendChild(pokemonElement);
        wrongMsg.innerHTML = "";

        // If all matched
        if (points === CARDS) {
          clearInterval(timer);
          draggableElements.innerHTML = `<p class="win">🏆 ¡Ganaste el nivel ${level}! 🏆</p>`;
          startNextLevel();
        }
      } else {
        score -= 5;
        updateScore(score);
        wrongMsg.innerHTML = `<p>Incorrecto</p>`;
      }
    });
  });

  setupNameChaos();
}

// Setup countdown timer
function setupTimer() {
  let timerElement = document.querySelector(".timer");

  if (!timerElement) {
    timerElement = document.createElement("p");
    timerElement.classList.add("timer");
    document.querySelector("main").prepend(timerElement);
  }

  if (!timerStarted) {
    timerStarted = true;
    timer = setInterval(() => {
      timeLeft--;
      timerElement.innerText = `⏳ Time left: ${timeLeft}s`;

      // Handle game over
      if (timeLeft <= 0) {
        clearInterval(timer);
        if (points < CARDS) {
          draggableElements.innerHTML = `<p class="lose">⌛ ¡Game Over en nivel ${level}! ⌛</p>`;
          droppableElements.innerHTML = "";

          // Add restart button
          const restartBtn = document.createElement("button");
          restartBtn.textContent = "🔁 Reintentar";
          restartBtn.classList.add("restart-btn");
          restartBtn.addEventListener("click", () => {
            level = 1;
            score = 0;
            points = 0;
            usedIds.clear();
            timerStarted = false;
            initGame();
          });

          draggableElements.appendChild(restartBtn);
        }
      }

      // Stop timer if already won
      if (points === CARDS) {
        clearInterval(timer);
      }
    }, 1000);
  }
}

// Shuffle name boxes periodically
function setupNameChaos() {
  setInterval(() => {
    const names = Array.from(document.querySelectorAll(".names"));

    // Fisher-Yates shuffle
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    // Update layout and occasionally flip
    droppableElements.innerHTML = "";
    names.forEach((nameBox) => {
      nameBox.style.transform =
        Math.random() < 0.1 ? "rotate(180deg)" : "rotate(0deg)";
      droppableElements.appendChild(nameBox);
    });
  }, 20000);
}

// Move to the next level after delay
function startNextLevel(delaySeconds = 5) {
  setTimeout(() => {
    level++;
    points = 0;
    usedIds.clear();
    timerStarted = false;
    initGame();
  }, delaySeconds * 1000);
}

// Update score on UI
function updateScore(value) {
  if (!scoreElement) {
    scoreElement = document.createElement("p");
    scoreElement.classList.add("score");
    document.querySelector("main").appendChild(scoreElement);
  }
  scoreElement.innerText = `⭐ Score: ${value}`;
}

// Update level on UI
function updateLevel(value) {
  let levelElement = document.querySelector(".level");
  if (!levelElement) {
    levelElement = document.createElement("p");
    levelElement.classList.add("level");
    document.querySelector("main").prepend(levelElement);
  }
  levelElement.innerText = `📊 Nivel: ${value}`;
}

// Change difficulty event listener
if (difficultySelector) {
  difficultySelector.addEventListener("change", () => {
    level = 1;
    score = 0;
    initGame();
  });
}

// Start the game initially
initGame();
