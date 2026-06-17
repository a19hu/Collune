import { useAuth } from "@/src/contexts/AuthContext";
import React from "react";

const LogoutPart: React.FC = ({currentUser}: { currentUser: any }) => {
    const { logout } = useAuth();


    return (
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <button 
          // onClick={handleOpenSchoolProfilePage}
           className="w-full flex items-center gap-2 text-left p-1 rounded-lg hover:bg-white/5 cursor-pointer">
            {/* <img referrerPolicy="no-referrer" src={adminProfile.avatar} alt="Avatar" className="w-7 h-7 rounded-full border border-white/10" /> */}
            <div className="overflow-hidden">
              <div className="text-[10px] font-bold truncate">{currentUser.name.split(' (')[0].toUpperCase()}</div>
              <div className="text-[8px] text-slate-500 font-mono truncate">{currentUser.role} Agent • {currentUser.id}</div>
            </div>
          </button>
          <button 
            id="logout"
            onClick={logout}
            className="w-full py-1.5 bg-red-950/20 hover:bg-red-900/30 border border-red-500/10 text-red-400 rounded-lg text-[9px] font-bold font-mono tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
    );
}

export default LogoutPart;