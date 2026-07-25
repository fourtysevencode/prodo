import React, { useState, useEffect } from "react";
import {
  apiAddFriend,
  apiGetFriendsList,
  apiGetFriendsLeaderboard,
  apiCreateCoopSession,
  apiJoinCoopSession,
  apiEndCoopSession,
  apiGetActiveCoopRooms,
} from "../../api/prodoApi";
import type { LeaderboardEntry } from "../../api/prodoApi";
import { useFocus } from "../../context/FocusContext";

/**
 * WhimsicalFriendsPage - Social study hubs and friend lobbies for beta.prodo.live.
 * Features soft rounded cards, active Co-Op multiplier chips, and instant room joining.
 */
const WhimsicalFriendsPage: React.FC = () => {
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
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            COMMUNITY STUDY HUBS
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Friends & Social Rooms
          </h1>
        </div>

        {/* Co-Op Status & Controls Chip */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xs">
            <span className={`w-3 h-3 rounded-full ${isCoopActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
            <span className="text-xs font-extrabold text-slate-700 uppercase">
              CO-OP BOOST: {isCoopActive ? "5.0X ACTIVE" : "STANDBY"}
            </span>
          </div>

          <button
            onClick={handleJoinCoop}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full border border-slate-200 transition-all"
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
              className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full shadow-xs transition-all"
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
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                Add Friend by Username
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Your Username: <strong className="text-[#0047AB]">{username || "Operator"}</strong>
              </p>
            </div>
            
            <form onSubmit={handleAddFriend} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter friend username..."
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-5 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0047AB]"
              />
              <button
                type="submit"
                className="bg-[#0047AB] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-md transition-all active:scale-95"
              >
                Send Request
              </button>
            </form>

            {msg && <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">{msg}</div>}
            {err && <div className="text-xs font-bold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">{err}</div>}
          </div>

          {/* Active Co-Op Rooms Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
                Discoverable Study Rooms ({activeRooms.length})
              </h3>
              <button
                onClick={handleCreateGeneralCoop}
                className="bg-blue-50 text-[#0047AB] hover:bg-blue-100 border border-blue-200 font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
              >
                + Create Room
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {activeRooms.length === 0 ? (
                <div className="text-slate-400 text-xs font-medium italic py-6 text-center">
                  No active friend rooms detected right now. Create one above!
                </div>
              ) : (
                activeRooms.map((room) => (
                  <div
                    key={room.session_id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Host: {room.host_username}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-400">
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
                      className="bg-[#0047AB] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full shadow-xs transition-all"
                    >
                      Join Room
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Friends List Directory */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
              Friend Directory ({friendsList.length})
            </h3>

            <div className="flex flex-col gap-3">
              {friendsList.length === 0 ? (
                <div className="text-slate-400 text-xs font-medium italic py-6 text-center">
                  No linked friends yet. Add your friends above!
                </div>
              ) : (
                friendsList.map((friend) => (
                  <div
                    key={friend.username}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-sm uppercase">
                        {friend.username[0]}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {friend.username}
                        </h4>
                        <p className="text-xs font-semibold text-amber-600">
                          {friend.points.toLocaleString()} XP
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartCoop(friend.username)}
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-full transition-colors"
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
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">
            Friends Leaderboard
          </h3>

          <div className="flex flex-col gap-3">
            {leaderboard.length === 0 ? (
              <div className="text-slate-400 text-xs font-medium italic py-8 text-center">
                Awaiting friends sync...
              </div>
            ) : (
              leaderboard.map((user, idx) => (
                <div
                  key={user.username}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#0047AB] text-white font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-extrabold text-xs text-slate-800">
                      {user.username}
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-600">
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

export default WhimsicalFriendsPage;
