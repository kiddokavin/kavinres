// NER-Asha Dementia Platform Master Controller
import { 
  MATCH_CARDS_SOURCE, 
  WORD_PAIRS, 
  REMINISCENCE_ALBUM, 
  RHYTHM_TEMPLATES, 
  CAREGIVER_ANALYTICS 
} from './data.js';

// Application State
let activeLanguage = 'en';
let currentPortal = 'patient'; // patient or caregiver
let ambientAudioContext = null;
let ambientInterval = null;
let ambientSynthIsPlaying = false;

// Voice Helper State
let currentSpeechUtterance = null;

// Game A: Card Match state
let cardDeck = [];
let selectedCards = [];
let matchedPairsCount = 0;
let cardGameStartTime = null;

// Game B: Word Linker state
let selectedWordLeft = null;
let matchedWordLinks = [];

// Game C: Drum Beats state
let activeRhythm = RHYTHM_TEMPLATES[0];
let inputSequence = [];
let drumPlaybackTimeout = null;

// Memory Vault state
let currentSlideIndex = 0;

// Caregiver Logs list
const caregiverLogs = [
  {
    timestamp: "2026-08-23 10:15",
    caregiverId: "CG-102 (Staff)",
    pills: "Morning (Done), Afternoon (Done)",
    mood: "Happy",
    notes: "Grandpa was singing a traditional Bihu folk tune during breakfast. Recalled his wedding day clearly when looking at old photos. Played memory game twice with 80% accuracy."
  },
  {
    timestamp: "2026-08-22 18:30",
    caregiverId: "CG-102 (Staff)",
    pills: "Morning (Done), Afternoon (Done), Evening (Done)",
    mood: "Calm",
    notes: "Quiet day. Walks in the garden went well. Enjoyed listening to the calming flute soundtrack. Completed word linker puzzle in 24 seconds."
  },
  {
    timestamp: "2026-08-21 16:45",
    caregiverId: "CG-101 (Staff)",
    pills: "Morning (Done), Afternoon (Done)",
    mood: "Restless",
    notes: "Became slightly disoriented around 4 PM (sundowning). Orientation help from Aina voice assistant was useful in redirecting focus. Settled down after having a warm cup of Assam tea."
  }
];

// Localized Language Pack (Calming and Direct phrasing for elderly)
const LOCALIZATION = {
  en: {
    greeting: "Good evening, Koka!",
    orientation: "Today is Sunday, August 23, 2026. You are at home in your cozy house in Guwahati, Assam. The weather outside is warm and pleasant today. Everything is safe and secure here.",
    pillReminder: "Take the yellow pill after your evening snack.",
    milkReminder: "Drink a warm glass of milk at 8:00 PM.",
    gamosaStory: "This is a Gamosa, a traditional red-and-white cloth from Assam. Do you remember wearing a Gamosa during the Spring festival?",
    japiStory: "This is a Bihu Japi, a beautiful woven hat decorated with red circles. Do you remember seeing the dancers wearing it?",
    teaStory: "This is a fresh cup of tea. It smells lovely. Do you remember sitting in the tea gardens of Assam?",
    wordPrompt: "Click a word on the left to begin.",
    wordSuccess: "Great job matching!",
    rhythmIntro: "Click play to listen to the pattern!",
    rhythmPass: "Perfect! You repeated the drum beats correctly!",
    rhythmFail: "Almost! Click play and try repeating the beats again."
  },
  as: {
    greeting: "শুভ সন্ধিয়া, ককা!",
    orientation: "আজি দেওবাৰ, ২৩ আগষ্ট, ২০২৬ চন। আপুনি অসমৰ গুৱাহাটীৰ নিজৰ ঘৰত আছে। বাহিৰৰ বতৰ অতি ধুনীয়া আৰু শান্ত। আপুনি সম্পূৰ্ণ সুৰক্ষিত আছে।",
    pillReminder: "সন্ধিয়া জলপানৰ পিছত হালধীয়া টেবলেটটো খাই লব।",
    milkReminder: "ৰাতি ৮ বজাত এগিলাচ গৰম গাখীৰ খাব।",
    gamosaStory: "ই এখন অসমীয়া ফুলাম গামোচা। বহাগ বিহুত গামোচা পিন্ধাৰ কথা আপোনাৰ মনত আছেনে?",
    japiStory: "ই এটা জাপি। বিহু নাচনীসকলে ইয়াক মূৰত পিন্ধে।",
    teaStory: "ই একাপ গৰম চাহ। অসমৰ চাহ বাগিচাত চাহ খোৱাৰ কথা মনত পৰেনে?",
    wordPrompt: "আৰম্ভ কৰিবলৈ বাঁহফালৰ শব্দ এটাত ক্লিক কৰক।",
    wordSuccess: "বঢ়িয়া! আপোনাৰ উত্তৰ শুদ্ধ হৈছে।",
    rhythmIntro: "ঢোলৰ মাতটো শুনিবলৈ প্লে বুটামত ক্লিক কৰক!",
    rhythmPass: "সুন্দৰ! আপুনি শুদ্ধকৈ ঢোল বজাইছে!",
    rhythmFail: "আকৌ চেষ্টা কৰক, প্লে বুটামত ক্লিক কৰক।"
  },
  bn: {
    greeting: "শুভ সন্ধ্যা, দাদু!",
    orientation: "আজ রবিবার, ২৩ আগস্ট, ২০২৬ সাল। আপনি আসামের গুয়াহাটিতে নিজের বাড়িতে আছেন। বাইরের আবহাওয়া খুব সুন্দর ও মনোরম। আপনি এখানে সম্পূর্ণ নিরাপদ আছেন।",
    pillReminder: "সন্ধ্যায় নাস্তা খাওয়ার পর হলুদ ওষুধটি খেয়ে নেবেন।",
    milkReminder: "রাত ৮ টায় এক গ্লাস গরম দুধ খাবেন।",
    gamosaStory: "এটি একটি গামছা, আসামের ঐতিহ্যবাহী লাল-সাদা কাপড়। মনে আছে কি বৈশাখী উৎসবে এটি ব্যবহার করার কথা?",
    japiStory: "এটি একটি জাপি টুপি। বিহু নৃত্যে এটি পরা হয়।",
    teaStory: "এটি এক কাপ গরম চা। আসামের চা বাগানের কথা মনে পড়ে?",
    wordPrompt: "শুরু করতে বাঁদিকের একটি শব্দে ক্লিক করুন।",
    wordSuccess: "চমৎকার! মিলটি সঠিক হয়েছে।",
    rhythmIntro: "ঢোলের শব্দ শুনতে প্লে বোতামে ক্লিক করুন!",
    rhythmPass: "দারুণ! আপনি সঠিকভাবে বাজিয়েছেন!",
    rhythmFail: "আবার চেষ্টা করুন, প্লে বোতামে ক্লিক করুন।"
  },
  mz: {
    greeting: "Chibai, Pu-te!",
    orientation: "Vawiin hi Pathianni, August 23, 2026 a ni. Guwahati, Assam-a in in nuam takah i awm a ni. Pawn boruak chu a lum nuam tawk hle. Heta hian i him tawk a ni.",
    pillReminder: "Tlailian thingpui in hnuah damdawi hmawr bial kha ei rawh le.",
    milkReminder: "Zan dar 8:00 ah bawnghnute lum no khat i in dawn nia.",
    gamosaStory: "Hei hi Gamosa, Assam puan eng leh a sen inzial a ni. Kut hnathawh dawn a i hman thin kha i la hre em?",
    japiStory: "Hei hi Japi Lukhum a ni. Kut lam thin ho in an khum thin kha.",
    teaStory: "Hei hi thingpui lum thur a ni. Assam thingpui huan rimtui tak kha i la hre em?",
    wordPrompt: "Tan nan veilam a thu hi hmet hmasa rawh.",
    wordSuccess: "I ti thra lutuk, a dik e!",
    rhythmIntro: "Rhythm ngaihthlak nan PLAY hmet rawh le!",
    rhythmPass: "I ti thra hle mai! I vaw dik e!",
    rhythmFail: "Han tum leh chhin teh le."
  },
  kh: {
    greeting: "Khublei, Pa Rad!",
    orientation: "Mynta ka sngi ka long ka Sngi U Blei, August 23, 2026. Phi don ha la iing ha Guwahati, Assam. Ka suinbneng ka long kaba shongshngain. Phi don ha ka shongsuk shongsain hangne.",
    pillReminder: "Dih ia ka dawai stem hadien ba phi la dih sha.",
    milkReminder: "Dih ia ka dud kaba shu shit por 8:00 baje janmiet.",
    gamosaStory: "Kane ka dei ka Gamosa, ka jaiñ riam tynrai na Assam. Phi kynmaw ban riam ha ki por shad?",
    japiStory: "Kane ka dei ka Tupia Japi ba la shna da ki sla thri.",
    teaStory: "Kane ka dei ka sha kaba shit. Kynmaw phi la ioh ban bam sha ha ki kper sha?",
    wordPrompt: "Shon ia ka kyntien kaba don ha ka kamon ban sdang.",
    wordSuccess: "Lah biang! Iadei bad kaba pyniasoh.",
    rhythmIntro: "Shon PLAY ban sngap ia ka riew sing!",
    rhythmPass: "Bha palat! Phi la tem ryngkat bha!",
    rhythmFail: "Pyrshang pat seh."
  }
};

// 1. Text-to-Speech Helper (Calming, slow-paced voicing)
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  
  // Stop existing speech
  window.speechSynthesis.cancel();
  
  currentSpeechUtterance = new SpeechSynthesisUtterance(text);
  
  // Choose voice based on active language if possible
  const voices = window.speechSynthesis.getVoices();
  let matchedVoice = null;
  
  if (activeLanguage === 'as' || activeLanguage === 'bn') {
    matchedVoice = voices.find(v => v.lang.startsWith('bn') || v.lang.startsWith('in'));
  } else if (activeLanguage === 'en') {
    matchedVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en'));
  }
  
  if (matchedVoice) currentSpeechUtterance.voice = matchedVoice;
  
  // Slower rate for dementia understanding
  currentSpeechUtterance.rate = 0.78; 
  currentSpeechUtterance.pitch = 1.0; 
  
  window.speechSynthesis.speak(currentSpeechUtterance);
}

// Update UI orientation display based on language selection
function updateOrientationText() {
  const pack = LOCALIZATION[activeLanguage];
  
  document.getElementById('orient-greeting').innerText = pack.greeting;
  document.getElementById('orient-speech-text').innerText = pack.orientation;
  
  const remindersEl = document.getElementById('orient-reminders');
  remindersEl.innerHTML = `
    <li><span class="bullet-check green"></span> ${pack.pillReminder}</li>
    <li><span class="bullet-check blue"></span> ${pack.milkReminder}</li>
  `;
}

// 2. Calming Flute Audio Synthesizer (Ambient relaxation melody generator)
function playCalmingMelody() {
  if (ambientSynthIsPlaying) return;
  
  try {
    if (!ambientAudioContext) {
      ambientAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (ambientAudioContext.state === 'suspended') {
      ambientAudioContext.resume();
    }

    ambientSynthIsPlaying = true;
    document.getElementById('melody-player-box').classList.add('show');
    
    // A soft pentatonic scale suitable for relaxing flute sounds (C4, D4, E4, G4, A4, C5)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    let noteIndex = 0;
    
    // Generate soft flute note every 2.5 seconds
    ambientInterval = setInterval(() => {
      // Soft random walk on pentatonic scale notes
      const step = Math.random() > 0.5 ? 1 : -1;
      noteIndex = (noteIndex + step + scale.length) % scale.length;
      const freq = scale[noteIndex];
      
      synthesizeFluteTone(freq);
    }, 2500);

  } catch (err) {
    console.warn("Flute Synth failed", err);
  }
}

function stopCalmingMelody() {
  ambientSynthIsPlaying = false;
  document.getElementById('melody-player-box').classList.remove('show');
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
}

function synthesizeFluteTone(frequency) {
  if (!ambientAudioContext) return;
  
  const osc = ambientAudioContext.createOscillator();
  const gainNode = ambientAudioContext.createGain();
  
  osc.type = 'sine'; // Pure clean wave
  osc.frequency.setValueAtTime(frequency, ambientAudioContext.currentTime);
  
  // Flute envelope: slow attack, slow decay/release
  gainNode.gain.setValueAtTime(0, ambientAudioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, ambientAudioContext.currentTime + 0.6); // quiet volume
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ambientAudioContext.currentTime + 2.3);
  
  osc.connect(gainNode);
  gainNode.connect(ambientAudioContext.destination);
  
  osc.start();
  osc.stop(ambientAudioContext.currentTime + 2.4);
}

// Synthesize feedback beep for actions
function playFeedbackTone(isCorrect) {
  try {
    const actx = ambientAudioContext || new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gainNode = actx.createGain();
    
    osc.type = 'sine';
    
    if (isCorrect) {
      // High double beep
      osc.frequency.setValueAtTime(520, actx.currentTime);
      gainNode.gain.setValueAtTime(0, actx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, actx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.3);
    } else {
      // Low buzzer
      osc.frequency.setValueAtTime(180, actx.currentTime);
      gainNode.gain.setValueAtTime(0, actx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, actx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.4);
    }
    
    osc.connect(gainNode);
    gainNode.connect(actx.destination);
    
    osc.start();
    osc.stop(actx.currentTime + 0.5);
  } catch (e) {}
}

// 3. AI Object Recognizer Mock Tool
function triggerObjectRecognizer(itemKey) {
  const pack = LOCALIZATION[activeLanguage];
  let text = "";
  
  switch (itemKey) {
    case 'gamosa':
      text = pack.gamosaStory;
      break;
    case 'japi':
      text = pack.japiStory;
      break;
    case 'tea':
      text = pack.teaStory;
      break;
  }
  
  // Highlight avatar speech
  const speechBox = document.getElementById('orient-speech-text');
  speechBox.innerText = text;
  speechBox.style.borderColor = 'var(--primary-brand)';
  
  speakText(text);
}

// 4. GAME A: MEMORY CARD MATCH
function initCardMatchGame() {
  const gridEl = document.getElementById('match-game-grid');
  gridEl.innerHTML = '';
  
  matchedPairsCount = 0;
  selectedCards = [];
  cardGameStartTime = new Date();
  document.getElementById('match-pairs-count').innerText = "0 / 6";
  
  // Build doubled deck
  cardDeck = [...MATCH_CARDS_SOURCE, ...MATCH_CARDS_SOURCE]
    .map((card, index) => ({
      ...card,
      uniqueId: `card-${index}`,
      flipped: false,
      matched: false
    }));

  // Shuffle deck
  cardDeck.sort(() => Math.random() - 0.5);

  // Render cards
  cardDeck.forEach(card => {
    const slot = document.createElement('div');
    slot.className = 'match-card-slot';
    slot.id = card.uniqueId;
    
    slot.innerHTML = `
      <div class="card-face-front">
        <i class="fa-solid fa-star"></i>
      </div>
      <div class="card-face-back">
        <i class="${card.icon}"></i>
        <span class="card-card-name">${card.name.split(" ")[0]}</span>
      </div>
    `;
    
    slot.addEventListener('click', () => handleCardClick(card));
    gridEl.appendChild(slot);
  });
}

function handleCardClick(card) {
  const cardObj = cardDeck.find(c => c.uniqueId === card.uniqueId);
  if (!cardObj || cardObj.flipped || cardObj.matched || selectedCards.length >= 2) return;

  // Flip card
  cardObj.flipped = true;
  const el = document.getElementById(card.uniqueId);
  el.classList.add('flipped');
  
  selectedCards.push(cardObj);

  if (selectedCards.length === 2) {
    checkCardMatch();
  }
}

function checkCardMatch() {
  const [c1, c2] = selectedCards;

  if (c1.id === c2.id) {
    // Correct Match
    c1.matched = true;
    c2.matched = true;
    
    setTimeout(() => {
      document.getElementById(c1.uniqueId).classList.add('matched');
      document.getElementById(c2.uniqueId).classList.add('matched');
      
      playFeedbackTone(true);
      matchedPairsCount++;
      document.getElementById('match-pairs-count').innerText = `${matchedPairsCount} / 6`;
      
      // AI Verbal Reinforcement
      speakText(c1.voicePrompt);
      
      selectedCards = [];
      
      if (matchedPairsCount === 6) {
        handleGameACompletion();
      }
    }, 400);
  } else {
    // Mismatch
    setTimeout(() => {
      c1.flipped = false;
      c2.flipped = false;
      document.getElementById(c1.uniqueId).classList.remove('flipped');
      document.getElementById(c2.uniqueId).classList.remove('flipped');
      
      playFeedbackTone(false);
      selectedCards = [];
    }, 1200);
  }
}

function handleGameACompletion() {
  const durationSec = Math.round((new Date() - cardGameStartTime) / 1000);
  // Log telemetry score
  const successMsg = `Congratulations! You found all pairs in ${durationSec} seconds. You did beautifully!`;
  speakText(successMsg);
  
  // Log performance points to caregiver analytics
  CAREGIVER_ANALYTICS.weekly_accuracy.matchAccuracyPercentage.push(100);
  CAREGIVER_ANALYTICS.weekly_cognitive_speed.avgReactionSeconds.push(durationSec);
}

// 5. GAME B: WORD LINKER
function initWordLinkerGame() {
  const leftCol = document.getElementById('word-left-column');
  const rightCol = document.getElementById('word-right-column');
  
  leftCol.innerHTML = '';
  rightCol.innerHTML = '';
  
  selectedWordLeft = null;
  matchedWordLinks = [];
  document.getElementById('word-linker-status').innerText = LOCALIZATION[activeLanguage].wordPrompt;

  // Shuffle left and right arrays independently
  const leftWords = WORD_PAIRS.map(w => ({ text: w.left, matches: w.matches }));
  const rightWords = WORD_PAIRS.map(w => ({ text: w.right, matches: w.matches }));
  
  leftWords.sort(() => Math.random() - 0.5);
  rightWords.sort(() => Math.random() - 0.5);

  // Render left col
  leftWords.forEach(w => {
    const btn = document.createElement('button');
    btn.className = 'btn-word-item';
    btn.innerText = w.text;
    btn.dataset.match = w.matches;
    btn.addEventListener('click', () => handleLeftWordSelect(btn));
    leftCol.appendChild(btn);
  });

  // Render right col
  rightWords.forEach(w => {
    const btn = document.createElement('button');
    btn.className = 'btn-word-item';
    btn.innerText = w.text;
    btn.dataset.match = w.matches;
    btn.addEventListener('click', () => handleRightWordSelect(btn));
    rightCol.appendChild(btn);
  });
}

function handleLeftWordSelect(btn) {
  if (btn.classList.contains('correct') || matchedWordLinks.includes(btn.dataset.match)) return;

  // Clear previous selections
  document.querySelectorAll('#word-left-column .btn-word-item').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedWordLeft = btn;
}

function handleRightWordSelect(btn) {
  if (!selectedWordLeft || btn.classList.contains('correct')) return;

  if (selectedWordLeft.dataset.match === btn.dataset.match) {
    // Correct link
    const key = btn.dataset.match;
    selectedWordLeft.classList.remove('selected');
    selectedWordLeft.classList.add('correct');
    btn.classList.add('correct');
    
    playFeedbackTone(true);
    matchedWordLinks.push(key);
    
    // Voice read aloud
    const phrase = `${selectedWordLeft.innerText} connects with ${btn.innerText}.`;
    document.getElementById('word-linker-status').innerText = LOCALIZATION[activeLanguage].wordSuccess;
    speakText(phrase);
    
    selectedWordLeft = null;
    
    if (matchedWordLinks.length === 6) {
      setTimeout(() => {
        speakText("Wonderful! You completed the word linker puzzle successfully.");
      }, 1000);
    }
  } else {
    // Mismatch
    btn.classList.add('incorrect');
    playFeedbackTone(false);
    
    setTimeout(() => {
      btn.classList.remove('incorrect');
    }, 600);
  }
}

// 6. GAME C: DRUM BEAT RHYTHM REPEAT
function loadRhythm(rhythmId) {
  activeRhythm = RHYTHM_TEMPLATES.find(r => r.id === rhythmId);
  inputSequence = [];
  document.getElementById('rhythm-score-status').innerText = LOCALIZATION[activeLanguage].rhythmIntro;
  
  // Highlight active selector button
  document.querySelectorAll('.btn-rhythm-load').forEach(b => {
    if (b.dataset.rhythm === rhythmId) b.classList.add('active');
    else b.classList.remove('active');
  });
}

function playRhythmBeats() {
  if (drumPlaybackTimeout) return;
  
  inputSequence = [];
  document.getElementById('rhythm-score-status').innerText = "Listen closely...";
  
  let delay = 0;
  activeRhythm.notes.forEach((color, i) => {
    drumPlaybackTimeout = setTimeout(() => {
      flashAndPlayDrum(color, activeRhythm.frequencies[i]);
      if (i === activeRhythm.notes.length - 1) {
        drumPlaybackTimeout = null;
        document.getElementById('rhythm-score-status').innerText = "Your turn! Repeat the beats.";
      }
    }, delay);
    delay += 900; // slow interval
  });
}

function flashAndPlayDrum(color, frequency) {
  const drumEl = document.getElementById(`drum-${color}`);
  drumEl.classList.add('active');
  
  // Synthesize drum frequency sound
  try {
    const actx = ambientAudioContext || new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gainNode = actx.createGain();
    
    osc.type = 'triangle'; // warmer than sine for drums
    osc.frequency.setValueAtTime(frequency, actx.currentTime);
    
    gainNode.gain.setValueAtTime(0, actx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, actx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(actx.destination);
    
    osc.start();
    osc.stop(actx.currentTime + 0.5);
  } catch(e) {}

  setTimeout(() => {
    drumEl.classList.remove('active');
  }, 350);
}

function handleDrumClick(color) {
  // Grab frequencies mapping
  const noteIdx = ['red', 'yellow', 'green', 'blue'].indexOf(color);
  const freq = [220, 293, 330, 440][noteIdx]; // generic pitches
  
  flashAndPlayDrum(color, freq);
  
  // If waiting for patient input sequence
  inputSequence.push(color);
  
  const stepIdx = inputSequence.length - 1;
  const expectedColor = activeRhythm.notes[stepIdx];
  
  if (color !== expectedColor) {
    // Mismatch in sequence
    document.getElementById('rhythm-score-status').innerText = LOCALIZATION[activeLanguage].rhythmFail;
    playFeedbackTone(false);
    inputSequence = [];
  } else if (inputSequence.length === activeRhythm.notes.length) {
    // Success sequence complete
    document.getElementById('rhythm-score-status').innerText = LOCALIZATION[activeLanguage].rhythmPass;
    setTimeout(() => {
      playFeedbackTone(true);
      speakText("Wonderful rhythm matching! You have a great memory for music.");
    }, 400);
    inputSequence = [];
  }
}

// 7. REMINISCENCE VAULT SLIDESHOW
function updateVaultSlide() {
  const slide = REMINISCENCE_ALBUM[currentSlideIndex];
  const box = document.getElementById('vault-slide-box');
  
  box.innerHTML = `
    <div class="vault-img-placeholder" style="background-color: ${slide.bgColor};">
      <i class="${slide.icon}"></i>
    </div>
    <div class="vault-details">
      <span class="vault-relation">${slide.relation} (${slide.year})</span>
      <h3 class="vault-title">${slide.title}</h3>
      <span class="vault-location"><i class="fa-solid fa-location-dot"></i> ${slide.location}</span>
      <p class="vault-desc">${slide.description}</p>
    </div>
  `;
}

function speakCurrentVaultStory() {
  const slide = REMINISCENCE_ALBUM[currentSlideIndex];
  speakText(slide.voiceOver);
}

// 8. CAREGIVER LOG HISTORY & SUBMIT
function renderCaregiverLogs() {
  const tbody = document.getElementById('cg-log-table-body');
  tbody.innerHTML = '';
  
  caregiverLogs.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600; white-space:nowrap;">${log.timestamp}</td>
      <td style="font-weight:600; color:var(--primary-brand);">${log.caregiverId}</td>
      <td style="color:var(--accent-green); font-weight:600;">${log.pills}</td>
      <td><span class="risk-badge risk-${log.mood.toLowerCase()}">${log.mood}</span></td>
      <td style="color:var(--text-muted); font-size:12px;">${log.notes}</td>
    `;
    tbody.appendChild(tr);
  });
}

function submitCaregiverJournal(e) {
  e.preventDefault();
  
  const pillsChecked = [];
  if (document.getElementById('pill-morning').checked) pillsChecked.push("Morning (Done)");
  if (document.getElementById('pill-afternoon').checked) pillsChecked.push("Afternoon (Done)");
  if (document.getElementById('pill-evening').checked) pillsChecked.push("Evening (Done)");
  
  const pillsStr = pillsChecked.length > 0 ? pillsChecked.join(", ") : "None Taken";
  const moodVal = document.querySelector('input[name="mood-select"]:checked').value;
  const notesText = document.getElementById('cg-journal-notes').value || "Routine log check. No unusual symptoms reported.";
  
  const now = new Date();
  const timestampStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const newLog = {
    timestamp: timestampStr,
    caregiverId: "CG-101 (Care Giver)",
    pills: pillsStr,
    mood: moodVal,
    notes: notesText
  };
  
  caregiverLogs.unshift(newLog);
  renderCaregiverLogs();
  
  // Clear textarea
  document.getElementById('cg-journal-notes').value = '';
  
  // Add dialog notice
  alert("Caregiver log committed to database successfully!");
}

// 9. CAREGIVER PROGRESSION TREND CHARTS
let speedChart = null;
let accuracyChart = null;

function renderCaregiverCharts() {
  if (speedChart && accuracyChart) return; // already rendered
  
  const speedCtx = document.getElementById('chart-cg-speed').getContext('2d');
  speedChart = new Chart(speedCtx, {
    type: 'line',
    data: {
      labels: CAREGIVER_ANALYTICS.weekly_cognitive_speed.labels,
      datasets: [{
        label: 'Reaction Delay (Sec)',
        data: CAREGIVER_ANALYTICS.weekly_cognitive_speed.avgReactionSeconds,
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.08)',
        fill: true,
        borderWidth: 3,
        pointRadius: 4,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#57534e', font: { size: 9 } } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#57534e', font: { size: 9 } } }
      }
    }
  });

  const accuracyCtx = document.getElementById('chart-cg-accuracy').getContext('2d');
  accuracyChart = new Chart(accuracyCtx, {
    type: 'bar',
    data: {
      labels: CAREGIVER_ANALYTICS.weekly_accuracy.labels,
      datasets: [{
        label: 'Accuracy Rate (%)',
        data: CAREGIVER_ANALYTICS.weekly_accuracy.matchAccuracyPercentage,
        backgroundColor: 'rgba(194, 65, 12, 0.7)',
        borderColor: '#c2410c',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#57534e', font: { size: 9 } } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#57534e', font: { size: 9 } }, max: 100 }
      }
    }
  });
}

// 10. Master Setup & Event Listeners
function initUIEvents() {
  
  // Soothing Music toggle
  const btnMusic = document.getElementById('btn-ambient-music');
  btnMusic.addEventListener('click', () => {
    if (ambientSynthIsPlaying) {
      stopCalmingMelody();
      btnMusic.classList.add('muted');
      btnMusic.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Music Muted';
    } else {
      playCalmingMelody();
      btnMusic.classList.remove('muted');
      btnMusic.innerHTML = '<i class="fa-solid fa-volume-high"></i> Soothing Flute';
    }
  });

  // Language Dropdown selector
  const langSelect = document.getElementById('lang-select');
  langSelect.addEventListener('change', (e) => {
    activeLanguage = e.target.value;
    updateOrientationText();
    initWordLinkerGame();
    loadRhythm(activeRhythm.id);
  });

  // Portal Toggle Patient/Caregiver View
  const btnTogglePortal = document.getElementById('btn-toggle-portal');
  btnTogglePortal.addEventListener('click', () => {
    if (currentPortal === 'patient') {
      currentPortal = 'caregiver';
      btnTogglePortal.innerHTML = '<i class="fa-solid fa-house-user"></i> Patient Mode';
      btnTogglePortal.classList.add('active');
      document.getElementById('patient-section').classList.add('hidden');
      document.getElementById('caregiver-section').classList.remove('hidden');
      
      // Trigger charts render
      renderCaregiverCharts();
    } else {
      currentPortal = 'patient';
      btnTogglePortal.innerHTML = '<i class="fa-solid fa-user-gear"></i> Caregiver Mode';
      btnTogglePortal.classList.remove('active');
      document.getElementById('patient-section').classList.remove('hidden');
      document.getElementById('caregiver-section').classList.add('hidden');
    }
  });

  // Audio Speech Synthesis Trigger
  document.getElementById('btn-speak-orientation').addEventListener('click', () => {
    const text = document.getElementById('orient-speech-text').innerText;
    speakText(text);
  });

  // AI Object Recognizer selection triggers
  document.querySelectorAll('.btn-scan-item').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerObjectRecognizer(btn.dataset.item);
    });
  });

  // Game card matches events
  document.getElementById('btn-reset-match-game').addEventListener('click', initCardMatchGame);
  document.getElementById('btn-reset-word-game').addEventListener('click', initWordLinkerGame);

  // Traditional drum beat triggers
  document.getElementById('btn-play-rhythm').addEventListener('click', playRhythmBeats);
  document.querySelectorAll('.btn-rhythm-load').forEach(btn => {
    btn.addEventListener('click', () => {
      loadRhythm(btn.dataset.rhythm);
    });
  });

  document.querySelectorAll('.drum').forEach(drum => {
    drum.addEventListener('click', () => {
      handleDrumClick(drum.dataset.color);
    });
  });

  // Memory slideshow transitions
  document.getElementById('btn-vault-prev').addEventListener('click', () => {
    currentSlideIndex = (currentSlideIndex - 1 + REMINISCENCE_ALBUM.length) % REMINISCENCE_ALBUM.length;
    updateVaultSlide();
  });
  document.getElementById('btn-vault-next').addEventListener('click', () => {
    currentSlideIndex = (currentSlideIndex + 1) % REMINISCENCE_ALBUM.length;
    updateVaultSlide();
  });
  
  document.getElementById('btn-speak-vault').addEventListener('click', speakCurrentVaultStory);

  // Caregiver Submit Form
  document.getElementById('caregiver-journal-form').addEventListener('submit', submitCaregiverJournal);
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  initUIEvents();
  updateOrientationText();
  initCardMatchGame();
  initWordLinkerGame();
  loadRhythm('rhythm-dhol');
  updateVaultSlide();
  renderCaregiverLogs();
  
  // Warm voice welcome
  setTimeout(() => {
    speakText("Welcome back, Grandfather. Let us practice our exercises today!");
  }, 1000);
});
