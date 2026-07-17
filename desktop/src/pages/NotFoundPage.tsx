import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-on-surface flex items-center justify-center font-log-body p-6 select-none">
      <div className="w-full max-w-md border-2 border-crimson flex flex-col bg-surface-container-lowest threat-pulse">
        
        {/* Terminal Header */}
        <div className="border-b border-crimson bg-[#1C0000] px-4 py-2 flex justify-between items-center text-xs font-technical-prefix text-crimson">
          <span>SYS_ERR: FATAL_ROUTING_EXCEPTION</span>
          <span>CODE_404</span>
        </div>

        {/* Error Body */}
        <div className="p-8 flex flex-col gap-6 text-center">
          <div className="text-crimson font-value-xl text-[64px] leading-none drop-shadow-[0_0_8px_rgba(220,20,60,0.6)]">
            ! 404
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-primary uppercase">TARGET ROUTE NOT FOUND</h3>
            <p className="text-xs text-outline-variant leading-relaxed">
              The requested address space does not link to any active operational node inside Prodo HUD.
            </p>
          </div>

          <Link
            to="/focus"
            className="w-full h-10 bg-crimson text-white hover:bg-red-500 font-technical-prefix font-bold uppercase transition-all flex items-center justify-center gap-2 btn-tactical cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_return</span>
            Return to Core Node
          </Link>
        </div>

        {/* Terminal Footer */}
        <div className="border-t border-surface-variant p-4 bg-[#0E0E0E] text-center font-technical-prefix text-[8px] text-outline-variant">
          SYS_LOG: REDIRECTING TERMINAL FEED TO PRIMARY HUD ADDR.
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;
