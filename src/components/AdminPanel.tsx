import React, { useState, useEffect } from 'react';
import { Order, Product } from '../types';
import { Check, Clock, Plus, Trash2, TrendingUp, DollarSign, PieChart as PieIcon, ShoppingBag, Send, Award, Flame, Percent, Sparkles, BarChart3, Download, User, MapPin, CreditCard, FileText, X, Copy, ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  openNewOrderFunc: () => void;
  onlyHistory?: boolean;
}

interface OrderTimerProps {
  order: Order;
}

export function OrderTimer({ order }: OrderTimerProps) {
  const [elapsed, setElapsed] = useState<number>(0);
  const [cookingElapsed, setCookingElapsed] = useState<number | null>(null);

  useEffect(() => {
    // If completed or cancelled, we don't need ticking interval
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return;
    }

    const tick = () => {
      const now = Date.now();
      const createdTime = new Date(order.createdAt).getTime();
      setElapsed(Math.max(0, now - createdTime));

      if (order.cookingStartedAt && order.status === 'cooking') {
        const cookTime = new Date(order.cookingStartedAt).getTime();
        setCookingElapsed(Math.max(0, now - cookTime));
      } else {
        setCookingElapsed(null);
      }
    };

    tick(); // Initial pull
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.status, order.cookingStartedAt]);

  // Format milliseconds to mm:ss or hh:mm:ss
  const formatMs = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Status is delivered or cancelled (static retrospective)
  if (order.status === 'delivered' || order.status === 'cancelled') {
    let durationStr = '';
    if (order.completedAt) {
      const diff = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
      durationStr = formatMs(Math.max(0, diff));
    } else {
      // Deterministic mock duration based on order.id
      const charCodeSum = order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mockMinutes = 10 + (charCodeSum % 15); // 10 to 24 mins
      const mockSeconds = charCodeSum % 60;
      durationStr = `${mockMinutes.toString().padStart(2, '0')}:${mockSeconds.toString().padStart(2, '0')}`;
    }

    return (
      <div className="flex flex-col gap-0.5 font-mono text-center">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
          ✓ Total: {durationStr}
        </span>
        {order.status === 'delivered' && (
          <span className="text-[9px] text-slate-400/80 dark:text-slate-500/80 font-sans">
            Despachado
          </span>
        )}
      </div>
    );
  }

  // Active states (pending or cooking)
  const totalMins = elapsed / 60000;
  let severityClass = '';

  if (totalMins < 10) {
    severityClass = 'bg-green-500/10 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-800/30';
  } else if (totalMins < 20) {
    severityClass = 'bg-amber-500/10 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-800/30';
  } else {
    severityClass = 'bg-red-500/15 dark:bg-red-950/30 text-red-655 dark:text-red-400 border-red-500/30 dark:border-red-800/40 animate-pulse font-bold';
  }

  return (
    <div className="flex flex-col gap-1 items-center justify-center font-mono select-none">
      <div className={`px-2 py-0.5 rounded-md border text-[11px] flex items-center gap-1 ${severityClass} tracking-wider font-semibold shadow-sm`}>
        <Clock className="w-3.5 h-3.5" />
        {formatMs(elapsed)}
      </div>

      {order.status === 'cooking' && cookingElapsed !== null && (
        <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium font-sans flex items-center gap-1 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
          <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></span>
          Cocción: {formatMs(cookingElapsed)}
        </span>
      )}
      {order.status === 'pending' && (
        <span className="text-[9px] text-yellow-600 dark:text-yellow-500/80 font-bold animate-pulse uppercase tracking-wider font-sans">
          En Espera...
        </span>
      )}
    </div>
  );
}

export default function AdminPanel({ orders, products, setOrders, openNewOrderFunc, onlyHistory = false }: AdminPanelProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrderIdForDetail, setSelectedOrderIdForDetail] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);

  // Math metrics
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  const totalCost = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, curr) => acc + curr.totalCost, 0);

  const netProfit = totalSales - totalCost;
  const marginPercentage = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0';

  // Real-time calculations from orders history
  // 1. Total Daily Sales (Ventas de Hoy check)
  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter((o) => {
    if (o.status === 'cancelled') return false;
    try {
      return new Date(o.createdAt).toDateString() === todayStr;
    } catch {
      return true; // Fallback
    }
  });

  const dailySales = todayOrders.reduce((acc, o) => acc + o.totalPrice, 0);

  // 2. Average Ticket Value (Ticket Promedio)
  const activeOrdersForAverage = todayOrders.length > 0 ? todayOrders : orders.filter(o => o.status !== 'cancelled');
  const salesForAverage = todayOrders.length > 0 ? dailySales : totalSales;
  const ticketPromedio = activeOrdersForAverage.length > 0 ? salesForAverage / activeOrdersForAverage.length : 0;

  // 3. Best-Selling Products Ranking (Productos más vendidos)
  const getTopSellingProducts = () => {
    const listMap: Record<string, { name: string; quantity: number; category: string }> = {};
    const validOrders = orders.filter(o => o.status !== 'cancelled');

    validOrders.forEach(o => {
      o.items.forEach(it => {
        if (!listMap[it.productId]) {
          const prod = products.find(p => p.id === it.productId);
          listMap[it.productId] = {
            name: it.productName,
            quantity: 0,
            category: prod?.category || 'Menú'
          };
        }
        listMap[it.productId].quantity += it.quantity;
      });
    });

    const list = Object.values(listMap);
    if (list.length === 0 && products.length > 0) {
      return [{
        name: products[0].name,
        quantity: 12,
        category: products[0].category
      }];
    }
    return list.sort((a, b) => b.quantity - a.quantity);
  };

  const topSellingList = getTopSellingProducts();
  const bestSellerProduct = topSellingList[0];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Change order status
  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const nowIso = new Date().toISOString();
          const updated: Order = { ...o, status: newStatus };
          if (newStatus === 'cooking') {
            updated.cookingStartedAt = nowIso;
          } else if (newStatus === 'delivered') {
            updated.completedAt = nowIso;
          }
          return updated;
        }
        return o;
      })
    );
  };

  // Delete/Cancel order
  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return { ...o, status: 'cancelled', completedAt: new Date().toISOString() };
        }
        return o;
      })
    );
  };

  // Filter orders (Only used in Historial view)
  const filteredOrders = orders.filter((o) => {
    const matchesType = filterType === 'all' || o.orderType === filterType;
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const activeCookingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'cooking');

  // Calculate Best Selling Products ("Productos Destacados / Lo Más Vendido")
  const getBestSellers = () => {
    const listMap: Record<string, { id: string; name: string; category: string; quantity: number; revenue: number; cost: number; imageUrl?: string }> = {};

    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(it => {
        if (!listMap[it.productId]) {
          const prod = products.find(p => p.id === it.productId);
          listMap[it.productId] = {
            id: it.productId,
            name: it.productName,
            category: prod?.category || 'Alimentos',
            quantity: 0,
            revenue: 0,
            cost: 0,
            imageUrl: prod?.imageUrl,
          };
        }
        listMap[it.productId].quantity += it.quantity;
        listMap[it.productId].revenue += it.price * it.quantity;
        listMap[it.productId].cost += (it.cost || 0) * it.quantity;
      });
    });

    const values = Object.values(listMap);
    if (values.length === 0) {
      return [];
    }

    return values.sort((a, b) => b.quantity - a.quantity).slice(0, 4);
  };

  // Calculate Hourly timeline data (Ventas vs Costos)
  const getHourlyData = () => {
    const hours = ['11:00', '12:00', '13:00', '14:00', '15:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    const dataMap = hours.reduce((acc, h) => {
      acc[h] = { hora: h, Ventas: 0, Costos: 0, Utilidad: 0 };
      return acc;
    }, {} as Record<string, { hora: string; Ventas: number; Costos: number; Utilidad: number }>);

    let hasActualData = false;
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      let hourStr = '20:00';
      try {
        if (o.createdAt) {
          const date = new Date(o.createdAt);
          const h = date.getHours();
          hourStr = `${h.toString().padStart(2, '0')}:00`;
        }
      } catch (e) {
        // fallback
      }
      if (!dataMap[hourStr]) {
        dataMap[hourStr] = { hora: hourStr, Ventas: 0, Costos: 0, Utilidad: 0 };
      }
      dataMap[hourStr].Ventas += o.totalPrice;
      dataMap[hourStr].Costos += o.totalCost;
      dataMap[hourStr].Utilidad += (o.totalPrice - o.totalCost);
      hasActualData = true;
    });

    if (!hasActualData) {
      return [];
    }
    return Object.values(dataMap);
  };

  // Calculate Product Category graph data
  const getCategoryData = () => {
    const categoriesMap: Record<string, { category: string; Ventas: number; Costos: number; Ganancia: number }> = {};
    let hasActualData = false;

    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(it => {
        const matchingProduct = products.find(p => p.id === it.productId);
        const cat = matchingProduct?.category || 'Otros';
        if (!categoriesMap[cat]) {
          categoriesMap[cat] = { category: cat, Ventas: 0, Costos: 0, Ganancia: 0 };
        }
        categoriesMap[cat].Ventas += it.price * it.quantity;
        categoriesMap[cat].Costos += (it.cost || 0) * it.quantity;
        categoriesMap[cat].Ganancia = categoriesMap[cat].Ventas - categoriesMap[cat].Costos;
        hasActualData = true;
      });
    });

    if (!hasActualData) {
      return [];
    }
    return Object.values(categoriesMap);
  };

  // Channels breakdown Data for Pie Chart
  const getChannelData = () => {
    const channelMap = {
      delivery: { name: 'Delivery 🛵', value: 0 },
      local: { name: 'Mesa Salón 🍽️', value: 0 },
      takeaway: { name: 'Para Llevar 🛍️', value: 0 },
    };

    let hasActualData = false;
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      if (channelMap[o.orderType]) {
        channelMap[o.orderType].value += o.totalPrice;
        hasActualData = true;
      }
    });

    if (!hasActualData) {
      return [];
    }
    return Object.values(channelMap).filter(v => v.value > 0);
  };

  const COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#10B981'];

  // Export orders to standard CSV/Excel format matching the financial database structures
  const exportOrdersToCSV = (ordersToExport: Order[], title = 'historial_pedidos') => {
    if (!ordersToExport || ordersToExport.length === 0) {
      alert('No hay pedidos en la lista para exportar.');
      return;
    }

    try {
      const headers = [
        'ID del Pedido',
        'Fecha y Hora',
        'Cliente',
        'Contacto/WhatsApp',
        'Canal de Origen',
        'Estado del Pedido',
        'Productos Detallados',
        'Monto Total Facturado ($)',
        'Costo de Produccion ($)',
        'Ganancia Neta ($)'
      ];

      const csvRows = [headers.join(';')];

      ordersToExport.forEach((order) => {
        // Create clean products layout e.g. "Hamburguesa Simple (x1), Papas Grandes (x2)"
        const itemsStr = order.items
          .map((it) => `${it.productName} (x${it.quantity})`)
          .join(', ');

        const row = [
          order.id || '-',
          order.createdAt ? new Date(order.createdAt).toLocaleString('es-AR') : '-',
          order.customerName || 'Cliente Anónimo',
          order.customerContact || '-',
          order.orderType === 'delivery' ? 'Delivery' : order.orderType === 'local' ? 'Mesa en Local' : 'Takeaway',
          order.status === 'pending' ? 'Pendiente' : order.status === 'cooking' ? 'En Cocina' : order.status === 'delivered' ? 'Entregado' : 'Cancelado',
          `"${itemsStr.replace(/"/g, '""')}"`, // safe quotes escape
          order.totalPrice || 0,
          order.totalCost || 0,
          order.netProfit || 0
        ];

        csvRows.push(row.join(';'));
      });

      // UTF-8 BOM indicator for direct click-and-open Microsoft Excel compatibility
      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      alert('Error de exportación: No se pudo generar el archivo de reporte.');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-auto">
      {onlyHistory ? (
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight font-sans">
              Historial de Pedidos <span className="text-slate-400 dark:text-slate-500 font-normal">/ WhatsApp</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Bitácora cronológica con todos los pedidos entrantes que fueron despachados a través del Menú QR a WhatsApp.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                exportOrdersToCSV(orders, 'historial_completo_pedidos');
              }}
              className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-sans flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" /> Exportar Historial
            </button>
          </div>
        </header>
      ) : (
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight font-sans">
              Resumen de Operación <span className="text-slate-400 dark:text-slate-500 font-normal">/ Hoy</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Supervisa ingresos, costos de materias primas y despachos automatizados por WhatsApp.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const activeOrders = todayOrders.length > 0 ? todayOrders : orders;
                const fileLabel = todayOrders.length > 0 ? 'reporte_ventas_hoy' : 'reporte_ventas_general';
                exportOrdersToCSV(activeOrders, fileLabel);
              }}
              className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-sans flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" /> Exportar Reporte {todayOrders.length > 0 ? 'Hoy' : 'Gral.'}
            </button>
            <button
              onClick={openNewOrderFunc}
              className="px-4 py-2 bg-red-650 text-white font-semibold rounded-md text-sm hover:bg-red-700 shadow-sm hover:shadow-red-200 transition-all flex items-center gap-2 cursor-pointer font-sans"
            >
              <Plus className="w-4 h-4" /> Nuevo Pedido
            </button>
          </div>
        </header>
      )}

      {/* Grid Indicators */}
      {!onlyHistory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {/* Tarjeta 1: Total de Ventas del Día */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md group">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wide uppercase font-sans">Ventas de Hoy</p>
              <span className="p-1 px-1.5 rounded-md bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-[10px] font-extrabold flex items-center gap-0.5 font-sans">
                <ShoppingBag className="w-3 h-3" /> {todayOrders.length} ped.
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
              {formatCurrency(dailySales || totalSales)}
            </h3>
            <div className="mt-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium font-sans">
              {dailySales > 0 ? 'Monto total facturado hoy.' : 'Monto total acumulado (Demostración).'}
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-24 h-24 text-slate-900 dark:text-white" />
            </div>
          </div>

          {/* Tarjeta 2: Ticket Promedio */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md group">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wide uppercase font-sans">Ticket Promedio</p>
              <span className="p-1 px-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold flex items-center gap-0.5 font-sans font-mono">
                ${Math.round(ticketPromedio).toLocaleString('es-AR')} avg
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
              {formatCurrency(ticketPromedio)}
            </h3>
            <div className="mt-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium font-sans">
              Valor promedio estimado por ticket de compra.
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-24 h-24 text-slate-900 dark:text-white" />
            </div>
          </div>

          {/* Tarjeta 3: Productos más Vendidos / Premio */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md group">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wide uppercase font-sans font-display">Producto Estrella</p>
              <span className="p-1 px-1.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[10px] font-extrabold flex items-center gap-0.5 font-sans">
                <Award className="w-3 h-3 animate-pulse" /> Top Ventas
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-sans truncate pr-4" title={bestSellerProduct?.name || 'Ninguno'}>
              {bestSellerProduct?.name || 'Ninguno'}
            </h3>
            <div className="mt-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium font-sans whitespace-nowrap overflow-hidden text-ellipsis">
              {bestSellerProduct?.quantity 
                ? `${bestSellerProduct.quantity} unidades vendidas (${bestSellerProduct.category})`
                : 'No hay ventas registradas todavía.'}
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <Flame className="w-24 h-24 text-red-650" />
            </div>
          </div>

          {/* Tarjeta 4: Ganancia Neta */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-red-100 dark:border-red-900/30 shadow-md bg-gradient-to-br from-white to-red-50/40 dark:from-slate-950 dark:to-red-950/10 relative overflow-hidden transition-all hover:shadow-lg group">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-red-655 dark:text-red-400 font-extrabold tracking-wide uppercase font-sans">Ganancia Neta</p>
              <span className="p-1 px-1.5 rounded-md bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[10px] font-black font-sans">
                Margen {marginPercentage}%
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
              {formatCurrency(netProfit)}
            </h3>
            <div className="mt-2 text-red-600 dark:text-red-400 text-[11px] font-semibold font-sans">
              Utilidad real restando costos de elaboración.
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <Percent className="w-24 h-24 text-red-655" />
            </div>
          </div>
        </div>
      )}

      {/* Conditional layout check */}
      {!onlyHistory ? (
        /* ======================== GRAPHICAL FINANCE DASHBOARD & FEATURED PRODUCTS ======================== */
        <div className="space-y-6">
          {/* Row 1: Finance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Left: Cash Flow by Hour (Ventas vs Costos) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    Facturación y Costos por Hora
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Flujo financiero comparando ingresos brutos frente al costo de mercadería elaborada (COGS)</p>
                </div>
              </div>
              <div className="flex-1 w-full text-xs font-mono min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={getHourlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="hora" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={9} />
                    <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '10px', direction: 'ltr', textAlign: 'left', border: 'none' }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, '']}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontFamily: 'sans-serif' }} />
                    <Area name="Ventas ($)" type="monotone" dataKey="Ventas" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    <Area name="Costos de Materia Prima ($)" type="monotone" dataKey="Costos" stroke="#EF4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCosts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Right: Channels Pie */}
            <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[320px]">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <PieIcon className="w-4 h-4 text-amber-500" />
                  Canales de Venta mas Fuertes
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Distribución de ingresos por tipo de despacho</p>
              </div>
              <div className="flex-1 flex items-center justify-center relative min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RePieChartInner data={getChannelData()} colors={COLORS} />
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Category Breakdown Bar & Featured Products list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Bar chart (Left Side) */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[350px]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Margen por Categoría
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Análisis comparativo de Ganancia líquida bruta vs Costo por sector de menú</p>
              </div>
              <div className="flex-1 w-full text-xs font-mono mt-4 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={getCategoryData()} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" className="dark:stroke-slate-900" />
                    <XAxis type="number" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={8} />
                    <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} stroke="#475569" fontSize={9} width={80} />
                    <Tooltip 
                      contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '10px', border: 'none' }}
                      formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, '']}
                    />
                    <Legend verticalAlign="top" height={32} iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'sans-serif' }} />
                    <Bar name="Costo" dataKey="Costos" fill="#94A3B8" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar name="Ganancia Neta" dataKey="Ganancia" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Featured Best Sellers list (Right Side) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2 font-sans">
                    <Award className="w-4.5 h-4.5 text-red-650 text-red-600 animate-bounce" />
                    Productos mas Vendidos (Productos Destacados)
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Ranking en tiempo real de productos estrella con margen neto estimado de rentabilidad</p>
                </div>
                <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-450 text-[9px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1 font-sans">
                  ⭐ Top Ventas
                </span>
              </div>

              {/* Best Selling Products list */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getBestSellers().map((item, index) => {
                  const profitRatio = item.revenue > 0 ? ((item.revenue - item.cost) / item.revenue) * 100 : 0;
                  return (
                    <div key={item.id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden hover:bg-white dark:hover:bg-slate-950 hover:border-red-200 dark:hover:border-red-905/40">
                      {/* Trophy badge for position */}
                      <span className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                        index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black' :
                        index === 1 ? 'bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold' :
                        index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400'
                      }`}>
                        #{index + 1}
                      </span>

                      <div>
                        {/* Upper line: category & sold counter */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[8px] uppercase tracking-wider font-extrabold font-sans">
                            {item.category}
                          </span>
                        </div>

                        {/* Product Title */}
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors mt-1 font-sans flex items-center gap-1">
                          {item.name}
                        </h4>

                        {/* Performance Details info */}
                        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80">
                          <div className="text-left">
                            <span className="text-[9px] text-slate-440 dark:text-slate-500 block uppercase font-sans font-bold">Unidades</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono flex items-center gap-0.5">
                              {item.quantity} <span className="text-[9px] text-slate-400 font-normal">u.</span>
                            </span>
                          </div>
                          
                          <div className="text-left">
                            <span className="text-[9px] text-slate-440 dark:text-slate-500 block uppercase font-sans font-bold">Facturado</span>
                            <span className="text-xs font-black text-green-600 dark:text-green-400 font-mono">
                              {formatCurrency(item.revenue)}
                            </span>
                          </div>

                          <div className="text-left">
                            <span className="text-[9px] text-slate-440 dark:text-slate-400 block uppercase font-sans font-bold">Utilidad</span>
                            <span className="text-xs font-black text-red-600 dark:text-red-450 font-mono">
                              {formatCurrency(item.revenue - item.cost)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lower profit indicator bar */}
                      <div className="mt-3.5">
                        <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-sans font-bold mb-1">
                          <span>Margen Unitario Estimado</span>
                          <span className={`font-black ${profitRatio > 65 ? 'text-green-600 dark:text-green-400' : profitRatio > 40 ? 'text-slate-700 dark:text-slate-350' : 'text-orange-600 dark:text-orange-400'}`}>
                            {profitRatio.toFixed(0)}%
                          </span>
                        </div>
                        {/* Interactive mini progress meter */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              profitRatio > 65 ? 'bg-green-500' : profitRatio > 40 ? 'bg-red-650 bg-red-600' : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, profitRatio))}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Active Orders Command center */}
          <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2 font-sans font-display">
                  <Clock className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
                  Comandas Activas en Tiempo Real (Control de Cocina rápido)
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">
                  Pedidos de hoy en preparación o entrega en cocina. Controlá el estado de los pedidos directamente desde esta pantalla.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-extrabold uppercase rounded-full tracking-wider flex items-center gap-1 font-sans">
                🛎️ {activeCookingOrders.length} Comandas en Curso
              </span>
            </div>

            {activeCookingOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-550 border border-dashed border-slate-200 dark:border-slate-850 rounded-lg flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-900/10">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center text-lg font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">¡Felicidades! Cocina al día</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-sans">No hay ningún pedido pendiente o en cocina para preparar.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCookingOrders.map((order) => {
                  const itemsSummary = order.items
                    .map((it) => `${it.quantity}x ${it.productName}`)
                    .join(', ');
                  
                  return (
                    <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-col justify-between hover:border-orange-200 dark:hover:border-orange-950/40 hover:shadow-sm transition-all">
                      <div>
                        {/* Status badge & Order ID */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-450">
                            {order.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] ${
                            order.status === 'pending'
                              ? 'bg-yellow-101 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-450'
                              : 'bg-blue-101 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                          }`}>
                            {order.status === 'pending' ? 'Pendiente' : 'En Cocina'}
                          </span>
                        </div>

                        {/* Customer Name */}
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-sans">
                          {order.customerName}
                        </h4>

                        {/* Order Type & Address info */}
                        <div className="flex flex-wrap gap-1.5 items-center mt-1.5 mb-2.5">
                          <span className="px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[9px] rounded font-semibold font-sans">
                            {order.orderType === 'delivery' ? '🛵 Envío' : order.orderType === 'local' ? '🍽️ Local' : '🛍️ Takeaway'}
                          </span>
                          {order.deliveryAddress && (
                            <span className="text-[9px] text-red-500/80 font-medium truncate max-w-[140px]" title={order.deliveryAddress}>
                              📍 {order.deliveryAddress}
                            </span>
                          )}
                        </div>

                        {/* Selected items description */}
                        <div className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800/60 mb-3">
                          <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-sans">Detalle Comanda</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                            {itemsSummary}
                          </p>
                        </div>
                      </div>

                      {/* Timer & Operational controls */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans">Tiempo transcurrido:</span>
                          <OrderTimer order={order} />
                        </div>

                        <div className="flex gap-1.5 matches-buttons">
                          <button
                            onClick={() => setSelectedOrderIdForDetail(order.id)}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center gap-1"
                            title="Ver Detalle Completo"
                          >
                            🔎 Detalle
                          </button>
                          {order.status === 'pending' ? (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cooking')}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              👨‍🍳 Cocinar
                            </button>
                          ) : (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                              ✓ Entregar
                            </button>
                          )}
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-650 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-600 dark:hover:bg-red-955"
                            title="Cancelar Pedido"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================== DETAILED ORDER LOGS & ACTIONS ======================== */
        <section className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px] w-full">
          <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-105 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-red-605 text-red-600" />
                Historial de Pedidos Recibidos
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Automáticos por WhatsApp y guardados en Firebase Live</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter by Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Ver Todos los Tipos</option>
                <option value="delivery" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Delivery</option>
                <option value="local" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Consumo Local</option>
                <option value="takeaway" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Para Llevar / Takeaway</option>
              </select>

              {/* Filter by Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600 cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Ver Todos los Estados</option>
                <option value="pending" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Pendientes</option>
                <option value="cooking" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">En Cocina</option>
                <option value="delivered" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Entregados</option>
                <option value="cancelled" className="dark:bg-slate-900 text-slate-700 dark:text-slate-200">Cancelados</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-sm font-medium">No se encontraron pedidos con estos filtros.</p>
                <p className="text-xs mt-1 text-slate-400/80">Generá uno nuevo desde la pestaña Menú Digital o hacé clic en Nuevo Pedido.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[850px] lg:min-w-full">
                <thead className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 z-10">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="px-5 py-3 w-[8%] min-w-[70px]">Código</th>
                    <th className="px-5 py-3 w-[26%] min-w-[180px]">Cliente / Detalle</th>
                    <th className="px-5 py-3 w-[10%] min-w-[80px]">Método</th>
                    <th className="px-5 py-3 w-[11%] min-w-[100px]">Total / Costo</th>
                    <th className="px-5 py-3 text-center w-[11%] min-w-[90px]">Filtro WhatsApp</th>
                    <th className="px-5 py-3 w-[11%] min-w-[90px]">Estado</th>
                    <th className="px-5 py-3 text-center w-[11%] min-w-[100px]">Control de Tiempo</th>
                    <th className="px-5 py-3 text-right w-[12%] min-w-[120px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900 text-slate-700 dark:text-slate-300">
                  {filteredOrders.map((order) => {
                    const itemsSummary = order.items
                      .map((it) => `${it.quantity}x ${it.productName}`)
                      .join(', ');

                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => setSelectedOrderIdForDetail(order.id)}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors cursor-pointer"
                        title="Presioná la fila para abrir el detalle completo"
                      >
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {order.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{order.customerName}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-sm" title={itemsSummary}>
                            {itemsSummary}
                          </div>
                          {order.deliveryAddress && (
                            <div className="text-[11px] text-red-500/80 font-medium mt-0.5">
                              📍 {order.deliveryAddress}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] rounded font-semibold uppercase tracking-wider">
                            {order.orderType === 'delivery' ? '🛵 Delivery' : order.orderType === 'local' ? '🍽️ Local' : '🛍️ Takeaway'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-105 dark:text-white">{formatCurrency(order.totalPrice)}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Costo: {formatCurrency(order.totalCost)}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-green-500 font-bold" title="Pedido enviado automáticamente">
                            {order.viaWhatsApp ? '✅' : '❌'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {order.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-yellow-101 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 text-[10px] rounded font-bold uppercase tracking-wider">
                              Pendiente
                            </span>
                          )}
                          {order.status === 'cooking' && (
                            <span className="px-2 py-0.5 bg-blue-101 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] rounded font-bold uppercase tracking-wider">
                              En Cocina
                            </span>
                          )}
                          {order.status === 'delivered' && (
                            <span className="px-2 py-0.5 bg-green-101 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] rounded font-bold uppercase tracking-wider">
                              Entregado
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="px-2 py-0.5 bg-red-101 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[10px] rounded font-bold uppercase tracking-wider">
                              Cancelado
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <OrderTimer order={order} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderIdForDetail(order.id);
                              }}
                              className="p-1 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 text-xs"
                              title="Detalle completo"
                            >
                              🔎 Ver Detalle
                            </button>
                            {order.status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, 'cooking');
                                }}
                                className="p-1 px-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-150 dark:hover:bg-blue-900 rounded transition-colors font-medium text-xs cursor-pointer"
                                title="Marcar En Cocina"
                              >
                                Cocinar
                              </button>
                            )}
                            {order.status === 'cooking' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, 'delivered');
                                }}
                                className="p-1 px-2 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-150 dark:hover:bg-green-900 rounded transition-colors font-medium text-xs cursor-pointer"
                                title="Marcar como Entregado"
                              >
                                Entregar
                              </button>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelOrder(order.id);
                                }}
                                className="p-1.5 text-slate-400 dark:text-slate-555 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                                title="Cancelar Pedido"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* Detalle de Pedido flotante (Modal de Comanda) */}
      {selectedOrderIdForDetail && (() => {
        const order = orders.find((o) => o.id === selectedOrderIdForDetail);
        if (!order) return null;

        const formatDateTimeFull = (isoString?: string) => {
          if (!isoString) return '';
          try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' hs (' + date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) + ')';
          } catch {
            return isoString;
          }
        };

        const timePreCooking = order.cookingStartedAt 
          ? Math.round((new Date(order.cookingStartedAt).getTime() - new Date(order.createdAt).getTime()) / 60000)
          : null;

        const timeCooking = (order.completedAt && order.cookingStartedAt)
          ? Math.round((new Date(order.completedAt).getTime() - new Date(order.cookingStartedAt).getTime()) / 60000)
          : null;

        const orderSubtotal = order.totalPrice - (order.deliveryCost || 0);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Pedido {order.id}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(order.id);
                        setCopiedOrderId(true);
                        setTimeout(() => setCopiedOrderId(false), 2000);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-sans cursor-pointer font-bold"
                    >
                      <Copy className="w-3 h-3" /> {copiedOrderId ? '¡Copiado!' : 'Copiar Código'}
                    </button>
                    <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-wider text-[9px] ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-450'
                        : order.status === 'cooking'
                        ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-405'
                        : order.status === 'delivered'
                        ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                    }`}>
                      {order.status === 'pending' ? 'Pendiente' : order.status === 'cooking' ? 'En Cocina' : order.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 font-sans">
                    {order.customerName}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-sans">
                    <Clock className="w-3.5 h-3.5" /> Ingresado el {formatDateTimeFull(order.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderIdForDetail(null)}
                  className="p-1 px-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Scrollbox */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-705 dark:text-slate-300">
                
                {/* Modality, Client Contact & Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Delivery & Contact box */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-850">
                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                      <User className="w-4 h-4 text-rose-500" />
                      Datos de Contacto
                    </h4>
                    <div className="space-y-2 text-xs font-sans">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Modalidad:</span>{' '}
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                          {order.orderType === 'delivery' ? '🛵 Envío a domicilio' : order.orderType === 'local' ? '🍽️ Consumo en local' : '🛍️ Takeaway / Para Llevar'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">Celular WhatsApp:</span>{' '}
                        {order.customerContact ? (
                          <span className="font-mono">
                            <a 
                              href={`https://wa.me/${order.customerContact}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-green-600 dark:text-green-400 font-extrabold hover:underline inline-flex items-center gap-1"
                            >
                              {order.customerContact} <ExternalLink className="w-3 h-3" />
                            </a>
                          </span>
                        ) : (
                          <span className="text-slate-405 italic">No especificado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address & Extra box */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-850">
                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      Dirección de Entrega
                    </h4>
                    {order.orderType === 'delivery' ? (
                      <div className="text-xs space-y-1.5 font-sans">
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {order.deliveryAddress || 'No ingresada'}
                        </p>
                        {order.deliveryAddress && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1 font-bold"
                          >
                            🗺️ Ver Mapa en Google <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-sans leading-relaxed">
                        {order.orderType === 'local' ? '🍽️ Comensal ubicado en mesa asignada.' : '🛍️ Se despacha para retiro en mostrador.'}
                      </p>
                    )}
                  </div>

                </div>

                {/* Menu items detailed */}
                <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 px-4 border-b border-slate-150 dark:border-slate-850 flex justify-between items-center">
                    <span className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 font-sans">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Productos de la Comanda
                    </span>
                    <span className="text-[10px] bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded-full font-extrabold font-sans">
                      {order.items.reduce((acc, it) => acc + it.quantity, 0)} u.
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 flex justify-between items-center gap-4 text-sm font-sans">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-slate-100">
                            {item.quantity}x {item.productName}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Precio unitario: {formatCurrency(item.price)}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient notes block */}
                {order.notes && (
                  <div className="p-4 bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-300 rounded-xl">
                    <h4 className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1 text-amber-600 dark:text-amber-500 font-sans">
                      ✍️ Aclaraciones / Comentarios del Cliente
                    </h4>
                    <p className="text-xs italic bg-white/40 dark:bg-black/20 p-2.5 rounded border border-amber-500/10 mt-1.5 leading-relaxed font-sans">
                      "{order.notes}"
                    </p>
                  </div>
                )}

                {/* Financial overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Payment method info */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-col justify-center">
                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      Medio de Pago Seleccionado
                    </h4>
                    <div className="space-y-2 text-xs font-sans">
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                        {order.paymentMethod === 'Mercado Pago' ? '📱 Mercado Pago' : order.paymentMethod === 'Efectivo' ? '💵 Efectivo (Contra entrega)' : order.paymentMethod === 'Tarjeta' ? '💳 Tarjeta de Débito/Crédito' : '💻 No especificado'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1">
                        El link de Mercado Pago se genera en base a esta elección. Se recibirá comprobante por chat para la confirmación de cocina.
                      </p>
                    </div>
                  </div>

                  {/* Pricing breakdown list */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-150 dark:border-slate-850">
                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2.5 font-sans">
                      Desglose de Costos
                    </h4>
                    <div className="space-y-2 text-xs font-sans">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Subtotal Ítems:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(orderSubtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Cargo de Delivery:</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {order.deliveryCost ? formatCurrency(order.deliveryCost) : 'Sin cargo'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-bold">
                        <span className="text-slate-900 dark:text-white">Total a Cobrar:</span>
                        <span className="font-mono text-red-655 text-red-600 dark:text-red-400">{formatCurrency(order.totalPrice)}</span>
                      </div>
                      {/* Admin Margin helper */}
                      <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800/80 pt-1.5 text-[10px] text-slate-400">
                        <span>Margen Neto Comercial:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold" title={`Costo: ${formatCurrency(order.totalCost)}`}>
                          +{formatCurrency(order.netProfit)} ({((order.netProfit / order.totalPrice) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* State timeline */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-150 dark:border-slate-850">
                  <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-4 flex items-center gap-1.5 font-sans">
                    <Clock className="w-4 h-4 text-blue-550" />
                    Historial de Estados (Auditoría Temporal)
                  </h4>
                  
                  {/* Timeline */}
                  <div className="relative pl-6 space-y-4 font-sans before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                    
                    {/* Event 1: Creation */}
                    <div className="relative">
                      <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950"></div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                          <span>📥 Pedido Recibido</span>
                          <span className="font-mono text-[9px] text-slate-400">{formatDateTimeFull(order.createdAt)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">La orden ingresó correctamente desde el catálogo.</p>
                      </div>
                    </div>

                    {/* Event 2: Cooking */}
                    <div className="relative">
                      <div className={`absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 ${
                        order.cookingStartedAt ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}></div>
                      <div className="text-xs">
                        <div className="font-bold flex items-center justify-between">
                          <span className={order.cookingStartedAt ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}>
                            👨‍🍳 Elaboración Iniciada
                          </span>
                          {order.cookingStartedAt ? (
                            <span className="font-mono text-[9px] text-slate-400">{formatDateTimeFull(order.cookingStartedAt)}</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 dark:text-slate-600 italic">Esperando cocina</span>
                          )}
                        </div>
                        {order.cookingStartedAt && (
                          <p className="text-[10px] text-slate-450 text-slate-400 mt-0.5">
                            Cocinero tomó la orden de preparación.{' '}
                            {timePreCooking !== null && (
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                (Demora en fila: {timePreCooking} min)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event 3: Completed or cancelled */}
                    {order.status === 'cancelled' ? (
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-950"></div>
                        <div className="text-xs">
                          <div className="font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
                            <span>❌ Pedido Cancelado</span>
                            <span className="font-mono text-[9px] text-red-500">Cancelado</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">La comanda fue suspendida por el administrador.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 ${
                          order.completedAt ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}></div>
                        <div className="text-xs">
                          <div className="font-bold flex items-center justify-between">
                            <span className={order.completedAt ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}>
                              ✓ Pedido Entregado / Despachado
                            </span>
                            {order.completedAt ? (
                              <span className="font-mono text-[9px] text-slate-400">{formatDateTimeFull(order.completedAt)}</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 dark:text-slate-600 italic font-medium">Bajo cocina o empaque...</span>
                            )}
                          </div>
                          {order.completedAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Despacho completado con éxito.{' '}
                              {timeCooking !== null && (
                                <span className="text-green-600 dark:text-green-400 font-bold">
                                  (Tiempo de cocción: {timeCooking} min)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 flex flex-wrap gap-2 justify-end">
                {/* Send Ticket via WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => {
                    const ticketText = `📄 *TICKET DE COMPRA - ${order.id}* 📄\n` +
                      `--------------------------------------\n` +
                      `👤 *Cliente:* ${order.customerName}\n` +
                      `📅 *Fecha:* ${new Date(order.createdAt).toLocaleDateString('es-AR')} ${new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs\n` +
                      `🍕 *Modalidad:* ${order.orderType === 'delivery' ? '🛵 Envío a domicilio' : order.orderType === 'local' ? '🍽️ Consumo en local' : '🛍️ Takeaway / Para Llevar'}\n` +
                      (order.orderType === 'delivery' && order.deliveryAddress ? `📍 *Dirección:* ${order.deliveryAddress}\n` : '') +
                      `--------------------------------------\n` +
                      `🛍️ *Detalle del Pedido:*\n` +
                      order.items.map(it => `- ${it.quantity}x ${it.productName} (*${formatCurrency(it.price * it.quantity)}*)`).join('\n') + '\n' +
                      `--------------------------------------\n` +
                      `💵 *Subtotal:* ${formatCurrency(orderSubtotal)}\n` +
                      (order.deliveryCost ? `🛵 *Cargo de Envío:* ${formatCurrency(order.deliveryCost)}\n` : '') +
                      `💰 *TOTAL A COBRAR:* *${formatCurrency(order.totalPrice)}*\n` +
                      `💳 *Medio de Pago:* ${order.paymentMethod || 'Efectivo'}\n` +
                      `--------------------------------------\n` +
                      `¡Muchas gracias por elegirnos! 🙌✨`;

                    const cleanedPhone = order.customerContact ? order.customerContact.replace(/\D/g, '') : '';
                    const waUrl = cleanedPhone 
                      ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(ticketText)}`
                      : `https://wa.me/?text=${encodeURIComponent(ticketText)}`;
                    
                    window.open(waUrl, '_blank');
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Enviar Ticket por WhatsApp
                </button>

                {/* Share Ticket Button */}
                <button
                  type="button"
                  onClick={async () => {
                    const ticketText = `📄 *TICKET DE COMPRA - ${order.id}* 📄\n` +
                      `--------------------------------------\n` +
                      `👤 *Cliente:* ${order.customerName}\n` +
                      `📅 *Fecha:* ${new Date(order.createdAt).toLocaleDateString('es-AR')} ${new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs\n` +
                      `🍕 *Modalidad:* ${order.orderType === 'delivery' ? '🛵 Envío a domicilio' : order.orderType === 'local' ? '🍽️ Consumo en local' : '🛍️ Takeaway / Para Llevar'}\n` +
                      (order.orderType === 'delivery' && order.deliveryAddress ? `📍 *Dirección:* ${order.deliveryAddress}\n` : '') +
                      `--------------------------------------\n` +
                      `🛍️ *Detalle del Pedido:*\n` +
                      order.items.map(it => `- ${it.quantity}x ${it.productName} (*${formatCurrency(it.price * it.quantity)}*)`).join('\n') + '\n' +
                      `--------------------------------------\n` +
                      `💵 *Subtotal:* ${formatCurrency(orderSubtotal)}\n` +
                      (order.deliveryCost ? `🛵 *Cargo de Envío:* ${formatCurrency(order.deliveryCost)}\n` : '') +
                      `💰 *TOTAL A COBRAR:* *${formatCurrency(order.totalPrice)}*\n` +
                      `💳 *Medio de Pago:* ${order.paymentMethod || 'Efectivo'}\n` +
                      `--------------------------------------\n` +
                      `¡Muchas gracias por elegirnos! 🙌✨`;

                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: `Ticket_${order.id}`,
                          text: ticketText
                        });
                      } catch (err) {
                        // If users cancel or it fails, fallback to copy to clipboard
                        if (err instanceof Error && err.name !== 'AbortError') {
                          await navigator.clipboard.writeText(ticketText);
                          alert('📋 ¡Ticket copiado al portapapeles! Ya podés pegarlo y compartirlo con tu cliente.');
                        }
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(ticketText);
                        alert('📋 ¡Tu navegador no soporta compartir directamente, pero el ticket fue copiado al portapapeles! Ya podés pegarlo en cualquier aplicación.');
                      } catch (err) {
                        console.error('Copy failed:', err);
                      }
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Compartir Ticket
                </button>

                {order.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, 'cooking');
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    👨‍🍳 Empezar Cocinado
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, 'delivered');
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    🚀 Entregar Pedido
                  </button>
                )}
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      cancelOrder(order.id);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-650 dark:text-slate-400 hover:text-red-600 font-bold rounded-xl text-xs transition border border-transparent hover:border-red-200 dark:hover:border-red-950/40 cursor-pointer"
                  >
                    Cancelar Pedido
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrderIdForDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-205 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cerrar Detalle
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Inner Component for Recharts Pie Chart to avoid React 19 / TypeScript JSX element type incompatibilities
function RePieChartInner({ data, colors }: { data: any[], colors: string[] }) {
  return (
    <RePieChart>
      <Pie
        data={data}
        cx="50%"
        cy="45%"
        innerRadius={45}
        outerRadius={75}
        paddingAngle={3}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip 
        contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '10px', border: 'none' }}
        formatter={(value: any) => [`$${Number(value).toLocaleString('es-AR')}`, 'Total']}
      />
      <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontFamily: 'sans-serif', paddingTop: '10px' }} />
    </RePieChart>
  );
}
