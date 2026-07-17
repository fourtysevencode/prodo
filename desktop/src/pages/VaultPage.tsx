import React from "react";
import { useFocus } from "../context/FocusContext";

const VaultPage: React.FC = () => {
  const { xp, vaultItems, purchaseApp } = useFocus();

  return (
    <div className="flex-grow flex flex-col p-6 h-full overflow-hidden select-none">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <div className="font-technical-prefix text-technical-prefix text-outline-variant">PRODO_SECURE_BYPASS</div>
          <h1 className="font-value-lg text-[32px] text-primary">DISTRACTION VAULT</h1>
        </div>

        {/* XP counter */}
        <div className="border border-outline-variant bg-surface-container-lowest px-4 py-2 flex flex-col justify-center text-right">
          <span className="font-technical-prefix text-[8px] text-outline-variant">AVAILABLE_XP</span>
          <span className="font-value-lg text-lg text-amber">{xp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Grid of Vault Items */}
      <div className="flex-grow bg-surface-container-lowest border border-outline-variant p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaultItems.map((item) => {
            const min = item.timerRemaining ? Math.floor(item.timerRemaining / 60) : 0;
            const sec = item.timerRemaining ? item.timerRemaining % 60 : 0;
            
            return (
              <div 
                key={item.id} 
                className={`border p-5 flex flex-col justify-between transition-all duration-300 min-h-[160px] ${
                  item.unlocked 
                    ? "border-emerald bg-[#0A0A0A] unlocked-pulse" 
                    : "border-surface-variant bg-surface-container-high hover:border-outline"
                }`}
              >
                {/* Header info */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[28px] ${
                      item.unlocked ? "text-emerald" : "text-outline-variant"
                    }`}>
                      {item.icon}
                    </span>
                    <div>
                      <span className="font-technical-prefix text-[8px] text-outline-variant">PROCESS_NODE</span>
                      <h3 className="font-log-body font-bold text-sm text-primary uppercase">{item.name}</h3>
                    </div>
                  </div>

                  {item.unlocked ? (
                    <span className="px-2 py-0.5 border border-emerald font-technical-prefix text-[8px] text-emerald bg-emerald/10 font-bold uppercase">
                      BYPASS_GRANTED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 border border-outline-variant font-technical-prefix text-[8px] text-outline-variant uppercase">
                      RESTRICTED
                    </span>
                  )}
                </div>

                {/* Footer details & Action */}
                <div className="flex justify-between items-end mt-auto">
                  <div>
                    {item.unlocked ? (
                      <div className="flex flex-col">
                        <span className="font-technical-prefix text-[8px] text-emerald uppercase">AUTH_EXPIRY</span>
                        <span className="font-log-body text-emerald font-bold text-sm">
                          {min.toString().padStart(2, '0')}:{sec.toString().padStart(2, '0')} min
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-technical-prefix text-[8px] text-outline-variant uppercase">BYPASS_COST</span>
                        <span className="font-log-body text-amber font-bold text-sm">
                          {item.cost} XP
                        </span>
                      </div>
                    )}
                  </div>

                  {item.unlocked ? (
                    <button 
                      disabled 
                      className="px-4 py-2 border border-emerald/50 text-emerald/50 font-technical-prefix text-[10px] font-bold uppercase cursor-not-allowed"
                    >
                      AUTHORIZED
                    </button>
                  ) : (
                    <button
                      onClick={() => purchaseApp(item.id)}
                      disabled={xp < item.cost}
                      className={`px-4 py-2 font-technical-prefix text-[10px] font-bold uppercase transition-all btn-tactical ${
                        xp >= item.cost 
                          ? "bg-primary text-background hover:bg-white" 
                          : "border border-outline-variant/30 text-outline-variant/30 cursor-not-allowed"
                      }`}
                    >
                      Bypass Limit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
