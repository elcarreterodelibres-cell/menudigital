import React from 'react';
import { Sun, Moon, Bell, BellOff } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  adminTheme: 'light' | 'dark';
  toggleAdminTheme: () => void;
  notificationPermission?: string;
  requestNotificationPermission?: () => Promise<string>;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  pendingCount,
  adminTheme,
  toggleAdminTheme,
  notificationPermission = 'default',
  requestNotificationPermission,
}: SidebarProps) {
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
        <div className="flex items-center justify-between mb-4 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">Tema del Panel</span>
          <button
            onClick={toggleAdminTheme}
            className="flex items-center bg-slate-950 border border-slate-850 rounded-full p-1 select-none relative w-16 h-7.5 cursor-pointer transition-all hover:border-slate-700/80 active:scale-95"
            title="Alternar entre modo claro y oscuro"
            id="admin-theme-switch-btn"
          >
            {/* Sliding background indicator */}
            <div 
              className={`absolute top-0.5 bottom-0.5 rounded-full bg-red-650 transition-all duration-300 w-6.5 ${
                adminTheme === 'light' ? 'left-0.5' : 'left-[34px]'
              }`} 
            />
            
            {/* Dynamic visual representations */}
            <div className="flex items-center justify-between w-full px-1.5 z-10 pointer-events-none">
              <Sun className={`w-3.5 h-3.5 transition-colors duration-350 ${adminTheme === 'light' ? 'text-white' : 'text-slate-650'}`} />
              <Moon className={`w-3.5 h-3.5 transition-colors duration-350 ${adminTheme === 'dark' ? 'text-white' : 'text-slate-650'}`} />
            </div>
          </button>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">Base de Datos</span>
          </div>
          <p className="text-sm font-bold text-white select-all">Firebase Cloud</p>
          <p className="text-[10px] font-mono text-green-400 truncate mt-0.5">firestore-burguercontrol-live</p>
        </div>

        {/* Browser Native Notification Banner Area */}
        <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700/50 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                notificationPermission === 'granted' ? 'bg-green-500' : 'bg-slate-500'
              }`} />
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Alertas PC</span>
            </div>
            {notificationPermission === 'granted' ? (
              <Bell className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>

          {notificationPermission === 'granted' ? (
            <div className="space-y-0.5">
              <p className="text-[10px] text-white font-extrabold flex items-center gap-1">
                🔔 Activas en Tiempo Real
              </p>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                Recibirás una notificación nativa de tu sistema operativo con el sonido habitual cada vez que un cliente emita un nuevo pedido.
              </p>
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="space-y-1">
              <p className="text-[10px] text-red-400 font-extrabold">
                ❌ Permiso Bloqueado
              </p>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                El navegador bloqueó las notificaciones. Cambiá la configuración en el ícono de candado al lado de la URL para volver a activar las alertas de comanda.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[9px] text-slate-400 leading-relaxed">
                Habilitá notificaciones push nativas en tu escritorio/celular para saber al instante si llega un pedido fresco.
              </p>
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="w-full py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-[9px] tracking-wide rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-950/25"
              >
                <Bell className="w-3 h-3 text-white" />
                CONFIGURAR ALERTAS
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
