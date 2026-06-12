const sheets = Array.from(document.querySelectorAll(".sheet"));
const prevButton = document.querySelector(".prev");
const nextButton = document.querySelector(".next");
const pageLabel = document.querySelector("#pageLabel");
const dots = document.querySelector("#dots");

const labels = [
  "Capa",
  "Introdução",
  "Nós",
  "",
  "",
  "",
  "",
  "",
  ""
];

let currentSpread = 0;
let isTurning = false;

function buildDots() {
  sheets.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Ir para pagina ${index + 1}`);
    dot.addEventListener("click", () => goTo(index));
    dots.appendChild(dot);
  });
}

function setLayering() {
  sheets.forEach((sheet, index) => {
    sheet.style.zIndex = sheets.length - index;
    if (sheet.classList.contains("flipped")) {
      sheet.style.zIndex = index + 1;
    }
  });
}

function updateControls() {
  prevButton.disabled = currentSpread === 0 || isTurning;
  nextButton.disabled = currentSpread === sheets.length || isTurning;
  pageLabel.textContent = labels[Math.min(currentSpread * 2, labels.length - 1)];

  Array.from(dots.children).forEach((dot, index) => {
    dot.classList.toggle("active", index === Math.min(currentSpread, sheets.length - 1));
  });
}

function addPaperSound() {
  if (!window.AudioContext && !window.webkitAudioContext) return;

  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const context = new AudioEngine();
  const bufferSize = context.sampleRate * 0.16;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const fade = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * fade * 0.05;
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  filter.type = "highpass";
  filter.frequency.value = 850;
  gain.gain.value = 0.28;

  noise.buffer = buffer;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start();
}

function turnTo(target) {
  if (target < 0 || target > sheets.length || target === currentSpread || isTurning) return;

  isTurning = true;
  const movingForward = target > currentSpread;
  const sheet = movingForward ? sheets[currentSpread] : sheets[currentSpread - 1];

  sheet.classList.add("turning");
  addPaperSound();

  if (movingForward) {
    sheet.classList.add("flipped");
    currentSpread += 1;
  } else {
    sheet.classList.remove("flipped");
    currentSpread -= 1;
  }

  setLayering();
  updateControls();

  window.setTimeout(() => {
    sheet.classList.remove("turning");
    isTurning = false;
    updateControls();
  }, 940);
}

function goTo(target) {
  if (target === currentSpread) return;
  const direction = target > currentSpread ? 1 : -1;
  const step = () => {
    if (currentSpread === target) return;
    turnTo(currentSpread + direction);
    window.setTimeout(step, 980);
  };
  step();
}

function handleCornerClick(event, sheet, index) {
  if (event.target.closest("[contenteditable='true']")) return;

  const rect = sheet.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const isRightCorner = clickX > rect.width * 0.72;
  const isLeftCorner = clickX < rect.width * 0.28;

  if (!sheet.classList.contains("flipped") && index === currentSpread && isRightCorner) {
    turnTo(currentSpread + 1);
  }

  if (sheet.classList.contains("flipped") && index === currentSpread - 1 && isLeftCorner) {
    turnTo(currentSpread - 1);
  }
}

sheets.forEach((sheet, index) => {
  sheet.addEventListener("click", (event) => handleCornerClick(event, sheet, index));
});

prevButton.addEventListener("click", () => turnTo(currentSpread - 1));
nextButton.addEventListener("click", () => turnTo(currentSpread + 1));

document.addEventListener("keydown", (event) => {
  if (event.target.closest("[contenteditable='true']")) return;
  if (event.key === "ArrowRight") turnTo(currentSpread + 1);
  if (event.key === "ArrowLeft") turnTo(currentSpread - 1);
});

buildDots();
setLayering();
updateControls();
