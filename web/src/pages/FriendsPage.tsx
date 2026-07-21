import React, { useState, useEffect } from "react";
import { 
  apiAddFriend, 
  apiGetFriendsList, 
  apiGetFriendsLeaderboard, 
  apiCreateCoopSession, 
  apiJoinCoopSession, 
  apiEndCoopSession,
  apiGetActiveCoopRooms
} from "../api/prodoApi";
import type { LeaderboardEntry } from "../api/prodoApi";
import { useFocus } from "../context/FocusContext";

const FriendsPage: React.FC = () => {
  const { username, isCoopActive, setIsCoopActive } = useFocus();
  const [friendUsername, setFriendUsername] = useState("");
  const [friendsList, setFriendsList] = useState<{ username: string; points: number }[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeRooms, setActiveRooms] = useState<{ session_id: string; host_username: string; started_at: number }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchSocialData = async () => {
    try {
      const fl = await apiGetFriendsList();
      if (fl.success) setFriendsList(Array.isArray(fl.friends) ? fl.friends : []);

      const lb = await apiGetFriendsLeaderboard();
      if (lb.success) setLeaderboard(Array.isArray(lb.leaderboard) ? lb.leaderboard : []);

      const ar = await apiGetActiveCoopRooms();
      if (ar.success) setActiveRooms(Array.isArray(ar.rooms) ? ar.rooms : []);
    } catch (e) {
      console.error("Error loading social data:", e);
    }
  };

  useEffect(() => {
    fetchSocialData();
    const interval = setInterval(fetchSocialData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!friendUsername.trim()) return;

    try {
      const res = await apiAddFriend(friendUsername);
      if (res.success) {
        setMsg(`✓ ${res.message}`);
        setFriendUsername("");
        fetchSocialData();
      } else {
        setErr("❌ Add friend failed.");
      }
    } catch (e: any) {
      setErr(`❌ Error: ${e.message || "Could not add friend."}`);
    }
  };

  const handleCreateGeneralCoop = async () => {
    setMsg(null);
    setErr(null);
    try {
      const res = await apiCreateCoopSession("");
      if (res.success) {
        setActiveSessionId(res.session_id);
        setIsCoopActive(true);
        setMsg(`🚀 Co-Op Focus room created! ID: ${res.session_id}`);
        fetchSocialData();
      }
    } catch (e: any) {
      setErr(`❌ Co-Op room creation failed: ${e.message}`);
    }
  };

  const handleStartCoop = async (username: string) => {
    setMsg(null);
    setErr(null);
    try {
      const res = await apiCreateCoopSession(username);
      if (res.success) {
        setActiveSessionId(res.session_id);
        setIsCoopActive(true);
        setMsg(`🚀 Co-Op Focus session initialized! ID: ${res.session_id}`);
        fetchSocialData();
      }
    } catch (e: any) {
      setErr(`❌ Co-Op start failed: ${e.message}`);
    }
  };

  const handleJoinCoop = async () => {
    const sId = prompt("Enter Co-Op Room ID to Join:");
    if (!sId) return;
    setMsg(null);
    setErr(null);
    try {
      const res = await apiJoinCoopSession(sId);
      if (res.success) {
        setActiveSessionId(sId);
        setIsCoopActive(true);
        setMsg(`✓ Successfully joined Co-Op Focus Room: ${sId}`);
        fetchSocialData();
      }
    } catch (e: any) {
      setErr(`❌ Co-Op join failed: ${e.message}`);
    }
  };

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 h-full overflow-hidden select-none">
      
      {/* Left panel - Add and List Friends */}
      <section className="flex-1 flex flex-col h-full gap-6 overflow-y-auto pr-1">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">OPERATOR_NET_LINKS</div>
          <h1 className="font-value-lg text-[32px] text-primary">SOCIAL FOCUS ROOMS</h1>
        </div>

        {/* Add Friend form */}
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-4">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">LINK_NEW_OPERATOR</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">ADD FRIEND BY USERNAME</h3>
            <div className="font-technical-prefix text-[10px] text-amber mt-2 uppercase">
              YOUR USERNAME: {username || "LOADING..."}
            </div>
          </div>
          
          <form onSubmit={handleAddFriend} className="flex gap-2">
            <input
              type="text"
              placeholder="ENTER USERNAME..."
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              className="flex-grow bg-background border border-outline-variant text-on-surface px-3 py-2 font-technical-prefix text-xs outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald text-background font-technical-prefix text-[10px] uppercase font-bold hover:bg-green-400 transition-all border border-emerald"
            >
              Link Node
            </button>
          </form>

          {msg && <div className="text-emerald font-technical-prefix text-[10px] uppercase">{msg}</div>}
          {err && <div className="text-crimson font-technical-prefix text-[10px] uppercase">{err}</div>}
        </div>

        {/* Discoverable Rooms */}
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-4">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">AVAILABLE_COOP_LOBBIES</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">JOIN FRIENDS' ROOMS</h3>
          </div>

          <div className="flex flex-col gap-3">
            {activeRooms.length === 0 ? (
              <div className="text-outline-variant font-technical-prefix text-xs italic">
                No active friend rooms detected.
              </div>
            ) : (
              activeRooms.map((room) => (
                <div 
                  key={room.session_id}
                  className="flex items-center justify-between p-3 border border-surface-variant bg-background"
                >
                  <div>
                    <div className="font-log-body font-bold text-primary">HOST: {room.host_username}</div>
                    <div className="font-technical-prefix text-[9px] text-outline-variant">
                      ROOM ID: {room.session_id}
                    </div>
                  </div>
                  
                  <button
                    onClick={async () => {
                      setMsg(null);
                      setErr(null);
                      try {
                        const res = await apiJoinCoopSession(room.session_id);
                        if (res.success) {
                          setActiveSessionId(room.session_id);
                          setIsCoopActive(true);
                          setMsg(`✓ Joined room hosted by ${room.host_username}`);
                        }
                      } catch (err: any) {
                        setErr(`❌ Join failed: ${err.message}`);
                      }
                    }}
                    className="px-3 py-1 bg-emerald text-background hover:bg-green-400 font-technical-prefix text-[9px] uppercase font-bold"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Friends List */}
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-4 flex-grow overflow-hidden">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">LINKED_NODES_LIST</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">OPERATOR DIRECTORY</h3>
          </div>

          <div className="flex-grow overflow-y-auto flex flex-col gap-3">
            {friendsList.length === 0 ? (
              <div className="text-outline-variant font-technical-prefix text-xs italic">
                No active operator links established.
              </div>
            ) : (
              friendsList.map((friend) => (
                <div 
                  key={friend.username}
                  className="flex items-center justify-between p-3 border border-surface-variant bg-background"
                >
                  <div>
                    <div className="font-log-body font-bold text-primary">{friend.username}</div>
                    <div className="font-technical-prefix text-[9px] text-outline-variant">
                      LIFETIME XP: {friend.points} PTS
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartCoop(friend.username)}
                      className="px-3 py-1 border border-amber/40 text-amber hover:bg-amber/10 font-technical-prefix text-[9px] uppercase"
                    >
                      Co-Op Focus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Co-Op status banner */}
          <div className="border border-outline-variant p-4 bg-background flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-technical-prefix text-[10px] text-outline-variant">CO-OP MULTIPLIER BOOST</span>
              <span className={`font-technical-prefix text-xs ${isCoopActive ? "text-emerald animate-pulse" : "text-outline-variant"}`}>
                {isCoopActive ? "ACTIVE: 5.0X BOOST" : "STANDBY"}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCreateGeneralCoop}
                className="flex-1 py-2 bg-amber text-background font-technical-prefix text-[10px] uppercase font-bold hover:bg-amber-400"
              >
                Create Room
              </button>
              <button
                onClick={handleJoinCoop}
                className="flex-1 py-2 border border-outline-variant hover:bg-surface-container-high font-technical-prefix text-[10px] uppercase text-primary"
              >
                Join Room ID
              </button>
              {isCoopActive && (
                <button
                  onClick={() => {
                    setIsCoopActive(false);
                    if (activeSessionId) apiEndCoopSession(activeSessionId).catch(console.error);
                    setActiveSessionId(null);
                    setMsg("Co-Op Session terminated.");
                  }}
                  className="px-4 py-2 bg-crimson text-white font-technical-prefix text-[10px] uppercase"
                >
                  End Room
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Right panel - Leaderboard */}
      <section className="w-full lg:w-[360px] flex flex-col gap-6 h-full flex-shrink-0 overflow-hidden">
        <div className="border border-outline-variant bg-surface-container-lowest p-5 flex flex-col gap-4 h-full">
          <div>
            <div className="font-technical-prefix text-technical-prefix text-outline-variant uppercase mb-1">COGNITIVE_RANKINGS</div>
            <h3 className="font-log-body font-bold text-sm text-primary uppercase">FRIENDS LEADERBOARD</h3>
          </div>

          <div className="flex-grow overflow-y-auto flex flex-col gap-2">
            {leaderboard.length === 0 ? (
              <div className="text-outline-variant font-technical-prefix text-xs italic">
                Awaiting ranking feed synchronization...
              </div>
            ) : (
              leaderboard.map((user, idx) => (
                <div 
                  key={user.username}
                  className="flex items-center justify-between p-3 border border-surface-variant bg-background"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-technical-prefix text-xs text-outline-variant">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-log-body font-bold text-primary">{user.username}</span>
                  </div>
                  <span className="font-technical-prefix text-xs text-amber font-bold">
                    {user.points} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FriendsPage;
