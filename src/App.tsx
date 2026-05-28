import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  ChevronLeft, 
  BookOpen, 
  Calendar, 
  Binary, 
  Palette, 
  CloudSun, 
  Sparkles, 
  Heart, 
  ShoppingBag,
  Info,
  Compass,
  FileText,
  VolumeX,
  Languages
} from 'lucide-react';

import { LETTERS, DAYS, NUMBERS, COLORS, SEASONS, MONTHS, ORGANS, FRUITS, GRADS } from './data';
import { ActiveSection, LetterItem, DayItem, NumberItem, ColorItem, SeasonItem, MonthItem, OrganItem, FruitItem } from './types';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [popupItem, setPopupItem] = useState<any | null>(null);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [drawerImgSrc, setDrawerImgSrc] = useState<string | null>(null);
  const [popupGrad, setPopupGrad] = useState<string[]>(['linear-gradient(135deg, #FF6B35, #E04010)', '#A03010']);
  const [popupLabel, setPopupLabel] = useState<string>('');
  const [expandedPoster, setExpandedPoster] = useState<{ url: string; title: string } | null>(null);

  // Mini-game states for open learning posters
  const [posterMode, setPosterMode] = useState<'poster' | 'game'>('game');
  const [gameScore, setGameScore] = useState<number>(0);
  const [gameQuestion, setGameQuestion] = useState<any | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Playground specific states
  const [pgTab, setPgTab] = useState<'story' | 'riddle' | 'alchemy'>('story');
  
  // Story Maker states
  const [storyCharacter, setStoryCharacter] = useState<string>('Sheep 🐑');
  const [storyTopic, setStoryTopic] = useState<string>('Magical Woods 🌲');
  const [storyLoading, setStoryLoading] = useState<boolean>(false);
  const [storyResult, setStoryResult] = useState<any | null>(null);
  
  // Riddle Box states
  const [riddleCategory, setRiddleCategory] = useState<string>('animals');
  const [riddleLoading, setRiddleLoading] = useState<boolean>(false);
  const [riddleResult, setRiddleResult] = useState<any | null>(null);
  const [selectedRiddleOption, setSelectedRiddleOption] = useState<number | null>(null);
  const [riddleAnswered, setRiddleAnswered] = useState<boolean>(false);
  const [isRiddleCorrect, setIsRiddleCorrect] = useState<boolean | null>(null);
  const [riddleFeedbackMessage, setRiddleFeedbackMessage] = useState<string>('');

  // Word Alchemy states
  const [alchemyInput, setAlchemyInput] = useState<string>('');
  const [alchemyLoading, setAlchemyLoading] = useState<boolean>(false);
  const [alchemyResult, setAlchemyResult] = useState<any | null>(null);
  const [alchemyError, setAlchemyError] = useState<string | null>(null);

  const generateStory = async () => {
    setStoryLoading(true);
    setStoryResult(null);
    try {
      const res = await fetch('/api/gemini/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: storyCharacter, topic: storyTopic })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      setStoryResult(data);
    } catch (e: any) {
      console.error(e);
      alert("Error generating story: " + e.message);
    } finally {
      setStoryLoading(false);
    }
  };

  const generateRiddle = async () => {
    setRiddleLoading(true);
    setRiddleResult(null);
    setSelectedRiddleOption(null);
    setRiddleAnswered(false);
    setIsRiddleCorrect(null);
    setRiddleFeedbackMessage('');
    try {
      const res = await fetch('/api/gemini/riddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: riddleCategory })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      setRiddleResult(data);
    } catch (e: any) {
      console.error(e);
      alert("Error generating riddle: " + e.message);
    } finally {
      setRiddleLoading(false);
    }
  };

  const handleRiddleAnswer = (idx: number) => {
    if (riddleAnswered || !riddleResult) return;
    setSelectedRiddleOption(idx);
    setRiddleAnswered(true);
    const correct = idx === riddleResult.correctAnswerIdx;
    setIsRiddleCorrect(correct);
    if (correct) {
      playBeep('tada');
      setRiddleFeedbackMessage(`🎉 Brilliant! ${riddleResult.correctAnswerEnglish} is correct! ${riddleResult.explanation}`);
    } else {
      playBeep('pop');
      const correctWord = riddleResult.options[riddleResult.correctAnswerIdx];
      setRiddleFeedbackMessage(`🌸 Almost! The correct answer is "${correctWord}" (${riddleResult.correctAnswerEnglish}). ${riddleResult.explanation}`);
    }
  };

  const runAlchemy = async () => {
    if (!alchemyInput.trim()) return;
    setAlchemyLoading(true);
    setAlchemyResult(null);
    setAlchemyError(null);
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: alchemyInput.trim() })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      setAlchemyResult(data);
    } catch (e: any) {
      console.error(e);
      setAlchemyError(e.message || "Failed to find the magic words.");
    } finally {
      setAlchemyLoading(false);
    }
  };

  const generatePosterQuestion = (url: string) => {
    let type = '';
    const lowUrl = url.toLowerCase();
    if (lowUrl.includes('alpha') || lowUrl.includes('letters')) type = 'letters';
    else if (lowUrl.includes('days')) type = 'days';
    else if (lowUrl.includes('num')) type = 'numbers';
    else if (lowUrl.includes('color')) type = 'colors';
    else if (lowUrl.includes('season')) type = 'seasons';
    else if (lowUrl.includes('organ')) type = 'organs';
    else if (lowUrl.includes('fruit')) type = 'fruits';

    if (!type) return null;

    let questionText = '';
    let questionSubtitle = '';
    let options: any[] = [];
    let correctIdx = 0;
    let correctItem: any = null;

    if (type === 'letters') {
      correctItem = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      questionText = `ⵎⴰⵏⵉ ⵢⵍⵍⴰ ⵓⵙⴽⴽⵉⵍ: "${correctItem.l}"?`;
      questionSubtitle = `ⵙⵙⴼెలⴷ: /${correctItem.label}/`;
      
      const candidates = LETTERS.filter(x => x.l !== correctItem.l);
      const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
      const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
      
      options = chosen.map(item => ({
        label: item.l,
        display: (
          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-4xl font-extrabold text-amber-900 select-none">{item.l}</span>
            <span className="text-xs text-neutral-550 font-mono mt-1 select-none">/{item.label}/</span>
          </div>
        ),
        id: item.l,
        item: item
      }));
      correctIdx = chosen.findIndex(x => x.l === correctItem.l);

    } else if (type === 'days') {
      correctItem = DAYS[Math.floor(Math.random() * DAYS.length)];
      questionText = `ⵎⴰⵏ ⵡⴰⵙⵙ ⵏ: "${correctItem.tif}"?`;
      questionSubtitle = `(${correctItem.lat})`;
      
      const candidates = DAYS.filter(x => x.tif !== correctItem.tif);
      const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
      const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
      
      options = chosen.map(item => ({
        label: item.tif,
        display: (
          <div className="flex flex-col items-center justify-center p-3 gap-1">
            <span className="text-2xl font-bold text-neutral-800 select-none">{item.tif}</span>
            <span className="text-xl select-none">{item.icon}</span>
          </div>
        ),
        id: item.tif,
        item: item
      }));
      correctIdx = chosen.findIndex(x => x.tif === correctItem.tif);

    } else if (type === 'numbers') {
      correctItem = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
      const styleCoin = Math.random() > 0.5;
      
      if (styleCoin) {
        questionText = `ⵎⴰⵏⵉ ⵓⵎⴹⴰⵏ: "${correctItem.tif}"?`;
        questionSubtitle = `(${correctItem.num})`;
        
        const candidates = NUMBERS.filter(x => x.num !== correctItem.num);
        const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
        const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
        
        options = chosen.map(item => ({
          label: String(item.num),
          display: (
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-3xl font-black text-amber-800 select-none">{item.num}</span>
              <span className="text-xl mt-1 select-none">{item.emoji}</span>
            </div>
          ),
          id: String(item.num),
          item: item
        }));
        correctIdx = chosen.findIndex(x => x.num === correctItem.num);
      } else {
        questionText = `ⵎⴰⵏⵉ ⵢⵉⵙⵎ ⵏ: ${correctItem.num} ${correctItem.emoji}?`;
        questionSubtitle = `${correctItem.tif}`;

        const candidates = NUMBERS.filter(x => x.num !== correctItem.num);
        const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
        const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());

        options = chosen.map(item => ({
          label: item.tif,
          display: (
            <div className="flex flex-col items-center justify-center p-2">
              <span className="text-lg font-bold text-neutral-800 select-none">{item.tif}</span>
              <span className="text-sm text-neutral-500 font-mono mt-1 select-none">/{item.num}/</span>
            </div>
          ),
          id: item.tif,
          item: item
        }));
        correctIdx = chosen.findIndex(x => x.num === correctItem.num);
      }

    } else if (type === 'colors') {
      correctItem = COLORS[Math.floor(Math.random() * COLORS.length)];
      questionText = `ⵎⴰⵏⵉ ⵉⴽⵯⵍⵉ ⵏ: "${correctItem.tif}"?`;
      questionSubtitle = `(${correctItem.lat})`;
      
      const candidates = COLORS.filter(x => x.tif !== correctItem.tif);
      const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
      const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
      
      options = chosen.map(item => ({
        label: item.tif,
        display: (
          <div className="flex flex-col items-center justify-center p-2 w-full h-full">
            <div 
              className="w-12 h-12 rounded-full border-2 border-stone-300 shadow-inner mb-2 select-none"
              style={{ backgroundColor: item.bg }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 font-mono select-none">{item.tif}</span>
          </div>
        ),
        id: item.tif,
        item: item
      }));
      correctIdx = chosen.findIndex(x => x.tif === correctItem.tif);

    } else if (type === 'seasons') {
      correctItem = SEASONS[Math.floor(Math.random() * SEASONS.length)];
      questionText = `ⵎⴰⵏ ⵉⵎⵉⵔ ⵏ: "${correctItem.tif}"?`;
      questionSubtitle = `(${correctItem.lat})`;
      
      const candidates = SEASONS.filter(x => x.tif !== correctItem.tif);
      const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
      const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
      
      options = chosen.map(item => ({
        label: item.tif,
        display: (
          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-4xl filter drop-shadow-sm select-none">{item.emoji}</span>
            <span className="text-sm font-bold text-amber-950 mt-1 select-none">{item.tif}</span>
          </div>
        ),
        id: item.tif,
        item: item
      }));
      correctIdx = chosen.findIndex(x => x.tif === correctItem.tif);

    } else if (type === 'organs') {
      correctItem = ORGANS[Math.floor(Math.random() * ORGANS.length)];
      questionText = `ⵎⴰⵏ ⵜⴰⴼⴳⴳⴰ ⵏ: "${correctItem.tif}"?`;
      questionSubtitle = `(${correctItem.lat})`;
      
      const candidates = ORGANS.filter(x => x.tif !== correctItem.tif);
      const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
      const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
      
      options = chosen.map(item => ({
        label: item.tif,
        display: (
          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-4xl filter drop-shadow select-none">{item.emoji}</span>
            <span className="text-xs font-mono text-neutral-500 mt-2 select-none">/{item.lat}/</span>
          </div>
        ),
        id: item.tif,
        item: item
      }));
      correctIdx = chosen.findIndex(x => x.tif === correctItem.tif);

    } else { // fruits
      correctItem = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      questionText = `ⵎⴰⵏⵉ ⵢⵍⵍⴰ: "${correctItem.tif}"?`;
      questionSubtitle = `(${correctItem.lat})`;
      
      const candidates = FRUITS.filter(x => x.tif !== correctItem.tif);
      const shuffledCandidates = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 3);
      const chosen = [correctItem, ...shuffledCandidates].sort(() => 0.5 - Math.random());
      
      options = chosen.map(item => ({
        label: item.tif,
        display: (
          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-4xl select-none">{item.emoji}</span>
            <span className="text-xs text-neutral-500 font-mono mt-1 font-bold select-none">/{correctItem.lat}/</span>
          </div>
        ),
        id: item.tif,
        item: item
      }));
      correctIdx = chosen.findIndex(x => x.tif === correctItem.tif);
    }

    return {
      type,
      questionText,
      questionSubtitle,
      options,
      correctIdx,
      originalItem: correctItem
    };
  };

  const startNewGameRound = (url: string) => {
    setSelectedOptionId(null);
    setGameStatus('idle');
    const q = generatePosterQuestion(url);
    setGameQuestion(q);
  };

  const handleOptionClick = (option: any, index: number) => {
    if (gameStatus !== 'idle') return;
    setSelectedOptionId(option.id);
    if (index === gameQuestion.correctIdx) {
      setGameStatus('correct');
      setGameScore(prev => prev + 1);
      playBeep('tada');

      const item = gameQuestion.originalItem;
      if (item) {
        const soundFile = item.sound || '';
        const backupTif = item.word || item.tif || item.l || '';
        const backupLat = item.label || item.lat || '';
        handlePlaySound(soundFile, backupTif, backupLat);
      }
    } else {
      setGameStatus('wrong');
      playBeep('bloop');
    }
  };

  useEffect(() => {
    if (expandedPoster) {
      setPosterMode('game');
      setGameScore(0);
      setGameStatus('idle');
      setSelectedOptionId(null);
      const q = generatePosterQuestion(expandedPoster.url);
      setGameQuestion(q);
    } else {
      setGameQuestion(null);
    }
  }, [expandedPoster]);

  const getPosterForSection = (section: string) => {
    switch (section) {
      case 'letters':
        return '/src/assets/images/cat_alphabets_1779617263160.png';
      case 'days':
        return '/src/assets/images/cat_days_1779617304531.png';
      case 'numbers':
        return '/src/assets/images/cat_numbers_1779617345744.png';
      case 'colors':
        return '/src/assets/images/cat_colors_1779617388646.png';
      case 'seasons':
        return '/src/assets/images/cat_seasons_1779617413796.png';
      case 'organs':
        return '/src/assets/images/cat_organs_1779617439439.png';
      case 'fruits':
        return '/src/assets/images/cat_fruits_1779617475517.png';
      default:
        return null;
    }
  };

  useEffect(() => {
    setImgLoaded(false);
    if (popupItem) {
      let initialSrc: string | null = null;
      if (popupItem.img && (popupItem.img.startsWith('http') || popupItem.img.startsWith('/src/'))) {
        initialSrc = popupItem.img;
      } else {
        initialSrc = getPosterForSection(activeSection);
      }
      setDrawerImgSrc(initialSrc);
    } else {
      setDrawerImgSrc(null);
    }
  }, [popupItem, activeSection]);
  
  // TTS & Audio State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play a procedurally generated friendly beep using Web Audio API for visual satisfaction
  const playBeep = (type: 'bloop' | 'tada' | 'pop') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'bloop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'tada') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 notes cascade
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.22);
          osc.start(ctx.currentTime + idx * 0.07);
          osc.stop(ctx.currentTime + idx * 0.07 + 0.22);
        });
      }
    } catch (err) {
      console.warn("Audio Context did not initialize:", err);
    }
  };

  // Play audio file with SpeechSynthesis fallback
  const handlePlaySound = (soundFile: string, backupTifinagh: string, backupLatin: string) => {
    // Terminate any standard playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsSpeaking(true);

    const speakFallback = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        // We speak the Latin translation or say it syllable by syllable so the child learns
        const speechText = `${backupLatin}`;
        const utterance = new SpeechSynthesisUtterance(speechText);
        
        // Use a friendly speed
        utterance.rate = 0.85;
        utterance.pitch = 1.15; // slightly higher pitch to sound cute/kid-friendly
        
        // Look for Moroccan French/Spanish or general friendly voice
        const voices = window.speechSynthesis.getVoices();
        const selectVoice = voices.find(v => v.lang.startsWith('fr') || v.lang.startsWith('es') || v.lang.includes('Morocco')) || voices[0];
        if (selectVoice) {
          utterance.voice = selectVoice;
        }

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    };

    // Attempt to load and play audio element from the real workspace
    const audio = new Audio(soundFile);
    audio.onerror = () => {
      // Sound file not uploaded yet or fails: activate standard fallback
      speakFallback();
    };
    audio.onended = () => {
      setIsSpeaking(false);
    };
    audioRef.current = audio;

    audio.play().catch((err) => {
      // Catch browser play policies, fallback to SpeechSynthesis
      speakFallback();
    });
  };

  const renderHighlightedWord = (word: string, letter: string, highlightColor: string = '#E04010') => {
    if (!word) return null;
    if (!letter) return <span>{word}</span>;
    const escapedLetter = letter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = word.split(new RegExp(`(${escapedLetter})`, 'g'));
    return (
      <span>
        {parts.map((part, idx) => {
          if (part === letter) {
            return (
              <span key={idx} style={{ color: highlightColor }} className="font-extrabold scale-110 inline-block text-shadow-sm">
                {part}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  const openDrawer = (item: any, grad: string[], labelText: string) => {
    playBeep('pop');
    setPopupItem(item);
    setPopupGrad(grad);
    setPopupLabel(labelText);
    
    // Automatically speak when letter/fruit is clicked (kids love immediate sound!)
    const backupTif = item.word || item.tif || '';
    const backupLat = item.label || item.lat || '';
    handlePlaySound(item.sound, backupTif, backupLat);
  };

  const closeDrawer = () => {
    playBeep('bloop');
    setPopupItem(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Handle section route updates
  const handleNavigate = (section: ActiveSection) => {
    playBeep('bloop');
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keep voices loaded for fallback
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col select-none overflow-x-hidden pb-12 font-sans bg-amber-50/20">
      
      {/* Scenic kids landscape background image with safe visibility for children theme */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-20 opacity-[0.15]" 
        style={{ backgroundImage: "url('/src/assets/images/spring_season_1779576383086.png')" }} 
      />
      
      {/* Whimsical Kids Theme Sky & Clouds backdrop */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-sky-200/50 to-amber-50/0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-8 left-1/10 w-24 h-12 bg-white/70 rounded-full blur-sm cartoon-cloud animate-bob" style={{ animationDelay: '0s' }} />
        <div className="absolute top-16 right-1/12 w-32 h-14 bg-white/60 rounded-full blur-sm cartoon-cloud animate-bob" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-28 left-1/3 w-16 h-8 bg-white/50 rounded-full blur-sm cartoon-cloud animate-bob" style={{ animationDelay: '3s' }} />
      </div>

      {/* Primary Header/Topbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b-2 border-amber-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {activeSection !== 'home' && (
            <motion.button 
              id="back-button-topbar"
              whileTap={{ scale: 0.85 }} 
              onClick={() => handleNavigate('home')}
              className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors pointer-events-auto cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[3]" />
            </motion.button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-amber-900 flex items-center gap-2">
              <span>ⵜⴰⵎⴰⵣⵉⵖⵜ</span>
              <span className="text-xs bg-amber-200 text-amber-950 font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:inline-block">Tifinagh</span>
            </h1>
            <p className="text-[11px] text-amber-700/80 font-medium font-sans">
              {activeSection === 'home' ? 'Beginners & Kids Learning Space' : `Learning Area • ${activeSection.toUpperCase()}`}
            </p>
          </div>
        </div>

        {/* Display interactive speaker if talking */}
        {isSpeaking && (
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full border border-amber-205 animate-pulse">
            <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span className="text-xs font-semibold">Listening...</span>
          </div>
        )}
      </header>

      {/* Main Container Area */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-6 flex-1">
        
        {/* Screen: Home Menu */}
        {activeSection === 'home' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Whimsical Welcome Card */}
            <div id="home-welcome-hero" className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-teal-900/10 border-b-6 border-teal-800 animate-bob h-52 flex flex-col justify-center">
              <img 
                src="/src/assets/images/home_hero_1779617236165.png" 
                alt="Tamazight Learning Pathway" 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-35 transition-all hover:scale-105 duration-1000" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-950 via-teal-900/70 to-transparent pointer-events-none" />
              <div className="relative z-10 max-w-md space-y-2">
                <span className="bg-emerald-400/35 border border-emerald-300/30 select-none text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full text-white inline-block">
                  ⴰⵙⵍⵎⴷ
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md text-yellow-300">ⵜⴰⵎⴰⵣⵉⵖⵜ ⵏ ⵡⴰⵣⵣⴰⵏ</h2>
                <div className="text-teal-100 text-[11px] sm:text-xs font-semibold leading-relaxed tracking-wider select-none bg-black/10 px-3 py-1.5 rounded-xl border border-white/10 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap drop-shadow-sm">
                  ⴰ • ⴱ • ⴳ • ⴷ • ⴹ • ⴻ • ⴼ • ⴽ • ⵀ • ⵃ • ⵄ • ⵅ • ⵇ • ⵉ • ⵊ • ⵍ • ⵎ • ⵏ • ⵓ • ⵔ • ⵕ • ⵙ • ⵚ • ⵛ • ⵜ • ⵟ • ⵡ • ⵢ • ⵣ • ⵥ
                </div>
              </div>
            </div>

            {/* Quick Helper Label */}
            <div className="text-center font-bold text-amber-900/80 text-sm tracking-widest uppercase flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
              <span className="text-base font-extrabold text-amber-950 tracking-wide font-sans">ⴰⵙⵍⵎⴷ ⵏ ⵜⵎⴰⵣⵉⵖⵜ</span>
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
            </div>

            {/* Path Grid: 7 Categories matching user HTML layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-8">
              
              {/* Card 1: Letters */}
              <motion.div
                id="home-card-letters"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('letters')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-orange-500 hover:border-orange-600 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="w-full h-36 mx-auto bg-orange-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-orange-100/50">
                  <img 
                    src="/src/assets/images/cat_alphabets_1779617263160.png" 
                    alt="Letters" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵉⵙⴽⴽⵉⵍⵏ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">33 Alphabets</p>
                </div>
              </motion.div>

              {/* Card 2: Days */}
              <motion.div
                id="home-card-days"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('days')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-sky-400 hover:border-sky-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="w-full h-36 mx-auto bg-sky-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-sky-100/50">
                  <img 
                    src="/src/assets/images/cat_days_1779617304531.png" 
                    alt="Days" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵓⵙⵙⴰⵏ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">Days of Week</p>
                </div>
              </motion.div>

              {/* Card 3: Numbers */}
              <motion.div
                id="home-card-numbers"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('numbers')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-emerald-500 hover:border-emerald-600 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="w-full h-36 mx-auto bg-emerald-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-emerald-100/50">
                  <img 
                    src="/src/assets/images/cat_numbers_1779617345744.png" 
                    alt="Numbers" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵉⵣⵡⵉⵍⵏ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">Numbers (0-20)</p>
                </div>
              </motion.div>

              {/* Card 4: Colors */}
              <motion.div
                id="home-card-colors"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('colors')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-violet-500 hover:border-violet-600 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="w-full h-36 mx-auto bg-violet-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-violet-100/50">
                  <img 
                    src="/src/assets/images/cat_colors_1779617388646.png" 
                    alt="Colors" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵉⴽⵯⵍⴰⵏ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">Colors Palette</p>
                </div>
              </motion.div>

              {/* Card 5: Seasons & Months */}
              <motion.div
                id="home-card-seasonsmonths"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('seasonsmonths')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-emerald-600 hover:border-emerald-700 transition-all cursor-pointer flex flex-col justify-between col-span-1 md:col-span-1"
              >
                <div className="w-full h-36 mx-auto bg-emerald-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-emerald-100/30">
                  <img 
                    src="/src/assets/images/cat_seasons_1779617413796.png" 
                    alt="Seasons & Months" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵉⵎⵉⵔⵏ · ⵉⵔⵏ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">Seasons & Months</p>
                </div>
              </motion.div>

              {/* Card 6: Human Organs */}
              <motion.div
                id="home-card-organs"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('organs')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-pink-500 hover:border-pink-600 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="w-full h-36 mx-auto bg-pink-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-pink-100/50">
                  <img 
                    src="/src/assets/images/cat_organs_1779617439439.png" 
                    alt="Body Organs" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵜⴰⴼⴳⴳⴰ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">Body Organs</p>
                </div>
              </motion.div>

              {/* Card 7: Fruits & Vegetables */}
              <motion.div
                id="home-card-fruits"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('fruits')}
                className="bg-white rounded-3xl p-4 text-center shadow-lg border-b-6 border-amber-500 hover:border-amber-600 transition-all cursor-pointer flex flex-col justify-between col-span-1 md:col-span-1"
              >
                <div className="w-full h-36 mx-auto bg-amber-50/50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center relative border border-amber-100/50">
                  <img 
                    src="/src/assets/images/cat_fruits_1779617475517.png" 
                    alt="Fruits & Vegetables" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-800">ⵉⴳⵓⵎⵎⴰ ⴷ ⵓⵜⵛⵉ</h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-1">Fruits & Foods</p>
                </div>
              </motion.div>

              {/* Card 8: Gemini AI Magic Playground */}
              <motion.div
                id="home-card-playground"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('playground')}
                className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white rounded-3xl p-5 text-center shadow-lg border-b-6 border-indigo-800 hover:border-indigo-900 transition-all cursor-pointer flex flex-col justify-between col-span-2 md:col-span-2 relative overflow-hidden group"
              >
                {/* Decorative floating shapes for child-like fantasy feel */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-pink-500/25 rounded-full blur-lg pointer-events-none" />
                
                <div className="w-full h-36 mx-auto bg-white/10 rounded-2xl mb-3 flex flex-col items-center justify-center relative border border-white/20 overflow-hidden">
                  <span className="text-5xl animate-bounce mb-1">🧙‍♂️✨</span>
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-950 font-sans font-bold text-[9px] uppercase px-2 py-0.5 rounded-full shadow border border-yellow-200 tracking-wider">
                    Smart AI
                  </div>
                  <p className="text-[10px] font-mono font-bold tracking-widest text-indigo-200 mt-1 uppercase">Tamazight AI Tutor</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold tracking-wide text-yellow-300 drop-shadow flex items-center justify-center gap-1.5">
                    <span>ⵓⵔⴰⵔ ⵏ ⵜⵎⵓⵙⵏⵉ</span>
                  </h3>
                  <p className="text-xs text-indigo-100 font-semibold mt-1 font-sans">AI Magic Kids Playground</p>
                </div>
              </motion.div>

            </div>
          </div>
        )}

        {/* Screen: Letters */}
        {activeSection === 'letters' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-amber-100">
              <span className="text-sm font-bold text-amber-900">🔔 Tap an alphabet below to learn its sounds and words!</span>
            </div>

            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_alphabets_1779617263160.png', title: 'ⵉⵙⴽⴽⵉⵍⵏ • Alphabet Chart Poster' });
              }}
              className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-4 border-2 border-orange-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-orange-200 p-1 flex-shrink-0 flex items-center justify-center">
                  <img src="/src/assets/images/cat_alphabets_1779617263160.png" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-orange-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    <span>Alphabet Reference Chart</span>
                  </h3>
                  <p className="text-xs text-orange-850/80 leading-relaxed max-w-sm mt-0.5">
                    Tap to open the complete rich visual poster for the Tamazight alphabets with beautiful illustrations!
                  </p>
                </div>
              </div>
              <button className="px-5 py-2 rounded-2xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 shadow border-b-4 border-orange-700 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                <span>🔍 Open Poster</span>
              </button>
            </motion.div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {LETTERS.map((item, i) => {
                const grad = GRADS[i % GRADS.length];
                return (
                  <motion.div
                    key={`letter-${i}`}
                    whileHover={{ scale: 1.05, rotate: [-1, 1, -1] }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDrawer(item, grad, item.l)}
                    className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border-b-4 shadow-md text-center cursor-pointer select-none transition-all hover:shadow-lg"
                    style={{ borderColor: grad[1] }}
                  >
                    {/* Character in Circle Badge */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow relative"
                      style={{ background: grad[0] }}
                    >
                      {item.l}
                    </div>

                    {/* Cute Kid-Friendly Illustration Frame */}
                    <div className="w-16 h-16 bg-neutral-50 rounded-2xl overflow-hidden mt-2 flex items-center justify-center border border-neutral-100 flex-shrink-0 relative shadow-inner">
                      <img 
                        src={item.img} 
                        alt={item.word} 
                        className="w-12 h-12 object-contain select-none z-10 p-0.5 transition-transform hover:scale-110 duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0';
                        }}
                      />
                      <span className="text-xl absolute inset-0 flex items-center justify-center -z-10 bg-neutral-50 select-none">
                        {item.emoji}
                      </span>
                    </div>

                    {/* Highlighted Word */}
                    <div className="text-xs font-bold text-neutral-800 tracking-wide mt-1.5 transition-colors group-hover:text-amber-900 truncate max-w-full px-1">
                      {renderHighlightedWord(item.word, item.l, grad[1])}
                    </div>

                    {/* Phonetic label */}
                    <span className="text-[10px] font-bold text-neutral-500 mt-0.5 block capitalize font-mono">[{item.label}]</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Screen: Days */}
        {activeSection === 'days' && (
          <div className="space-y-4 max-w-lg mx-auto pb-10">
            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_days_1779617304531.png', title: 'ⵓⵙⵙⴰⵏ • Days of the Week Wheel' });
              }}
              className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-3xl p-4 border-2 border-sky-200 shadow-md flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-sky-200 p-1 flex-shrink-0 flex items-center justify-center">
                  <img src="/src/assets/images/cat_days_1779617304531.png" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sky-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
                    <span>Days Calendar Wheel</span>
                  </h3>
                  <p className="text-xs text-sky-850/80 leading-relaxed max-w-xs mt-0.5">
                    Tap to view the beautiful colorful daily spinner and calendar cycle!
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-2xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 shadow border-b-4 border-sky-700 transition-all flex items-center gap-1.5 justify-center flex-shrink-0">
                <span>🔍 Open</span>
              </button>
            </motion.div>

            {DAYS.map((day, dIdx) => (
              <motion.div
                key={`day-${dIdx}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => openDrawer({ l: '', word: day.tif, lat: day.lat, emoji: day.icon, sound: day.sound }, [day.color || '#4A90D9', day.color || '#4A90D9'], day.icon)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-amber-100 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${day.color}20` }}
                  >
                    {day.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-neutral-800 tracking-wide">{day.tif}</h4>
                    <p className="text-xs text-neutral-500 font-semibold">{day.lat}</p>
                  </div>
                </div>
                <button 
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 text-amber-700 font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaySound(day.sound, day.tif, day.lat);
                  }}
                >
                  🔊
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Screen: Numbers */}
        {activeSection === 'numbers' && (
          <div className="space-y-6">
            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_numbers_1779617345744.png', title: 'ⵉⵣⵡⵉⵍⵏ • Numbers Scale Poster' });
              }}
              className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl p-4 border-2 border-emerald-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-emerald-200 p-1 flex-shrink-0 flex items-center justify-center">
                  <img src="/src/assets/images/cat_numbers_1779617345744.png" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Count Numbers Board</span>
                  </h3>
                  <p className="text-xs text-emerald-850/80 leading-relaxed max-w-sm mt-0.5">
                    Tap to open the beautiful child-friendly counting chart with giant cartoon numbers!
                  </p>
                </div>
              </div>
              <button className="px-5 py-2 rounded-2xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 shadow border-b-4 border-emerald-700 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                <span>🔍 Open Poster</span>
              </button>
            </motion.div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {NUMBERS.map((n, i) => {
                const grad = GRADS[i % GRADS.length];
                return (
                  <motion.div
                    key={`num-${i}`}
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDrawer({ ...n, l: String(n.num), word: n.tif }, grad, String(n.num))}
                    className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center border-b-4 shadow-md text-center cursor-pointer select-none"
                    style={{ borderColor: grad[1] }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-md"
                      style={{ background: grad[0] }}
                    >
                      {n.num}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 mt-2 block truncate w-full">{n.tif}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Screen: Colors */}
        {activeSection === 'colors' && (
          <div className="space-y-6">
            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_colors_1779617388646.png', title: 'ⵉⴽⵯⵍⴰⵏ • Painter\'s Color Palette' });
              }}
              className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-3xl p-4 border-2 border-violet-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-violet-200 p-1 flex-shrink-0 flex items-center justify-center">
                  <img src="/src/assets/images/cat_colors_1779617388646.png" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-violet-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                    <span>Artist Paint Palette</span>
                  </h3>
                  <p className="text-xs text-violet-850/80 leading-relaxed max-w-sm mt-0.5">
                    Tap to open the complete smiling palette showing the primary colors with Tifinagh labels!
                  </p>
                </div>
              </div>
              <button className="px-5 py-2 rounded-2xl bg-violet-500 text-white font-bold text-xs hover:bg-violet-600 shadow border-b-4 border-violet-700 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                <span>🔍 Open Palette</span>
              </button>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {COLORS.map((c, i) => (
                <motion.div
                  key={`color-${i}`}
                  whileHover={{ scale: 1.03, rotate: i % 2 === 0 ? 1 : -1 }}
                  onClick={() => openDrawer({ l: '', word: c.tif, lat: c.lat, emoji: '🎨', sound: c.sound }, [`linear-gradient(135deg, ${c.bg}, ${c.bg})`, `${c.bg}`], '🎨')}
                  className="rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer relative shadow-lg overflow-hidden border border-black/5"
                  style={{ backgroundColor: c.bg }}
                >
                  <div className="absolute top-2 right-2 opacity-15">
                    <Palette className="w-12 h-12 text-black" />
                  </div>
                  <h4 
                    className="text-2xl font-bold tracking-widest text-shadow-sm"
                    style={{ color: c.text }}
                  >
                    {c.tif}
                  </h4>
                  <p 
                    className="text-xs font-semibold opacity-85 mt-1"
                    style={{ color: c.text }}
                  >
                    {c.lat}
                  </p>
                  
                  <button 
                    className="mt-2.5 px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 hover:scale-105 transition-transform"
                    style={{ color: c.text, borderColor: `${c.text}50`, backgroundColor: `${c.text}10` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySound(c.sound, c.tif, c.lat);
                    }}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>ⵙⵙⵏ</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Screen: Seasons & Months */}
        {activeSection === 'seasonsmonths' && (
          <div className="space-y-8">
            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_seasons_1779617413796.png', title: 'ⵉⵎⵉⵔⵏ ⵏ ⵓⵙⴳⴳⵯⴰⵙ • Four Seasons Circle' });
              }}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-4 border-2 border-teal-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-teal-200 p-1 flex-shrink-0 flex items-center justify-center">
                  <img src="/src/assets/images/cat_seasons_1779617413796.png" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-teal-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                    <span>Four Seasons Cycle Chart</span>
                  </h3>
                  <p className="text-xs text-teal-850/80 leading-relaxed max-w-sm mt-0.5">
                    Tap to view the complete cycle showing Spring, Summer, Autumn and Winter together!
                  </p>
                </div>
              </div>
              <button className="px-5 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-750 shadow border-b-4 border-emerald-800 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                <span>🔍 Open Cycle</span>
              </button>
            </motion.div>
            
            {/* Seasons part */}
            <div>
              <h3 className="text-sm font-bold/80 tracking-widest text-neutral-500 uppercase mb-4 flex items-center gap-2">
                <span>ⵉⵎⵉⵔⵏ</span>
                <span className="h-0.5 bg-neutral-300 flex-1" />
                <span>Seasons</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SEASONS.map((s, idx) => (
                  <motion.div
                    key={`season-${idx}`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => openDrawer({ l: '', word: s.tif, lat: `${s.lat} (${s.months})`, emoji: s.emoji, img: s.img, sound: s.sound }, [s.bg, '#1B5E20'], s.emoji)}
                    className="bg-white rounded-3xl overflow-hidden shadow-md flex flex-col border border-amber-100/50 cursor-pointer"
                  >
                    <div className="bg-amber-50/40 flex items-center justify-center h-48 relative overflow-hidden">
                      {s.img ? (
                        <img 
                          src={s.img} 
                          alt={s.lat} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className="text-5xl absolute z-0 opacity-60 animate-bob">{s.emoji}</span>
                    </div>
                    <div 
                      className="p-4 text-white flex items-center justify-between gap-2 border-t"
                      style={{ background: s.bg }}
                    >
                      <div>
                        <h4 className="text-xl font-bold">{s.tif}</h4>
                        <p className="text-xs opacity-90">{s.lat}</p>
                        <p className="text-[10px] opacity-75 mt-1">{s.months}</p>
                      </div>
                      <button 
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 border-2 border-white/60 hover:bg-white/30 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySound(s.sound, s.tif, s.lat);
                        }}
                      >
                        🔊
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Months part */}
            <div>
              <h3 className="text-sm font-bold/80 tracking-widest text-neutral-500 uppercase mb-4 flex items-center gap-2">
                <span>ⵉⵔⵏ</span>
                <span className="h-0.5 bg-neutral-300 flex-1" />
                <span>Months</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MONTHS.map((m, idx) => (
                  <motion.div
                    key={`month-${idx}`}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => openDrawer({ l: String(m.num), word: m.tif, lat: `Month ${m.num}`, emoji: m.emoji, sound: m.sound }, [m.bg, m.bg], m.emoji)}
                    className="rounded-xl p-3 text-white flex flex-col justify-between items-stretch shadow-md h-24 relative cursor-pointer"
                    style={{ backgroundColor: m.bg }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-lg font-bold bg-white/20 backdrop-blur-sm rounded-lg px-2 py-0.5">{m.num}</span>
                      <span className="text-2xl">{m.emoji}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-sm tracking-wide truncate pr-1">{m.tif}</span>
                      <button 
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySound(m.sound, m.tif, String(m.num));
                        }}
                      >
                        🔊
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Screen: Organs */}
        {activeSection === 'organs' && (
          <div className="space-y-6">
            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_organs_1779617439439.png', title: 'ⵜⴰⴼⴳⴳⴰ ⵏ ⵓⴼⴳⴰⵏ • Human Organs Poster' });
              }}
              className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-3xl p-4 border-2 border-pink-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-pink-200 p-1 flex-shrink-0 flex items-center justify-center">
                  <img src="/src/assets/images/cat_organs_1779617439439.png" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
                    <span>Human Body Anatomy Chart</span>
                  </h3>
                  <p className="text-xs text-rose-850/80 leading-relaxed max-w-sm mt-0.5">
                    Tap to view the beautiful complete kid anatomy schematic, with points labeling body organs!
                  </p>
                </div>
              </div>
              <button className="px-5 py-2 rounded-2xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 shadow border-b-4 border-pink-700 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                <span>🔍 Open Anatomy</span>
              </button>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ORGANS.map((o, idx) => (
                <motion.div
                  key={`organ-${idx}`}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => openDrawer({ l: '', word: o.tif.replace('_ear', ''), lat: o.lat, emoji: o.emoji, img: o.img, sound: o.sound }, ['linear-gradient(135deg, #EC4899, #BE185D)', '#9D174D'], o.emoji)}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-transform text-center flex flex-col items-center justify-between border-t-4 cursor-pointer"
                  style={{ borderTopColor: '#EC4899' }}
                >
                  <div className="w-14 h-14 bg-pink-50 rounded-2xl border border-pink-100 flex items-center justify-center text-3xl mb-3">
                    {o.emoji}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-neutral-800 tracking-wide">{o.tif.replace('_ear', '')}</h4>
                    <p className="text-[11px] text-neutral-500 font-semibold">{o.lat}</p>
                  </div>
                  <button 
                    className="mt-3 px-3 py-1 rounded-full text-xs font-bold text-pink-600 bg-pink-50 border border-pink-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySound(o.sound, o.tif, o.lat);
                    }}
                  >
                    🔊 ⵙⵙⵏ
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Screen: Fruits & Vegetables */}
        {activeSection === 'fruits' && (
          <div className="space-y-6">
            {/* Learning Poster Preview */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                playBeep('pop');
                setExpandedPoster({ url: '/src/assets/images/cat_fruits_1779617475517.png', title: 'ⵉⴳⵓⵎⵎⴰ • Fruits & Vegetables' });
              }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-4 border-2 border-amber-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl border-2 border-amber-200 flex-shrink-0 flex items-center justify-center text-3xl shadow-sm">
                  🍉
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>ⵓⵔⴰⵔ • ⵉⴳⵓⵎⵎⴰ</span>
                  </h3>
                  <p className="text-xs text-amber-850/80 leading-relaxed max-w-sm mt-0.5 font-sans">
                    ⵜⵓⵜⵓⵜ ⵅⴼ ⵓⵔⴰⵔ ⵏ ⵉⴳⵓⵎⵎⴰ ⴷ ⵓⵜⵛⵉ!
                  </p>
                </div>
              </div>
              <button className="px-5 py-2 rounded-2xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 shadow border-b-4 border-amber-700 transition-all flex items-center gap-1.5 self-stretch md:self-auto justify-center">
                <span>ⵓⵔⴰⵔ 🎮</span>
              </button>
            </motion.div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {FRUITS.map((item, i) => {
                const grad = GRADS[i % GRADS.length];
                return (
                  <motion.div
                    key={`fruit-${i}`}
                    whileHover={{ scale: 1.1, rotate: i % 2 === 0 ? 1 : -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDrawer({ l: '', word: item.tif, img: item.img, sound: item.sound, emoji: item.emoji, lat: item.lat }, grad, item.emoji)}
                    className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center border-b-4 shadow-md text-center cursor-pointer select-none"
                    style={{ borderColor: grad[1] }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-sm relative"
                      style={{ background: `${grad[0]}15` }}
                    >
                      {item.emoji}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-700 mt-2 block w-full truncate">{item.tif}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Screen: AI Magic Playground */}
        {activeSection === 'playground' && (
          <div className="space-y-6 animate-fade-in pb-12">
            
            {/* Header banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border-b-6 border-indigo-805">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <span className="bg-yellow-400 text-yellow-950 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full inline-block font-sans shadow-md border border-yellow-250">
                  ⚡ Gemini AI Powered
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight">ⵓⵔⴰⵔ ⵏ ⵜⵎⵓⵙⵏⵉ</h2>
                <p className="text-indigo-100 text-xs sm:text-sm font-sans">
                  Welcome to the AI Magic Children's Playground! Let's read magical custom stories, solve fun riddles, or explore any words in Tamazight!
                </p>
              </div>
            </div>

            {/* Sub Tabs Selection Panel */}
            <div className="grid grid-cols-3 gap-2 bg-indigo-50/55 p-2 rounded-2xl border border-indigo-100">
              <button
                onClick={() => { playBeep('pop'); setPgTab('story'); }}
                className={`py-3 rounded-xl font-bold font-sans text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  pgTab === 'story'
                    ? 'bg-indigo-600 text-white shadow-md border-b-4 border-indigo-805'
                    : 'bg-white text-indigo-900 border border-indigo-100 hover:bg-indigo-100/50'
                }`}
              >
                <span>📖</span>
                <span>Story Magic</span>
              </button>

              <button
                onClick={() => { playBeep('pop'); setPgTab('riddle'); }}
                className={`py-3 rounded-xl font-bold font-sans text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  pgTab === 'riddle'
                    ? 'bg-purple-600 text-white shadow-md border-b-4 border-purple-805'
                    : 'bg-white text-purple-900 border border-purple-100 hover:bg-purple-100/50'
                }`}
              >
                <span>🔮</span>
                <span>Riddle Box</span>
              </button>

              <button
                onClick={() => { playBeep('pop'); setPgTab('alchemy'); }}
                className={`py-3 rounded-xl font-bold font-sans text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  pgTab === 'alchemy'
                    ? 'bg-violet-600 text-white shadow-md border-b-4 border-violet-805'
                    : 'bg-white text-violet-900 border border-violet-100 hover:bg-violet-100/50'
                }`}
              >
                <span>🧪</span>
                <span>Word Alchemy</span>
              </button>
            </div>

            {/* TAB CONTENT 1: STORY MAGIC */}
            {pgTab === 'story' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-indigo-100 space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <span>Story Oracle • ⵜⴰⵏⴼⵓⵙⵜ 🪄</span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">Customize your characters and topics to hear a custom-styled, child-friendly Tamazight fairy tale!</p>
                </div>

                <div className="space-y-4">
                  {/* Select Character */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 tracking-wider font-sans uppercase">1. Pick your Hero:</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['Sheep 🐑', 'Sun ☀️', 'Star ⭐', 'Lion 🦁', 'Bee 🐝'].map((char) => (
                        <button
                          key={char}
                          onClick={() => { playBeep('pop'); setStoryCharacter(char); }}
                          className={`p-3 rounded-xl border-2 font-sans font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            storyCharacter === char 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm' 
                              : 'bg-white border-neutral-105 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="text-2xl">{char.split(' ')[1] || char}</span>
                          <span className="text-[10px] truncate w-full text-center">{char.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Topic */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 tracking-wider font-sans uppercase">2. Pick a World:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {['Woods 🌲', 'Farm 🚜', 'Ocean 🌊', 'Clouds ☁️', 'Feast 🍲'].map((topic) => (
                        <button
                          key={topic}
                          onClick={() => { playBeep('pop'); setStoryTopic(topic); }}
                          className={`p-3 rounded-xl border-2 font-sans font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            storyTopic === topic 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm' 
                              : 'bg-white border-neutral-105 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="text-2xl">{topic.split(' ')[1] || topic}</span>
                          <span className="text-[10px] truncate w-full text-center">{topic.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button / Loading */}
                <div className="pt-2">
                  {storyLoading ? (
                    <div className="bg-indigo-50 rounded-2xl p-6 text-center space-y-3 border-2 border-indigo-200/50">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-bold text-indigo-950 animate-pulse font-sans">
                        Casting magical scripts... 🪄
                      </p>
                      <p className="text-xs text-indigo-600/80 font-sans font-medium">Preparing spelling books for standard Northern Tamazight</p>
                    </div>
                  ) : (
                    <button
                      onClick={generateStory}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-md border-b-4 border-indigo-800 transition-all font-sans text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>✨ Tell Me a Story!</span>
                    </button>
                  )}
                </div>

                {/* Story Result Layout */}
                {storyResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-50/50 border-2 border-amber-200 rounded-3xl p-5 relative space-y-4 text-center">
                    <div className="absolute top-3 right-3 text-2xl">📜</div>
                    
                    {/* Story Text */}
                    <div className="space-y-2 text-center max-w-lg mx-auto">
                      <h4 className="text-2xl font-extrabold text-amber-950 leading-relaxed font-sans">{storyResult.tifinagh}</h4>
                      <p className="text-xs font-bold text-neutral-500 italic mt-1 font-mono">{storyResult.latin}</p>
                      <hr className="border-amber-200/50 my-2" />
                      <p className="text-sm font-semibold text-amber-900 font-sans leading-relaxed">"{storyResult.english}"</p>
                    </div>

                    {/* Word Key Definitions */}
                    <div className="bg-white/80 rounded-2xl p-3 border border-amber-100 space-y-2 text-left">
                      <span className="text-[10px] font-bold text-amber-800 tracking-wider font-sans uppercase block">Vocabulary Spellbook Key:</span>
                      <div className="grid grid-cols-3 gap-3">
                        {storyResult.vocabulary?.map((word: any, i: number) => (
                          <div key={i} className="flex flex-col items-center bg-amber-50/30 p-2.5 rounded-xl border border-amber-150/40 text-center">
                            <span className="text-2xl">{word.emoji}</span>
                            <span className="text-xs font-sans font-bold text-neutral-800 mt-1">{word.tif}</span>
                            <span className="text-[10px] text-neutral-500 font-sans font-medium">{word.eng}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* TAB CONTENT 2: RIDDLE BOX */}
            {pgTab === 'riddle' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-purple-100 space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-extrabold text-purple-950 flex items-center gap-1.5">
                    <span>Riddle Box • ⵜⴰⵏⵣⵣⵓⵔⵜ 🧠</span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">Solve mind-boggling interactive puzzles generated by our smart AI to test your Tamazight skills!</p>
                </div>

                {/* Sub Category selectors */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-700 tracking-wider font-sans uppercase block">Choose a Category:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Animals 🐾', 'Fruits 🍉', 'Colors 🎨'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { playBeep('pop'); setRiddleCategory(cat.split(' ')[0].toLowerCase()); }}
                        className={`p-3 rounded-xl border-2 font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          riddleCategory === cat.split(' ')[0].toLowerCase()
                            ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-sm'
                            : 'bg-white border-neutral-105 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button / Loading */}
                <div>
                  {riddleLoading ? (
                    <div className="bg-purple-50 rounded-2xl p-6 text-center space-y-3 border-2 border-purple-200/50">
                      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-bold text-purple-950 animate-pulse font-sans">
                        Summoning the Riddle Master... 🔮
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={generateRiddle}
                      className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-md border-b-4 border-purple-800 transition-all font-sans text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🔮 Summon Fun Riddle!</span>
                    </button>
                  )}
                </div>

                {/* Quest Riddle Layout */}
                {riddleResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <div className="bg-purple-50/50 border-2 border-purple-200 rounded-3xl p-5 text-center relative space-y-3">
                      <div className="text-3xl">🧩</div>
                      <h4 className="text-2xl font-extrabold text-purple-950 leading-relaxed font-sans">{riddleResult.riddleTifinagh}</h4>
                      <p className="text-xs font-bold text-neutral-500 italic font-mono">{riddleResult.riddleLatin}</p>
                      <hr className="border-purple-200/50" />
                      <p className="text-sm font-semibold text-purple-900 font-sans">"{riddleResult.riddleEnglish}"</p>
                    </div>

                    {/* Options Click layout */}
                    <div className="grid grid-cols-2 gap-3">
                      {riddleResult.options?.map((opt: string, idx: number) => {
                        let btnStyle = "bg-white border-2 border-neutral-100 text-neutral-800 hover:bg-purple-50/50";
                        if (riddleAnswered) {
                          if (idx === riddleResult.correctAnswerIdx) {
                            btnStyle = "bg-emerald-500 border-2 border-emerald-600 text-white font-extrabold shadow-emerald-200 shadow-md";
                          } else if (idx === selectedRiddleOption) {
                            btnStyle = "bg-rose-500 border-2 border-rose-600 text-white font-bold shadow-rose-200 shadow-md";
                          } else {
                            btnStyle = "bg-neutral-50 opacity-50 border border-neutral-200 text-neutral-400";
                          }
                        } else if (selectedRiddleOption === idx) {
                          btnStyle = "bg-purple-100 border-2 border-purple-500 text-purple-950";
                        }
                        
                        return (
                          <button
                            key={idx}
                            disabled={riddleAnswered}
                            onClick={() => handleRiddleAnswer(idx)}
                            className={`p-4 rounded-2xl border-b-4 text-center font-bold transition-all text-sm flex flex-col items-center justify-center cursor-pointer ${btnStyle}`}
                          >
                            <span className="text-lg leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback Explanation */}
                    {riddleAnswered && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className={`p-4 rounded-2xl border-l-4 text-sm font-sans ${
                          isRiddleCorrect 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium' 
                            : 'bg-amber-50 border-amber-500 text-amber-950 font-medium'
                        }`}
                      >
                        {riddleFeedbackMessage}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* TAB CONTENT 3: WORD ALCHEMIST */}
            {pgTab === 'alchemy' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-lg border-2 border-violet-100 space-y-6 text-left">
                <div>
                  <h3 className="text-xl font-extrabold text-violet-950 flex items-center gap-1.5">
                    <Languages className="w-5 h-5 text-violet-600 animate-bounce" />
                    <span>Word Alchemist • ⴰⵡⴰⵍ 🧪</span>
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">Type any English noun, fruit, emotion, or action and watch the Alchemist brew standard Tamazight Tifinagh!</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={alchemyInput}
                      onChange={(e) => setAlchemyInput(e.target.value)}
                      placeholder="e.g. rainbow, butterfly, friend, milk..."
                      className="w-full px-5 py-4 border-2 border-neutral-100 bg-neutral-50/50 rounded-2xl text-sm font-sans focus:border-violet-400 focus:bg-white outline-none font-medium pr-12 text-neutral-800"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') runAlchemy();
                      }}
                    />
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-xl">🧪</div>
                  </div>

                  {/* Suggestion tags to help children explore */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase font-sans tracking-tight">Kid Suggestions:</span>
                    {['butterfly', 'friend', 'moon', 'cookie', 'happy'].map((word) => (
                      <button
                        key={word}
                        onClick={() => {
                          playBeep('pop');
                          setAlchemyInput(word);
                          // Trigger translation instantly
                          setAlchemyLoading(true);
                          setAlchemyResult(null);
                          setAlchemyError(null);
                          fetch('/api/gemini/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ word })
                          })
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.error) throw new Error(data.error);
                            setAlchemyResult(data);
                            setAlchemyError(null);
                          })
                          .catch((e) => setAlchemyError(e.message))
                          .finally(() => setAlchemyLoading(false));
                        }}
                        className="text-xs px-3 py-1 rounded-full border border-violet-200 text-violet-700 bg-violet-50/55 hover:bg-violet-100/60 font-medium font-sans cursor-pointer transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>

                  {alchemyLoading ? (
                    <div className="bg-violet-50 rounded-2xl p-6 text-center space-y-3 border-2 border-violet-200/50">
                      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-bold text-violet-950 animate-pulse font-sans">
                        Transmuting words... 🧪
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={runAlchemy}
                      className="w-full py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 shadow-md border-b-4 border-violet-805 transition-all font-sans text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🧪 Transmute Word!</span>
                    </button>
                  )}
                </div>

                {/* Translate Error */}
                {alchemyError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans">
                    ⚠️ {alchemyError}
                  </div>
                )}

                {/* Alchemy Result display */}
                {alchemyResult && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-violet-50/40 border-2 border-violet-200 rounded-3xl p-5 relative space-y-3 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white border border-violet-150 shadow-sm flex items-center justify-center text-4xl mx-auto mb-2">
                      {alchemyResult.emoji || '✨'}
                    </div>

                    <h4 className="text-3xl font-extrabold text-violet-950 leading-relaxed font-sans">{alchemyResult.wordTifinagh}</h4>
                    <span className="text-xs font-bold text-neutral-500 italic mt-0.5 block font-mono">Pronounced: {alchemyResult.pronunciation}</span>
                    <hr className="border-violet-200/50" />
                    
                    <p className="text-sm font-semibold text-neutral-700 font-sans max-w-md mx-auto leading-relaxed">
                      "{alchemyResult.explanation}"
                    </p>

                    {/* Example Sentence inside Box */}
                    <div className="bg-white rounded-2xl p-4 border border-violet-150 text-center space-y-1">
                      <span className="text-[9px] font-extrabold text-violet-850 uppercase tracking-widest font-sans block mb-1">Interactive Example Sentence:</span>
                      <p className="text-lg font-bold text-neutral-900 leading-relaxed font-sans">{alchemyResult.exampleTifinagh}</p>
                      <p className="text-xs text-neutral-500 font-sans font-medium">"{alchemyResult.exampleEnglish}"</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </div>
        )}

      </main>

      {/* Slide-Up Bottom Drawer / Modal */}
      <AnimatePresence>
        {popupItem && (
          <>
            {/* Dark Mask Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 pointer-events-auto cursor-pointer"
            />

            {/* Cute Drawer Chassis */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[32px] box-shadow-2xl z-50 max-h-[85vh] flex flex-col overflow-hidden border-t-4 border-amber-200"
            >
              {/* Top Handle bar */}
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto my-3 flex-shrink-0" />
              
              <button 
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neutral-100/80 backdrop-blur-sm shadow hover:bg-neutral-200 text-neutral-600 font-bold text-center flex items-center justify-center border transition-all z-10"
                onClick={closeDrawer}
              >
                ✕
              </button>

              <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6 flex flex-col items-center text-center">
                
                {/* Round Giant Circle representing input character */}
                <div className="flex justify-center flex-shrink-0 pb-1 pt-2">
                  <motion.div 
                    initial={{ scale: 0.8, rotate: -8 }}
                    animate={{ scale: [0.9, 1.05, 1], rotate: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-lg"
                    style={{ 
                      background: popupGrad[0],
                      boxShadow: `0 8px 0 ${popupGrad[1]}`
                    }}
                  >
                    {popupLabel}
                  </motion.div>
                </div>

                {/* Sub Illustration or Big Colorful Emoji representing that item */}
                <div className="w-full max-w-sm aspect-square bg-gradient-to-b from-amber-50/50 to-neutral-50 rounded-3xl border-2 border-neutral-100/80 flex flex-col items-center justify-center overflow-hidden h-48 relative shadow-inner">
                  
                  {/* Real Image Placeholder (will render nicely with no-referrer policy) */}
                  {drawerImgSrc && (
                    <img 
                      src={drawerImgSrc} 
                      alt={popupItem.tif || popupItem.word || popupLabel}
                      className="w-full h-full object-contain p-4 select-none absolute inset-0 z-10 transition-all duration-300"
                      referrerPolicy="no-referrer"
                      onLoad={() => setImgLoaded(true)}
                      onError={(e) => {
                        const poster = getPosterForSection(activeSection);
                        if (drawerImgSrc !== poster && poster) {
                          setDrawerImgSrc(poster);
                        } else {
                          e.currentTarget.style.display = 'none';
                          setImgLoaded(false);
                        }
                      }}
                    />
                  )}
                  
                  {/* Fallback Whimsical giant emoji inside soft aura */}
                  {!imgLoaded && (
                    <div className="text-[80px] select-none cursor-default drop-shadow-md animate-bob">
                      {popupItem.emoji || '🌟'}
                    </div>
                  )}
                </div>

                {/* Information Header Block */}
                <div className="space-y-1">
                  <h3 className="text-3xl font-extrabold text-neutral-950 tracking-wide">
                    {popupItem.l ? renderHighlightedWord(popupItem.word || popupItem.tif || '', popupItem.l, popupGrad[1]) : (popupItem.word || popupItem.tif || '')}
                  </h3>
                  
                  {popupItem.lat && (
                    <p className="text-base text-neutral-500 font-semibold capitalize tracking-wide">
                      Means: "{popupItem.lat}"
                    </p>
                  )}
                  {popupItem.label && (
                    <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest font-mono">
                      Phonetic Symbol: [{popupItem.label}]
                    </p>
                  )}
                </div>

                {/* Sound Speak triggering Chassis controls */}
                <div className="w-full max-w-sm pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-md border-b-6 flex items-center justify-center gap-3 active:translate-y-1"
                    style={{ 
                      background: 'linear-gradient(135deg, #FF6B35, #E04010)',
                      borderColor: '#A03010'
                    }}
                    onClick={() => {
                      const backupTif = popupItem.word || popupItem.tif || '';
                      const backupLat = popupItem.label || popupItem.lat || '';
                      handlePlaySound(popupItem.sound, backupTif, backupLat);
                    }}
                  >
                    <Volume2 className="w-6 h-6 animate-bounce" />
                    <span>🔊 ⵙⵙⵏ • Click to Speak!</span>
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </>
        )}

        {expandedPoster && (
          <>
            {/* Dark Mask Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playBeep('bloop');
                setExpandedPoster(null);
              }}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-50 pointer-events-auto cursor-zoom-out"
            />

            {/* Scale dialog with complete interactive challenge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-4 md:inset-10 bg-white rounded-[32px] overflow-hidden shadow-2xl z-50 flex flex-col max-w-4xl mx-auto border-4 border-amber-300 pointer-events-auto shadow-amber-950/20"
            >
              {/* Header inside popup */}
              <div className="bg-amber-100/50 border-b border-amber-200 px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎮</span>
                  <span className="text-base font-extrabold text-amber-950 tracking-wide font-sans">
                    ⵓⵔⴰⵔ • {expandedPoster.title.split(' • ')[0]}
                  </span>
                </div>

                <button 
                  className="w-8 h-8 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold flex items-center justify-center transition-colors shadow"
                  onClick={() => {
                    playBeep('bloop');
                    setExpandedPoster(null);
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Learning Game block - strictly exclusive and native Tamazight */}
              <div className="flex-1 overflow-auto p-6 md:p-8 flex flex-col justify-between bg-gradient-to-b from-amber-50/40 via-white to-white select-none">
                {gameQuestion ? (
                  <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center">
                    
                    {/* Round Header / Streak */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-1.5 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200 text-amber-950 font-bold text-xs">
                        <span>🎯 ⵜⴰⵙⵎⵓⵔⵉⵏ (Successes):</span>
                        <span className="text-sm font-black text-amber-500">{gameScore}</span>
                      </div>
                      <button
                        onClick={() => {
                          playBeep('pop');
                          setGameScore(0);
                          startNewGameRound(expandedPoster.url);
                        }}
                        className="text-xs text-neutral-500 font-semibold hover:text-amber-600 underline"
                      >
                        🔄 ⴰⵍⵙ (Reset)
                      </button>
                    </div>

                    {/* Question bubble Card */}
                    <div className="bg-amber-100 text-amber-950 rounded-3xl p-6 text-center shadow-lg border-2 border-amber-300/80 mb-6 relative overflow-hidden">
                      
                      {/* Decorative floating shapes */}
                      <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-amber-200/50 -translate-x-3 -translate-y-3" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-amber-200/50 translate-x-4 translate-y-4" />

                      <h3 className="text-xl md:text-2xl font-extrabold tracking-wide mb-2">
                        {gameQuestion.questionText}
                      </h3>
                      {gameQuestion.questionSubtitle && (
                        <p className="text-sm text-amber-800 font-medium font-sans">
                          {gameQuestion.questionSubtitle}
                        </p>
                      )}
                    </div>

                    {/* Pick choices Options grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {gameQuestion.options.map((option: any, idx: number) => {
                        const isSelected = selectedOptionId === option.id;
                        const isCorrectIdx = idx === gameQuestion.correctIdx;
                        
                        let btnStyle = "border-neutral-200/80 bg-stone-50 text-stone-800 hover:bg-amber-50 hover:border-amber-300 active:scale-95";
                        if (gameStatus !== 'idle') {
                          if (isCorrectIdx) {
                            btnStyle = "bg-green-100 border-green-500 border-3 text-green-900 ring-4 ring-green-100 scale-102 font-bold animate-pulse";
                          } else if (isSelected) {
                            btnStyle = "bg-red-50 border-red-500 border-3 text-red-900 opacity-80 line-through scale-95";
                          } else {
                            btnStyle = "bg-neutral-50 border-neutral-100 text-neutral-400 opacity-60 pointer-events-none";
                          }
                        }

                        return (
                          <motion.button
                            key={option.id + '-' + idx}
                            whileHover={gameStatus === 'idle' ? { scale: 1.04 } : {}}
                            whileTap={gameStatus === 'idle' ? { scale: 0.96 } : {}}
                            onClick={() => handleOptionClick(option, idx)}
                            disabled={gameStatus !== 'idle'}
                            className={`rounded-2xl border-2 p-3 transition-all flex items-center justify-center min-h-[96px] shadow-sm cursor-pointer ${btnStyle}`}
                          >
                            {option.display}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Interactive Feedback & Action controls */}
                    <div className="mt-8 text-center h-16 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {gameStatus === 'correct' && (
                          <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="flex flex-col items-center gap-2"
                            key="correct"
                          >
                            <div className="text-sm font-black text-green-700 flex items-center gap-1.5 bg-green-50 px-4 py-1.5 rounded-full border border-green-250 shadow-sm">
                              <span>🎉 ⵉⵛⵡⴰ! (Correct standard pronunciation...)</span>
                              <span className="animate-bounce">🌟</span>
                            </div>
                            <button
                              onClick={() => startNewGameRound(expandedPoster.url)}
                              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors"
                            >
                              ⵢⴰⴹⵏ ➡️ (Next)
                            </button>
                          </motion.div>
                        )}

                        {gameStatus === 'wrong' && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="flex flex-col items-center gap-2"
                            key="wrong"
                          >
                            <p className="text-sm font-bold text-red-605 bg-red-50 px-4 py-1.5 rounded-full border border-red-250 shadow-sm animate-shake">
                              😢 ⴰⵔⵎ ⴷⴰⵖ (Try again!)
                            </p>
                            <button
                              onClick={() => startNewGameRound(expandedPoster.url)}
                              className="px-6 py-2 rounded-xl bg-neutral-600 hover:bg-neutral-700 text-white font-bold text-sm shadow transition-colors"
                            >
                              ⵣⵔⵉ ➔ (Skip)
                            </button>
                          </motion.div>
                        )}

                        {gameStatus === 'idle' && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-neutral-500 font-bold"
                            key="idle"
                          >
                            👉 ⵜⵓⵜⵓⵜ ⵅⴼ ⵜⴽⴰⵕⴹⴰ ⵢⵓⴳⵣⵏ (Tap any card to guess!)
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-500 font-bold mb-4">No challenges available.</p>
                  </div>
                )}
              </div>

              {/* Instructional Footer */}
              <div className="bg-stone-100 border-t border-stone-250 px-6 py-4 text-center">
                <p className="text-xs text-amber-900 font-bold tracking-wide">
                  🌈 ⵜⵓⵜⵓⵜ ⴱⵕⵕⴰ ⵏⵖ ✕ ⵉ ⵓⵖⴰⵍ ⵙ ⵓⴱⵔⵉⴷ ⵏ ⵓⵍⵎⵎⵓⴷ! (Tap outside or ✕ to go back)
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
