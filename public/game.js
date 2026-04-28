const app = document.getElementById('app');
const toast = document.getElementById('toast');
const startupLoader = document.getElementById('startup-loader');
const mobileWidthLimit = 768;
const mainIconPath = '/image/buttons/main/';
const washIconPath = '/image/buttons/wash/';
const tvIconPath = '/image/buttons/TV/';
const eatIconPath = '/image/buttons/eat/';
const marketIconPath = '/image/buttons/market/';
const ramenRequiredOrder = ['water', 'spice', 'mayo'];

function createRamenStock() {
  return { water: -1, spice: 5, mayo: 1, veg: 4, soy: 2, salt: 3 };
}

function createDefaultRamenState() {
  return { step: 1, tasty: 68, spice: 50, happy: 40, used: [], stock: createRamenStock(), infusing: false };
}

function createDefaultProgress() {
  return {
    washActions: 0,
    washWins: 0,
    shopPurchases: 0,
    coinsSpent: 0,
    tvUpgrades: 0,
    tvChecksSuccess: 0,
    tvSpraysUsed: 0,
    ramenCooked: 0,
    ingredientsAdded: 0,
    moodActions: 0,
    moodPositiveActions: 0,
    bonusWins: 0
  };
}

function createDefaultAchievementsState() {
  return { claimed: {} };
}

function createDefaultSettingsState() {
  return { musicEnabled: true, soundsEnabled: true, musicVolume: 26, soundVolume: 48, sfxVolume: 42 };
}

const defaultState = {
  screen: 'home', coins: 1670, beer: 2, noodles: 4, tvChips: 0, money: 0, currencyModel: 'usd1',
  dead: false,
  mood: 56, clean: 23, sleep: 72, washClean: 0, foam: 0, signal: 42,
  tools: { shampoo: 12, sponge: 7, shower: -1, towel: 5 },
  tv: { antenna: 1, amp: 1, cap: 1, wires: 1, spray: 3 },
  ramen: createDefaultRamenState(),
  progress: createDefaultProgress(),
  achievements: createDefaultAchievementsState(),
  settings: createDefaultSettingsState()
};

let state = loadState();
let selectedTool = 'shower';
let desktopBlocked = false;
let washStroke = null;
let transitionBusy = false;
let animateNextScene = false;
let washFoamStrokes = [];
let ramenInfuseTimer = null;
let moneyRouletteOpen = false;
let moneyRouletteSpinning = false;
let moneyRouletteResult = '';
let moneyRouletteReward = 0;
let moneyRouletteTimer = null;
let settingsOpen = false;
let settingsClosing = false;
let settingsCloseTimer = null;
let moneyRouletteClosing = false;
let bonusCloseTimer = null;
let giftScore = 0;
let giftGameRunning = false;
let giftGameTimer = null;
let giftFallingItems = [];
let giftPlayerX = 50;
let giftGameRendering = false;
let giftDragging = false;
let giftDragOffsetX = 0;

const musicPlaylist = [
  'Бутырка - 085-Бутырка-Шарик.mp3',
  'Бутырка - Раённый прокурор.mp3',
  'Бутырка-А для вас я никто.mp3',
  'Кольщик.mp3'
];
const ambientTrackByScreen = {
  tv: '/sound/interference-low-sharp.mp3',
  wash: '/sound/wish.mp3',
  ramen: '/sound/0002603.mp3',
  shop: '/sound/jg-032316-sfx-grocery-store-ambiance.mp3'
};
const clickSoundPath = '/sound/cartoon-bubble-pop-01-.mp3';
const musicPlayer = new Audio();
const ambientPlayer = new Audio();
const clickSoundTemplate = new Audio(clickSoundPath);
let audioReady = false;
let currentTrackIndex = 0;
let activeAmbientTrack = '';

const FADE_DURATION = 800;
const FADE_STEPS = 20;

musicPlayer.preload = 'auto';
musicPlayer.addEventListener('ended', () => {
  if (!musicPlaylist.length) return;
  currentTrackIndex = (currentTrackIndex + 1) % musicPlaylist.length;
  musicPlayer.src = trackUrlByIndex(currentTrackIndex);
  fadeInMusic(() => musicPlayer.play().catch(() => {}));
});
ambientPlayer.preload = 'auto';
ambientPlayer.loop = true;
clickSoundTemplate.preload = 'auto';

const achievementCategories = [
  { id: 'wash', title: 'МОЙКА' },
  { id: 'tv', title: 'ТЕЛЕВИЗОР' },
  { id: 'life', title: 'БЫТ И ЕДА' }
];

const dedPhraseCore = [
  'Щас как дам по телевизору, и он начнет показывать.',
  'Кто рано встает, тот раньше всех ворчит.',
  'Не умничай, у меня еще диплом ПТУ в серванте.',
  'Я в твоем возрасте уже три раза на картошке был.',
  'Сделай тише, у меня новости в голове не помещаются.',
  'Шапку надень, сквозняк кость продувает.',
  'Интернет твой - это когда провод в ведро вставили?',
  'Не трогай пульт, он у меня к руке приучен.',
  'Жизнь тебя научит, а я закреплю материал.',
  'Чай без сахара - это не чай, а недоразумение.',
  'Суп без хлеба - это гарнир, а не обед.',
  'Я не злой, я просто советский стандарт.',
  'В наше время кнопки нажимали с уважением.',
  'Холодильник открываешь - закрой мысль за собой.',
  'Сиди ровно, а то мысли в штанину уйдут.',
  'Сначала работа, потом ворчание по расписанию.',
  'Эх, молодежь, у вас даже лень с вайфаем.',
  'Я не спорю, я объясняю как правильно.',
  'Без дела сидишь - батарейку из стула вынь.',
  'Тарелку домыл? Или это художественная грязь?',
  'В квартире не холодно, это характер закаляется.',
  'Не хлопай дверью, она не виновата.',
  'Поел - скажи спасибо, не поел - тоже скажи.',
  'Не зевай, а то удача мимо кассы пройдет.',
  'Кто выключил свет? Экономист нашелся.',
  'Не тяни кота за антенну.',
  'Слово дал - держи, не можешь держать - не тряси.',
  'Смотри под ноги, там твое будущее в тапках.',
  'Я тебя не пугаю, я предупреждаю заранее.',
  'Гречка сама себя не похвалит, а я похвалю.',
  'Хорош болтать, чай остывает.',
  'Порядок в доме - это когда дед доволен.',
  'Не нервируй меня, у меня давление с фантазией.',
  'Сначала думай, потом включай смекалку.',
  'Куда пошел в носках? Пол же не коврик.',
  'Я видел будущее, там ты убираешься.',
  'Не делай вид, что не слышал, я повторю громче.',
  'Уважай старших, они помнят проводной телефон.',
  'Сидишь в телефоне - зарядку с собой носи вежливо.',
  'Дом без табуретки - как суп без соли.',
  'Ложку в раковину клади тихо, не на сцене.',
  'Кот умнее некоторых, он хотя бы молчит вовремя.',
  'Не бегай по квартире, тут не олимпийский резерв.',
  'В магазин иди списком, а не эмоциями.',
  'Дед сказал - дед передумал, это тоже план.',
  'Не сутулься, а то мысли сыпятся.',
  'Пельмени не считаются овощами, даже если в морозилке.',
  'Тапки ищи глазами, а не судьбой.',
  'Не кипишуй, у нас кипит только чайник.',
  'Хочешь умничать - сначала мусор вынеси.'
];

const dedPhraseOpeners = [
  'Ты слушай деда',
  'Запомни раз и навсегда',
  'В советской школе говорили',
  'На заводе так не делали',
  'Во дворе за такое смеялись',
  'Дома порядок держится на одном',
  'Нормальный человек знает',
  'Пока дед жив, помни',
  'Сосед Петрович подтвердит',
  'Если по уму делать',
  'Сначала по-человечески',
  'Не спорь, а усвой',
  'Кто с утра ленится',
  'Опытные люди повторяют'
];

const dedPhraseEndings = [
  'без тапок дисциплины не бывает',
  'чайник свистит не просто так',
  'пульт любит уверенную руку',
  'гречка уважает терпеливых',
  'шум в доме рождает суету',
  'работу видно по раковине',
  'порядок начинается с табуретки',
  'кто ноет - тот моет посуду',
  'сахар в чае лишним не бывает',
  'сначала дело, потом философия'
];

const dedPhrases = [...dedPhraseCore];
for (const opener of dedPhraseOpeners) {
  for (const ending of dedPhraseEndings) {
    if (dedPhrases.length >= 120) break;
    dedPhrases.push(`${opener}: ${ending}.`);
  }
  if (dedPhrases.length >= 120) break;
}

const washToolRewardNames = {
  shampoo: 'Шампунь',
  sponge: 'Мочалка',
  shower: 'Душ',
  towel: 'Полотенце'
};

const tvPartRewardNames = {
  antenna: 'Антенна',
  amp: 'Усилитель',
  cap: 'Конденсатор',
  wires: 'Провода',
  spray: 'Спрей'
};

const ramenStockRewardNames = {
  water: 'Кипяток',
  spice: 'Приправа',
  mayo: 'Китайский мазик',
  veg: 'Сушеные овощи',
  soy: 'Соевый соус',
  salt: 'Дедовская соль'
};

const achievementsCatalog = [
  {
    id: 'wash-start',
    category: 'wash',
    title: 'ПЕННЫЙ СТАРТ',
    description: 'Сделай 15 действий в мойке.',
    goal: 15,
    metric: (currentState) => currentState.progress.washActions,
    reward: { coins: 70, tools: { shampoo: 2 } }
  },
  {
    id: 'wash-clean-win',
    category: 'wash',
    title: 'ЧИСТЮЛЯ',
    description: 'Полностью отмой деда 1 раз.',
    goal: 1,
    metric: (currentState) => currentState.progress.washWins,
    reward: { coins: 120, tools: { sponge: 2 } }
  },
  {
    id: 'wash-clean-rating',
    category: 'wash',
    title: 'БЛЕСК КОЖИ',
    description: 'Подними показатель чистоты до 70%.',
    goal: 70,
    metric: (currentState) => clamp(currentState.clean),
    reward: { coins: 110, tools: { towel: 2 } }
  },
  {
    id: 'wash-marathon',
    category: 'wash',
    title: 'МОЕЧНЫЙ МАРАФОН',
    description: 'Сделай 80 действий в мойке.',
    goal: 80,
    metric: (currentState) => currentState.progress.washActions,
    reward: { coins: 170, tvChips: 2 }
  },
  {
    id: 'wash-veteran',
    category: 'wash',
    title: 'ВЕТЕРАН БАНИ',
    description: 'Полностью отмой деда 5 раз.',
    goal: 5,
    metric: (currentState) => currentState.progress.washWins,
    reward: { coins: 260, tvChips: 3, tools: { towel: 3 } }
  },
  {
    id: 'tv-first',
    category: 'tv',
    title: 'ПЕРВЫЙ МАСТЕР',
    description: 'Сделай первое улучшение ТВ.',
    goal: 1,
    metric: (currentState) => currentState.progress.tvUpgrades,
    reward: { coins: 80, tvChips: 2 }
  },
  {
    id: 'tv-engineer',
    category: 'tv',
    title: 'ТЕЛЕИНЖЕНЕР',
    description: 'Сделай 8 улучшений ТВ.',
    goal: 8,
    metric: (currentState) => currentState.progress.tvUpgrades,
    reward: { coins: 220, tvChips: 6 }
  },
  {
    id: 'tv-channel',
    category: 'tv',
    title: 'ОХОТНИК ЗА КАНАЛАМИ',
    description: 'Успешно проверь каналы 3 раза.',
    goal: 3,
    metric: (currentState) => currentState.progress.tvChecksSuccess,
    reward: { coins: 180, tv: { spray: 2 } }
  },
  {
    id: 'tv-max-signal',
    category: 'tv',
    title: 'СИГНАЛ 100%',
    description: 'Доведи качество сигнала до 100%.',
    goal: 100,
    metric: (currentState) => clamp(currentState.signal),
    reward: { coins: 260, tvChips: 4 }
  },
  {
    id: 'tv-spray-king',
    category: 'tv',
    title: 'КОНТАКТ-МАНЬЯК',
    description: 'Используй спрей 5 раз.',
    goal: 5,
    metric: (currentState) => currentState.progress.tvSpraysUsed,
    reward: { coins: 140, tvChips: 3 }
  },
  {
    id: 'life-shopper',
    category: 'life',
    title: 'ХОЗЯИН ПАКЕТА',
    description: 'Купи 3 товара в магазине.',
    goal: 3,
    metric: (currentState) => currentState.progress.shopPurchases,
    reward: { coins: 90, noodles: 1, beer: 1 }
  },
  {
    id: 'life-spender',
    category: 'life',
    title: 'ЩЕДРЫЙ КОШЕЛЕК',
    description: 'Потрать 1200$ в магазине и ТВ.',
    goal: 1200,
    metric: (currentState) => currentState.progress.coinsSpent,
    reward: { coins: 170, tvChips: 4, noodles: 1 }
  },
  {
    id: 'life-chef',
    category: 'life',
    title: 'ПОВАР-ПЕРВОРАЗНИК',
    description: 'Приготовь доширак 1 раз.',
    goal: 1,
    metric: (currentState) => currentState.progress.ramenCooked,
    reward: { coins: 150, ramenStock: { spice: 2, veg: 2, soy: 1 } }
  },
  {
    id: 'life-chef-master',
    category: 'life',
    title: 'ПОВАР ДЕДА',
    description: 'Приготовь доширак 5 раз.',
    goal: 5,
    metric: (currentState) => currentState.progress.ramenCooked,
    reward: { coins: 260, noodles: 2, beer: 1 }
  },
  {
    id: 'life-mood',
    category: 'life',
    title: 'ПОДНЯЛ НАСТРОЙ',
    description: '10 раз улучши настроение деда.',
    goal: 10,
    metric: (currentState) => currentState.progress.moodPositiveActions,
    reward: { coins: 190, tools: { shampoo: 1, sponge: 1 }, noodles: 1 }
  }
];

const washToolFlow = {
  shampoo: { interval: 105 },
  sponge: { interval: 115 },
  shower: { interval: 80 },
  towel: { interval: 105 }
};

function loadState() {
  const freshState = structuredClone(defaultState);
  try {
    const storedState = JSON.parse(localStorage.getItem('myt-deda-state') || '{}');
    const merged = {
      ...freshState,
      ...storedState,
      tools: { ...freshState.tools, ...(storedState.tools || {}) },
      tv: { ...freshState.tv, ...(storedState.tv || {}) },
      progress: { ...freshState.progress, ...(storedState.progress || {}) },
      settings: { ...freshState.settings, ...(storedState.settings || {}) },
      achievements: {
        ...freshState.achievements,
        ...(storedState.achievements || {}),
        claimed: {
          ...freshState.achievements.claimed,
          ...((storedState.achievements && storedState.achievements.claimed) || {})
        }
      },
      ramen: {
        ...freshState.ramen,
        ...(storedState.ramen || {}),
        stock: {
          ...freshState.ramen.stock,
          ...((storedState.ramen && storedState.ramen.stock) || {})
        }
      }
    };
    merged.ramen.step = Math.max(1, Math.min(6, Number(merged.ramen.step) || 1));
    merged.ramen.used = Array.isArray(merged.ramen.used) ? merged.ramen.used : [];
    merged.ramen.infusing = false;
    Object.keys(freshState.progress).forEach((key) => {
      merged.progress[key] = Math.max(0, Number(merged.progress[key]) || 0);
    });
    merged.achievements.claimed = Object.entries(merged.achievements.claimed || {}).reduce((acc, [id, value]) => {
      if (value) acc[id] = true;
      return acc;
    }, {});
    merged.tvChips = Math.max(0, Number(merged.tvChips) || 0);
    merged.settings.musicEnabled = Boolean(merged.settings.musicEnabled);
    merged.settings.soundsEnabled = Boolean(merged.settings.soundsEnabled);
    merged.settings.musicVolume = clamp(Number(merged.settings.musicVolume) || 0, 0, 100);
    merged.settings.soundVolume = clamp(Number(merged.settings.soundVolume ?? merged.settings.sfxVolume) || 0, 0, 100);
    merged.settings.sfxVolume = clamp(Number(merged.settings.sfxVolume ?? merged.settings.soundVolume) || 0, 0, 100);
    merged.dead = Boolean(merged.dead) || clamp(merged.mood) <= 0;
    if (merged.dead) merged.mood = 0;
    if (merged.currencyModel !== 'usd1') {
      const legacyMoney = Number(merged.money) || 0;
      if (legacyMoney > 0) merged.coins = Math.max(0, Number(merged.coins) || 0) + legacyMoney;
      merged.currencyModel = 'usd1';
    }
    merged.money = 0;
    return merged;
  } catch {
    return freshState;
  }
}

function save() {
  localStorage.setItem('myt-deda-state', JSON.stringify(state));
}

function settingsState() {
  if (!state.settings) state.settings = createDefaultSettingsState();
  return state.settings;
}

function trackUrlByIndex(index) {
  const file = musicPlaylist[index % musicPlaylist.length];
  return `/mp3deda/${encodeURIComponent(file)}`;
}

function currentSfxVolumeValue() {
  const settings = settingsState();
  return clamp(Number(settings.sfxVolume ?? settings.soundVolume) || 0, 0, 100);
}

function screenAmbientTrack(screen) {
  return ambientTrackByScreen[screen] || '';
}

function updateAmbientAudio(forceTrackUpdate = false) {
  const settings = settingsState();
  const nextTrack = settings.soundsEnabled ? screenAmbientTrack(state.screen) : '';
  if (!audioReady || !nextTrack) {
    if (!ambientPlayer.paused) fadeOutAmbient();
    activeAmbientTrack = '';
    return;
  }
  const shouldChangeTrack = forceTrackUpdate || activeAmbientTrack !== nextTrack;
  if (shouldChangeTrack) {
    const wasPlaying = !ambientPlayer.paused;
    if (wasPlaying) {
      fadeOutAmbient(() => {
        activeAmbientTrack = nextTrack;
        ambientPlayer.src = nextTrack;
        ambientPlayer.currentTime = 0;
        fadeInAmbient(() => ambientPlayer.play().catch(() => {}));
      });
    } else {
      activeAmbientTrack = nextTrack;
      ambientPlayer.src = nextTrack;
      ambientPlayer.currentTime = 0;
      fadeInAmbient(() => ambientPlayer.play().catch(() => {}));
    }
    return;
  }
  if (ambientPlayer.paused) {
    fadeInAmbient(() => ambientPlayer.play().catch(() => {}));
  }
}

function applyAudioSettings() {
  const settings = settingsState();
  if (!settings.musicEnabled) {
    if (!musicPlayer.paused) fadeOutMusic();
  } else if (audioReady && musicPlayer.paused) {
    playBackgroundTrack();
  }
  updateAmbientAudio();
}

function playBackgroundTrack() {
  const settings = settingsState();
  if (!audioReady || !settings.musicEnabled || !musicPlaylist.length) return;
  musicPlayer.src = trackUrlByIndex(currentTrackIndex);
  fadeInMusic(() => musicPlayer.play().catch(() => {}));
}

function ensureAudioReady() {
  if (audioReady) return;
  audioReady = true;
  applyAudioSettings();
  playBackgroundTrack();
}

function fadeAudio(audioElement, targetVolume, duration = FADE_DURATION, onComplete = null, fadeIntervalVar = null) {
  const stepDuration = duration / FADE_STEPS;
  const currentVolume = audioElement.volume || 0;
  const volumeStep = (targetVolume - currentVolume) / FADE_STEPS;
  let stepCount = 0;
  if (fadeIntervalVar !== null) {
    if (window[fadeIntervalVar]) clearInterval(window[fadeIntervalVar]);
    window[fadeIntervalVar] = setInterval(() => {
      stepCount += 1;
      if (stepCount >= FADE_STEPS) {
        clearInterval(window[fadeIntervalVar]);
        window[fadeIntervalVar] = null;
        audioElement.volume = targetVolume;
        if (onComplete) onComplete();
        return;
      }
      audioElement.volume = Math.max(0, Math.min(1, currentVolume + volumeStep * stepCount));
    }, stepDuration);
  } else {
    const interval = setInterval(() => {
      stepCount += 1;
      if (stepCount >= FADE_STEPS) {
        clearInterval(interval);
        audioElement.volume = targetVolume;
        if (onComplete) onComplete();
        return;
      }
      audioElement.volume = Math.max(0, Math.min(1, currentVolume + volumeStep * stepCount));
    }, stepDuration);
  }
}

function fadeOutMusic(onComplete = null) {
  fadeAudio(musicPlayer, 0, FADE_DURATION, () => {
    musicPlayer.pause();
    musicPlayer.currentTime = 0;
    if (onComplete) onComplete();
  }, null);
}

function fadeInMusic(onComplete = null) {
  const settings = settingsState();
  const targetVolume = clamp(settings.musicVolume, 0, 100) / 100;
  fadeAudio(musicPlayer, targetVolume, FADE_DURATION, onComplete);
}

function fadeOutAmbient(onComplete = null) {
  fadeAudio(ambientPlayer, 0, FADE_DURATION, () => {
    ambientPlayer.pause();
    ambientPlayer.currentTime = 0;
    if (onComplete) onComplete();
  }, null);
}

function fadeInAmbient(onComplete = null) {
  const settings = settingsState();
  const targetVolume = (currentSfxVolumeValue() / 100) * 0.32;
  fadeAudio(ambientPlayer, targetVolume, FADE_DURATION, onComplete);
}

function playButtonSound() {
  const settings = settingsState();
  if (!settings.soundsEnabled) return;
  const click = clickSoundTemplate.cloneNode();
  click.volume = 0;
  click.play().then(() => {
    fadeAudio(click, currentSfxVolumeValue() / 100, 100, () => {
      setTimeout(() => {
        fadeAudio(click, 0, 80, () => click.remove());
      }, 120);
    });
  }).catch(() => {});
}

function handleGlobalButtonAudio(event) {
  const button = event.target.closest('button');
  if (!button || !app.contains(button)) return;
  ensureAudioReady();
  playButtonSound();
}

function settingsModal() {
  if (!settingsOpen && !settingsClosing) return '';
  const settings = settingsState();
  const sfxVolume = currentSfxVolumeValue();
  return `<div class="settings-modal ${settingsClosing ? 'hide' : 'show'}" aria-label="Настройки игры">
    <button class="settings-modal__backdrop" data-settings-close aria-label="Закрыть"></button>
    <div class="settings-modal__panel panel">
      <h3 class="settings-modal__title">НАСТРОЙКИ</h3>
      <div class="settings-modal__grid">
        <button class="btn ${settings.musicEnabled ? 'green' : 'dark'} settings-toggle" data-settings-toggle="music">МУЗЫКА: ${settings.musicEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button>
        <label class="settings-slider"><span>ГРОМКОСТЬ МУЗЫКИ ${settings.musicVolume}%</span><input type="range" min="0" max="100" value="${settings.musicVolume}" data-settings-volume="music"></label>
        <button class="btn ${settings.soundsEnabled ? 'green' : 'dark'} settings-toggle" data-settings-toggle="sounds">SFX: ${settings.soundsEnabled ? 'ВКЛ' : 'ВЫКЛ'}</button>
        <label class="settings-slider"><span>ГРОМКОСТЬ SFX ${sfxVolume}%</span><input type="range" min="0" max="100" value="${sfxVolume}" data-settings-volume="sfx"></label>
      </div>
      <div class="settings-modal__actions">
        <button class="btn red" data-action="resetGameConfirm">СБРОСИТЬ ПРОГРЕСС</button>
        <button class="btn purple" data-settings-close>ЗАКРЫТЬ</button>
      </div>
    </div>
  </div>`;
}

function openSettingsModal() {
  clearTimeout(settingsCloseTimer);
  settingsCloseTimer = null;
  settingsClosing = false;
  settingsOpen = true;
  render();
}

function closeSettingsModal() {
  if (!settingsOpen || settingsClosing) return;
  settingsClosing = true;
  clearTimeout(settingsCloseTimer);
  settingsCloseTimer = setTimeout(() => {
    settingsOpen = false;
    settingsClosing = false;
    settingsCloseTimer = null;
    render();
  }, 240);
  render();
}

function toggleSettingsFlag(flag) {
  const settings = settingsState();
  if (flag === 'music') settings.musicEnabled = !settings.musicEnabled;
  if (flag === 'sounds') settings.soundsEnabled = !settings.soundsEnabled;
  applyAudioSettings();
  save();
  render();
}

function updateSettingsVolume(kind, value) {
  const volume = clamp(Number(value) || 0, 0, 100);
  const settings = settingsState();
  if (kind === 'music') settings.musicVolume = volume;
  if (kind === 'sfx' || kind === 'sounds') {
    settings.sfxVolume = volume;
    settings.soundVolume = volume;
  }
  applyAudioSettings();
  save();
  render();
}

function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }
function val(key) { return Number.isFinite(state[key]) ? state[key] : 0; }
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1600);
}

function incrementProgress(key, amount = 1) {
  if (!state.progress) state.progress = createDefaultProgress();
  const currentValue = Number(state.progress[key]) || 0;
  const safeAmount = Number(amount) || 0;
  state.progress[key] = Math.max(0, currentValue + safeAmount);
}

function achievementById(id) {
  return achievementsCatalog.find((achievement) => achievement.id === id);
}

function achievementMetricValue(achievement) {
  if (!achievement) return 0;
  try {
    const value = Number(achievement.metric(state));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch {
    return 0;
  }
}

function isAchievementUnlocked(achievement) {
  return achievementMetricValue(achievement) >= achievement.goal;
}

function isAchievementClaimed(id) {
  return Boolean(state.achievements?.claimed?.[id]);
}

function formatAchievementReward(reward) {
  const rewardParts = [];
  if (reward.coins) rewardParts.push(`+${reward.coins}$`);
  if (reward.tvChips) rewardParts.push(`+${reward.tvChips} микросхем`);
  if (reward.noodles) rewardParts.push(`+${reward.noodles} дошик`);
  if (reward.beer) rewardParts.push(`+${reward.beer} пиво`);
  if (reward.tools) {
    Object.entries(reward.tools).forEach(([toolId, amount]) => {
      if (!amount) return;
      rewardParts.push(`+${amount} ${washToolRewardNames[toolId] || toolId}`);
    });
  }
  if (reward.tv) {
    Object.entries(reward.tv).forEach(([partId, amount]) => {
      if (!amount) return;
      rewardParts.push(`+${amount} ${tvPartRewardNames[partId] || partId}`);
    });
  }
  if (reward.ramenStock) {
    Object.entries(reward.ramenStock).forEach(([stockId, amount]) => {
      if (!amount) return;
      rewardParts.push(`+${amount} ${ramenStockRewardNames[stockId] || stockId}`);
    });
  }
  return rewardParts.join(' • ');
}

function addAmountWithInfinity(currentAmount, amountToAdd) {
  if (currentAmount === -1) return -1;
  return Math.max(0, (Number(currentAmount) || 0) + amountToAdd);
}

function applyAchievementReward(reward) {
  if (reward.coins) state.coins += reward.coins;
  if (reward.tvChips) state.tvChips = Math.max(0, Number(state.tvChips || 0) + reward.tvChips);
  if (reward.noodles) state.noodles += reward.noodles;
  if (reward.beer) state.beer += reward.beer;

  if (reward.tools) {
    Object.entries(reward.tools).forEach(([toolId, amount]) => {
      if (!state.tools[toolId]) state.tools[toolId] = 0;
      state.tools[toolId] = addAmountWithInfinity(state.tools[toolId], Number(amount) || 0);
    });
  }

  if (reward.tv) {
    Object.entries(reward.tv).forEach(([partId, amount]) => {
      if (!state.tv[partId]) state.tv[partId] = 0;
      state.tv[partId] = addAmountWithInfinity(state.tv[partId], Number(amount) || 0);
    });
  }

  if (reward.ramenStock) {
    Object.entries(reward.ramenStock).forEach(([ingredientId, amount]) => {
      const currentCount = getRamenCount(ingredientId);
      if (currentCount < 0) return;
      setRamenCount(ingredientId, Math.max(0, currentCount + (Number(amount) || 0)));
    });
  }
}

function claimAchievement(id) {
  if (state.dead) return;
  const achievement = achievementById(id);
  if (!achievement) return;
  if (isAchievementClaimed(id)) return;
  if (!isAchievementUnlocked(achievement)) {
    showToast('Сначала выполни условие достижения.');
    return;
  }
  if (!state.achievements) state.achievements = createDefaultAchievementsState();
  if (!state.achievements.claimed) state.achievements.claimed = {};
  state.achievements.claimed[id] = true;
  applyAchievementReward(achievement.reward);
  save();
  render();
  showToast(`Награда: ${achievement.title}`);
}

function achievementsUnlockedCount() {
  return achievementsCatalog.filter((achievement) => isAchievementUnlocked(achievement)).length;
}

function achievementsClaimedCount() {
  return achievementsCatalog.filter((achievement) => isAchievementClaimed(achievement.id)).length;
}

function mainIcon(file) {
  return `${mainIconPath}${file}.png`;
}

function washIcon(file) {
  return `${washIconPath}${file}.png`;
}

function tvIcon(file) {
  return `${tvIconPath}${file}.png`;
}

function eatIcon(file) {
  return `${eatIconPath}${encodeURIComponent(file)}.png`;
}

function marketIcon(file) {
  return `${marketIconPath}${encodeURIComponent(file)}.png`;
}

function loadImageAsset(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

async function bootGame() {
  const preloadAssets = [
    '/image/main.png', '/image/wash.png', '/image/market.png', '/image/TV.png', '/image/eat.png',
    mainIcon('Аватарка деда'), mainIcon('Настройки'), mainIcon('Достижения'), washIcon('Шампунь'), washIcon('Намылить'),
    eatIcon('Кипяток'), eatIcon('Приправа'), eatIcon('Китайский мазик'), eatIcon('Сушеные овощи'),
    eatIcon('Соевый соус'), eatIcon('Дедовская соль'), eatIcon('Назад'), eatIcon('Перемешать'), eatIcon('Готово'), eatIcon('Рецепт'),
    marketIcon('Бигбон'), marketIcon('Доширак'), marketIcon('Роллтон'), marketIcon('Пивосик'), marketIcon('Самогон деда'),
    marketIcon('Купить'), marketIcon('Список деда'), marketIcon('Назад'), marketIcon('К кассе')
  ];
  const loaderBackgrounds = ['/image/main.png', '/image/wash.png', '/image/market.png', '/image/TV.png', '/image/eat.png'];
  const loaderCaptions = [
    'ДЕД ПРОВЕРЯЕТ, ДОСТАТОЧНО ЛИ ТЫ СТАРАЕШЬСЯ',
    'РАЗОГРЕВАЕМ КОМНАТЫ, МЫЛО И ДЕДОВО НАСТРОЕНИЕ',
    'ЕСЛИ ГРУЗИТСЯ ДОЛГО - ЗНАЧИТ ДЕД ВОРЧИТ',
    'СЕЙЧАС БУДЕМ ОТМЫВАТЬ ЛЕГЕНДУ'
  ];
  if (startupLoader) {
    const bg = loaderBackgrounds[Math.floor(Math.random() * loaderBackgrounds.length)];
    const caption = loaderCaptions[Math.floor(Math.random() * loaderCaptions.length)];
    startupLoader.style.setProperty('--loader-background', `url('${bg}')`);
    const captionNode = startupLoader.querySelector('.startup-loader__caption');
    if (captionNode) captionNode.textContent = caption;
  }
  await Promise.all([
    Promise.all(preloadAssets.map(loadImageAsset)),
    new Promise((resolve) => setTimeout(resolve, 1450))
  ]);
  desktopBlocked = !isDesktopBlocked();
  animateNextScene = true;
  syncViewportMode();
  if (startupLoader) {
    startupLoader.classList.add('is-hidden');
    setTimeout(() => startupLoader.remove(), 760);
  }
}

function isDesktopBlocked() {
  return window.innerWidth > mobileWidthLimit;
}

function topbar() {
  return `<div class="topbar">
    <div class="resource"><span class="icon-coin">$</span><strong>${state.coins}</strong><span class="plus" data-action="bonus" data-type="coins">+</span></div>
    <div class="resource"><span class="icon-round">🍺</span><strong>${state.beer}</strong><span class="plus" data-action="bonus" data-type="beer">+</span></div>
    <div class="resource"><span class="icon-round">🍜</span><strong>${state.noodles}</strong><span class="plus" data-action="bonus" data-type="noodles">+</span></div>
    <button class="gear image-gear" data-action="settings"><img src="${mainIcon('Настройки')}" alt=""></button>
  </div>`;
}

function profile() {
  return `<aside class="profile">
    <div class="profile-top"><div class="avatar avatar-image"><img src="${mainIcon('Аватарка деда')}" alt=""></div><div class="profile-name">ДЕД АЛИШЕР<span>167 ЛЕТ</span></div></div>
    ${stat('🙂', state.mood)}${stat('💩', state.clean)}${stat('💤', state.sleep)}
  </aside>`;
}

function stat(icon, value) {
  return `<div class="stat"><span class="label">${icon}</span><div class="bar"><i style="width:${clamp(value)}%"></i></div><b>${clamp(value)}%</b></div>`;
}

function title(blue, white, subtitle = '') {
  return `<header class="screen-title"><h1><span>${blue}</span>${white}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</header>`;
}

function fxLayer() {
  const washFx = state.screen === 'wash' ? `${state.foam ? 'fx-foam' : ''}` : '';
  return `<div class="fx-layer ${washFx}" id="fx-layer"><div class="fx-foam-strokes" id="foam-strokes"></div></div>`;
}

function bonusModal() {
  if (!moneyRouletteOpen && !moneyRouletteClosing) return '';
  const resultText = moneyRouletteResult === 'win'
    ? `Дед дал ${moneyRouletteReward}$`
    : moneyRouletteResult === 'fail'
      ? 'Пошел нахуй, спинагрыз!'
      : 'Крути и узнай, добрый дед сегодня или нет.';
  const resultClass = moneyRouletteResult ? ` ${moneyRouletteResult}` : '';
  return `<div class="bonus-modal ${moneyRouletteClosing ? 'hide' : 'show'}" aria-label="Рулетка деда">
    <button class="bonus-modal__backdrop" data-bonus-close aria-label="Закрыть"></button>
    <div class="bonus-modal__panel panel">
      <div class="bonus-modal__title">РУЛЕТКА ДЕДА</div>
      <div class="bonus-modal__wheel-wrap">
        <span class="bonus-modal__pointer">▼</span>
        <div class="bonus-modal__wheel ${moneyRouletteSpinning ? 'spinning' : ''}">
          <b>$ / ХРЕН</b>
        </div>
      </div>
      <div class="bonus-modal__legend"><span class="win">+ ДОЛЛАРЫ</span><span class="fail">ПУСТО</span></div>
      <div class="bonus-modal__result${resultClass}">${resultText}</div>
      <div class="bonus-modal__actions">
        <button class="btn yellow" data-bonus-spin ${moneyRouletteSpinning ? 'disabled' : ''}>КРУТИТЬ</button>
        <button class="btn dark" data-bonus-close ${moneyRouletteSpinning ? 'disabled' : ''}>ЗАКРЫТЬ</button>
      </div>
    </div>
  </div>`;
}

function deathModal() {
  if (!state.dead) return '';
  return `<div class="death-modal show" aria-label="Дед умер">
    <div class="death-modal__backdrop"></div>
    <div class="death-modal__panel panel">
      <div class="death-modal__title">ДЕД АЛИШЕР СДОХ ОТ ЕБАННОЙ ДИПРЕССИИ..</div>
      <button class="btn red death-modal__restart" data-action="restartAfterDeath">НАЧАТЬ ЗАНОГО</button>
    </div>
  </div>`;
}

function render() {
  if (window.innerWidth > mobileWidthLimit) {
    document.body.classList.add('desktop-blocked');
    return;
  }
  document.body.classList.remove('desktop-blocked');
  
  if (!state.dead && clamp(state.mood) <= 0) {
    state.mood = 0;
    state.dead = true;
    clearTimeout(moneyRouletteTimer);
    moneyRouletteTimer = null;
    clearTimeout(bonusCloseTimer);
    bonusCloseTimer = null;
    clearTimeout(settingsCloseTimer);
    settingsCloseTimer = null;
    moneyRouletteOpen = false;
    moneyRouletteClosing = false;
    moneyRouletteSpinning = false;
    moneyRouletteResult = '';
    settingsOpen = false;
    settingsClosing = false;
    save();
  }
  const screens = { home, wash, shop, tv, ramen, achievements, phrases, gift };
  app.innerHTML = screens[state.screen]();
  const scene = app.querySelector('.scene');
  if (scene && animateNextScene) {
    scene.classList.add('scene-enter');
    animateNextScene = false;
  }
  if (state.screen === 'wash') renderWashFoamStrokes();
  updateAmbientAudio();
  bindEvents();
}

function syncViewportMode() {
  const shouldBlock = isDesktopBlocked();
  if (desktopBlocked === shouldBlock) return;
  desktopBlocked = shouldBlock;
  document.body.classList.toggle('desktop-blocked', desktopBlocked);
  if (!desktopBlocked) animateNextScene = true;
  render();
}

function shell(bg, content, options = {}) {
  const withProfile = options.withProfile !== false;
  return `<section class="scene ${bg}">${fxLayer()}${topbar()}${withProfile ? profile() : ''}${content}${bonusModal()}${settingsModal()}${deathModal()}</section>`;
}

function home() {
  return shell('home-bg', `${title('МЫТЬ', 'ДЕДА')}
    <nav class="left-menu">
      ${mainTile('blue', 'Мыть деда', 'МЫТЬ ДЕДА', 'wash')}${mainTile('purple', 'Включить телевизор', 'ВКЛЮЧИТЬ ТЕЛЕВИЗОР', 'tv')}
      ${mainTile('yellow', 'Готовить доширак', 'ГОТОВИТЬ ДОШИРАК', 'ramen')}${mainTile('green', 'Сходить за пивом', 'СХОДИТЬ ЗА ПИВОМ', 'shop')}
    </nav>
    <nav class="right-menu">
      ${mainTile('pink', 'Подать тапки', 'ПОДАТЬ ТАПКИ', 'gift')}${mainTile('yellow', 'Достижения', 'ДОСТИЖЕНИЯ', 'achievements')}${mainTile('dark', 'Дедовы фразы', 'ДЕДОВЫ ФРАЗЫ', 'phrases')}
    </nav>
    <div class="mini-title" style="position:absolute;left:0;right:0;bottom:150px;z-index:15">НАСТРОЕНИЕ ДЕДА</div>
    <div class="mood-row">
      ${mainMood('green', 'Доволен', 'ДОВОЛЕН', 6)}${mainMood('yellow', 'Так себе', 'ТАК СЕБЕ', 1)}${mainMood('red', 'Орет', 'ОРЁТ', -6)}${mainMood('pink', 'Хочет пиво', 'ХОЧЕТ ПИВА', -2)}${mainMood('purple', 'Спать', 'СПАТЬ', -4)}
    </div>`);
}

function mainTile(color, icon, text, screen) {
  const needsCaption = screen === 'achievements' || screen === 'phrases';
  return `<button class="tile ${color} image-tile ${needsCaption ? 'home-caption-tile' : ''}" data-screen="${screen}" aria-label="${text}"><img src="${mainIcon(icon)}" alt=""><span>${text}</span>${needsCaption ? `<b class="home-tile-caption">${text}</b>` : ''}</button>`;
}

function tile(color, emoji, text, screen) {
  return `<button class="tile ${color}" data-screen="${screen}"><span class="emoji">${emoji}</span>${text}</button>`;
}

function mainMood(color, icon, text, delta) {
  return `<button class="btn ${color} mood image-mood" data-action="mood" data-delta="${delta}" aria-label="${text}"><img src="${mainIcon(icon)}" alt=""><span>${text}</span></button>`;
}

function mood(color, emoji, text, delta) {
  return `<button class="btn ${color} mood" data-action="mood" data-delta="${delta}"><span class="emoji">${emoji}</span>${text}</button>`;
}

function wash() {
  const clean = clamp(state.washClean);
  return shell('wash-bg', `${title('МОЙКА', 'ДЕДА')}
    <aside class="side-panel tools"><div class="mini-title">ИНСТРУМЕНТЫ</div>${tool('shampoo','Шампунь','ШАМПУНЬ')}${tool('sponge','Мочалка','МОЧАЛКА')}${tool('shower','Душ','ДУШ')}${tool('towel','Полотенце','ПОЛОТЕНЦЕ')}</aside>
    <aside class="side-panel panel goal"><h3>⭐ ЦЕЛЬ:</h3><b>ПОМЫТЬ ДЕДА<br>ЧИСТОТА ${clean}%</b><ul><li>намылить</li><li>смыть пену</li><li>вытереть</li></ul><div class="clean-meter">${clean}%</div></aside>
    <div class="wash-zone" data-wash-zone></div>
    <div class="wash-controls">
      <button class="btn purple wash-exit" data-screen="home">⬅ ВЫЙТИ</button>
      <div class="prompt panel">ВОДИ ПО ДЕДУ ИЛИ ЖМИ КНОПКИ</div>
      <div class="action-row">${washAction('Намылить','НАМЫЛИТЬ','soap')}${washAction('Смыть пену','СМЫТЬ ПЕНУ','rinse')}${washAction('Вытереть','ВЫТЕРЕТЬ','wipe')}${washAction('Высушить','ВЫСУШИТЬ НУЖЕН УРОВЕНЬ 5','dry')}</div>
    </div>`);
}

function tool(id, icon, name) {
  const amount = state.tools[id] === -1 ? '∞' : state.tools[id];
  return `<button class="tool wash-tool ${selectedTool === id ? 'selected' : ''}" data-tool="${id}" data-name="${name}" aria-label="${name}"><img src="${washIcon(icon)}" alt=""><span>${name}</span><b class="tool-count ${amount === '∞' ? 'infinity' : ''}">${amount}</b></button>`;
}

function washAction(icon, text, action) {
  return `<button class="tile image-tile wash-action-button" data-wash="${action}" aria-label="${text}"><img src="${washIcon(icon)}" alt=""><span>${text}</span></button>`;
}

function shop() {
  const products = [
    ['BIGBON','Бигбон',99,'noodles',1], ['ДОШИРАК','Доширак',69,'noodles',1],
    ['РОЛЛТОН','Роллтон',59,'noodles',1], ['ПИВОСИК','Пивосик',79,'beer',1], ['САМОГОН ДЕДА','Самогон деда',1488,'mood',25]
  ];
  return shell('shop-bg', `${title('МАГАЗИН','ИДИ ЗА ПОКУПКАМИ<br>ДЕДУ НЕ ЛЕНЬ!')}
    <div class="shop-list-image" aria-label="Список деда"><img src="${marketIcon('Список деда')}" alt="Список деда"></div>
    <div class="paper-note" style="top:118px;right:88px">АЛКАШКА<br>- РАДОСТЬ<br>ДЕДАШКИ ☺</div>
    <div class="shop-products">${products.map(product).join('')}</div>
    <footer class="shop-footer">
      <button class="image-tile shop-nav-button" data-screen="home" aria-label="НАЗАД"><img src="${marketIcon('Назад')}" alt=""><span>НАЗАД</span></button>
      <div class="money shop-money" aria-label="Твои деньги">
        <div class="shop-money-title">ТВОИ ДЕНЬГИ:</div>
        <div class="shop-money-row"><span class="shop-money-icon" aria-hidden="true"></span><b class="shop-money-value">${state.coins}$</b></div>
      </div>
      <button class="image-tile shop-nav-button shop-cash-button" data-screen="home" aria-label="К КАССЕ"><img src="${marketIcon('К кассе')}" alt=""><span>К КАССЕ</span></button>
    </footer>`);
}

function product(item) {
  const [name, icon, price, type, amount] = item;
  return `<article class="product market-product">
    <img class="market-product-image" src="${marketIcon(icon)}" alt="${name}">
    <div class="market-buy-row">
      <b class="price">${price}$</b>
      <button class="cart market-cart image-tile" data-buy="${type}" data-price="${price}" data-amount="${amount}" aria-label="Купить ${name}">
        <img src="${marketIcon('Купить')}" alt="">
        <span>Купить</span>
      </button>
    </div>
  </article>`;
}

function tv() {
  return shell('tv-bg', `${title('НАСТРОЙ','ТЕЛЕВИЗОР','ЧТОБЫ ДЕД СМОТРЕЛ СВОИ ЛЮБИМЫЕ КАНАЛЫ!')}
    <div class="tv-goal-image" aria-label="ЦЕЛЬ"><img src="/image/buttons/TV/цель.png" alt="Цель: Настрой телевизор"></div>
    <div class="tv-chip-counter panel">МИКРОСХЕМЫ ТВ: <b>${state.tvChips}</b></div>
    <div class="tv-signal" aria-label="Качество сигнала">
      <div class="tv-signal-title">КАЧЕСТВО СИГНАЛА</div>
      <div class="tv-signal-row">
        <div class="tv-signal-meter">${renderTvSignalSegments(state.signal)}</div>
        <b class="tv-signal-value">${state.signal}%</b>
      </div>
    </div>
    <div class="parts panel">${part('antenna','%D0%90%D0%BD%D1%82%D0%B5%D0%BD%D0%BD%D0%B0','АНТЕННА',50)}${part('amp','%D0%A3%D1%81%D0%B8%D0%BB%D0%B8%D1%82%D0%B5%D0%BB%D1%8C','УСИЛИТЕЛЬ',80)}${part('cap','%D0%9A%D0%BE%D0%BD%D0%B4%D0%B5%D0%BD%D1%81%D0%B0%D1%82%D0%BE%D1%80','КОНДЕНСАТОР',60)}${part('wires','%D0%9F%D1%80%D0%BE%D0%B2%D0%BE%D0%B4%D0%B0','ПРОВОДА',40)}${part('spray','%D0%9E%D1%82%D1%87%D0%B8%D1%81%D1%82%D0%B8%D1%82%D1%8C%20%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D1%8B','ОЧИСТИТЬ<br>КОНТАКТЫ',0)}</div>
    <footer class="bottom-nav tv-bottom-nav">
      <button class="image-tile tv-nav-button" data-screen="home" aria-label="НАЗАД"><img src="${tvIcon('%D0%9D%D0%B0%D0%B7%D0%B0%D0%B4')}" alt=""><span>НАЗАД</span></button>
      <div></div>
      <button class="image-tile tv-nav-button" data-action="checkTv" aria-label="ПРОВЕРИТЬ КАНАЛЫ"><img src="${tvIcon('%D0%9F%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%B8%D1%82%D1%8C%20%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB%D1%8B')}" alt=""><span>ПРОВЕРИТЬ КАНАЛЫ</span></button>
    </footer>`);
}

function renderTvSignalSegments(value) {
  const segmentCount = 10;
  const activeSegments = Math.max(0, Math.min(segmentCount, Math.round(clamp(value) / (100 / segmentCount))));
  const palette = ['#cf2f38', '#d63f31', '#db4f2f', '#de602f', '#e16f31', '#df7c34', '#cc6e33', '#b96131', '#9a532f', '#7d472d'];
  return Array.from({ length: segmentCount }, (_, index) => {
    if (index >= activeSegments) return '<span class="tv-signal-segment"></span>';
    const color = palette[Math.min(index, palette.length - 1)];
    return `<span class="tv-signal-segment active" style="--tv-signal-color:${color}"></span>`;
  }).join('');
}

function getTvUpgradeCost(id, baseCost) {
  if (id === 'spray') return 0;
  const level = Math.max(1, Number(state.tv[id] || 1));
  const scaledCost = baseCost * (1 + (level - 1) * 0.25);
  return Math.max(baseCost, Math.round(scaledCost / 5) * 5);
}

function spendTvUpgradeCost(cost) {
  const chipValue = 10;
  const availableCoins = Math.max(0, Number(state.coins) || 0);
  const availableChips = Math.max(0, Number(state.tvChips) || 0);
  const totalBudget = availableCoins + availableChips * chipValue;
  if (totalBudget < cost) return null;

  const spendCoins = Math.min(availableCoins, cost);
  const remainingCost = Math.max(0, cost - spendCoins);
  const spendChips = remainingCost > 0 ? Math.ceil(remainingCost / chipValue) : 0;
  state.coins = availableCoins - spendCoins;
  state.tvChips = availableChips - spendChips;

  return { spendCoins, spendChips };
}

function part(id, icon, name, cost) {
  const level = id === 'spray' ? `${state.tv.spray}` : `${state.tv[id]}`;
  const upgradeCost = id === 'spray' ? 0 : getTvUpgradeCost(id, cost);
  const actionText = id === 'spray' ? 'ИСПОЛЬЗОВАТЬ' : `УЛУЧШИТЬ ${upgradeCost}$`;
  const costText = id === 'spray' ? '' : `${upgradeCost}`;
  const actionIcon = id === 'spray' ? '%D0%98%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D0%BE%D0%B2%D0%B0%D1%82%D1%8C' : '%D1%83%D0%BB%D1%83%D1%87%D1%88%D0%B8%D1%82%D1%8C';
  return `<div class="part tv-part-card">
    <button class="image-tile tv-part-surface" data-tv="${id}" data-cost="${upgradeCost}" aria-label="${actionText}">
      <img class="tv-part-bg" src="${tvIcon(icon)}" alt="${name}">
      <img class="tv-part-action-icon" src="${tvIcon(actionIcon)}" alt="">
      <span>${actionText}</span>
      ${costText ? `<b class="tv-part-cost">${costText}</b>` : ''}
      <b class="tv-part-level">${level}</b>
    </button>
  </div>`;
}

function getRamenCount(id) {
  const value = Number(state.ramen.stock?.[id]);
  if (!Number.isFinite(value)) return 0;
  return value;
}

function setRamenCount(id, nextCount) {
  if (!state.ramen.stock) state.ramen.stock = createRamenStock();
  state.ramen.stock[id] = nextCount;
}

function ramenStepGoal(step = state.ramen.step) {
  if (step === 1) return 'ЗАЛЕЙ КИПЯТОК';
  if (step === 2) return 'ДОБАВЬ ПРИПРАВУ';
  if (step === 3) return 'ДОБАВЬ КИТАЙСКИЙ МАЗИК';
  if (step === 4) return 'НАЖМИ ПЕРЕМЕШАТЬ';
  if (step === 5) return 'ЛАПША НАСТАИВАЕТСЯ';
  return 'ЖМИ ГОТОВО';
}

function ramenStepLabel() {
  return `ШАГ ${state.ramen.step}/6`;
}

function ramenStatusRow(titleText, iconType, value, tone) {
  const score = clamp(value);
  const iconMarkup = iconType === 'ded'
    ? `<span class="ramen-status-icon ded"><img src="${mainIcon('Аватарка деда')}" alt=""></span>`
    : `<span class="ramen-status-icon">${iconType}</span>`;
  return `<div class="ramen-status-row">
    <div class="ramen-status-title">${titleText}</div>
    <div class="ramen-status-line">
      ${iconMarkup}
      <div class="ramen-status-meter ${tone}">
        <i style="width:${score}%"></i>
        <b>${score}%</b>
      </div>
    </div>
  </div>`;
}

function ramen() {
  const noNoodles = state.noodles <= 0;
  return shell('ramen-bg', `${title('ГОТОВИМ','ДОШИРАК','СДЕЛАЙ ВКУСНО, ИНАЧЕ...')}
    <aside class="side-panel panel ramen-status">${ramenStatusRow('ВКУСНОТА','🙂',state.ramen.tasty,'taste')}${ramenStatusRow('ЧИНАЗЕС','🔥',state.ramen.spice,'spice')}${ramenStatusRow('ДОВОЛЕННОСТЬ ДЕДА','ded',state.ramen.happy,'happy')}<b class="ramen-status-warning">НЕ ДОВЕДИ ДО КРАСНОГО!</b></aside>
    <div class="ramen-recipe-image" aria-label="РЕЦЕПТ"><img src="${eatIcon('Рецепт')}" alt="Рецепт идеального доширака"></div>
    <section class="ramen-ingredients-shell panel">
      <div class="ramen-stock ${noNoodles ? 'empty' : ''}">ДОШИРАКОВ: ${state.noodles}</div>
      <div class="ramen-step-hint">ШАГ ${state.ramen.step}/6: ${ramenStepGoal()}</div>
      <div class="ramen-ingredients">${ingredient('water','Кипяток','КИПЯТОК',getRamenCount('water'), false, noNoodles)}${ingredient('spice','Приправа','ПРИПРАВА',getRamenCount('spice'), true, noNoodles)}${ingredient('mayo','Китайский мазик','КИТАЙСКИЙ МАЗИК',getRamenCount('mayo'), true, noNoodles)}${ingredient('veg','Сушеные овощи','СУШЁНЫЕ ОВОЩИ',getRamenCount('veg'), true, noNoodles)}${ingredient('soy','Соевый соус','СОЕВЫЙ СОУС',getRamenCount('soy'), true, noNoodles)}${ingredient('salt','Дедовская соль','ДЕДОВСКАЯ СОЛЬ',getRamenCount('salt'), true, noNoodles)}</div>
    </section>
    <footer class="bottom-nav ramen-bottom-nav">
      <button class="image-tile ramen-nav-button" data-screen="home" aria-label="НАЗАД"><img src="${eatIcon('Назад')}" alt=""><span>НАЗАД</span></button>
      <button class="image-tile ramen-nav-button ramen-nav-step-button" data-action="stir" aria-label="ПЕРЕМЕШАТЬ"><img src="${eatIcon('Перемешать')}" alt=""><span>ПЕРЕМЕШАТЬ</span><b class="ramen-nav-step">${ramenStepLabel()}</b></button>
      <button class="image-tile ramen-nav-button ramen-nav-step-button" data-action="finishRamen" aria-label="ГОТОВО"><img src="${eatIcon('Готово')}" alt=""><span>ГОТОВО</span><b class="ramen-nav-step">${ramenStepLabel()}</b></button>
    </footer>`);
}

function achievements() {
  const unlockedCount = achievementsUnlockedCount();
  const claimedCount = achievementsClaimedCount();
  const totalCount = achievementsCatalog.length;
  return shell('achievements-bg', `
    <section class="achievements-board panel">
      <div class="achievements-title">ДОСТИЖЕНИЯ</div>
      <header class="achievements-summary">
        <div class="achievements-summary-item"><span>ОТКРЫТО</span><b>${unlockedCount}/${totalCount}</b></div>
        <div class="achievements-summary-item"><span>ЗАБРАНО</span><b>${claimedCount}/${totalCount}</b></div>
        <div class="achievements-summary-item"><span>МИКРОСХЕМЫ ТВ</span><b>${state.tvChips}</b></div>
      </header>
      <div class="achievements-categories">
        ${achievementCategories.map((category) => achievementCategory(category)).join('')}
      </div>
    </section>
    <div class="achievements-footer">
      <button class="btn purple achievements-back-button" data-screen="home">⬅ НАЗАД</button>
      <div class="achievements-footer-hint">Награды: деньги, микросхемы, мойка и еда.</div>
    </div>`, { withProfile: false });
}

function gift() {
  return shell('tv-bg', `<div class="gift-game-container">
    <div class="gift-game-score">ПОЙМАНО: <span id="gift-score-value">${giftScore}</span></div>
    <div class="gift-game-zone" id="gift-zone" data-gift-zone>
      <img id="gift-ded-img" class="gift-ded" src="/image/ded/Ded_Alisher.png" alt="" style="position:absolute;bottom:0;left:${giftPlayerX}%">
    </div>
    <div class="gift-game-instructions">ЗАЖМИ И ПЕРЕТАЩИ ДЕДА ВЛЕВО-ВПРАВО!<br>НЕ ЛОВИ КОТА!</div>
    ${giftGameRunning ? '<button class="btn red gift-stop-btn" data-action="stopGiftGame">СТОП</button>' : '<button class="btn green gift-start-btn" data-action="startGiftGame">СТАРТ</button>'}
  </div>`, { withProfile: true });
}

function startGiftGame() {
  if (giftGameRunning) return;
  giftScore = 0;
  giftPlayerX = 50;
  giftFallingItems = [];
  giftGameRunning = true;
  giftGameRendering = true;
  giftGameTimer = setInterval(updateGiftGame, 30);
  render();
}

function stopGiftGame() {
  giftGameRunning = false;
  giftGameRendering = false;
  clearInterval(giftGameTimer);
  giftGameTimer = null;
  giftFallingItems = [];
  showToast(`Поймано ${giftScore} тапок!`);
  if (giftScore > 0) {
    state.coins += giftScore * 10;
    state.mood = clamp(state.mood + giftScore * 2);
    save();
  }
  giftScore = 0;
  render();
}

function updateGiftGame() {
  const zone = document.getElementById('gift-zone');
  if (!zone || !giftGameRunning) return;
  const rect = zone.getBoundingClientRect();
  const playerWidth = 256;
  const playerLeft = (giftPlayerX / 100) * (rect.width - playerWidth);
  const playerRight = playerLeft + playerWidth;
  const dedCatchZoneY = rect.height - 130;
  
  if (Math.random() < 0.03) {
    const isCat = Math.random() < 0.35;
    giftFallingItems.push({
      x: 5 + Math.random() * 85,
      y: -120,
      isCat: isCat,
      speed: 2.5 + Math.random() * 2
    });
  }
  
  for (let i = giftFallingItems.length - 1; i >= 0; i--) {
    const item = giftFallingItems[i];
    item.y += item.speed;
    
    const itemCenterPx = (item.x / 100) * rect.width + 60;
    const itemBottomY = item.y + 120;
    const hitX = itemCenterPx >= playerLeft && itemCenterPx <= playerRight;
    const hitY = itemBottomY >= dedCatchZoneY;
    
    if (hitX && hitY) {
      if (item.isCat) {
        giftGameOver();
        giftFallingItems = [];
        return;
      } else {
        giftScore += 1;
        giftFallingItems.splice(i, 1);
        continue;
      }
    }
    
    if (item.y > rect.height + 50) {
      giftFallingItems.splice(i, 1);
    }
  }
  renderGiftGame();
}

function renderGiftGame() {
  if (!giftGameRendering) return;
  const zone = document.getElementById('gift-zone');
  const scoreEl = document.getElementById('gift-score-value');
  if (!zone && !scoreEl) return;
  if (scoreEl) scoreEl.textContent = giftScore;
  if (!zone) return;
  const dedImg = document.getElementById('gift-ded-img');
  if (!dedImg) return;
  dedImg.style.left = giftPlayerX + '%';
  const existingItems = zone.querySelectorAll('.gift-falling-item');
  existingItems.forEach(el => el.remove());
  giftFallingItems.forEach(item => {
    const img = document.createElement('img');
    img.className = 'gift-falling-item';
    img.src = item.isCat ? '/image/ded/Cum_Cat.png' : '/image/ded/Tapok.png';
    img.style.left = item.x + '%';
    img.style.top = item.y + 'px';
    img.style.position = 'absolute';
    img.style.width = '120px';
    zone.appendChild(img);
  });
}

function giftGameOver() {
  giftGameRunning = false;
  giftGameRendering = false;
  clearInterval(giftGameTimer);
  giftGameTimer = null;
  giftFallingItems = [];
  showToast('ДЕД ПОЛУЧИЛ МОЧУ КОТА! РЕСТАРТ...');
  setTimeout(() => restartAfterDeath(), 1500);
}

function phrases() {
  const list = dedPhrases.slice(0, 120);
  return shell('achievements-bg', `
    <section class="achievements-board panel phrases-board">
      <div class="achievements-title phrases-title">ДЕДОВЫ ФРАЗЫ</div>
      <header class="achievements-summary phrases-summary">
        <div class="achievements-summary-item"><span>ВСЕГО ФРАЗ</span><b>${list.length}</b></div>
        <div class="achievements-summary-item"><span>СТИЛЬ</span><b>СССР</b></div>
        <div class="achievements-summary-item"><span>РЕЖИМ</span><b>ВОРЧУН</b></div>
      </header>
      <div class="phrases-list">
        ${list.map((phrase, index) => `<article class="achievement-card phrase-card"><b class="phrase-index">${index + 1}</b><p class="phrase-text">${phrase}</p></article>`).join('')}
      </div>
    </section>
    <div class="achievements-footer">
      <button class="btn purple achievements-back-button" data-screen="home">⬅ НАЗАД</button>
      <div class="achievements-footer-hint">Словарь советского деда: ворчание, мудрость и бытовая классика.</div>
    </div>`, { withProfile: false });
}

function achievementCategory(category) {
  const list = achievementsCatalog.filter((achievement) => achievement.category === category.id);
  return `<section class="achievement-category">
    <h3>${category.title}</h3>
    <div class="achievement-list">${list.map((achievement) => achievementCard(achievement)).join('')}</div>
  </section>`;
}

function achievementCard(achievement) {
  const progressValue = achievementMetricValue(achievement);
  const cappedValue = Math.min(achievement.goal, progressValue);
  const unlocked = progressValue >= achievement.goal;
  const claimed = isAchievementClaimed(achievement.id);
  const cardClass = claimed ? 'claimed' : unlocked ? 'unlocked' : 'locked';
  const claimButton = claimed
    ? '<button class="btn green achievement-claim-button" disabled>ЗАБРАНО</button>'
    : unlocked
      ? `<button class="btn yellow achievement-claim-button" data-ach-claim="${achievement.id}">ЗАБРАТЬ</button>`
      : '<button class="btn dark achievement-claim-button" disabled>ЗАКРЫТО</button>';
  return `<article class="achievement-card ${cardClass}">
    <div class="achievement-head">
      <b>${achievement.title}</b>
      <i>${Math.round(cappedValue)}/${achievement.goal}</i>
    </div>
    <p>${achievement.description}</p>
    <div class="achievement-progress"><i style="width:${clamp((progressValue / achievement.goal) * 100)}%"></i></div>
    <div class="achievement-reward">${formatAchievementReward(achievement.reward)}</div>
    ${claimButton}
  </article>`;
}

function ingredient(id, icon, name, count, showCount = true, disabled = false) {
  const labelCount = count < 0 ? '∞' : count;
  const countMarkup = showCount ? `<b class="ingredient-count">ЕСТЬ: ${labelCount}</b>` : '';
  const disabledAttr = disabled ? 'disabled' : '';
  return `<button class="ingredient image-tile ${disabled ? 'disabled' : ''}" data-ing="${id}" aria-label="${name}" ${disabledAttr}><img src="${eatIcon(icon)}" alt="${name}"><span>${name}</span>${countMarkup}</button>`;
}

function bindEvents() {
  app.querySelectorAll('[data-screen]').forEach((button) => {
    button.addEventListener('click', () => changeScreen(button.dataset.screen));
  });

  app.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => action(button));
  });

  app.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedTool = button.dataset.tool;
      render();
      showToast(`Выбран инструмент: ${button.dataset.name || button.textContent.trim()}`);
    });
  });

  app.querySelectorAll('[data-wash]').forEach((button) => {
    button.addEventListener('click', () => washMove(button.dataset.wash));
  });

  app.querySelectorAll('[data-buy]').forEach((button) => {
    button.addEventListener('click', () => buy(button));
  });

  app.querySelectorAll('[data-tv]').forEach((button) => {
    button.addEventListener('click', () => upgradeTv(button));
  });

  app.querySelectorAll('[data-ing]').forEach((button) => {
    button.addEventListener('click', () => addIngredient(button.dataset.ing));
  });

  app.querySelectorAll('[data-bonus-spin]').forEach((button) => {
    button.addEventListener('click', spinMoneyRoulette);
  });

  app.querySelectorAll('[data-bonus-close]').forEach((button) => {
    button.addEventListener('click', closeMoneyRoulette);
  });

  app.querySelectorAll('[data-ach-claim]').forEach((button) => {
    button.addEventListener('click', () => claimAchievement(button.dataset.achClaim));
  });

  app.querySelectorAll('[data-settings-close]').forEach((button) => {
    button.addEventListener('click', closeSettingsModal);
  });

  app.querySelectorAll('[data-settings-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleSettingsFlag(button.dataset.settingsToggle));
  });

  app.querySelectorAll('[data-settings-volume]').forEach((input) => {
    input.addEventListener('input', () => updateSettingsVolume(input.dataset.settingsVolume, input.value));
  });

  const washZone = app.querySelector('[data-wash-zone]');
  if (washZone) bindWashZone(washZone);

  const giftZone = app.querySelector('[data-gift-zone]');
  if (giftZone) bindGiftZone(giftZone);
}

function bindGiftZone(zone) {
  if (!giftGameRunning) return;
  const dedImg = document.getElementById('gift-ded-img');
  if (!dedImg) return;
  const handleMove = (clientX) => {
    const rect = zone.getBoundingClientRect();
    let newX = clientX - rect.left - giftDragOffsetX;
    newX = clamp(newX, 0, rect.width);
    giftPlayerX = (newX / rect.width) * 100;
  };
  dedImg.addEventListener('pointerdown', (event) => {
    if (!giftGameRunning) return;
    giftDragging = true;
    dedImg.classList.add('dragging');
    const rect = zone.getBoundingClientRect();
    const dedRect = dedImg.getBoundingClientRect();
    giftDragOffsetX = event.clientX - dedRect.left - (dedRect.width / 2);
    dedImg.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  zone.addEventListener('pointermove', (event) => {
    if (!giftGameRunning || !giftDragging) return;
    handleMove(event.clientX);
  });
  zone.addEventListener('pointerup', (event) => {
    if (!giftDragging) return;
    giftDragging = false;
    dedImg.classList.remove('dragging');
    if (event && event.pointerId) {
      try { dedImg.releasePointerCapture(event.pointerId); } catch {}
    }
  });
  zone.addEventListener('pointercancel', (event) => {
    giftDragging = false;
    dedImg.classList.remove('dragging');
  });
  dedImg.addEventListener('touchstart', (event) => {
    if (!giftGameRunning) return;
    giftDragging = true;
    dedImg.classList.add('dragging');
    const rect = zone.getBoundingClientRect();
    const dedRect = dedImg.getBoundingClientRect();
    const touch = event.touches[0];
    giftDragOffsetX = touch.clientX - dedRect.left - (dedRect.width / 2);
    event.preventDefault();
  }, { passive: false });
  dedImg.addEventListener('touchmove', (event) => {
    if (!giftGameRunning || !giftDragging) return;
    const touch = event.touches[0];
    handleMove(touch.clientX);
    event.preventDefault();
  }, { passive: false });
  dedImg.addEventListener('touchend', (event) => {
    giftDragging = false;
    dedImg.classList.remove('dragging');
  });
}

function bindWashZone(zone) {
  const finishStroke = () => {
    if (!washStroke) return;
    const won = washStroke.won;
    washStroke = null;
    save();
    render();
    if (won) showToast('Победа! Дед чистый. +100$');
  };

  const applyPointer = (event, force = false) => {
    if (!washStroke) return;
    const config = washToolFlow[washStroke.tool];
    if (!config) return;
    const now = performance.now();
    if (!force && now - washStroke.lastApply < config.interval) return;
    washStroke.lastApply = now;
    const rect = zone.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    const previousX = washStroke.lastX ?? x;
    const previousY = washStroke.lastY ?? y;
    spawnWashTrail(washStroke.tool, x, y, rect, previousX, previousY);
    washStroke.lastX = x;
    washStroke.lastY = y;
    applyWashStrokeState(washStroke.tool);
    syncWashLiveUi();
  };

  zone.addEventListener('pointerdown', (event) => {
    if (!beginWashStroke(selectedTool)) return;
    washStroke.pointerId = event.pointerId;
    zone.classList.add('active');
    zone.setPointerCapture(event.pointerId);
    event.preventDefault();
    applyPointer(event, true);
  });

  zone.addEventListener('pointermove', (event) => {
    if (!washStroke || event.pointerId !== washStroke.pointerId) return;
    event.preventDefault();
    applyPointer(event);
  });

  zone.addEventListener('pointerup', (event) => {
    if (!washStroke || event.pointerId !== washStroke.pointerId) return;
    zone.classList.remove('active');
    finishStroke();
  });

  zone.addEventListener('pointercancel', () => {
    zone.classList.remove('active');
    finishStroke();
  });
}

function beginWashStroke(tool) {
  if (!washToolFlow[tool]) return false;
  if (tool !== 'shower') {
    if (state.tools[tool] <= 0) {
      showToast('Инструмент закончился!');
      return false;
    }
    if (state.tools[tool] !== -1) state.tools[tool] -= 1;
  }
  washStroke = { tool, pointerId: null, lastApply: 0, won: false };
  syncWashLiveUi();
  return true;
}

function applyWashStrokeState(tool) {
  const beforeClean = state.washClean;
  incrementProgress('washActions', 1);
  if (tool === 'shampoo') {
    state.foam = clamp(state.foam + 8);
    state.washClean = clamp(state.washClean + 2);
  }
  if (tool === 'sponge') {
    state.foam = clamp(state.foam + 6);
    state.washClean = clamp(state.washClean + 3);
  }
  if (tool === 'shower') {
    state.foam = clamp(state.foam - 12);
    state.washClean = clamp(state.washClean + 5);
    state.clean = clamp(state.clean + 4);
  }
  if (tool === 'towel') {
    state.foam = clamp(state.foam - 7);
    state.washClean = clamp(state.washClean + 4);
    state.clean = clamp(state.clean + 5);
    state.mood = clamp(state.mood + 1);
  }
  if (beforeClean < 100 && state.washClean >= 100) {
    state.coins += 100;
    state.mood = clamp(state.mood + 12);
    incrementProgress('washWins', 1);
    if (washStroke) washStroke.won = true;
  }
}

function syncWashLiveUi() {
  const layer = app.querySelector('.fx-layer');
  if (layer) layer.classList.toggle('fx-foam', state.foam > 0);
  if (state.foam <= 0 && washFoamStrokes.length) washFoamStrokes = [];

  const goal = app.querySelector('.goal b');
  if (goal) goal.innerHTML = `ПОМЫТЬ ДЕДА<br>ЧИСТОТА ${clamp(state.washClean)}%`;

  const meter = app.querySelector('.clean-meter');
  if (meter) meter.textContent = `${clamp(state.washClean)}%`;

  const profileStats = app.querySelectorAll('.profile .stat');
  updateStatNode(profileStats[0], state.mood);
  updateStatNode(profileStats[1], state.clean);
  updateStatNode(profileStats[2], state.sleep);

  app.querySelectorAll('.wash-tool').forEach((button) => {
    button.classList.toggle('selected', button.dataset.tool === selectedTool);
  });

  Object.entries(state.tools).forEach(([tool, amount]) => {
    const count = app.querySelector(`[data-tool="${tool}"] .tool-count`);
    if (!count) return;
    count.textContent = amount === -1 ? '∞' : amount;
    count.classList.toggle('infinity', amount === -1);
  });

  renderWashFoamStrokes();
}

function updateStatNode(node, value) {
  if (!node) return;
  const bar = node.querySelector('i');
  const label = node.querySelector('b');
  if (bar) bar.style.width = `${clamp(value)}%`;
  if (label) label.textContent = `${clamp(value)}%`;
}

function renderWashFoamStrokes() {
  const container = app.querySelector('#foam-strokes');
  if (!container) return;
  container.innerHTML = washFoamStrokes.map((stroke) => `<span class="fx-soap-stroke" style="left:${stroke.x}px;top:${stroke.y}px;width:${stroke.size}px;height:${stroke.size}px;transform:translate(-50%, -50%) rotate(${stroke.rotation}deg);opacity:${stroke.opacity}"></span>`).join('');
}

function clearFoamStrokesNear(x, y, radius, limit) {
  let removed = 0;
  washFoamStrokes = washFoamStrokes.filter((stroke) => {
    if (removed >= limit) return true;
    const distance = Math.hypot(stroke.x - x, stroke.y - y);
    if (distance > radius) return true;
    removed += 1;
    return false;
  });
}

function spawnWashTrail(tool, x, y, rect, previousX, previousY) {
  const layer = app.querySelector('.fx-layer');
  if (!layer) return;

  if (tool === 'shower') {
    clearFoamStrokesNear(x, y, 56, 4);
    const stream = document.createElement('span');
    stream.className = 'fx-stream';
    stream.style.left = `${x}px`;
    stream.style.top = `${Math.max(y - 8, 0)}px`;
    stream.style.height = `${Math.max(rect.height - y + 28, 76)}px`;
    layer.appendChild(stream);
    setTimeout(() => stream.remove(), 420);

    for (let index = 0; index < 6; index += 1) {
      const drop = document.createElement('span');
      const drift = (Math.random() - .5) * 22;
      drop.className = 'fx-drop';
      drop.style.left = `${x + drift}px`;
      drop.style.top = `${y + 16}px`;
      drop.style.setProperty('--drop-x', `${drift * 1.2}px`);
      drop.style.setProperty('--drop-y', `${38 + Math.random() * 78}px`);
      layer.appendChild(drop);
      setTimeout(() => drop.remove(), 620);
    }
    return;
  }

  if (tool === 'shampoo' || tool === 'sponge') {
    const deltaX = x - previousX;
    const deltaY = y - previousY;
    const distance = Math.hypot(deltaX, deltaY);
    const stampStep = tool === 'sponge' ? 15 : 13;
    const stampCount = Math.max(1, Math.min(8, Math.ceil(distance / stampStep)));
    const baseSize = tool === 'sponge' ? 38 : 32;
    const spread = tool === 'sponge' ? 9 : 11;

    for (let index = 0; index < stampCount; index += 1) {
      const progress = stampCount === 1 ? 1 : index / (stampCount - 1);
      const offsetX = (Math.random() - .5) * spread;
      const offsetY = (Math.random() - .5) * spread;
      washFoamStrokes.push({
        x: previousX + deltaX * progress + offsetX,
        y: previousY + deltaY * progress + offsetY,
        size: baseSize + Math.random() * 16,
        rotation: -18 + Math.random() * 36,
        opacity: tool === 'sponge' ? .88 - Math.random() * .08 : .8 - Math.random() * .1
      });
    }

    if (washFoamStrokes.length > 220) washFoamStrokes = washFoamStrokes.slice(-220);

    const lather = document.createElement('span');
    lather.className = 'fx-lather';
    lather.style.left = `${x}px`;
    lather.style.top = `${y}px`;
    layer.appendChild(lather);
    setTimeout(() => lather.remove(), 520);
    return;
  }

  if (tool === 'towel') {
    clearFoamStrokesNear(x, y, 68, 5);
    const wipe = document.createElement('span');
    wipe.className = 'fx-wipe';
    wipe.style.left = `${x}px`;
    wipe.style.top = `${y}px`;
    wipe.style.setProperty('--wipe-rotation', `${-28 + Math.random() * 56}deg`);
    layer.appendChild(wipe);
    setTimeout(() => wipe.remove(), 460);
  }
}

function changeScreen(screen) {
  if (state.dead) return;
  if (['home', 'wash', 'shop', 'tv', 'ramen', 'achievements', 'phrases', 'gift'].includes(screen)) {
    if (screen === state.screen) return;
    transitionToScreen(screen);
    return;
  }
  const messages = {
    gift: 'Подарок ещё заворачивают в газетку.'
  };
  showToast(messages[screen] || 'Скоро будет.');
}

function transitionToScreen(screen) {
  if (transitionBusy) return;
  transitionBusy = true;

  if (state.screen === 'gift' && giftGameRunning) {
    stopGiftGame();
  }

  const currentScene = app.querySelector('.scene');
  if (currentScene) currentScene.classList.add('scene-leave');

  setTimeout(() => {
    state.screen = screen;
    save();
    animateNextScene = true;
    render();
  }, 220);

  setTimeout(() => {
    transitionBusy = false;
  }, 620);
}

function action(button) {
  const name = button.dataset.action;
  if (state.dead && name !== 'restartAfterDeath') return;
  if (name === 'bonus') addBonus(button.dataset.type);
  if (name === 'settings') openSettingsModal();
  if (name === 'resetGameConfirm') resetGame();
  if (name === 'mood') changeMood(Number(button.dataset.delta || 0));
  if (name === 'checkTv') checkTv();
  if (name === 'stir') stirRamen();
  if (name === 'finishRamen') finishRamen();
  if (name === 'restartAfterDeath') restartAfterDeath();
  if (name === 'startGiftGame') startGiftGame();
  if (name === 'stopGiftGame') stopGiftGame();
}

function addBonus(type) {
  if (type === 'coins') {
    openMoneyRoulette();
    return;
  }
  if (type === 'beer' || type === 'noodles') {
    if (state.screen !== 'shop') transitionToScreen('shop');
    else showToast('Магазин уже открыт.');
  }
}

function openMoneyRoulette() {
  clearTimeout(bonusCloseTimer);
  bonusCloseTimer = null;
  moneyRouletteClosing = false;
  moneyRouletteOpen = true;
  moneyRouletteSpinning = false;
  moneyRouletteResult = '';
  moneyRouletteReward = 0;
  clearTimeout(moneyRouletteTimer);
  moneyRouletteTimer = null;
  render();
}

function closeMoneyRoulette() {
  if (moneyRouletteSpinning || !moneyRouletteOpen || moneyRouletteClosing) return;
  moneyRouletteClosing = true;
  clearTimeout(bonusCloseTimer);
  bonusCloseTimer = setTimeout(() => {
    moneyRouletteOpen = false;
    moneyRouletteClosing = false;
    bonusCloseTimer = null;
    moneyRouletteResult = '';
    render();
  }, 240);
  moneyRouletteResult = '';
  render();
}

function spinMoneyRoulette() {
  if (!moneyRouletteOpen || moneyRouletteSpinning) return;
  moneyRouletteSpinning = true;
  moneyRouletteResult = '';
  moneyRouletteReward = 40 + Math.floor(Math.random() * 7) * 20;
  const won = Math.random() < 0.55;
  render();
  clearTimeout(moneyRouletteTimer);
  moneyRouletteTimer = setTimeout(() => {
    moneyRouletteSpinning = false;
    if (won) {
      state.coins += moneyRouletteReward;
      incrementProgress('bonusWins', 1);
      moneyRouletteResult = 'win';
      save();
      showToast(`Дед подкинул ${moneyRouletteReward}$`);
    } else {
      moneyRouletteResult = 'fail';
      showToast('Пошел нахуй, спинагрыз!');
    }
    render();
  }, 1700);
}

function resetGame() {
  if (!confirm('Сбросить прогресс деда?')) return;
  const preservedSettings = structuredClone(settingsState());
  clearTimeout(ramenInfuseTimer);
  clearTimeout(moneyRouletteTimer);
  clearTimeout(bonusCloseTimer);
  clearTimeout(settingsCloseTimer);
  bonusCloseTimer = null;
  settingsCloseTimer = null;
  moneyRouletteTimer = null;
  moneyRouletteOpen = false;
  moneyRouletteClosing = false;
  moneyRouletteSpinning = false;
  moneyRouletteResult = '';
  settingsOpen = false;
  settingsClosing = false;
  ramenInfuseTimer = null;
  state = structuredClone(defaultState);
  state.settings = preservedSettings;
  selectedTool = 'shower';
  washFoamStrokes = [];
  applyAudioSettings();
  save();
  render();
  showToast('Дед снова грязный и недовольный.');
}

function restartAfterDeath() {
  const preservedSettings = structuredClone(settingsState());
  clearTimeout(ramenInfuseTimer);
  clearTimeout(moneyRouletteTimer);
  clearTimeout(bonusCloseTimer);
  clearTimeout(settingsCloseTimer);
  bonusCloseTimer = null;
  settingsCloseTimer = null;
  ramenInfuseTimer = null;
  moneyRouletteTimer = null;
  moneyRouletteOpen = false;
  moneyRouletteClosing = false;
  moneyRouletteSpinning = false;
  moneyRouletteResult = '';
  settingsOpen = false;
  settingsClosing = false;
  state = structuredClone(defaultState);
  state.settings = preservedSettings;
  selectedTool = 'shower';
  washFoamStrokes = [];
  applyAudioSettings();
  save();
  render();
  showToast('Дед снова живой. Не доводи его до депрессии.');
}

function changeMood(delta) {
  state.mood = clamp(state.mood + delta);
  incrementProgress('moodActions', 1);
  if (delta > 0) incrementProgress('moodPositiveActions', 1);
  save();
  render();
  if (delta < 0) shakeScene();
  else spawnFx('fx-bubble', 8);
}

function washMove(move) {
  const beforeClean = state.washClean;
  const actionableMoves = ['soap', 'rinse', 'wipe'];
  if (actionableMoves.includes(move)) incrementProgress('washActions', 1);
  let fx = null;
  let shouldShake = false;
  const use = (tool) => {
    if (state.tools[tool] === -1) return true;
    if (state.tools[tool] <= 0) {
      showToast('Инструмент закончился!');
      return false;
    }
    state.tools[tool] -= 1;
    return true;
  };

  if (move === 'soap') {
    if (!use('shampoo')) return;
    state.foam = clamp(state.foam + 35);
    state.washClean = clamp(state.washClean + 8);
    state.mood = clamp(state.mood - 2);
    showToast('Дед намылен. Он ворчит.');
    fx = ['fx-bubble', 14];
  }

  if (move === 'rinse') {
    state.foam = clamp(state.foam - 45);
    state.washClean = clamp(state.washClean + (selectedTool === 'shower' ? 18 : 8));
    state.clean = clamp(state.clean + 12);
    showToast('Пена смыта!');
    fx = ['fx-bubble', 7];
  }

  if (move === 'wipe') {
    if (!use('towel')) return;
    state.foam = clamp(state.foam - 20);
    state.washClean = clamp(state.washClean + 15);
    state.clean = clamp(state.clean + 16);
    state.mood = clamp(state.mood + 4);
    showToast('Дед вытерт почти до блеска.');
  }

  if (move === 'dry') {
    showToast('Фен откроется на 5 уровне.');
    shouldShake = true;
  }

  if (beforeClean < 100 && state.washClean >= 100) {
    state.coins += 100;
    state.mood = clamp(state.mood + 12);
    incrementProgress('washWins', 1);
    showToast('Победа! Дед чистый. +100$');
  }
  save();
  render();
  if (fx) spawnFx(fx[0], fx[1]);
  if (shouldShake) shakeScene();
}

function buy(button) {
  const price = Number(button.dataset.price);
  const amount = Number(button.dataset.amount);
  if (state.coins < price) {
    showToast('Не хватает долларов.');
    return;
  }
  state.coins -= price;
  const type = button.dataset.buy;
  if (type === 'beer') state.beer += amount;
  if (type === 'noodles') state.noodles += amount;
  if (type === 'mood') state.mood = clamp(state.mood + 25);
  incrementProgress('shopPurchases', 1);
  incrementProgress('coinsSpent', price);
  showToast('Покупка в авоське!');
  save();
  render();
}

function upgradeTv(button) {
  const id = button.dataset.tv;
  const cost = Number(button.dataset.cost);
  if (id === 'spray') {
    if (state.tv.spray <= 0) {
      showToast('Спрей закончился.');
      return;
    }
    state.tv.spray -= 1;
    state.signal = clamp(state.signal + 9);
    incrementProgress('tvSpraysUsed', 1);
    showToast('Контакты блестят!');
  } else {
    const payment = spendTvUpgradeCost(cost);
    if (!payment) {
      showToast('Не хватает долларов и микросхем.');
      return;
    }
    state.tv[id] += 1;
    state.signal = clamp(state.signal + 8 + state.tv[id] * 3);
    incrementProgress('tvUpgrades', 1);
    if (payment.spendCoins > 0) incrementProgress('coinsSpent', payment.spendCoins);
    if (payment.spendChips > 0) showToast(`Сигнал стал лучше. -${payment.spendChips} микросхем`);
    else showToast('Сигнал стал лучше.');
  }
  save();
  render();
}

function checkTv() {
  if (state.signal >= 85) {
    state.mood = clamp(state.mood + 10);
    state.coins += 25;
    incrementProgress('tvChecksSuccess', 1);
    showToast('Каналы пойманы! Дед доволен.');
  } else {
    state.mood = clamp(state.mood - 6);
    showToast('Рябит. Дед стучит по телевизору.');
  }
  save();
  render();
  if (state.signal >= 85) spawnFx('fx-bubble', 10);
  else shakeScene();
}

function addIngredient(id) {
  const changes = {
    water: [4, -2, 4],
    spice: [8, 12, 7],
    mayo: [10, 18, 8],
    veg: [7, -3, 5],
    soy: [9, 9, 6],
    salt: [-5, 18, -12]
  };
  if (!changes[id]) return;
  if (state.noodles <= 0) {
    showToast('Нет доширака! Сходи в магазин.');
    shakeScene();
    return;
  }

  const requiredId = ramenRequiredOrder[state.ramen.step - 1];
  if (requiredId && id !== requiredId) {
    showToast(`Сейчас шаг ${state.ramen.step}/6: ${ramenStepGoal()}`);
    shakeScene();
    return;
  }

  if (state.ramen.step === 4) {
    showToast('Сначала нажми ПЕРЕМЕШАТЬ.');
    return;
  }

  if (state.ramen.infusing || state.ramen.step === 5) {
    showToast('Подожди, лапша настаивается...');
    return;
  }

  const currentCount = getRamenCount(id);
  if (currentCount === 0) {
    showToast('Этот ингредиент закончился.');
    return;
  }
  if (currentCount > 0) setRamenCount(id, currentCount - 1);

  const [tasty, spice, happy] = changes[id];
  state.ramen.tasty = clamp(state.ramen.tasty + tasty);
  state.ramen.spice = clamp(state.ramen.spice + spice);
  state.ramen.happy = clamp(state.ramen.happy + happy);
  if (requiredId && id === requiredId) state.ramen.step = Math.min(6, state.ramen.step + 1);
  if (!state.ramen.used.includes(id)) state.ramen.used.push(id);
  incrementProgress('ingredientsAdded', 1);
  showToast('Ингредиент отправлен в лапшу.');
  save();
  render();
  spawnFx('fx-steam', 5);
}

function stirRamen() {
  if (state.ramen.step < 4) {
    showToast(`Рано мешать. ${ramenStepGoal()}.`);
    shakeScene();
    return;
  }
  if (state.ramen.infusing || state.ramen.step === 5) {
    showToast('Уже настаивается...');
    return;
  }
  if (state.ramen.step >= 6) {
    showToast('Уже можно подавать деду.');
    return;
  }
  state.ramen.tasty = clamp(state.ramen.tasty + 7);
  state.ramen.spice = clamp(state.ramen.spice - 4);
  state.ramen.happy = clamp(state.ramen.happy + 6);
  state.ramen.step = 5;
  state.ramen.infusing = true;
  clearTimeout(ramenInfuseTimer);
  ramenInfuseTimer = setTimeout(() => {
    if (!state.ramen.infusing) return;
    state.ramen.infusing = false;
    state.ramen.step = 6;
    save();
    if (state.screen === 'ramen') render();
    showToast('Лапша настоялась. Жми ГОТОВО.');
  }, 1800);
  showToast('Перемешано. Немного настаиваем...');
  save();
  render();
  spawnFx('fx-steam', 7);
}

function finishRamen() {
  if (state.ramen.step < 6 || state.ramen.infusing) {
    showToast('Еще рано. Дай дошираку дойти.');
    return;
  }
  const score = Math.round((state.ramen.tasty + state.ramen.happy + (100 - Math.abs(55 - state.ramen.spice))) / 3);
  if (state.noodles <= 0) {
    showToast('Нет доширака!');
    return;
  }
  clearTimeout(ramenInfuseTimer);
  ramenInfuseTimer = null;
  state.noodles -= 1;
  state.mood = clamp(state.mood + Math.round(score / 7));
  state.coins += score;
  incrementProgress('ramenCooked', 1);
  state.ramen = createDefaultRamenState();
  showToast(`Дед оценил дошик на ${score}/100. +${score}$`);
  save();
  render();
}

function shakeScene() {
  const target = app.querySelector('.scene');
  if (!target) return;
  target.classList.remove('shake');
  void target.offsetWidth;
  target.classList.add('shake');
}

function spawnFx(className, count) {
  const zone = app.querySelector('.fx-layer') || app;
  const box = zone.getBoundingClientRect();
  for (let index = 0; index < count; index += 1) {
    const fx = document.createElement('span');
    fx.className = className;
    fx.style.left = `${Math.random() * box.width}px`;
    fx.style.top = `${box.height * (.35 + Math.random() * .45)}px`;
    zone.appendChild(fx);
    setTimeout(() => fx.remove(), 1700);
  }
}

window.addEventListener('resize', syncViewportMode);
window.addEventListener('orientationchange', syncViewportMode);
app.addEventListener('click', handleGlobalButtonAudio, true);
app.addEventListener('contextmenu', (e) => e.preventDefault());
app.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains('gift-ded') || e.target.classList.contains('gift-falling-item')) {
    e.preventDefault();
  }
});
app.addEventListener('pointermove', (e) => {
  if (e.buttons === 2) e.preventDefault();
});
bootGame();





