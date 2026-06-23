import React, { useState } from 'react';
import { Product, CartItem, Order } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, Send, CheckCircle, Smartphone } from 'lucide-react';

interface MenuPanelProps {
  products: Product[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onOrderSuccess: () => void;
}

export default function MenuPanel({ products, setOrders, onOrderSuccess }: MenuPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  
  // Checkout form state
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'local' | 'takeaway'>('delivery');
  const [tableNumber, setTableNumber] = useState<string>('Mesa 1');
  const [customerContact, setCustomerContact] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('5493415551234'); // Business Phone

  // Extract categories
  const preferredCategoryOrder = [
    'Todos',
    'Entradas',
    'Minutas',
    'Hamburguesas',
    'Platos',
    'Guarniciones',
    'Acompañamientos',
    'Bebidas'
  ];

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))].sort((a, b) => {
    const idxA = preferredCategoryOrder.indexOf(a);
    const idxB = preferredCategoryOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // Filter products
  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  const cartCost = cart.reduce((acc, curr) => acc + curr.product.cost * curr.quantity, 0);

  // Send order directly to system counter (no WhatsApp redirection)
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderType !== 'local' && !customerName.trim()) {
      alert('Por favor, ingresá el nombre del cliente para la orden.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      alert('Para envíos a domicilio registrados en caja, se requiere la dirección.');
      return;
    }

    const orderId = `#CJ${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      cost: item.product.cost,
    }));

    const finalCustomerName = customerName.trim() || `Mesa ${tableNumber.replace(/^\D+/g, '') || tableNumber}`;

    // Create a new simulated Order
    const newOrder: Order = {
      id: orderId,
      customerName: `${finalCustomerName} ${orderType === 'local' ? `(${tableNumber})` : ''}`,
      items: newOrderItems,
      totalPrice: cartTotal,
      totalCost: cartCost,
      netProfit: cartTotal - cartCost,
      createdAt: new Date().toISOString(),
      status: 'pending',
      viaWhatsApp: false, // Registered directly on site
      orderType,
      customerContact: customerContact || undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
    };

    // Save locally
    setOrders((prev) => [newOrder, ...prev]);

    // Reset everything
    clearCart();
    setIsCheckoutOpen(false);
    onOrderSuccess();
    alert(`¡Pedido ${orderId} registrado con éxito DIRECTO EN CAJA! No requiere enviar mensaje por WhatsApp.`);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
      {/* Menu / Product list segment - left side */}
      <div className="flex-[2] flex flex-col gap-4 overflow-hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">Menú Digital Autogestionable</h2>
          <p className="text-xs text-slate-500 mt-1">
            Los clientes eligen sus productos preferidos para despachar al instante por WhatsApp.
          </p>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-sm shadow-red-100'
                  : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
          {filteredProducts.map((p) => {
            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                    <span className="text-red-650 text-red-600 font-extrabold text-sm shrink-0">
                      {formatCurrency(p.price)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-3">
                    🔖 {p.category}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Insumo: {p.name.includes('Burger') ? 'Crítico ⚠️' : 'Estándar ✅'}
                  </span>
                  <button
                    onClick={() => addToCart(p)}
                    className="p-1 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Panel - right side */}
      <div className="flex-[1] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[350px]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-800">Carrito de Pedido</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
            >
              Vaciar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 p-4">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-xs font-bold">Carrito Vacío</p>
              <p className="text-[10px] mt-1 text-slate-400 leading-relaxed">
                Seleccioná tus platos en el menú digital de la izquierda para armar el pedido.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-red-600">
                    {formatCurrency(item.product.price)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-md bg-white">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 px-1.5 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="px-1 text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 px-1.5 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider">Monto Total:</span>
              <span className="text-lg text-slate-950 font-extrabold">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-bold shadow-sm hover:shadow-red-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Registrar Pedido en Caja <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
 
      {/* Checkout modal dialog */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>🏦</span> Registrar Venta en Caja (Mostrador)
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Ingresá los datos de facturación. La orden se enviará directamente a Cocina y se actualizará el stock e ingresos al instante.
              </p>
            </div>
 
            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4 flex-1 overflow-auto">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {orderType === 'local' ? 'Nombre del Cliente (Opcional)' : 'Nombre del Cliente *'}
                </label>
                <input
                  type="text"
                  required={orderType !== 'local'}
                  placeholder={orderType === 'local' ? "Ej: Carlos Mendía (Opcional)" : "Ej: Carlos Mendía"}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                />
              </div>
 
              {/* Order mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Método de Entrega *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'delivery', label: '🛵 Envío', emoji: '🛵' },
                    { val: 'local', label: '🍽️ Local', emoji: '🍽️' },
                    { val: 'takeaway', label: '🛍️ Retirar', emoji: '🛍️' },
                  ].map((mode) => (
                    <button
                      key={mode.val}
                      type="button"
                      onClick={() => setOrderType(mode.val as any)}
                      className={`py-2 px-1 border rounded-lg text-xs font-bold transition-all ${
                        orderType === mode.val
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-base mb-0.5">{mode.emoji}</div>
                      <div>{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Table Selector */}
              {orderType === 'local' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Mesa *
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-slate-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  >
                    {Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`).map((mesa) => (
                      <option key={mesa} value={mesa}>
                        📍 {mesa}
                      </option>
                    ))}
                  </select>
                </div>
              )}
 
              {/* Destination Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Celular del Cliente (Opcional)</span>
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +54 9 341 555-1234"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                />
              </div>
 
              {/* Delivery Address (only if delivery) */}
              {orderType === 'delivery' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dirección de Envío *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Pellegrini 1420, Depto 6B"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  />
                </div>
              )}
 
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-150 text-[10px] text-emerald-800 font-medium">
                💡 Al confirmar, descontaremos los insumos críticos del stock activo y sumaremos {formatCurrency(cartTotal)} a las ganancias del Panel Principal.
              </div>
 
              {/* CTA Action */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-bold text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  Confirmar Venta en Caja 🗳️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
