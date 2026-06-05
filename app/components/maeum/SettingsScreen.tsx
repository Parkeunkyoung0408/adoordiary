"use client";

import { useMaeum } from "./MaeumContext";

const THEME_OPTIONS = [
  { id: "sauge", label: "Cloud Skin ☁️" },
  { id: "night", label: "Cocao Root ☕" },
];

export default function SettingsScreen() {
  const {
    isEditingName,
    setIsEditingName,
    userName,
    setUserName,
    saveName,
    theme,
    handleThemeChange,
    stats,
    handleResetData,
  } = useMaeum();

  return (
    <div className="flex-1 px-5 py-6 flex flex-col space-y-6">
      {/* User Profile Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--border-color)] overflow-hidden shrink-0 bg-[var(--bg-card-inner)] flex items-center justify-center">
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
          {THEME_OPTIONS.map((t) => (
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
              <div className="bg-[var(--accent-color)] h-full transition-all duration-500" style={{ width: `${stats.bucketPct}%` }} />
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
          className="w-full py-3 rounded-[30px] font-bold text-[12px] transition-colors"
          style={{ backgroundColor: "#175138", color: "#ffffff" }}
        >
          모든 데이터 및 설정 초기화
        </button>
      </div>
    </div>
  );
}
