import React, { useEffect, useState } from "react";
import { apiGetGlobalLeaderboard, apiGetFriendsLeaderboard } from "../../api/prodoApi";
import type { LeaderboardEntry } from "../../api/prodoApi";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalLeaderboardPage - Cheerful, accessible rankings dashboard for beta.prodo.live.
 * Features numbered circle badges, clean user cards, tab pills, and XP pill metrics.
 */
const WhimsicalLeaderboardPage: React.FC = () => {
  const { username } = useFocus();
  const [tab, setTab] = useState<"global" | "friends">("global");
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
  const [friendsData, setFriendsData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const currentUser = username || "";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [global, friends] = await Promise.all([
        apiGetGlobalLeaderboard(),
        apiGetFriendsLeaderboard(),
      ]);
      setGlobalData(global.leaderboard);
      setFriendsData(friends.leaderboard);
      setLastRefreshed(new Date().toTimeString().split(" ")[0]);
    } catch (e: any) {
      setError("Cannot reach Prodo API server. Ensure the backend worker is online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const activeList = tab === "global" ? globalData : friendsData;

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-amber-400 text-amber-950 font-black shadow-sm";
    if (rank === 2) return "bg-slate-300 text-slate-900 font-bold shadow-sm";
    if (rank === 3) return "bg-amber-600/80 text-white font-bold shadow-sm";
    return "bg-[#0047AB] text-white font-bold";
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header Card & Tab Controls */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            COMMUNITY & COMPETITION
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Leaderboard & Rankings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full border border-slate-200">
            <button
              onClick={() => setTab("global")}
              className={`px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${
                tab === "global"
                  ? "bg-[#0047AB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setTab("friends")}
              className={`px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${
                tab === "friends"
                  ? "bg-[#0047AB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              Friends
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#0047AB] hover:bg-blue-50 flex items-center justify-center transition-all"
            title={lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Main Leaderboard List Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            {tab === "global" ? "GLOBAL LEADERBOARD POOL" : "FRIENDS LEADERBOARD POOL"}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {activeList.length} Ranked User{activeList.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400 font-bold text-sm">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-[#0047AB] rounded-full animate-spin"></div>
            Loading community rankings...
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-4xl">signal_disconnected</span>
            <p className="text-rose-700 font-bold text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 bg-[#0047AB] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activeList.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-medium text-sm italic">
            No ranked operators found in this pool yet.
          </div>
        )}

        {/* Ranked Operators Cards */}
        {!loading && !error && activeList.length > 0 && (
          <div className="flex flex-col gap-3">
            {activeList.map((entry, idx) => {
              const rank = idx + 1;
              const isCurrent = entry.username.toLowerCase() === currentUser.toLowerCase();

              return (
                <div
                  key={entry.username}
                  className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all ${
                    isCurrent
                      ? "bg-blue-50/70 border-blue-300 shadow-2xs"
                      : "bg-slate-50/80 border-slate-200/80 hover:bg-white hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Circle Number Rank Badge */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${getRankBadgeStyle(
                        rank
                      )}`}
                    >
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                    </div>

                    {/* Avatar Badge */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center font-bold text-sm uppercase">
                      {entry.username[0]}
                    </div>

                    {/* Username & Badge */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {entry.username}
                        </span>
                        {isCurrent && (
                          <span className="bg-[#0047AB] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Rank #{rank}
                      </span>
                    </div>
                  </div>

                  {/* Focus XP Metric Chip */}
                  <div className="bg-white border border-slate-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xs">
                    <span className="material-symbols-outlined text-amber-500 text-lg">bolt</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {entry.points.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">XP</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};

export default WhimsicalLeaderboardPage;
