const commandForm = document.getElementById("commandForm");
const commandInput = document.getElementById("commandInput");
const storyOutput = document.getElementById("storyOutput");
const logOutput = document.getElementById("logOutput");

const asciiArt = document.getElementById("asciiArt");
const statusHp = document.getElementById("statusHp");
const statusMp = document.getElementById("statusMp");
const statusRoom = document.getElementById("statusRoom");
const statusInventory = document.getElementById("statusInventory");

function addStoryLine(text) {
  const lines = String(text).split("\n");

  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = `> ${line}`;
    storyOutput.appendChild(p);
  }

  storyOutput.scrollTop = storyOutput.scrollHeight;
}

function renderLogFromState(state) {
  logOutput.innerHTML = "";

  for (const line of state.log) {
    const p = document.createElement("p");
    p.textContent = `[Log] ${line}`;
    logOutput.appendChild(p);
  }

  logOutput.scrollTop = logOutput.scrollHeight;
}

function updateUI(state) {
  statusHp.textContent = `${state.player.hp}/${state.player.maxHp}`;
  statusMp.textContent = `${state.player.mp}/${state.player.maxMp}`;
  statusRoom.textContent = state.player.currentRoom;
  statusInventory.textContent =
    state.player.inventory.length > 0 ? state.player.inventory.join("、") : "無";

  asciiArt.textContent = state.currentRoom.ascii;
  renderLogFromState(state);
}

async function loadGameState() {
  try {
    const response = await fetch("/api/state");
    const state = await response.json();

    updateUI(state);
    addStoryLine(state.currentRoom.description);
  } catch (error) {
    addStoryLine("無法載入遊戲狀態，請重新整理頁面後再試一次。");
  }
}

async function sendCommand(command) {
  try {
    const response = await fetch("/api/game/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    });

    const data = await response.json();

    updateUI(data.state);
    addStoryLine(data.narration || data.eventResult.message);
  } catch (error) {
    addStoryLine("指令送出失敗，請稍後再試。");
  }
}

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const command = commandInput.value.trim();

  if (command === "") {
    addStoryLine("請輸入指令。");
    return;
  }

  addStoryLine(command);
  sendCommand(command);

  commandInput.value = "";
  commandInput.focus();
});

loadGameState();
