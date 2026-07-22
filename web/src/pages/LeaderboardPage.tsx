import React, { useEffect, useState } from "react";
import { apiGetGlobalLeaderboard, apiGetFriendsLeaderboard } from "../api/prodoApi";
import type { LeaderboardEntry } from "../api/prodoApi";
import { useFocus } from "../context/FocusContext";

const MEDALS = ["🥇", "🥈", "🥉"];

const RankRow: React.FC<{ entry: LeaderboardEntry; rank: number; highlight?: boolean }> = ({
  entry,
  rank,
  highlight,
}) => {
  const medal = MEDALS[rank - 1] ?? null;
  const isTop3 = rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-b border-surface-variant transition-all hover:bg-surface-container-low ${
        highlight ? "bg-amber/5 border-l-2 border-l-amber" : "border-l-2 border-l-transparent"
      }`}
    >
      {/* Rank */}
      <div className={`w-10 text-center font-technical-prefix text-xs flex-shrink-0 ${isTop3 ? "text-amber font-bold text-base" : "text-outline-variant"}`}>
        {medal ?? `#${rank}`}
      </div>

      {/* Avatar placeholder */}
      <div className="w-8 h-8 bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0">
        <span className="font-technical-prefix text-[10px] text-outline-variant uppercase">
          {entry.username[0]}
        </span>
      </div>

      {/* Username */}
      <div className="flex-grow">
        <div className={`font-log-body font-bold text-sm uppercase ${highlight ? "text-amber" : "text-primary"}`}>
          {entry.username}
          {highlight && <span className="ml-2 font-technical-prefix text-[8px] text-amber/70">[YOU]</span>}
        </div>
      </div>

      {/* Points */}
      <div className="text-right flex-shrink-0">
        <div className="font-technical-prefix text-[8px] text-outline-variant">TOTAL_XP</div>
        <div className={`font-value-lg text-base ${isTop3 ? "text-amber" : "text-primary"}`}>
          {entry.points.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const LeaderboardPage: React.FC = () => {
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
      setError("ERR_NET: Cannot reach Prodo API server. Ensure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const activeList = tab === "global" ? globalData : friendsData;

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_GLOBAL_RANKINGS</div>
          <h1 className="font-value-lg text-[32px] text-primary">LEADERBOARD</h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Tab switcher */}
          <div className="flex border border-outline-variant">
            <button
              onClick={() => setTab("global")}
              className={`px-4 py-2 font-technical-prefix text-[10px] uppercase border-r border-outline-variant transition-colors ${
                tab === "global" ? "bg-primary text-background font-bold" : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setTab("friends")}
              className={`px-4 py-2 font-technical-prefix text-[10px] uppercase transition-colors ${
                tab === "friends" ? "bg-primary text-background font-bold" : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              Friends
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant font-technical-prefix text-[9px] text-outline-variant hover:border-primary hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[12px]">refresh</span>
            {lastRefreshed ? `Refreshed ${lastRefreshed}` : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-grow bg-surface-container-lowest border border-outline-variant overflow-hidden flex flex-col">
        {/* Panel header row */}
        <div className="flex items-center gap-4 px-4 py-2 bg-surface-container-high border-b border-outline-variant flex-shrink-0">
          <span className="w-10 font-technical-prefix text-[8px] text-outline-variant uppercase">Rank</span>
          <span className="w-8 font-technical-prefix text-[8px] text-outline-variant uppercase">Op</span>
          <span className="flex-grow font-technical-prefix text-[8px] text-outline-variant uppercase">Username</span>
          <span className="font-technical-prefix text-[8px] text-outline-variant uppercase text-right">Focus XP</span>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-full gap-3 text-outline-variant font-technical-prefix text-xs">
              <span className="w-3 h-3 border-2 border-outline-variant border-t-primary animate-spin rounded-full"></span>
              SYNCING RANKINGS FROM SERVER...
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <span className="material-symbols-outlined text-[40px] text-crimson">signal_disconnected</span>
              <div className="font-technical-prefix text-xs text-crimson uppercase">{error}</div>
              <div className="font-technical-prefix text-[9px] text-outline-variant">
                Unable to reach Cloudflare Worker API (<code className="text-primary bg-background px-1">https://api.prodo.live</code>)
              </div>
              <button
                onClick={fetchData}
                className="mt-2 px-4 py-2 border border-outline-variant text-primary font-technical-prefix text-[10px] uppercase hover:bg-surface-container-high transition-all"
              >
                Retry Connection
              </button>
            </div>
          )}

          {!loading && !error && activeList.length === 0 && (
            <div className="flex items-center justify-center h-full text-outline-variant font-technical-prefix text-xs">
              NO RANKED OPERATORS FOUND IN THIS POOL.
            </div>
          )}

          {!loading && !error && activeList.map((entry, idx) => (
            <RankRow
              key={entry.username}
              entry={entry}
              rank={idx + 1}
              highlight={entry.username.toLowerCase() === currentUser.toLowerCase()}
            />
          ))}
        </div>

        {/* Footer status */}
        {!loading && !error && (
          <div className="border-t border-surface-variant px-4 py-2 flex justify-between items-center flex-shrink-0">
            <span className="font-technical-prefix text-[8px] text-outline-variant uppercase">
              {activeList.length} OPERATOR{activeList.length !== 1 ? "S" : ""} RANKED
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald"></span>
              <span className="font-technical-prefix text-[8px] text-emerald uppercase">LIVE_SYNC</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
