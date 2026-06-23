import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import MenuPanel from './components/MenuPanel';
import InventoryPanel from './components/InventoryPanel';
import ArchitecturePanel from './components/ArchitecturePanel';
import SettingsPanel from './components/SettingsPanel';
import CustomerMenu from './components/CustomerMenu';
import ProductsAdminPanel from './components/ProductsAdminPanel';

import { Product, Ingredient, Order } from './types';
import { db } from './lib/db';
import { Smartphone, LayoutDashboard, QrCode, Lock, ShieldCheck, RotateCcw, Printer } from 'lucide-react';
import { generateOrderTicketPDF, generateConsolidatedTicketsPDF } from './utils/pdfGenerator';

export default function App() {
  const [viewMode, setViewMode] = useState<'client' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || params.get('view') === 'admin') {
        return 'admin';
      }
    }
    return 'client';
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Theme state for administration (light/dark mode toggle)
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('admin_theme') as 'light' | 'dark') || 'light';
  });

  const toggleAdminTheme = () => {
    setAdminTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('admin_theme', next);
      return next;
    });
  };
  
  // States of isolation simulation (like Vercel hosting)
  const [vercelSimulation, setVercelSimulation] = useState<'full' | 'split'>('full'); // 'full' is the real production separation without layout switcher bar
  const [hasScannedQr, setHasScannedQr] = useState<boolean>(false);
  const [selectedSimulatedMesa, setSelectedSimulatedMesa] = useState<number>(4);

  // Realtime state simulation backed by simulated Firestore
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => db.getIngredients());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [config, setConfig] = useState(() => db.getBusinessConfig());

  // Printing states for Comanda ticketing system
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [selectedOrderIdToPrint, setSelectedOrderIdToPrint] = useState<string>('');

  // Native Browser Web Notifications state & actions
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          try {
            new Notification('🔔 ¡Notificaciones Activadas!', {
              body: 'Recibirás avisos en tiempo real sobre nuevos pedidos de los clientes.',
              tag: 'burguercontrol-test',
            });
          } catch (e) {
            console.warn('Error displaying native permission notification:', e);
          }
        }
        return permission;
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
    return 'default';
  };

  const triggerNewOrderNotification = (order: Order) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const tableInfo = order.orderType === 'local' ? '🍽️ Consumo en Mesa' : order.orderType === 'delivery' ? '🛵 Envío a Domicilio' : '🛍️ Retiro en Local';
      const itemsCount = order.items.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
      const totalAmount = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(order.totalPrice);
      
      try {
        new Notification('📝 Nuevo Pedido Recibido', {
          body: `${tableInfo}\n${itemsCount} productos • Total: ${totalAmount}\nCliente: ${order.customerName}`,
          tag: order.id,
          requireInteraction: true
        });
      } catch (e) {
        console.warn('Error playing/displaying order notification:', e);
      }
    }
  };

  // Password / PIN protection for administration
  const [adminPIN, setAdminPIN] = useState<string>('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false); // Start locked so clients scan-and-play cannot enter admin!
  const [pinError, setPinError] = useState<boolean>(false);

  // Keypad actions for admin lock screen
  const handlePinKeyPress = (char: string) => {
    setPinError(false);
    if (adminPIN.length < 4) {
      const nextPin = adminPIN + char;
      setAdminPIN(nextPin);
      
      // Auto unlock when 4 digits are typed
      if (nextPin.length === 4) {
        const correctPin = config.adminPin || '1234';
        if (nextPin === correctPin) {
          setIsAdminUnlocked(true);
          setAdminPIN('');
        } else {
          setTimeout(() => {
            setPinError(true);
            setAdminPIN('');
          }, 200);
        }
      }
    }
  };

  const handlePinDelete = () => {
    setAdminPIN((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinClear = () => {
    setAdminPIN('');
    setPinError(false);
  };

  // Sync helpers
  const handleSetOrders = (updater: Order[] | ((prev: Order[]) => Order[])) => {
    setOrders((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      
      // Automatic ingredient subtraction for new orders
      const prevIds = new Set(prev.map((o) => o.id));
      const addedOrders = next.filter((o) => !prevIds.has(o.id));
      
      if (addedOrders.length > 0) {
        // Trigger browser native notification alert
        addedOrders.forEach((order) => {
          triggerNewOrderNotification(order);
        });

        setIngredients((currentIngs) => {
          let updatedIngs = [...currentIngs];
          let updated = false;

          addedOrders.forEach((newOrder) => {
            newOrder.items.forEach((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (product && product.ingredientsRequired && product.ingredientsRequired.length > 0) {
                product.ingredientsRequired.forEach((req) => {
                  const qtyToSubtract = req.quantity * item.quantity;
                  updatedIngs = updatedIngs.map((ing) => {
                    if (ing.id === req.ingredientId) {
                      updated = true;
                      return {
                        ...ing,
                        currentStock: Math.max(0, Number((ing.currentStock - qtyToSubtract).toFixed(2))),
                      };
                    }
                    return ing;
                  });
                });
              }
            });
          });

          if (updated) {
            db.saveIngredients(updatedIngs);
          }
          return updatedIngs;
        });
      }

      db.saveOrders(next);
      return next;
    });
  };

  const handleSetIngredients = (updater: Ingredient[] | ((prev: Ingredient[]) => Ingredient[])) => {
    setIngredients((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      db.saveIngredients(next);
      return next;
    });
  };

  const handleSetProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      db.saveProducts(next);
      return next;
    });
  };

  const handleSetConfig = (updater: any) => {
    setConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      db.saveBusinessConfig(next);
      return next;
    });
  };

  // Live total pending orders
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'cooking').length;

  const handleOrderSubmittedByClient = (newOrder: Order) => {
    // Add client order directly into Firestore simulator
    handleSetOrders((prev) => [newOrder, ...prev]);
    // Switch view back to admin so user immediately sees the order arrived in real time!
    setVercelSimulation('split');
    setViewMode('admin');
    setCurrentTab('dashboard');
    alert('🎉 ¡Comanda enviada!\nIngresó a la cocina del administrador en tiempo real mediante Sincronización Firebase Live.');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden antialiased">
      
      {/* Top Controller Switch Mode Nav Header: Only shown in "split" workspace simulator mode */}
      {vercelSimulation === 'split' && (
        <div className="h-14 bg-slate-950 text-white flex items-center justify-between px-6 shrink-0 z-40 shadow-md border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wide text-red-500 uppercase">Simulador Entorno Vercel</span>
            <span className="px-1.5 py-0.5 bg-slate-850 rounded font-mono text-[8px] text-slate-400">Modo Desarrollo</span>
          </div>

          {/* View Mode Switcher buttons */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 max-w-sm/2">
            <button
              onClick={() => setViewMode('client')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'client'
                  ? 'bg-red-650 bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> 📱 Menú Cliente (QR)
            </button>
            <button
              onClick={() => {
                setViewMode('admin');
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-red-650 bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> 📊 Sección Administrador
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVercelSimulation('full');
                setViewMode('client');
                alert('✨ Modo Producción Aislado Activado. Estás visualizando el catálogo exacto que se abre al cliente cuando escanea un QR real. No hay barras administrativas de acceso, ni enlaces de backoffice.');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-wider text-[10px]"
            >
              🚀 Simular Cliente Real
            </button>
          </div>
        </div>
      )}

      {viewMode === 'client' ? (
        /* ======================== CLIENT VIEW MOUNT ======================== */
        vercelSimulation === 'split' ? (
          /* Split developer view (within phone container mockup) */
          <div className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden flex flex-col h-[750px] border-4 border-slate-950 animate-fade-in">
              {/* Real Smartphone Status bar simulation */}
              <div className="px-5 py-2.5 bg-red-650 bg-red-600 flex justify-between items-center text-white/50 text-[10px] select-none border-b border-white/5">
                <span>📶 4G En Vercel</span>
                <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} p.m.</span>
                <span>🔋 100%</span>
              </div>
              
              {/* Live QR Scan Source Banner info */}
              <div className="bg-amber-50 text-amber-900 px-4 py-2 text-[10px] font-bold flex justify-between items-center border-b border-amber-100 shrink-0">
                <span className="flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  Mesa simulada: Mesa 4
                </span>
                <button
                  onClick={() => {
                    setVercelSimulation('full');
                    alert('✨ Menú cargado en Responsiva de pantalla completa. Así se visualiza en los navegadores de celulares reales.');
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all"
                >
                  PANTALLA COMPLETA ↗️
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50">
                <CustomerMenu
                  products={products}
                  onOrderSubmitted={handleOrderSubmittedByClient}
                  whatsappPhone={config.whatsappPhone}
                  businessName={config.businessName}
                  onGoToAdmin={() => setViewMode('admin')}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 100% DECOUPLED CLIENT VIEW - NO ADMIN OVERLAYS, BARS OR SWITCHERS */
          <div className="flex-1 overflow-auto bg-[#0a0a0c] flex justify-center animate-fade-in">
            <div className="w-full max-w-7xl bg-[#121212] min-h-screen shadow-2xl flex flex-col relative">
              <CustomerMenu
                products={products}
                onOrderSubmitted={handleOrderSubmittedByClient}
                whatsappPhone={config.whatsappPhone}
                businessName={config.businessName}
                onGoToAdmin={() => setViewMode('admin')}
              />
            </div>
          </div>
        )
      ) : !isAdminUnlocked ? (
        /* ======================== SECURE LOCK SCREEN VIEW ======================== */
        <div className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center relative text-white">
            
            {/* Lock indicator */}
            <div className="w-16 h-16 bg-red-950/60 border border-red-900/30 text-red-500 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-sm font-extrabold text-slate-100 text-center uppercase tracking-wide">
              Acceso Restringido - {config.businessName}
            </h2>
            <p className="text-[11px] text-slate-400 text-center mt-1 pb-4 leading-relaxed border-b border-slate-850 w-full font-medium">
              Por favor ingresá tu pin personal de de 4 dígitos para ver pedidos en cocina, stock, costos y reportes financieros.
            </p>

            {/* Simulated dot indicator */}
            <div className="flex gap-4.5 my-6.5 justify-center">
              {[0, 1, 2, 3].map((idx) => {
                const filled = adminPIN.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all duration-150 ${
                      pinError
                        ? 'bg-red-500 animate-bounce'
                        : filled
                        ? 'bg-red-600 scale-110 shadow-[0_0_8px_rgba(239,68,68,0.55)]'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-[11px] text-red-500 font-bold mb-4">
                ❌ PIN Incorrecto. Reintentá.
              </p>
            )}

            {/* Custom Interactive Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px] mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinKeyPress(digit)}
                  className="w-14 h-14 rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-slate-100 text-base font-extrabold transition-all duration-100 active:scale-95 flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handlePinClear}
                className="w-14 h-14 rounded-full text-slate-500 hover:text-slate-350 text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer select-none"
              >
                Limpiar
              </button>
              <button
                onClick={() => handlePinKeyPress('0')}
                className="w-14 h-14 rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-slate-100 text-base font-extrabold transition-all duration-100 active:scale-95 flex items-center justify-center cursor-pointer select-none"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                className="w-14 h-14 rounded-full text-slate-500 hover:text-slate-350 text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer select-none"
              >
                Borrar
              </button>
            </div>

            {/* Factories override display helper */}
            <div className="bg-slate-900 p-2 text-center w-full mb-4 rounded-xl border border-slate-850">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">🔑 PIN DE TESTEO DE FÁBRICA</span>
              <span className="text-xs font-mono font-bold text-red-500 mt-0.5 block">{config.adminPin || '1234'}</span>
              <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">Podés modificarlo en la solapa "Configuración QR" si iniciás sesión.</span>
            </div>

            {/* Back button to customers layout */}
            <button
              onClick={() => setViewMode('client')}
              className="py-1.5 px-4 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-[10px] font-bold tracking-wide flex items-center gap-1 cursor-pointer transition-colors border border-slate-800"
            >
              <RotateCcw className="w-3 h-3" /> Volver al Menú de Clientes
            </button>
          </div>
        </div>
      ) : (
        /* ======================== ADMIN VIEW MOUNT ======================== */
        <div className={`flex-1 flex flex-col overflow-hidden ${adminTheme === 'dark' ? 'dark' : ''}`}>
          {/* Main admin navigation headers */}
          <nav className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 shadow-sm z-30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-sm hover:rotate-6 transition-transform">
                {config.businessName ? config.businessName.charAt(0).toUpperCase() : 'B'}
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100 flex items-center gap-1.5 select-none transition-colors">
                {config.businessName}
                <span className="bg-red-650 bg-red-600 text-white text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded-sm uppercase">
                  ADMIN
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Canal de Pedidos Recibidos
                </span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-900/35 transition-colors">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Sincronizado Firebase Live • {orders.length} totales
                </span>
              </div>

              {/* Print Ticket/Comanda Master Trigger */}
              <button
                onClick={() => {
                  setShowPrintModal(true);
                  if (orders.length > 0) {
                    setSelectedOrderIdToPrint(orders[orders.length - 1].id);
                  }
                }}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 dark:text-slate-350 dark:text-slate-300 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                title="Imprimir comanda térmica o consolidada"
                id="btn-print-comanda"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Comanda
              </button>

              {/* Instant Security Lock button */}
              <button
                onClick={() => {
                  setIsAdminUnlocked(false);
                  setViewMode('client');
                  alert('🔒 Sección de administración bloqueada con éxito.');
                }}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 dark:text-slate-300 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                title="Cerrar panel de administración y bloquear acceso"
                id="btn-lock-admin"
              >
                <Lock className="w-3.5 h-3.5" /> Bloquear
              </button>

              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-250 dark:border-slate-800 flex items-center justify-center font-bold text-sm text-slate-600 bg-slate-250 dark:bg-slate-900">
                👨‍🍳
              </div>
            </div>
          </nav>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Left Component */}
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              pendingCount={pendingOrdersCount}
              adminTheme={adminTheme}
              toggleAdminTheme={toggleAdminTheme}
              notificationPermission={notificationPermission}
              requestNotificationPermission={requestNotificationPermission}
            />

            {/* Selected Workspace Panel Display */}
            <main className="flex-1 p-8 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {currentTab === 'dashboard' && (
                    <AdminPanel
                      orders={orders}
                      products={products}
                      setOrders={handleSetOrders}
                      openNewOrderFunc={() => setCurrentTab('menu')}
                    />
                  )}

                  {currentTab === 'orders' && (
                    <AdminPanel
                      orders={orders}
                      products={products}
                      setOrders={handleSetOrders}
                      openNewOrderFunc={() => setCurrentTab('menu')}
                      onlyHistory={true}
                    />
                  )}

                  {currentTab === 'menu' && (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                      <div className="p-3 bg-red-50 text-red-900 text-xs font-bold rounded-lg border border-red-150 flex justify-between items-center">
                        <span>💡 Se simula la carga rápida de pedidos desde caja de administración.</span>
                        <button
                          onClick={() => setViewMode('client')}
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wide px-3 py-1.5 rounded transition-all cursor-pointer"
                        >
                          Probar Menú QR del Cliente 📱
                        </button>
                      </div>
                      <MenuPanel
                        products={products}
                        setOrders={handleSetOrders}
                        onOrderSuccess={() => setCurrentTab('dashboard')}
                      />
                    </div>
                  )}

                  {currentTab === 'products-admin' && (
                    <ProductsAdminPanel
                      products={products}
                      setProducts={handleSetProducts}
                      ingredients={ingredients}
                    />
                  )}

                  {currentTab === 'inventory' && (
                    <InventoryPanel
                      ingredients={ingredients}
                      setIngredients={handleSetIngredients}
                    />
                  )}

                  {currentTab === 'settings' && (
                    <SettingsPanel
                      config={config}
                      setConfig={handleSetConfig}
                    />
                  )}

                  {currentTab === 'architecture' && <ArchitecturePanel />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}
      {/* Modal De Impresión y Generación de Comandas en PDF */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/45 text-rose-650 dark:text-rose-450 rounded-lg">
                  <Printer className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base font-sans">
                    Impresión de Comandas
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans uppercase tracking-wider font-extrabold">
                    {config.businessName} • Cocina
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-sm font-sans text-slate-705 dark:text-slate-300">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Podés descargar los tickets formateados a un ancho de **rollo de 80mm** (apropiado para ticketeadoras térmicas de cocina) u hojas consolidadas **A4** para el despacho.
              </p>

              {/* Quick Options */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase tracking-wider font-black text-slate-400 mb-1">
                  Opciones rápidas de impresión
                </h4>

                {/* Option 1: Print Latest Order */}
                {orders.length > 0 ? (
                  <button
                    onClick={() => {
                      const latest = orders[orders.length - 1];
                      generateOrderTicketPDF(latest, {
                        businessName: config.businessName || 'El Carretero',
                        whatsappPhone: config.whatsappPhone || '',
                      });
                    }}
                    className="w-full text-left p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 rounded-xl transition duration-150 cursor-pointer group flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-xs">
                        ⚡ Imprimir Último Pedido Recibido
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        #{orders[orders.length - 1].id.slice(0, 8).toUpperCase()} • {orders[orders.length - 1].customerName}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded transition duration-150 group-hover:scale-105">
                      Ticket 80mm
                    </span>
                  </button>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 text-center text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                    No hay ningún pedido registrado para imprimir.
                  </div>
                )}

                {/* Option 2: Active Orders report (Pending & Cooking) */}
                <button
                  onClick={() => {
                    const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'cooking');
                    if (activeOrders.length === 0) {
                      alert('No hay comandas activas ("Pendiente" o "En Cocina") en este momento.');
                      return;
                    }
                    generateConsolidatedTicketsPDF(activeOrders, 'PENDIENTES Y EN COCINA');
                  }}
                  className="w-full text-left p-4 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 rounded-xl transition duration-150 cursor-pointer group flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                      📁 Reporte Consolidado de Cocina (Hoja A4)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Agrupa todos los pedidos pendientes y en cocina en un reporte consolidado.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded transition duration-150 group-hover:scale-105">
                    Descargar A4 ({orders.filter((o) => o.status === 'pending' || o.status === 'cooking').length} u.)
                  </span>
                </button>
              </div>

              {/* Option 3: Individual select dropdown */}
              {orders.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 space-y-2">
                  <h4 className="text-[11px] uppercase tracking-wider font-black text-slate-400 mb-1">
                    Seleccionar un pedido específico
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={selectedOrderIdToPrint}
                      onChange={(e) => setSelectedOrderIdToPrint(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-rose-500 transition duration-150"
                    >
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {new Date(o.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {o.customerName} ({new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(o.totalPrice)}) [{o.status === 'pending' ? 'Pendiente' : o.status === 'cooking' ? 'Cocina' : o.status === 'delivered' ? 'Entregado' : 'Cancelado'}]
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        const targetOrder = orders.find((o) => o.id === selectedOrderIdToPrint);
                        if (targetOrder) {
                          generateOrderTicketPDF(targetOrder, {
                            businessName: config.businessName || 'El Carretero',
                            whatsappPhone: config.whatsappPhone || '',
                          });
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-200 text-xs font-bold rounded-xl transition duration-150 cursor-pointer flex items-center justify-center shadow-sm"
                    >
                      Descargar Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
