"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Mood,
  DiaryEntry,
  BucketItem,
  BucketType,
  Particle,
  wordSets,
  bucketTypeMeta,
  createOrderLabels,
  createOrderProgress,
  orderLabelPlaceholder,
  orderUnitsFromProgress,
  OrderProgress,
} from "./types";

function useMaeumState() {
  // Date States
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
  const [stats, setStats] = useState({ writeCount: 0, releaseCount: 0, bucketPct: 0, bucketActiveCount: 0, bucketArchivedCount: 0 });

  // Bucket List States
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [newBucketText, setNewBucketText] = useState("");

  // Archive flip card
  const [flippedDate, setFlippedDate] = useState<string | null>(null);

  // Embla Carousel hook
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Initialize Week & Theme
  useEffect(() => {
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

    const todayObj = currentWeek.find((d) => d.isToday) || currentWeek[3];
    setSelectedFullDate(todayObj.fullDate);

    const savedTheme = localStorage.getItem("maeum_theme") || "sauge";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedName = localStorage.getItem("maeum_username") || "나의 하루";
    setUserName(savedName);

    // Load bucket list (with migration for legacy items)
    const savedBucket = localStorage.getItem("maeum_bucket");
    if (savedBucket) {
      try {
        const parsed = JSON.parse(savedBucket) as any[];
        const migrated: BucketItem[] = parsed.map((it) => {
          const type: BucketType = it.type || "habit";
          const target = bucketTypeMeta[type] ? (it.units?.length || 7) : 7;
          const units: boolean[] = Array.isArray(it.units) ? it.units : Array(target).fill(false);
          const labels =
            type === "order"
              ? (Array.isArray(it.labels) && it.labels.length === units.length
                  ? it.labels
                  : createOrderLabels(units.length)
                ).map((label: string, i: number) =>
                  label === orderLabelPlaceholder(i) ? "" : label
                )
              : undefined;
          const orderProgress: OrderProgress[] | undefined =
            type === "order"
              ? Array.isArray(it.orderProgress) && it.orderProgress.length === units.length
                ? it.orderProgress
                : units.map((done: boolean, i: number) => {
                    if (done) return 2;
                    if (labels?.[i]?.trim()) return 1;
                    return 0;
                  })
              : undefined;
          const syncedUnits = type === "order" && orderProgress ? orderUnitsFromProgress(orderProgress) : units;
          return {
            id: it.id,
            text: it.text,
            type,
            units: syncedUnits,
            labels,
            orderProgress,
            completed: type === "order" && orderProgress ? orderProgress.every((step) => step === 2) : syncedUnits.every(Boolean),
            archived: it.archived || false,
            archivedAt: it.archivedAt,
            createdAt: it.createdAt || Date.now(),
          };
        });
        setBucketItems(migrated);
      } catch (e) {}
    }

    refreshSavedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (emblaApi) emblaApi.scrollTo(0);
        return;
      } catch (e) {
        console.error(e);
      }
    }

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
  const saveCurrentEntry = useCallback(
    (updates: Partial<DiaryEntry>) => {
      if (!selectedFullDate) return;

      const currentEntry: DiaryEntry = {
        date: selectedFullDate,
        mood: updates.mood !== undefined ? updates.mood : mood,
        fourWords: updates.fourWords !== undefined ? updates.fourWords : isDirectWrite ? customWords : fourWords,
        isDirectWrite: updates.isDirectWrite !== undefined ? updates.isDirectWrite : isDirectWrite,
        heartText: updates.heartText !== undefined ? updates.heartText : heartText,
        releaseText: updates.releaseText !== undefined ? updates.releaseText : releaseText,
        released: updates.released !== undefined ? updates.released : isReleased,
      };

      localStorage.setItem(`maeum_entry_${selectedFullDate}`, JSON.stringify(currentEntry));
      refreshSavedDates();
    },
    [selectedFullDate, mood, fourWords, isDirectWrite, customWords, heartText, releaseText, isReleased, refreshSavedDates]
  );

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

  // Toast alert launcher
  const triggerToast = useCallback((msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(""), 3000);
  }, []);

  // Roulette Spinning Action
  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);

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

  // Dissolve/Release Animation Action
  const handleRelease = () => {
    if (!releaseText.trim() || isReleasing) return;
    setIsReleasing(true);

    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 80 + 10,
      top: Math.random() * 40 + 30,
      x: (Math.random() - 0.5) * 200,
      y: -150 - Math.random() * 180,
      r: Math.random() * 360 + 180,
    }));
    setParticles(newParticles);

    setTimeout(() => {
      setReleaseText("");
      setIsReleased(true);
      setIsReleasing(false);
      setParticles([]);
      saveCurrentEntry({ releaseText: "", released: true });
      triggerToast("마음이 한결 털어지셨기를 바랍니다. 🕊️");
    }, 1200);
  };

  // Bucket list updates
  const persistBucket = (updated: BucketItem[]) => {
    setBucketItems(updated);
    localStorage.setItem("maeum_bucket", JSON.stringify(updated));
  };

  const createBucketItem = (text: string, type: BucketType, target: number): BucketItem => ({
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    text,
    type,
    units: Array(target).fill(false),
    labels: type === "order" ? createOrderLabels(target) : undefined,
    orderProgress: type === "order" ? createOrderProgress(target) : undefined,
    completed: false,
    archived: false,
    createdAt: Date.now(),
  });

  const handleAddBucketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketText.trim()) return;
    const item = createBucketItem(newBucketText.trim(), "habit", 7);
    persistBucket([item, ...bucketItems]);
    setNewBucketText("");
    triggerToast("마음 습관이 추가되었습니다 ✨");
  };

  const addBucketItem = (item: BucketItem) => {
    persistBucket([item, ...bucketItems]);
    const meta = bucketTypeMeta[item.type];
    triggerToast(`${meta.label} 습관을 담았어요`);
  };

  const addPresetBucket = (preset: { type: BucketType; phrase: string; target: number }) => {
    const text = newBucketText.trim() || preset.phrase;
    addBucketItem(createBucketItem(text, preset.type, preset.target));
    if (newBucketText.trim()) setNewBucketText("");
  };

  const updateBucketLabel = (id: string, index: number, label: string) => {
    setBucketItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id || item.type !== "order") return item;
        const labels = [...(item.labels ?? createOrderLabels(item.units.length))];
        const progress = [...(item.orderProgress ?? createOrderProgress(item.units.length))];
        labels[index] = label;
        if (!label.trim() && progress[index] > 0) progress[index] = 0;
        const units = orderUnitsFromProgress(progress);
        return {
          ...item,
          labels,
          orderProgress: progress,
          units,
          completed: progress.every((step) => step === 2),
        };
      });
      localStorage.setItem("maeum_bucket", JSON.stringify(next));
      return next;
    });
  };

  const handleBucketCompletion = (id: string, justCompleted: boolean) => {
    if (!justCompleted) return;
    triggerToast("가득 채웠어요! 아카이브에 보관할게요 🕊️");
    setTimeout(() => {
      setBucketItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, archived: true, archivedAt: Date.now() } : it));
        localStorage.setItem("maeum_bucket", JSON.stringify(next));
        return next;
      });
    }, 1000);
  };

  const advanceOrderProgress = (id: string, index: number) => {
    setBucketItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (!item || item.type !== "order") return prev;

      const labels = item.labels ?? createOrderLabels(item.units.length);
      const progress = [...(item.orderProgress ?? createOrderProgress(item.units.length))];
      const current = progress[index];
      const label = labels[index]?.trim() ?? "";

      if (current === 0 && !label) {
        queueMicrotask(() => triggerToast("할 일을 먼저 적어주세요"));
        return prev;
      }

      const nextStep: OrderProgress = current === 0 ? 1 : current === 1 ? 2 : 1;
      progress[index] = nextStep;
      const units = orderUnitsFromProgress(progress);
      const completed = progress.every((step) => step === 2);
      const justCompleted = completed && !item.completed;

      const next = prev.map((it) =>
        it.id === id ? { ...it, orderProgress: progress, units, completed } : it
      );
      localStorage.setItem("maeum_bucket", JSON.stringify(next));

      if (nextStep === 1) queueMicrotask(() => triggerToast("작성 완료! 이제 수행하면 탭해주세요"));
      if (nextStep === 2 && !justCompleted) queueMicrotask(() => triggerToast("수행 완료! ✓"));

      if (justCompleted) queueMicrotask(() => handleBucketCompletion(id, true));
      return next;
    });
  };

  const toggleBucketUnit = (id: string, index: number) => {
    setBucketItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      const nextValue = !target.units[index];
      let justCompleted = false;
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const units = item.units.map((u, i) => (i === index ? nextValue : u));
        const completed = units.every(Boolean);
        if (completed && !item.completed) justCompleted = true;
        return { ...item, units, completed };
      });
      localStorage.setItem("maeum_bucket", JSON.stringify(next));
      if (justCompleted) queueMicrotask(() => handleBucketCompletion(id, true));
      return next;
    });
  };

  const deleteBucketItem = (id: string) => {
    setBucketItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem("maeum_bucket", JSON.stringify(next));
      return next;
    });
    triggerToast("습관을 지웠어요");
  };

  const deleteDiaryEntry = useCallback(
    (dateKey: string) => {
      localStorage.removeItem(`maeum_entry_${dateKey}`);
      refreshSavedDates();
      setFlippedDate((prev) => (prev === dateKey ? null : prev));
      if (selectedFullDate === dateKey) {
        setMood(null);
        setFourWords(wordSets[0].words);
        setIsDirectWrite(false);
        setHeartText("");
        setReleaseText("");
        setIsReleased(false);
        setCustomWords(["", "", "", ""]);
        if (emblaApi) emblaApi.scrollTo(0);
      }
      triggerToast("기록을 지웠어요");
    },
    [refreshSavedDates, selectedFullDate, emblaApi, triggerToast]
  );

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
    const active = bucketItems.filter((i) => !i.archived);
    const archived = bucketItems.filter((i) => i.archived);
    const totalUnits = active.reduce((s, i) => s + i.units.length, 0);
    const filledUnits = active.reduce((s, i) => s + i.units.filter(Boolean).length, 0);
    const bucketPct = totalUnits > 0 ? Math.round((filledUnits / totalUnits) * 100) : 0;

    setStats({
      writeCount,
      releaseCount,
      bucketPct,
      bucketActiveCount: active.length,
      bucketArchivedCount: archived.length,
    });
  }, [savedDates, bucketItems]);

  return {
    weekDays,
    selectedFullDate,
    setSelectedFullDate,
    savedDates,
    mood,
    setMood,
    fourWords,
    heartText,
    setHeartText,
    releaseText,
    setReleaseText,
    isReleased,
    setIsReleased,
    isDirectWrite,
    customWords,
    setCustomWords,
    isSpinning,
    isReleasing,
    particles,
    showToast,
    theme,
    userName,
    setUserName,
    isEditingName,
    setIsEditingName,
    stats,
    bucketItems,
    newBucketText,
    setNewBucketText,
    flippedDate,
    setFlippedDate,
    emblaRef,
    emblaApi,
    selectedIndex,
    saveCurrentEntry,
    spinRoulette,
    toggleDirectWrite,
    handleRelease,
    triggerToast,
    handleAddBucketItem,
    addBucketItem,
    addPresetBucket,
    toggleBucketUnit,
    updateBucketLabel,
    advanceOrderProgress,
    deleteBucketItem,
    deleteDiaryEntry,
    handleThemeChange,
    handleResetData,
    saveName,
  };
}

type MaeumContextValue = ReturnType<typeof useMaeumState>;

const MaeumContext = createContext<MaeumContextValue | null>(null);

export function useMaeum() {
  const ctx = useContext(MaeumContext);
  if (!ctx) throw new Error("useMaeum must be used within MaeumProvider");
  return ctx;
}

export function MaeumProvider({ children }: { children: ReactNode }) {
  const value = useMaeumState();
  return <MaeumContext.Provider value={value}>{children}</MaeumContext.Provider>;
}
