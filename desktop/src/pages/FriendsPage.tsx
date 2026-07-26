import React, { useState, useEffect } from "react";
import {
  apiAddFriend,
  apiGetFriendsList,
  apiGetFriendsLeaderboard,
  apiCreateCoopSession,
  apiJoinCoopSession,
  apiEndCoopSession,
  apiGetActiveCoopRooms,
} from "../api/prodoApi";
import type { LeaderboardEntry } from "../api/prodoApi";
import { useFocus } from "../context/FocusContext";

/**
 * WhimsicalFriendsPage - Immersive social study hubs and friend lobbies.
 * Features neon rounded cards, active Co-Op multiplier chips, and instant room joining in dark mode.
 */
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
    if (!localStorage.getItem("prodo_token")) return;
    try {
      const fl = await apiGetFriendsList();
      if (fl && fl.success) setFriendsList(Array.isArray(fl.friends) ? fl.friends : []);

      const lb = await apiGetFriendsLeaderboard();
      if (lb && lb.success) setLeaderboard(Array.isArray(lb.leaderboard) ? lb.leaderboard : []);

      const ar = await apiGetActiveCoopRooms();
      if (ar && ar.success) setActiveRooms(Array.isArray(ar.rooms) ? ar.rooms : []);
    } catch (e) {
      // Silently absorb social fetch errors when offline / in guest mode
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

  const handleStartCoop = async (targetUser: string) => {
    setMsg(null);
    setErr(null);
    try {
      const res = await apiCreateCoopSession(targetUser);
      if (res.success) {
        setActiveSessionId(res.session_id);
        setIsCoopActive(true);
        setMsg(`🚀 Co-Op session initialized! ID: ${res.session_id}`);
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
    <div className="flex flex-col gap-6 pb-12 mt-8">
      
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest">
            COMMUNITY STUDY HUBS
          </span>
          <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mt-1">
            Friends & Social Rooms
          </h1>
        </div>

        {/* Co-Op Status & Controls Chip */}
        <div className="flex items-center gap-3">
          <div className="bg-background/50 border border-lavender/50 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-sm">
            <span className={`w-3 h-3 rounded-full ${isCoopActive ? "bg-secondary animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "bg-on-surface/30"}`}></span>
            <span className="text-[10px] font-black text-on-surface uppercase tracking-wider">
              CO-OP BOOST: {isCoopActive ? <span className="text-secondary">5.0X ACTIVE</span> : <span className="text-on-surface/50">STANDBY</span>}
            </span>
          </div>

          <button
            onClick={handleJoinCoop}
            className="bg-background hover:bg-surface text-on-surface font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-full border border-lavender/50 transition-all shadow-sm"
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
              className="bg-heart-red hover:bg-heart-red/80 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-full shadow-md shadow-heart-red/20 transition-all"
            >
              End Room
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Add Friend & Discoverable Rooms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Add Friend Form Card */}
          <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-base text-on-surface uppercase tracking-wider">
                Add Friend by Username
              </h3>
              <p className="text-xs font-semibold text-on-surface/50 mt-0.5">
                Your Username: <strong className="text-primary">{username || "Operator"}</strong>
              </p>
            </div>
            
            <form onSubmit={handleAddFriend} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter friend username..."
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="flex-1 bg-background border border-lavender rounded-full px-5 py-3 text-xs text-on-surface focus:outline-none focus:bg-surface focus:border-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary/80 text-white font-black text-[10px] uppercase tracking-wider px-6 py-3 rounded-full shadow-md shadow-primary/20 transition-all active:scale-95"
              >
                Send Request
              </button>
            </form>

            {msg && <div className="text-[10px] font-black text-secondary bg-secondary/10 p-3 rounded-xl border border-secondary/30 uppercase tracking-wider">{msg}</div>}
            {err && <div className="text-[10px] font-black text-heart-red bg-heart-red/10 p-3 rounded-xl border border-heart-red/30 uppercase tracking-wider">{err}</div>}
          </div>

          {/* Active Co-Op Rooms Card */}
          <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-on-surface uppercase tracking-wider">
                Discoverable Study Rooms ({activeRooms.length})
              </h3>
              <button
                onClick={handleCreateGeneralCoop}
                className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
              >
                + Create Room
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {activeRooms.length === 0 ? (
                <div className="text-on-surface/40 text-xs font-medium italic py-6 text-center">
                  No active friend rooms detected right now. Create one above!
                </div>
              ) : (
                activeRooms.map((room) => (
                  <div
                    key={room.session_id}
                    className="bg-background/50 border border-lavender rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-surface hover:scale-[1.01]"
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-on-surface">
                        Host: {room.host_username}
                      </h4>
                      <p className="text-[10px] font-bold text-on-surface/50 uppercase tracking-wider">
                        Room ID: {room.session_id}
                      </p>
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
                      className="bg-primary hover:bg-primary/80 text-white font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-primary/20 transition-all"
                    >
                      Join Room
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Friends List Directory */}
          <div className="bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col gap-4">
            <h3 className="font-extrabold text-base text-on-surface uppercase tracking-wider">
              Friend Directory ({friendsList.length})
            </h3>

            <div className="flex flex-col gap-3">
              {friendsList.length === 0 ? (
                <div className="text-on-surface/40 text-xs font-medium italic py-6 text-center">
                  No linked friends yet. Add your friends above!
                </div>
              ) : (
                friendsList.map((friend) => (
                  <div
                    key={friend.username}
                    className="bg-background/50 border border-lavender rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-surface hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-black text-sm uppercase">
                        {friend.username[0]}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-on-surface">
                          {friend.username}
                        </h4>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-wider">
                          {(friend.points || 0).toLocaleString()} XP
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartCoop(friend.username)}
                      className="bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/30 text-tertiary font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
                    >
                      Invite to Co-Op
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Friends Leaderboard Preview */}
        <div className="lg:col-span-1 bg-surface/80 backdrop-blur-xl border border-lavender rounded-[32px] p-6 kawaii-shadow flex flex-col gap-4">
          <h3 className="font-extrabold text-base text-on-surface uppercase tracking-wider">
            Friends Leaderboard
          </h3>

          <div className="flex flex-col gap-3">
            {leaderboard.length === 0 ? (
              <div className="text-on-surface/40 text-xs font-medium italic py-8 text-center">
                Awaiting friends sync...
              </div>
            ) : (
              leaderboard.map((user, idx) => (
                <div
                  key={user.username}
                  className="bg-background/50 border border-lavender rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700' : 'bg-primary'}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-extrabold text-xs text-on-surface">
                      {user.username}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-secondary">
                    {user.points} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default FriendsPage;
