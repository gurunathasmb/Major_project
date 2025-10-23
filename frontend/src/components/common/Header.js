// filepath: C:\Users\mohit\Desktop\Major project\src\components\common\Header.js
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header(){
  const { currentUser, logout } = useContext(AuthContext);
  const nav = useNavigate();
  const handleLogout = ()=>{
    logout();
    nav("/");
  };
  return (
    <header className="bg-white/60 backdrop-blur sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold text-indigo-600">CephaloAI</div>
          <div className="text-sm text-gray-600">Orthodontic Cephalogram Platform</div>
        </div>
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={16}/> <span>{currentUser.name}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-600">
                <LogOut size={16}/> Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}