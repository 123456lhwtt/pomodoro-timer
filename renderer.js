// Timer state
const MODES = {
  work: { label: '工作', minutes: 25 },
  shortBreak: { label: '短休息', minutes: 5 },
  longBreak: { label: '长休息', minutes: 15 },
};

const CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

let currentMode = 'work';
let totalSeconds = MODES.work.minutes * 60;
let remainingSeconds = totalSeconds;
let timerInterval = null;
let pomodoroCount = 1; // 1–4, resets to 1 after long break

// DOM elements
const timerContainer = document.querySelector('.timer-container');
const timerDisplay = document.getElementById('timer-display');
const progressRing = document.getElementById('progress-ring');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const sessionCount = document.getElementById('session-count');
const sessionLabel = document.getElementById('session-label');
const modeBtns = document.querySelectorAll('.mode-btn');

// Audio context — created on first user interaction
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeep() {
  ensureAudio();
  const now = audioCtx.currentTime;
  // Three quick beeps: 0.15s on, 0.1s off, repeat
  [0, 0.25, 0.5].forEach((offset) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
    osc.start(now + offset);
    osc.stop(now + offset + 0.15);
  });
}

function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, silent: true });
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  document.title = `${formatTime(remainingSeconds)} - ${MODES[currentMode].label}`;
  const progress = (totalSeconds - remainingSeconds) / totalSeconds;
  progressRing.style.strokeDashoffset = CIRCUMFERENCE * progress;
}

function switchMode(mode) {
  currentMode = mode;
  totalSeconds = MODES[mode].minutes * 60;
  remainingSeconds = totalSeconds;

  // Update body class for CSS color overrides
  document.body.className = '';
  if (mode === 'shortBreak') document.body.className = 'short-break';
  if (mode === 'longBreak') document.body.className = 'long-break';

  // Update mode buttons
  modeBtns.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));

  // Update progress ring
  progressRing.style.strokeDashoffset = 0;

  // Update session info
  if (mode === 'work') {
    sessionLabel.textContent = '阶段';
    sessionCount.textContent = `${pomodoroCount} / 4`;
  } else {
    sessionLabel.textContent = '休息';
    sessionCount.textContent = '';
  }

  updateDisplay();
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      playBeep();
      notifySessionEnd();
      advanceToNextMode();
    }
  }, 1000);

  btnStart.textContent = '暂停';
  timerContainer.classList.add('running');
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  btnStart.textContent = '开始';
  timerContainer.classList.remove('running');
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  remainingSeconds = totalSeconds;
  btnStart.textContent = '开始';
  timerContainer.classList.remove('running');
  updateDisplay();
}

function notifySessionEnd() {
  const title = currentMode === 'work' ? '工作完成！' : '休息结束！';
  const body = currentMode === 'work' ? '该休息一下了。' : '开始专注吧！';
  notify(title, body);
}

function advanceToNextMode() {
  if (currentMode === 'work') {
    if (pomodoroCount % 4 === 0) {
      switchMode('longBreak');
    } else {
      switchMode('shortBreak');
    }
  } else {
    if (currentMode === 'longBreak') {
      pomodoroCount = 1;
    } else {
      pomodoroCount++;
    }
    switchMode('work');
  }
}

// Request notification permission on first click
document.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

// Also request on start button
btnStart.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  if (timerInterval) {
    pauseTimer();
  } else {
    ensureAudio(); // Activate audio on user gesture
    startTimer();
  }
});

btnReset.addEventListener('click', resetTimer);

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    btnStart.textContent = '开始';
    timerContainer.classList.remove('running');
    switchMode(btn.dataset.mode);
  });
});

// Settings inputs
const setWork = document.getElementById('set-work');
const setShort = document.getElementById('set-short');
const setLong = document.getElementById('set-long');

function applySettings() {
  MODES.work.minutes = parseInt(setWork.value) || 25;
  MODES.shortBreak.minutes = parseInt(setShort.value) || 5;
  MODES.longBreak.minutes = parseInt(setLong.value) || 15;
  resetTimer();
}

[setWork, setShort, setLong].forEach((input) => {
  input.addEventListener('change', applySettings);
});

// Init
updateDisplay();
