const T = {
  vignetteShow: 2600,
  vignetteFade: 1100,
  pauseAfterVigs: 1100,
  youMeetShow: 4300,
  youMeetFade: 1200,
  ctxFadeIn: 1600,
  ctxHold: 20000,
  bodyFadeDelay: 7000,
  bodyFadeDur: 6000,
  finalFadeDelay: 3000,
  finalFadeDur: 3000,
  blackPause: 200,
  overlayFade: 1400,
  nameInterval: 800,
  tickLeadMs: 120,
  ghostDelayMin: 1000,
  ghostDelayMax: 2000,
  ghostOpacity: 0.15,
  promptTimeout: 20000,
  videoButtonDelay: 4000,
  complicitFadeDelay: 3000
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

let names = [];
let idx = 0;
let timer;
let nameCount = 0;
let promptBatchSize = 35;
let isPromptActive = false;
let promptTimeout;
let videoIdx = 0;
let isLoading = true;
let canSkip = false;
let skipCallback = null;

const videoPrompts = [
  {
    videoUrl: "videos/photoj.mp4",
    source: "Al-Jazeera",
    sourceUrl: "",
    date: "June 2025",
    caption: "Palestinian photojournalist Abdel Rahim Khudr breaks down after discovering the loss of 48 family members in an Israeli air strike that hit his home in northern Gaza"
  },
  {
    videoUrl: "videos/aidrun.mp4",
    source: "abo._.jamal0",
    sourceUrl: "https://www.tiktok.com/@abo._.jamal0/video/7519182991055228168?_r=1&_t=ZS-8yHAXb4uFqU",
    date: "June 2025",
    caption: "Palestinians take cover as Israeli soldiers open fire on civilians attempting to collect humanitarian aid."
  },
  {
    videoUrl: "videos/motazcompose.mp4",
    source: "motaz_azaiza",
    sourceUrl: "https://x.com/jannataminkhan/status/1711474447293517845",
    date: "October 2023",
    caption: "Palestinian journalist Motaz Azaiza pauses to collect himself before continuing his coverage."
  },
  {
    videoUrl: "videos/israelstrike.mp4",
    source: "motaz_azaiza",
    sourceUrl: "https://www.instagram.com/p/DCU7572OVrv/?hl=en",
    date: "November 2024",
    caption: "An Israeli air strike is captured hitting an area where displaced civilians are seeking refuge in tents."
  },
  {
    videoUrl: "videos/pleshunger.mp4",
    source: "plestia.alaqad",
    sourceUrl: "https://www.instagram.com/p/DMcnOBFSUzC/?hl=en",
    date: "July 2025",
    caption: ""
  }
];

function showLoading() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) indicator.style.display = 'block';
}

function hideLoading() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) indicator.style.display = 'none';
}

async function fadeInEl(el, dur) {
  el.style.transition = `opacity ${dur}ms ease`;
  el.style.opacity = 1;
  await sleep(dur);
}

async function fadeOutEl(el, dur) {
  el.style.transition = `opacity ${dur}ms ease`;
  el.style.opacity = 0;
  await sleep(dur);
}

function playTick() {
  const a = document.getElementById('tick-audio');
  if (!a) return;
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch (_) {}
}

async function runIntro() {
  if (isLoading) {
    hideLoading();
    isLoading = false;
  }

  const overlay = document.getElementById('intro-overlay');
  const textEl = document.getElementById('intro-text');

  const skipEl = document.createElement('div');
  skipEl.id = 'skip-indicator';
  skipEl.textContent = 'click to continue';
  skipEl.style.cssText = 'position: absolute; bottom: 20px; right: 20px; font-size: 0.7em; color: #444; opacity: 0; transition: opacity 0.5s ease; pointer-events: none;';
  overlay.appendChild(skipEl);

  setTimeout(() => {
    skipEl.style.opacity = '1';
    canSkip = true;
  }, 2000);

  let currentStep = 0;
  let shouldAdvance = false;

  const handleAdvance = () => {
    if (canSkip) {
      shouldAdvance = true;
    }
  };

  overlay.addEventListener('click', handleAdvance);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      handleAdvance();
    }
  }, { once: false });

  const vignettes = [
    "A child who loved to draw.",
    "A grandfather who made the best tea.",
    "A student one semester away from becoming a doctor.",
    "A mother who sang lullabies."
  ];

  textEl.classList.add('no-wrap');
  for (let i = 0; i < vignettes.length; i++) {
    currentStep = i;
    shouldAdvance = false;

    const line = vignettes[i];
    textEl.classList.remove('red');
    textEl.textContent = line;
    await fadeInEl(textEl, T.vignetteFade);

    if (shouldAdvance) {
      await fadeOutEl(textEl, 200);
      continue;
    }

    await sleep(T.vignetteShow);
    if (shouldAdvance) {
      await fadeOutEl(textEl, 200);
      continue;
    }

    await fadeOutEl(textEl, T.vignetteFade);
  }

  if (!shouldAdvance) {
    await sleep(T.pauseAfterVigs);
  }

  currentStep = 4;
  shouldAdvance = false;

  textEl.classList.add('red');
  textEl.textContent = "You will never meet them.";
  await fadeInEl(textEl, T.youMeetFade);

  if (!shouldAdvance) {
    await sleep(T.youMeetShow);
  }

  if (!shouldAdvance) {
    await fadeOutEl(textEl, T.youMeetFade);
  } else {
    await fadeOutEl(textEl, 200);
  }

  textEl.classList.remove('red');
  textEl.classList.remove('no-wrap');

  currentStep = 5;
  shouldAdvance = false;

  textEl.innerHTML = `
    <div id="ctx-head">They were Palestinians killed by Israeli forces in Gaza.</div>
    <div id="ctx-body">
      They listened to songs that made them dance in the kitchen and they hummed while doing the dishes.
      They looked forward to the same shows every week. They knew which coffee shop made the best breakfast and had favourite corners of their homes where the light felt warm.
      They teased their siblings, cared for their parents, and texted their friends just to say goodnight.
      And at the end of long days, they looked at the same moon we do, dreaming about their future.
    </div>
    <div id="ctx-foot">We remember their names - in solidarity with those still suffering.</div>
  `;

  await fadeInEl(textEl, T.ctxFadeIn);

  if (!shouldAdvance) {
    await sleep(T.ctxHold);
  }

  if (!shouldAdvance) {
    const head = document.getElementById('ctx-head');
    const body = document.getElementById('ctx-body');
    const foot = document.getElementById('ctx-foot');

    head.classList.add('fade6');
    body.classList.add('fade6');
    foot.style.transition = `color ${T.bodyFadeDur}ms ease`;
    foot.classList.add('red');

    if (!shouldAdvance) {
      await sleep(T.bodyFadeDur);
    }

    if (!shouldAdvance) {
      await sleep(T.finalFadeDelay);
    }

    if (!shouldAdvance) {
      await fadeOutEl(foot, T.finalFadeDur);
    }
  }

  canSkip = false;
  skipEl.remove();

  await sleep(1000);
  await fadeOutEl(overlay, T.overlayFade);
  overlay.remove();
  await sleep(1000);
  startMemorial();
}

function startMemorial() {
  const box = document.getElementById('name-container');
  box.classList.remove('hidden');
  fadeInEl(box, 1600);
  scheduleName();
  timer = setInterval(scheduleName, T.nameInterval);
}

function scheduleName() {
  if (nameCount > 0 && nameCount % promptBatchSize === 0 && !isPromptActive) {
    showVideoPrompt();
    return;
  }
  playTick();
  setTimeout(showNextName, T.tickLeadMs);
}

function showNextName() {
  if (!names.length) return;
  if (idx >= names.length) idx = 0;

  const p = names[idx];
  const nameEl = document.getElementById('name-line');
  const dobEl = document.getElementById('dob-line');

  nameEl.textContent = p.name || 'Unknown';

  const birthYear = p.dob ? p.dob.slice(0, 4) : "";
  const dy = p.death_year;
  const ageTxt = (p.age === "Infant") ? "Infant" : (typeof p.age === "number" ? p.age : "");

  let secondLine = "";
  if (birthYear && dy) {
    secondLine = `${birthYear} – ${dy}${ageTxt !== "" ? ` · ${ageTxt}` : ""}`;
  } else if (birthYear) {
    secondLine = birthYear;
  } else if (ageTxt !== "") {
    secondLine = ageTxt;
  }
  dobEl.textContent = secondLine;

  addGhost(p.name || 'Unknown');
  idx++;
  nameCount++;
}

function showVideoPrompt() {
  isPromptActive = true;
  clearInterval(timer);

  const nameContainer = document.getElementById('name-container');
  const playPrompt = document.getElementById('play-prompt');

  nameContainer.style.opacity = 0;

  setTimeout(() => {
    playPrompt.classList.add('active');
    setTimeout(() => playPrompt.classList.add('pulsing'), 500);
  }, 2000);

  promptTimeout = setTimeout(() => {
    hideVideoPrompt();
    resumeMemorialWithoutAdvancing();
  }, T.promptTimeout + 2000);

  playPrompt.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(promptTimeout);
    showVideoPlayer();
  };
}

function showVideoPlayer() {
  const playPrompt = document.getElementById('play-prompt');
  const videoContainer = document.getElementById('video-container');
  const videoElement = document.getElementById('video-element');
  const videoSource = document.getElementById('video-source');
  const videoDate = document.getElementById('video-date');
  const videoButtons = document.getElementById('video-buttons');
  const muteBtn = document.getElementById('mute-btn');
  const complicitBtn = document.getElementById('btn-complicit');
  const videoError = document.getElementById('video-error');

  playPrompt.classList.remove('active', 'pulsing');
  complicitBtn.classList.remove('clicked');
  complicitBtn.textContent = 'Remain Complicit';
  videoError.style.display = 'none';

  if (videoIdx >= videoPrompts.length) videoIdx = 0;
  const prompt = videoPrompts[videoIdx];

  videoElement.src = prompt.videoUrl;
  videoElement.muted = false;
  videoSource.textContent = prompt.source;
  videoDate.textContent = prompt.date;

  const videoCaption = document.getElementById('video-context');
  videoCaption.textContent = prompt.caption || '';

  if (prompt.sourceUrl) {
    videoSource.style.cursor = 'pointer';
    videoSource.onclick = (e) => {
      e.stopPropagation();
      window.open(prompt.sourceUrl, '_blank');
    };
  } else {
    videoSource.style.cursor = 'default';
    videoSource.onclick = null;
  }

  muteBtn.textContent = 'MUTE';
  muteBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    videoElement.muted = !videoElement.muted;
    muteBtn.textContent = videoElement.muted ? 'UNMUTE' : 'MUTE';
  };

  videoElement.addEventListener('error', () => {
    videoError.style.display = 'flex';
    setTimeout(() => {
      hideVideoPlayer();
      resumeMemorial();
    }, 3000);
  }, { once: true });

  videoContainer.classList.add('active');

  videoElement.play().catch(() => {
    videoElement.muted = true;
    muteBtn.textContent = 'UNMUTE';
    return videoElement.play().catch(() => {
      videoError.style.display = 'flex';
      setTimeout(() => {
        hideVideoPlayer();
        resumeMemorial();
      }, 3000);
    });
  });

  setTimeout(() => videoButtons.classList.add('visible'), T.videoButtonDelay);

  document.getElementById('btn-complicit').onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleComplicitChoice();
  };

  document.getElementById('btn-help').onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = 'help.html';
  };
}

function handleComplicitChoice() {
  const videoContainer = document.getElementById('video-container');
  const videoElement = document.getElementById('video-element');
  const complicitBtn = document.getElementById('btn-complicit');

  complicitBtn.classList.add('clicked');
  complicitBtn.textContent = 'COMPLICIT';
  videoElement.pause();

  setTimeout(() => {
    videoContainer.style.transition = 'opacity 2s ease';
    videoContainer.style.opacity = 0;
  }, 1000);

  setTimeout(() => {
    hideVideoPlayer();
    videoIdx++;
    if (videoIdx >= videoPrompts.length) videoIdx = 0;
    setTimeout(() => resumeMemorial(), 4000);
  }, 3000);
}

function hideVideoPrompt() {
  const playPrompt = document.getElementById('play-prompt');
  playPrompt.classList.remove('active', 'pulsing');
  playPrompt.onclick = null;
  clearTimeout(promptTimeout);
}

function hideVideoPlayer() {
  const videoContainer = document.getElementById('video-container');
  const videoButtons = document.getElementById('video-buttons');
  const videoElement = document.getElementById('video-element');

  videoContainer.classList.remove('active');
  videoButtons.classList.remove('visible');
  videoElement.pause();
  videoElement.src = '';
  videoContainer.style.opacity = '';
  videoContainer.style.transition = '';
}

function resumeMemorial() {
  const nameContainer = document.getElementById('name-container');
  isPromptActive = false;
  nameCount++;
  clearInterval(timer);

  fadeInEl(nameContainer, 800).then(() => {
    scheduleName();
    timer = setInterval(scheduleName, T.nameInterval);
  });
}

function resumeMemorialWithoutAdvancing() {
  const nameContainer = document.getElementById('name-container');
  isPromptActive = false;
  nameCount++;
  clearInterval(timer);

  fadeInEl(nameContainer, 800).then(() => {
    scheduleName();
    timer = setInterval(scheduleName, T.nameInterval);
  });
}

function addGhost(name) {
  const wall = document.getElementById('ghost-wall');
  const g = document.createElement('div');
  g.className = 'ghost';
  g.textContent = name;

  const pad = 50;
  let x = Math.random() * (window.innerWidth - pad * 2) + pad;
  let y = Math.random() * (window.innerHeight - pad * 2) + pad;

  g.style.left = x + 'px';
  g.style.top = y + 'px';
  wall.appendChild(g);

  const delay = T.ghostDelayMin + Math.random() * (T.ghostDelayMax - T.ghostDelayMin);
  setTimeout(() => { g.style.opacity = T.ghostOpacity; }, delay);


}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !canSkip) {
    e.preventDefault();
    const playPrompt = document.getElementById('play-prompt');
    if (playPrompt && playPrompt.classList.contains('active')) {
      playPrompt.click();
    }
  }
});

showLoading();

fetch('names.json')
  .then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    names = data.filter(item => item && item.name);

    if (names.length === 0) {
      console.warn('No valid names loaded');
      names = [{ name: 'Unknown', age: '', dob: '', death_year: '2024' }];
    }

    runIntro();
  })
  .catch(e => {
    console.error('Failed to load names:', e);
    hideLoading();
    names = [{ name: 'Unknown', age: '', dob: '', death_year: '2024' }];
    runIntro();
  });