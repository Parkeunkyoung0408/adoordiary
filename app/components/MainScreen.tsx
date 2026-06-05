"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  RotateCw,
  ArrowRight,
  Edit3,
  Trash2,
  Archive,
  Settings,
  Plus,
  Check,
  X,
  Info,
  RefreshCw,
  User,
  Activity
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

type Mood = "happy" | "calm" | "sad" | "tired" | "angry" | null;

interface DiaryEntry {
  date: string;
  mood: Mood;
  fourWords: string[];
  isDirectWrite: boolean;
  heartText: string;
  releaseText: string;
  released: boolean;
}

interface BucketItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  x: number;
  y: number;
  r: number;
}

const wordSets = [
  { words: ["토", "닥", "토", "닥"], hint: "ㅌㄷㅌㄷ" },
  { words: ["행", "복", "만", "땅"], hint: "ㅎㅂㅁㄷ" },
  { words: ["힐", "링", "타", "임"], hint: "ㅎㄹㅌㅇ" },
  { words: ["사", "랑", "해", "요"], hint: "ㅅㄹㅎㅇ" },
  { words: ["소", "소", "한", "날"], hint: "ㅅㅅㅎㄴ" },
  { words: ["마", "음", "일", "기"], hint: "ㅁㅇㅇㄱ" },
  { words: ["쓰", "담", "쓰", "담"], hint: "ㅅㄷㅅㄷ" },
  { words: ["몽", "글", "몽", "글"], hint: "ㅁㄱㅁㄱ" },
];

const moods = [
  { id: "happy" as Mood, emoji: "😊", label: "행복", color: "bg-[#ffe3ec] dark:bg-[#3d1a24] text-[#ff6b9d] border-[#ffb3c6] shadow-[#ffe3ec]/30", glow: "rgba(255,107,157,0.4)" },
  { id: "calm" as Mood, emoji: "😌", label: "평온", color: "bg-[#e8f1f5] dark:bg-[#1a2d3d] text-[#4ea8de] border-[#90e0ef] shadow-[#e8f1f5]/30", glow: "rgba(78,168,222,0.4)" },
  { id: "sad" as Mood, emoji: "😔", label: "우울", color: "bg-[#eef2f7] dark:bg-[#1f242e] text-[#64748b] border-[#cbd5e1] shadow-[#eef2f7]/30", glow: "rgba(100,116,139,0.4)" },
  { id: "tired" as Mood, emoji: "😑", label: "지침", color: "bg-[#f3f4f6] dark:bg-[#1e1e24] text-[#9ca3af] border-[#e5e7eb] shadow-[#f3f4f6]/30", glow: "rgba(156,163,175,0.4)" },
  { id: "angry" as Mood, emoji: "😤", label: "화남", color: "bg-[#ffebee] dark:bg-[#3d181a] text-[#ef5350] border-[#ffcdd2] shadow-[#ffebee]/30", glow: "rgba(239,83,80,0.4)" },
];

const archiveCardColors: Record<string, { bg: string; ink: string }> = {
  happy: { bg: "#F4A9C7", ink: "#C42A6B" },
  calm: { bg: "#9AD0EC", ink: "#2E6E8E" },
  sad: { bg: "#A9C585", ink: "#4F6B34" },
  tired: { bg: "#F4CB45", ink: "#A9750A" },
  angry: { bg: "#F0875D", ink: "#B53A22" },
};

export default function MainScreen() {
  // Navigation & Date States
  const [activeTab, setActiveTab] = useState<"write" | "bucket" | "archive" | "settings">("write");
  const [weekDays, setWeekDays] = useState<Array<{ day: string; date: number; fullDate: string; isToday: boolean }>>([]);
  const [selectedFullDate, setSelectedFullDate] = useState("");
  const [savedDates, setSavedDates] = useState<{ [key: string]: Mood }>({});
  
  // Diary States (synced per date)
  const [mood, setMood] = useState<Mood>(null);
  const [currentWordSetIndex, setCurrentWordSetIndex] = useState(0);
  const [fourWords, setFourWords] = useState<string[]>(wordSets[0].words);
  const [heartText, setHeartText] = useState("");
  const [releaseText, setReleaseText] = useState("");
  const [isReleased, setIsReleased] = useState(false);
  const [isDirectWrite, setIsDirectWrite] = useState(false);
  const [customWords, setCustomWords] = useState(["", "", "", ""]);
  
  // UI Interaction States
  const [isSpinning, setIsSpinning] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showToast, setShowToast] = useState("");
  const [theme, setTheme] = useState("sauge");
  const [userName, setUserName] = useState("나의 하루");
  const [isEditingName, setIsEditingName] = useState(false);
  const [stats, setStats] = useState({ writeCount: 0, releaseCount: 0, bucketPct: 0 });

  // Bucket List States
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [newBucketText, setNewBucketText] = useState("");

  // Archive flip card
  const [flippedDate, setFlippedDate] = useState<string | null>(null);

  // Embla Carousel hook
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Initialize Week & Theme
  useEffect(() => {
    // Generate Current Week
    const now = new Date();
    const currentDay = now.getDay();
    const distance = currentDay === 0 ? -6 : 1 - currentDay; // Distance to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + distance);

    const days = ["월", "화", "수", "목", "금", "토", "일"];
    const currentWeek = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      const fullDate = `${year}-${month}-${date}`;
      return {
        day: days[i],
        date: d.getDate(),
        fullDate,
        isToday: d.toDateString() === now.toDateString(),
      };
    });

    setWeekDays(currentWeek);

    // Default selected date is today
    const todayObj = currentWeek.find(d => d.isToday) || currentWeek[3];
    setSelectedFullDate(todayObj.fullDate);

    // Load theme
    const savedTheme = localStorage.getItem("maeum_theme") || "sauge";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Load username
    const savedName = localStorage.getItem("maeum_username") || "나의 하루";
    setUserName(savedName);

    // Load bucket list
    const savedBucket = localStorage.getItem("maeum_bucket");
    if (savedBucket) {
      try { setBucketItems(JSON.parse(savedBucket)); } catch(e) {}
    }

    refreshSavedDates();
  }, []);

  // Sync Saved Dates with Entries for Indicators
  const refreshSavedDates = useCallback(() => {
    if (typeof window === "undefined") return;
    const newSaved: { [key: string]: Mood } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("maeum_entry_")) {
        const dateStr = key.replace("maeum_entry_", "");
        try {
          const val = JSON.parse(localStorage.getItem(key) || "{}");
          if (val.mood || val.heartText || val.releaseText) {
            newSaved[dateStr] = val.mood;
          }
        } catch (e) {}
      }
    }
    setSavedDates(newSaved);
  }, []);

  // Load Entry when date changes
  useEffect(() => {
    if (!selectedFullDate) return;
    
    const saved = localStorage.getItem(`maeum_entry_${selectedFullDate}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMood(parsed.mood || null);
        setFourWords(parsed.fourWords || wordSets[0].words);
        setIsDirectWrite(parsed.isDirectWrite || false);
        setHeartText(parsed.heartText || "");
        setReleaseText(parsed.releaseText || "");
        setIsReleased(parsed.released || false);
        if (parsed.isDirectWrite && parsed.fourWords) {
          setCustomWords(parsed.fourWords);
        } else {
          setCustomWords(["", "", "", ""]);
        }
        // Scroll to first slide on date change
        if (emblaApi) emblaApi.scrollTo(0);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Default state if no entry exists
    setMood(null);
    setFourWords(wordSets[0].words);
    setIsDirectWrite(false);
    setHeartText("");
    setReleaseText("");
    setIsReleased(false);
    setCustomWords(["", "", "", ""]);
    if (emblaApi) emblaApi.scrollTo(0);
  }, [selectedFullDate, emblaApi]);

  // Auto-save entry state to localStorage
  const saveCurrentEntry = useCallback((updates: Partial<DiaryEntry>) => {
    if (!selectedFullDate) return;

    const currentEntry: DiaryEntry = {
      date: selectedFullDate,
      mood: updates.mood !== undefined ? updates.mood : mood,
      fourWords: updates.fourWords !== undefined ? updates.fourWords : (isDirectWrite ? customWords : fourWords),
      isDirectWrite: updates.isDirectWrite !== undefined ? updates.isDirectWrite : isDirectWrite,
      heartText: updates.heartText !== undefined ? updates.heartText : heartText,
      releaseText: updates.releaseText !== undefined ? updates.releaseText : releaseText,
      released: updates.released !== undefined ? updates.released : isReleased,
    };

    localStorage.setItem(`maeum_entry_${selectedFullDate}`, JSON.stringify(currentEntry));
    refreshSavedDates();
  }, [selectedFullDate, mood, fourWords, isDirectWrite, customWords, heartText, releaseText, isReleased, refreshSavedDates]);

  // Embla callbacks
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Roulette Spinning Action
  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    
    // Staggered letter animation timing
    setTimeout(() => {
      const nextIndex = (currentWordSetIndex + 1) % wordSets.length;
      setCurrentWordSetIndex(nextIndex);
      const newWords = wordSets[nextIndex].words;
      setFourWords(newWords);
      setIsDirectWrite(false);
      setIsSpinning(false);
      saveCurrentEntry({ fourWords: newWords, isDirectWrite: false });
    }, 600);
  };

  // Switch to Direct Write Mode
  const toggleDirectWrite = () => {
    const nextState = !isDirectWrite;
    setIsDirectWrite(nextState);
    if (nextState) {
      setCustomWords(["", "", "", ""]);
      saveCurrentEntry({ isDirectWrite: true, fourWords: ["", "", "", ""] });
    } else {
      const words = wordSets[currentWordSetIndex].words;
      setFourWords(words);
      saveCurrentEntry({ isDirectWrite: false, fourWords: words });
    }
  };

  // Handlers for direct character inputs are replaced by a unified text overlay for better IME support.

  // Dissolve/Release Animation Action
  const handleRelease = () => {
    if (!releaseText.trim() || isReleasing) return;
    setIsReleasing(true);

    // Spawn floating ashes
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10,
      top: Math.random() * 40 + 30,
      x: (Math.random() - 0.5) * 200,
      y: -150 - Math.random() * 180,
      r: Math.random() * 360 + 180,
    }));
    setParticles(newParticles);

    // Calming fade-out completion
    setTimeout(() => {
      setReleaseText("");
      setIsReleased(true);
      setIsReleasing(false);
      setParticles([]);
      saveCurrentEntry({ releaseText: "", released: true });
      triggerToast("마음이 한결 털어지셨기를 바랍니다. 🕊️");
    }, 1200);
  };

  // Toast alert launcher
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(""), 3000);
  };

  // Bucket list updates
  const handleAddBucketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketText.trim()) return;

    const newItem: BucketItem = {
      id: Date.now().toString(),
      text: newBucketText.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    const updated = [newItem, ...bucketItems];
    setBucketItems(updated);
    setNewBucketText("");
    localStorage.setItem("maeum_bucket", JSON.stringify(updated));
    triggerToast("버킷리스트가 추가되었습니다. ✨");
  };

  const toggleBucketItem = (id: string) => {
    const updated = bucketItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setBucketItems(updated);
    localStorage.setItem("maeum_bucket", JSON.stringify(updated));
    
    const item = updated.find(i => i.id === id);
    if (item?.completed) {
      triggerToast("대단해요! 하나 완료했습니다 🎉");
    }
  };

  const deleteBucketItem = (id: string) => {
    const updated = bucketItems.filter(item => item.id !== id);
    setBucketItems(updated);
    localStorage.setItem("maeum_bucket", JSON.stringify(updated));
  };

  // Apply visual theme to DOM
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("maeum_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    triggerToast("테마가 변경되었습니다.");
  };

  // Reset all app data
  const handleResetData = () => {
    if (confirm("정말로 모든 마음일기와 버킷리스트 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
      localStorage.clear();
      setMood(null);
      setFourWords(wordSets[0].words);
      setHeartText("");
      setReleaseText("");
      setIsReleased(false);
      setCustomWords(["", "", "", ""]);
      setBucketItems([]);
      setTheme("sauge");
      setUserName("나의 하루");
      document.documentElement.setAttribute("data-theme", "sauge");
      refreshSavedDates();
      triggerToast("모든 데이터가 완전히 비워졌습니다.");
    }
  };

  // Update Profile Name
  const saveName = () => {
    setIsEditingName(false);
    localStorage.setItem("maeum_username", userName);
    triggerToast("프로필 이름이 저장되었습니다.");
  };

  // Calculate statistics on client side dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    let writeCount = 0;
    let releaseCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("maeum_entry_")) {
        try {
          const val = JSON.parse(localStorage.getItem(key) || "{}");
          if (val.mood || val.heartText) writeCount++;
          if (val.released) releaseCount++;
        } catch (e) {}
      }
    }
    const bucketComplete = bucketItems.filter((i) => i.completed).length;
    const bucketTotal = bucketItems.length;
    const bucketPct = bucketTotal > 0 ? Math.round((bucketComplete / bucketTotal) * 100) : 0;

    setStats({ writeCount, releaseCount, bucketPct });
  }, [savedDates, bucketItems]);

  return (
    <div className="h-full w-full bg-[var(--bg-container)] flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Top Navigation Header */}
      <div className="shrink-0 px-5 pt-6 pb-3 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-container)]/80 backdrop-blur-md z-10 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <svg
            onClick={() => setActiveTab("write")}
            viewBox="0 0 478.89 112.08"
            fill="#175138"
            role="img"
            aria-label="마음써방"
            className="h-[26px] w-auto cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
          >
            <path d="M67.59,2.35H22.89s-14.9,0-14.9,0c-2.52,0-5.49-.07-7.97.03v102.78s67.61,0,67.61,0V37.25c-.01-11.48.18-23.5-.03-34.9ZM26.39,84.89V22.61s15,0,15,0v62.28s-15,0-15,0Z" />
            <path d="M124.52,69.06c-.07,14.13-.18,28.91.03,43.02h99.17s.26-.17.26-.17c.18-14.07.05-28.76,0-42.86h-99.47ZM197.99,94.33c-5.31.09-10.82.01-16.14.01h-31.16c0-2.75,0-5.49.03-8.23h47.31c-.07,2.68-.02,5.53-.03,8.22Z" />
            <path d="M129.56,36.13c6.55,5.67,14.37,5.65,22.38,5.65h11.07s40.12,0,40.12,0c6.53-.46,13.36-2.11,17.88-7.45,6.41-7.56,6.09-21.31-1.42-27.98C212.34-.15,203.11.44,194.19.45h-15.77s-21.07,0-21.07,0c-3.79,0-7.78-.05-11.59.05-.02,0-.04,0-.06,0-6.68.5-13.59,2.06-18.16,7.63-6.47,7.88-5.74,21.29,2.02,28ZM150.58,19.13c.99-1.32,1.62-1.48,3.18-1.84,2.55-.1,5.45-.03,8.02-.03h14.98s11.25,0,11.25,0c2.49,0,6.64-.37,8.9.68,1.7.78,2.29,3.54,1.3,5.1-.76,1.2-2.12,1.55-3.41,1.78-6.74.25-15.01.03-21.84.03h-11.74c-2.36,0-6.79.29-8.98-.51-1.97-.72-3.04-3.36-1.66-5.21Z" />
            <path d="M104.28,40.31c0-13.2.21-27.16-.02-40.3h-26.5s.08,112.06.08,112.06h26.46s0-13.49,0-13.49v-37.96s13.14,0,13.14,0c0-6.58.13-13.77-.03-20.31h-13.13Z" />
            <path d="M229.44,57.96v-11.65s-69.14.03-69.14.03h-26.04c-4.97,0-10.18.08-15.13-.05-.17,1.14-.11,5.42-.09,6.84.07,3.49-.08,7.29.03,10.75h73.16c12.14,0,25.02-.23,37.12,0,.17-1.25.09-4.49.09-5.92Z" />
            <path d="M302.18,25.64c.09-7.92-.15-16.53.03-24.45l-23.2-.02v26.03c-.02,15.14.43,31.14-5.33,45.34-1.03-2.79-2.12-5.7-2.81-8.61-2.81-11.99-2.56-24.74-2.56-36.97V1.17h-23.1c-.1,8.49.02,17-.02,25.5-.06,14.59.64,29.94-4.73,43.74-1.4,3.6-3.51,7.35-6.83,9.34v26c7.81-1.62,14.19-7.01,18.55-13.78,1.8-2.84,3.32-5.86,4.54-9.01,3.79,9.98,7.99,17,16.96,22.87,9.25-6.1,12.93-12.62,16.94-22.84,3.9,9.3,9.3,17.56,18.78,21.46,1.4.58,2.86,1.01,4.34,1.28v-14.7s.02-11.31.02-11.31c-12.69-8-11.75-40.41-11.59-54.08Z" />
            <path d="M449.09,63.45c-4.56-.66-8.93-.47-13.52-.47h-19.38s-20.14,0-20.14,0c-3.18,0-7.58-.24-10.64.09-7.23.88-12.78,2.26-17.6,8.5-4.33,5.56-4.99,13.42-4.32,20.32.55,5.68,3.26,11.51,7.7,15,7.07,5.56,14.41,5.14,22.75,5.14h38.77c4.03,0,9.16.15,13.13-.09,15.49-1.43,23.16-11.3,22.03-27.34-.83-11.67-7.63-19.54-18.8-21.16ZM436.8,93.28c-1.11.13-4.14.06-5.38.06h-10.85s-16.15,0-16.15,0c-2.89,0-5.77.02-8.67-.03-2.28,0-4.74-1.08-5.28-3.66-.84-4.05,0-6.77,4.02-7.86,1.51-.16,4.29-.08,5.87-.08h10.35s15.96,0,15.96,0c2.89,0,5.76-.02,8.67.03,2.3-.01,4.83.88,5.37,3.56.8,3.92.04,6.88-3.92,7.98Z" />
            <path d="M368.47,56.23c.45.15.87.48,1.32.61,2.16.18,4.38.36,6.54.37h52.31s0-9.85,0-9.85v-30.62c0-4.66.2-10.99-.02-15.53h-25.01c0,3.52-.03,7.1.01,10.6h-17.58c-.02-3.54-.02-7.06.01-10.58h-25.39s0,29.45,0,29.45c0,1.8,0,3.57,0,5.43-.03,7.8-1.08,17.12,7.81,20.11ZM386.11,29.02c5.43-.17,11.87-.01,17.37-.01.07,3.15.16,7.46,0,10.55-.64.24-16.32.23-17.17-.04-.47-1.41-.25-8.7-.21-10.5Z" />
            <path d="M321.13,0v36.67s-14.18,0-14.18,0v20.42s14.17,0,14.17,0v54.91s10.87,0,10.87,0h13.18s-.02-111.98-.02-111.98c-7.98-.03-16.07.09-24.03-.03Z" />
            <path d="M478.78,18.49c-.77-.64-11.42-.31-13.3-.36V.01s-26.33,0-26.33,0c-.18,19.36.21,38.94-.07,58.29h26.38s0-14.6,0-14.6v-5.36s13.41.04,13.41.04v-13.36c0-1.44.11-5.35-.08-6.52Z" />
          </svg>
        </div>
        <button 
          onClick={() => setActiveTab("settings")} 
          className="relative group w-9 h-9 rounded-full overflow-hidden border border-[#175138] hover:border-[#175138] transition-all duration-300 flex items-center justify-center bg-[var(--bg-card-inner)]"
        >
          <img src="/0604.png" alt="Profile" className="w-full h-full object-cover" />
        </button>
      </div>

      {/* Main Tab Screen Area */}
      <div className="flex-1 min-h-0 overflow-y-auto relative flex flex-col">
        {activeTab === "write" && (
          <>
            {/* Weekly Date Picker */}
            <div className="shrink-0 px-4 pt-3 pb-1">
              <div className="flex justify-between items-center bg-[var(--bg-card-inner)] rounded-2xl p-1.5 border border-[var(--border-color)] transition-colors duration-300">
                {weekDays.map((item) => {
                  const hasEntry = savedDates[item.fullDate];
                  const isSelected = selectedFullDate === item.fullDate;
                  const moodColor = moods.find(m => m.id === hasEntry)?.color.split(" ")[0] || "";

                  return (
                    <button
                      key={item.fullDate}
                      onClick={() => setSelectedFullDate(item.fullDate)}
                      className={`relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold border border-[var(--border-color)]" 
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/40"
                      }`}
                    >
                      {item.isToday && (
                        <div className="absolute top-1.5 w-1 h-1 bg-[var(--accent-color)] rounded-full animate-pulse" />
                      )}
                      <span className="text-[10px] uppercase font-medium leading-[14px]">{item.day}</span>
                      <span className="text-[13px] font-bold mt-0.5 leading-[16px]">{item.date}</span>
                      {hasEntry && (
                        <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${moodColor || "bg-[var(--text-muted)]"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood Selection Card */}
            <div className="shrink-0 px-4 pb-2">
              <div className="glass-panel-sm rounded-[24px] px-4 py-3.5 transition-colors duration-300">
                <p className="text-[14px] text-center mb-3 text-[var(--text-main)] font-medium">
                  <span className="opacity-60">오늘, </span>
                  <span className="font-bold">{userName}</span>
                  <span className="opacity-60">의 기분은 어떤가요?</span>
                </p>
                <div className="flex justify-between gap-1.5">
                  {moods.map((m) => {
                    const isActive = mood === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMood(m.id);
                          saveCurrentEntry({ mood: m.id });
                          triggerToast(`오늘 기분을 '${m.label}'(으)로 선택했습니다.`);
                        }}
                        className="flex flex-col items-center flex-1 transition-all duration-300"
                        style={{ outline: "none" }}
                      >
                        <div
                          className={`w-[44px] h-[44px] rounded-xl flex items-center justify-center text-[22px] border transition-colors duration-300 ${
                            isActive
                              ? `${m.color} border-[var(--accent-color)]`
                              : "bg-[var(--bg-card-inner)] border-transparent opacity-60 hover:opacity-100"
                          }`}
                          style={isActive ? { borderColor: "#175138" } : undefined}
                        >
                          {m.emoji}
                        </div>
                        <span className={`text-[10px] mt-1.5 font-medium transition-colors duration-300 ${
                          isActive ? "text-[var(--text-main)] font-bold" : "text-[var(--text-muted)]"
                        }`}>
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Swipeable Carousel Container */}
            <div className="flex-1 px-4 pb-3 min-h-0">
              <div className="overflow-hidden h-full rounded-[24px]" ref={emblaRef}>
                <div className="flex h-full gap-4">
                  
                  {/* Card 1: Four Words Roulette */}
                  <div className="flex-[0_0_100%] min-w-0 h-full">
                    <div
                      className="glass-panel rounded-[24px] p-5 h-full flex flex-col justify-between transition-colors duration-300"
                      style={{ borderWidth: "1px", borderColor: "#175138", backgroundColor: "#FFF7F4" }}
                    >
                      <div className="text-center">
                        <h2 className="text-[18px] font-extrabold text-[var(--text-main)] mb-0.5 leading-snug">
                          지금 마음을 네 글자로 적어줘
                        </h2>
                        <p className="text-[12px] text-[var(--text-muted)]">
                          잠시 숨을 고르고, 떠오르는 단어를 기록해요.
                        </p>
                      </div>

                      {/* Animated Blocks with IME-friendly unified Korean support overlay */}
                      <div className="flex justify-between gap-2.5 my-4 max-w-[250px] mx-auto w-full relative">
                        {isDirectWrite ? (
                          <>
                            {/* Hidden full-width input to handle IME composition natively */}
                            <input
                              type="text"
                              value={customWords.join("")}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\s/g, "").slice(0, 4);
                                const newWords = Array.from({ length: 4 }, (_, idx) => val[idx] || "");
                                setCustomWords(newWords);
                                saveCurrentEntry({ fourWords: newWords });
                              }}
                              maxLength={4}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                              placeholder=""
                            />
                            {/* Visual cards mapping text */}
                            {Array.from({ length: 4 }).map((_, index) => {
                              const word = customWords[index] || "";
                              const currentLength = customWords.join("").length;
                              const isFocused = currentLength === index || (index === 3 && currentLength === 4);
                              return (
                                <div
                                  key={index}
                                  className={`flex-1 aspect-square rounded-[18px] border-2 flex items-center justify-center bg-[var(--bg-card-inner)] shadow-inner transition-all duration-300 ${
                                    isFocused 
                                      ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20" 
                                      : "border-[var(--border-color)]"
                                  }`}
                                >
                                  <span className="text-[22px] font-extrabold text-[var(--text-main)]">
                                    {word}
                                  </span>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          fourWords.map((word, index) => (
                            <div
                              key={index}
                              className={`flex-1 aspect-square rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-card-inner)] flex items-center justify-center shadow-sm relative overflow-hidden transition-all duration-300 ${
                                isSpinning ? "animate-spin-letter" : ""
                              }`}
                              style={{ animationDelay: `${index * 75}ms` }}
                            >
                              <span className="text-[22px] font-extrabold text-[var(--text-main)]">
                                {word}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Interaction Buttons */}
                      <div className="space-y-2 w-full">
                        <button
                          onClick={() => emblaApi?.scrollNext()}
                          className="bg-[#175138] w-full h-11 text-white rounded-[30px] font-black text-[14px] tracking-wide flex items-center justify-center gap-1.5 border-2 border-[#175138]"
                          style={{ color: "#ffffff" }}
                        >
                          이 단어로 마음 풀기
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={toggleDirectWrite}
                            className={`flex-1 h-11 rounded-[30px] font-bold text-[13px] transition-all duration-300 flex items-center justify-center gap-1.5 border-2 ${
                              isDirectWrite
                                ? "bg-[var(--accent-bg)] text-[var(--nav-active-text)] border-transparent"
                                : "bg-[var(--button-secondary-bg)] border-[#175138] text-[var(--button-secondary-text)] hover:bg-[var(--bg-card-inner)]"
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                            {isDirectWrite ? "룰렛 단어 사용" : "내가 직접 쓰기"}
                          </button>

                          {!isDirectWrite && (
                            <button
                              onClick={spinRoulette}
                              disabled={isSpinning}
                              className="flex-1 h-11 bg-[var(--button-secondary-bg)] border-2 border-[#175138] text-[var(--button-secondary-text)] rounded-[30px] font-bold text-[13px] hover:bg-[var(--bg-card-inner)] transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                            >
                              <RotateCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                              룰렛 돌리기
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Heart - 솔직하게 풀어보기 */}
                  <div className="flex-[0_0_100%] min-w-0 h-full">
                    <div className="glass-panel rounded-[24px] p-6 h-full flex flex-col transition-colors duration-300" style={{ borderColor: "#175138" }}>
                      <div className="flex items-center justify-center mb-4 border-b border-[var(--border-color)] pb-3">
                        <div className="flex gap-2.5">
                          {(isDirectWrite ? customWords : fourWords).map((w, idx) => (
                            <span key={idx} className="w-12 h-12 rounded-xl bg-[var(--bg-card-inner)] flex items-center justify-center text-[22px] font-black border border-[var(--border-color)] text-[var(--text-main)]">
                              {w || "-"}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 relative bg-[var(--bg-card-inner)] rounded-2xl border border-[var(--border-color)] p-4 flex flex-col justify-between transition-all duration-300">
                        <textarea
                          value={heartText}
                          onChange={(e) => {
                            setHeartText(e.target.value);
                            saveCurrentEntry({ heartText: e.target.value });
                          }}
                          placeholder={`선택한 단어를 보며, 지금 드는 솔직한 생각이나 감정을 자유롭게 써내려가 보세요.\n(예: 마음 속이 몽글몽글해지는 기분이다...)`}
                          className="w-full flex-1 bg-transparent border-none focus:outline-none text-[14px] text-[var(--text-main)] resize-none leading-relaxed placeholder-[var(--text-muted)]/80"
                        />
                        <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mt-2">
                          <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" /> 실시간 저장 중
                          </span>
                          <span>{heartText.length} 자</span>
                        </div>
                      </div>

                      <button
                        onClick={() => emblaApi?.scrollNext()}
                        className="bg-[#175138] w-full h-11 mt-4 text-white rounded-[30px] font-bold text-[13px] tracking-wide flex items-center justify-center gap-1 border border-white/10"
                        style={{ color: "#ffffff" }}
                      >
                        내 마음에 한걸음 더
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Release - 나를 위해 버려보기 */}
                  <div className="flex-[0_0_100%] min-w-0 h-full">
                    <div className="glass-panel rounded-[24px] p-6 h-full flex flex-col transition-colors duration-300 relative" style={{ borderWidth: "1px", borderColor: "#175138" }}>
                      {/* Particles during releasing */}
                      {particles.map((p) => (
                        <div
                          key={p.id}
                          className="animate-ash"
                          style={{
                            left: `${p.left}%`,
                            top: `${p.top}%`,
                            "--x": `${p.x}px`,
                            "--y": `${p.y}px`,
                            "--r": `${p.r}deg`,
                          } as React.CSSProperties}
                        />
                      ))}

                        <div className="flex items-center justify-center mb-4 border-b border-[var(--border-color)] pb-3">
                          <div className="flex gap-2.5">
                            {(isDirectWrite ? customWords : fourWords).map((w, idx) => (
                              <span key={idx} className="w-12 h-12 rounded-xl bg-[var(--bg-card-inner)] flex items-center justify-center text-[22px] font-black border border-[var(--border-color)] text-[var(--text-main)]">
                                {w || "-"}
                              </span>
                            ))}
                          </div>
                        </div>

                        {isReleased ? (
                          <div className="bg-[var(--bg-card-inner)] border border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center my-6 flex flex-col items-center justify-center min-h-[200px]">
                            <div className="w-14 h-14 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[24px] mb-3 animate-pulse">
                              🕊️
                            </div>
                            <h3 className="text-[15px] font-bold text-[var(--text-main)] mb-1">마음을 훌훌 털어냈습니다</h3>
                            <p className="text-[12px] text-[var(--text-muted)] max-w-[200px] leading-relaxed">
                              비워낸 마음 대신 따뜻한 평온함이 채워졌기를 바랄게요.
                            </p>
                            <button
                              onClick={() => {
                                setIsReleased(false);
                                saveCurrentEntry({ released: false });
                              }}
                              className="mt-4 text-[11px] font-bold text-[var(--nav-active-text)] hover:underline flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> 다시 적기
                            </button>
                          </div>
                        ) : (
                          <div className={`flex-1 min-h-0 relative bg-[var(--bg-card-inner)] rounded-2xl border border-[var(--border-color)] p-4 flex flex-col justify-between transition-all duration-300 ${
                            isReleasing ? "animate-shred-text" : ""
                          }`}>
                            <textarea
                              value={releaseText}
                              onChange={(e) => {
                                setReleaseText(e.target.value);
                                saveCurrentEntry({ releaseText: e.target.value });
                              }}
                              disabled={isReleasing}
                              placeholder={`나를 힘들게 하거나 집착하게 만드는 복잡한 감정들을 여기에 적어보세요.\n적은 뒤 아래 '마음 비우기' 버튼을 누르면 연기처럼 흩어져 사라집니다.`}
                              className="w-full flex-1 bg-transparent border-none focus:outline-none text-[14px] text-[var(--text-main)] resize-none leading-relaxed placeholder-[var(--text-muted)]/80 disabled:opacity-50"
                            />
                            <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] mt-2">
                              <span>비울 감정 기록</span>
                              <span>{releaseText.length} 자</span>
                            </div>
                          </div>
                        )}

                      {!isReleased && (
                        <button
                          onClick={handleRelease}
                          disabled={!releaseText.trim() || isReleasing}
                          className="w-full h-11 mt-4 disabled:cursor-not-allowed text-white rounded-[30px] font-bold text-[13px] flex items-center justify-center gap-1.5"
                          style={{ color: "#ffffff", backgroundColor: "#175138" }}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isReleasing ? "비워내는 중..." : "글과 함께 마음 날려버리기"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Indicators */}
            <div className="shrink-0 flex gap-1.5 justify-center py-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === selectedIndex ? "bg-[#175138] w-5" : "bg-[var(--border-color)] w-1.5"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* 2. Bucket List Tab */}
        {activeTab === "bucket" && (
          <div className="flex-1 px-5 py-6 flex flex-col">
            <div className="mb-5">
              <h2 className="text-[20px] font-extrabold text-[var(--text-main)]">마음 버킷리스트</h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">
                스스로의 마음에 휴식을 선물하는 소소한 약속을 채워보세요.
              </p>
            </div>

            {/* Add Item Input */}
            <form onSubmit={handleAddBucketItem} className="flex gap-2 mb-4 shrink-0">
              <input
                type="text"
                value={newBucketText}
                onChange={(e) => setNewBucketText(e.target.value)}
                placeholder="새로운 습관을 적어보세요..."
                maxLength={40}
                className="flex-1 px-4 py-2.5 bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl text-[14px] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
              />
              <button
                type="submit"
                className="w-10 h-10 bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-white rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" style={{ color: "#ffffff" }} />
              </button>
            </form>

            {/* Bucket Items List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {bucketItems.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-card-inner)] rounded-2xl border border-dashed border-[var(--border-color)]">
                  <p className="text-[13px] text-[var(--text-muted)]">아직 추가된 마음 습관이 없어요.</p>
                  <p className="text-[11px] text-[var(--text-muted)]/80 mt-1">"따뜻한 차 한 잔 마시기" 같은 작은 일부터 적어보세요!</p>
                </div>
              ) : (
                bucketItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      item.completed
                        ? "bg-[var(--bg-card-inner)]/50 border-[var(--border-color)] opacity-60"
                        : "bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm hover:scale-[1.01]"
                    }`}
                  >
                    <button
                      onClick={() => toggleBucketItem(item.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${
                        item.completed
                          ? "bg-[var(--accent-color)] border-[var(--accent-color)] text-white"
                          : "border-[var(--text-muted)] bg-transparent"
                      }`}>
                        {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={`text-[13px] font-medium leading-normal ${
                        item.completed 
                          ? "line-through text-[var(--text-muted)]" 
                          : "text-[var(--text-main)]"
                      }`}>
                        {item.text}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteBucketItem(item.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 p-1 transition-colors"
                      aria-label="Delete item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Archive Tab */}
        {activeTab === "archive" && (
          <div className="flex-1 px-5 py-6 flex flex-col">
            <div className="mb-5">
              <h2 className="text-[20px] font-extrabold text-[var(--text-main)]">기록 보관소</h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">
                그동안 기록해 온 아름다운 기분들의 조각들입니다.
              </p>
            </div>

            {/* Statistics Banner */}
            <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
              <div className="bg-[var(--bg-card-inner)] rounded-2xl p-4 border border-[var(--border-color)] text-center transition-colors">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">작성한 일기</p>
                <p className="text-[22px] font-black mt-1 text-[var(--text-main)]">{stats.writeCount} <span className="text-[12px] font-normal">일</span></p>
              </div>
              <div className="bg-[var(--bg-card-inner)] rounded-2xl p-4 border border-[var(--border-color)] text-center transition-colors">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">비워낸 무거운 생각</p>
                <p className="text-[22px] font-black mt-1 text-[var(--text-main)]">{stats.releaseCount} <span className="text-[12px] font-normal">개</span></p>
              </div>
            </div>

            {/* History Cards Scroll */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-1 content-start">
              {Object.keys(savedDates).length === 0 ? (
                <div className="col-span-2 text-center py-16 bg-[var(--bg-card-inner)] rounded-2xl border border-dashed border-[var(--border-color)]">
                  <p className="text-[13px] text-[var(--text-muted)]">아직 보관된 마음 기록이 없습니다.</p>
                  <p className="text-[11px] text-[var(--text-muted)]/80 mt-1">오늘 첫 마음 기록을 채워보세요!</p>
                </div>
              ) : (
                Object.keys(savedDates)
                  .sort((a, b) => b.localeCompare(a)) // Latest first
                  .map((dateKey) => {
                    const saved = localStorage.getItem(`maeum_entry_${dateKey}`);
                    if (!saved) return null;
                    
                    try {
                      const entry: DiaryEntry = JSON.parse(saved);
                      const entryMood = moods.find(m => m.id === entry.mood);
                      const palette = archiveCardColors[entry.mood] || { bg: "#FFF7F4", ink: "#175138" };
                      const words = entry.fourWords?.filter(Boolean) || [];
                      const line1 = words.slice(0, 2).join("");
                      const line2 = words.slice(2, 4).join("");
                      const shortDate = dateKey.slice(5).replace("-", ".");
                      const formattedDate = dateKey.slice(5).replace("-", "월 ") + "일";
                      const note = entry.heartText || entry.releaseText || "";
                      const isFlipped = flippedDate === dateKey;

                      return (
                        <div
                          key={dateKey}
                          onClick={() => setFlippedDate((prev) => (prev === dateKey ? null : dateKey))}
                          className="group relative aspect-[3/4] cursor-pointer select-none"
                          style={{ perspective: "1000px" }}
                        >
                          <div
                            className="relative w-full h-full transition-transform duration-500"
                            style={{
                              transformStyle: "preserve-3d",
                              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            }}
                          >
                            {/* FRONT */}
                            <div
                              className="absolute inset-0 rounded-2xl p-3 shadow-sm overflow-hidden"
                              style={{ backfaceVisibility: "hidden", backgroundColor: palette.bg }}
                            >
                              {/* Top-left corner */}
                              <div className="absolute top-2.5 left-3 flex flex-col items-center leading-none" style={{ color: palette.ink }}>
                                <span className="text-[18px]">{entryMood?.emoji || "📝"}</span>
                                <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{shortDate}</span>
                              </div>

                              {/* Bottom-right corner (mirrored) */}
                              <div className="absolute bottom-2.5 right-3 flex flex-col items-center leading-none rotate-180" style={{ color: palette.ink }}>
                                <span className="text-[18px]">{entryMood?.emoji || "📝"}</span>
                                <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{shortDate}</span>
                              </div>

                              {/* Center headline */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                                <p className="font-black leading-[1.04] tracking-tight" style={{ color: palette.ink }}>
                                  <span className="block text-[30px]">{line1 || "-"}</span>
                                  {line2 && <span className="block text-[30px]">{line2}</span>}
                                </p>
                              </div>
                            </div>

                            {/* BACK */}
                            <div
                              className="absolute inset-0 rounded-2xl p-3 shadow-sm overflow-hidden"
                              style={{
                                backfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                                backgroundColor: palette.bg,
                              }}
                            >
                              <div className="w-full h-full rounded-xl bg-white/85 p-3 flex flex-col">
                                <div className="flex items-center justify-between mb-2" style={{ color: palette.ink }}>
                                  <span className="text-[11px] font-extrabold tracking-tight">{formattedDate}</span>
                                  <span className="text-[15px]">{entryMood?.emoji || "📝"}</span>
                                </div>
                                <p className="flex-1 text-[12px] leading-relaxed text-[#3a3a3a] overflow-y-auto whitespace-pre-wrap">
                                  {note || "이 날의 기록이 없어요."}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFullDate(dateKey);
                                    setActiveTab("write");
                                  }}
                                  className="text-[10px] font-bold mt-2 self-end hover:underline"
                                  style={{ color: palette.ink }}
                                >
                                  자세히 보기 ›
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })
              )}
            </div>
          </div>
        )}

        {/* 4. Settings Tab */}
        {activeTab === "settings" && (
          <div className="flex-1 px-5 py-6 flex flex-col space-y-6">
            {/* User Profile Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-sm transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-[var(--border-color)] overflow-hidden shrink-0 bg-[var(--bg-card-inner)] flex items-center justify-center shadow-inner">
                  <img src="/0604.png" alt="Puppy Profile" className="w-14 h-14 object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-[13px] font-bold text-[var(--text-main)] focus:outline-none w-full max-w-[120px]"
                        maxLength={10}
                      />
                      <button onClick={saveName} className="bg-[var(--button-primary)] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        저장
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[16px] font-extrabold text-[var(--text-main)] truncate">{userName}</h3>
                      <button onClick={() => setIsEditingName(true)} className="text-[11px] text-[var(--nav-active-text)] hover:underline font-bold">
                        수정
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">마음써방과 함께하는 소중한 나날</p>
                </div>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2.5">
              <h3 className="text-[13px] font-bold text-[var(--text-main)] px-1">앱 테마 스타일</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "sauge", label: "Cloud Skin ☁️" },
                  { id: "night", label: "Cocao Root ☕" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`p-3 rounded-2xl border text-center transition-all duration-300 ${
                      theme === t.id
                        ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30 font-bold bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm"
                        : "border-[var(--border-color)] bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <span className="text-[11px] block">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics Review */}
            <div className="space-y-2.5">
              <h3 className="text-[13px] font-bold text-[var(--text-main)] px-1">기록 통계</h3>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[var(--text-muted)]">버킷리스트 완료율</span>
                    <span className="font-bold text-[var(--text-main)]">{stats.bucketPct}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg-card-inner)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                    <div 
                      className="bg-[var(--accent-color)] h-full transition-all duration-500"
                      style={{ width: `${stats.bucketPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-[var(--text-muted)]">비워낸 무거운 생각들</span>
                  <span className="font-bold text-[var(--text-main)]">{stats.releaseCount} 개</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={handleResetData}
                className="w-full py-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 rounded-2xl font-bold text-[12px] transition-colors"
              >
                모든 데이터 및 설정 초기화
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Alert Popups */}
      {showToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-black/85 text-white rounded-full text-[12px] font-medium z-50 shadow-md animate-pop flex items-center gap-1.5 whitespace-nowrap">
          <span>✨</span> {showToast}
        </div>
      )}

      {/* Bottom Tab Navigation Bar */}
      <div className="shrink-0 bg-[var(--bg-container)] border-t border-[var(--border-color)] px-4 py-3 z-10 transition-all duration-300">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {[
            { id: "write" as const, label: "기록", icon: Edit3 },
            { id: "bucket" as const, label: "버킷", icon: Trash2 },
            { id: "archive" as const, label: "아카이브", icon: Archive },
            { id: "settings" as const, label: "설정", icon: Settings },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--accent-bg)] text-[var(--nav-active-text)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
                style={{ minWidth: "64px" }}
              >
                <IconComponent
                  className="w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] leading-none mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
