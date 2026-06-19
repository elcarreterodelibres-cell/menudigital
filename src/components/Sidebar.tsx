import React from 'react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
}

export default function Sidebar({ currentTab, setCurrentTab, pendingCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: '📊', group: 'Gestión' },
    { id: 'menu', label: 'Menú Digital', icon: '🍔', group: 'Gestión' },
    { id: 'products-admin', label: 'Gestionar Menú', icon: '📝', group: 'Gestión' },
    { id: 'orders', label: 'Pedidos WhatsApp', icon: '🧾', group: 'Gestión', badge: pendingCount },
    { id: 'inventory', label: 'Inventario Insumos', icon: '📦', group: 'Gestión' },
    { id: 'settings', label: 'Configuración QR', icon: '⚙️', group: 'Administración' },
    { id: 'architecture', label: 'Esquema & Backend', icon: '🗄️', group: 'Administración' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none">
      <div className="p-6 space-y-8 flex-1">
        <div className="space-y-6">
          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Gestión Comercial</p>
          <nav className="space-y-1">
            {menuItems
              .filter((item) => item.group === 'Gestión')
              .map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        <div className="space-y-6">
          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Especificación Técnica</p>
          <nav className="space-y-1">
            {menuItems
              .filter((item) => item.group === 'Administración')
              .map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950/40">
        <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">Base de Datos</span>
          </div>
          <p className="text-sm font-bold text-white select-all">Firebase Cloud</p>
          <p className="text-[10px] font-mono text-green-400 truncate mt-0.5">firestore-burguercontrol-live</p>
        </div>
      </div>
    </aside>
  );
}
