import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order, AppUser } from '../types';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Check, 
  MessageSquare, 
  QrCode, 
  User, 
  LogIn, 
  LogOut, 
  Mail, 
  Lock, 
  Shield, 
  Sparkles, 
  Search, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ArrowRight,
  Flame,
  Clock 
} from 'lucide-react';
import { db } from '../lib/db';

interface CustomerMenuProps {
  products: Product[];
  onOrderSubmitted: (newOrder: Order) => void;
  whatsappPhone: string;
  businessName: string;
}

// Map high quality Unsplash images specifically for product illustration
const getProductImage = (productId: string, productName: string, category: string) => {
  const normName = productName.toLowerCase();
  if (productId === 'prod-1' || normName.includes('doble cheddar')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (productId === 'prod-2' || normName.includes('clásica') || normName.includes('clasica')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (productId === 'prod-3' || normName.includes('oklahoma') || normName.includes('onion')) {
    return 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (productId === 'prod-4' || normName.includes('cheddar & bacon') || normName.includes('bacon')) {
    return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (productId === 'prod-5' || normName.includes('papas fritas') || normName.includes('papas')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (productId === 'prod-6' || normName.includes('cola') || normName.includes('coca')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (productId === 'prod-7' || normName.includes('agua') || normName.includes('mineral')) {
    return 'https://images.unsplash.com/photo-1608885898957-a599fb1b4600?auto=format&fit=crop&w=600&h=600&q=80';
  }

  // Fallbacks by category
  if (category.toLowerCase().includes('hamburguesa')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (category.toLowerCase().includes('acompañamiento') || category.toLowerCase().includes('papas')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&h=600&q=80';
  }
  if (category.toLowerCase().includes('bebida')) {
    return 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&h=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=600&q=80';
};

export default function CustomerMenu({ products, onOrderSubmitted, whatsappPhone, businessName }: CustomerMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Profile avatar details state
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  // Auth local state backed by simulated database
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => db.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [googlePopupOpen, setGooglePopupOpen] = useState<boolean>(false);
  const [googleProcessing, setGoogleProcessing] = useState<boolean>(false);

  // Customer choice fields (pre-filled if authenticated)
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'local' | 'takeaway'>('local');
  const [tableNumber, setTableNumber] = useState<string>('Mesa 4');
  const [customerContact, setCustomerContact] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Sync inputs when user logs in/out
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.displayName);
      if (currentUser.phoneNumber) {
        setCustomerContact(currentUser.phoneNumber);
      }
    } else {
      setCustomerName('');
      setCustomerContact('');
    }
  }, [currentUser]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (userMenuOpen) {
      const handleOutsideClick = () => setUserMenuOpen(false);
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [userMenuOpen]);

  // Firebase auth logic simulation
  const handleRegisterSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim() || !authName.trim()) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    const newUser: AppUser = {
      uid: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
      email: authEmail.trim(),
      displayName: authName.trim(),
      phoneNumber: authPhone.trim() || undefined,
      authProvider: 'email'
    };

    db.saveUser(newUser);
    setCurrentUser(newUser);
    setAuthModalOpen(false);
    // clean fields
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthPhone('');
    alert(`¡Registro exitoso en Firebase Auth! Bienvenido ${newUser.displayName}. Tus datos se guardaron para compras más rápidas.`);
  };

  const handleLoginSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      alert('Por favor, ingresa tu email y contraseña.');
      return;
    }

    const users = db.getUsers();
    const found = users.find((u) => u.email.toLowerCase() === authEmail.trim().toLowerCase());

    if (found) {
      db.setCurrentUser(found);
      setCurrentUser(found);
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      alert(`¡Sesión iniciada con éxito! Bienvenido nuevamente, ${found.displayName}.`);
    } else {
      // Create user on the fly to keep sim fast and seamless
      const generatedUser: AppUser = {
        uid: `usr_${Math.floor(100000 + Math.random() * 900000)}`,
        email: authEmail.trim(),
        displayName: authEmail.split('@')[0],
        authProvider: 'email'
      };
      db.saveUser(generatedUser);
      setCurrentUser(generatedUser);
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      alert(`¡Iniciaste sesión correctamente! Se ha creado un perfil Firebase con tu correo ${generatedUser.email}.`);
    }
  };

  const startGoogleSignIn = () => {
    setGooglePopupOpen(true);
    setGoogleProcessing(false);
  };

  const handleGoogleAccountSelect = (selectedEmail: string, selectedName: string) => {
    setGoogleProcessing(true);
    setTimeout(() => {
      const googleUser: AppUser = {
        uid: `usr_google_${Math.floor(100000 + Math.random() * 900000)}`,
        email: selectedEmail,
        displayName: selectedName,
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80',
        authProvider: 'google'
      };
      db.saveUser(googleUser);
      setCurrentUser(googleUser);
      setGoogleProcessing(false);
      setGooglePopupOpen(false);
      setAuthModalOpen(false);
      alert(`¡Autenticado con éxito usando Google! Hola, ${selectedName}. Tu perfil de Gmail se ha sincronizado correctamente.`);
    }, 1200);
  };

  const handleLogout = () => {
    if (window.confirm('¿Seguro que querés cerrar sesión?')) {
      db.clearCurrentUser();
      setCurrentUser(null);
      alert('Sesión cerrada correctamente.');
    }
  };

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  const cartCost = cart.reduce((acc, curr) => acc + curr.product.cost * curr.quantity, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(val);
  };

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
        .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderType !== 'local' && !customerName.trim()) {
      alert('Por favor ingresá tu nombre para identificar el pedido.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      alert('Por favor especificá la dirección de envío.');
      return;
    }

    const orderId = `#QR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderItems = cart.map((it) => ({
      productId: it.product.id,
      productName: it.product.name,
      quantity: it.quantity,
      price: it.product.price,
      cost: it.product.cost,
    }));

    const finalCustomerName = customerName.trim() || `Mesa ${tableNumber.replace(/^\D+/g, '') || tableNumber}`;

    const finalOrder: Order = {
      id: orderId,
      customerName: `${finalCustomerName} ${orderType === 'local' ? `(${tableNumber})` : ''}`,
      items: newOrderItems,
      totalPrice: cartTotal,
      totalCost: cartCost,
      netProfit: cartTotal - cartCost,
      createdAt: new Date().toISOString(),
      status: 'pending',
      viaWhatsApp: true,
      orderType,
      customerContact: customerContact || undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
    };

    // Text format comanda for WhatsApp Dispatcher
    let text = `🍟 *NUEVO PEDIDO DESDE EL MENÚ QR* 🍟\n`;
    text += `*ID de Pedido:* \`${orderId}\`\n`;
    text += `*Local:* _${businessName}_\n`;
    text += `------------------------------------------\n`;
    text += `👤 *Cliente:* ${finalCustomerName}\n`;
    text += `📍 *Modalidad:* ${orderType === 'delivery' ? '🛵 Envío a Domicilio' : orderType === 'local' ? `🍽️ Consumo en ${tableNumber}` : '🛍️ Retiro en Local'}\n`;
    
    if (orderType === 'delivery' && deliveryAddress) {
      text += `🏠 *Dirección:* ${deliveryAddress}\n`;
    }
    if (customerContact) {
      text += `📞 *Teléfono:* ${customerContact}\n`;
    }
    if (orderNotes.trim()) {
      text += `✍️ *Aclaraciones:* _"${orderNotes}"_\n`;
    }
    text += `------------------------------------------\n\n`;
    text += `🛍️ *PRODUCTOS SELECCIONADOS:*\n`;

    cart.forEach((it) => {
      text += `• *${it.quantity}x* ${it.product.name} (${formatCurrency(it.product.price * it.quantity)})\n`;
    });

    text += `\n💰 *Total del Pedido:* ${formatCurrency(cartTotal)}\n`;
    text += `------------------------------------------\n`;
    text += `💬 Enviar este mensaje para iniciar la preparación en cocina.`;

    onOrderSubmitted(finalOrder);

    const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(text)}`;
    window.open(whatsappLink, '_blank');

    setCart([]);
    setIsCheckoutOpen(false);
    alert('¡Pedido enviado al administrador! Se abrirá un chat de WhatsApp para completar el envío de manera formal.');
  };

  return (
    <div className="w-full min-h-screen bg-[#121212] flex flex-col font-sans text-zinc-150 relative">
      
      {/* 1. FIXED & COMPACT NAVBAR (Cabecera Optimizada) */}
      <header className="sticky top-0 bg-[#0d0d0f]/90 backdrop-blur-md z-40 border-b border-zinc-850 h-14 md:h-16 flex items-center justify-between px-4 md:px-8 shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          {/* Flame mark representing BurgerControl / Gourmet Burgers */}
          <div className="w-8 h-8 rounded-lg bg-red-650 bg-red-650 flex items-center justify-center text-white font-display font-black text-lg animate-pulse shadow-sm">
            <Flame className="w-5 h-5 animate-bounce fill-white/10" />
          </div>
          <span className="text-base md:text-xl font-display font-black tracking-tight text-white flex items-center gap-1.5 select-none uppercase">
            {businessName}
            <span className="hidden sm:inline bg-zinc-800 text-[8px] tracking-widest px-2 py-0.5 rounded text-red-500 font-extrabold border border-zinc-700">
              Gourmet
            </span>
          </span>
        </div>

        {/* Dynamic User Profile Status Dropdown (ONLY visible/expanded upon click) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-full bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-800 flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
          >
            {currentUser ? (
              currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar de Cliente" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs font-black text-red-500">{currentUser.displayName.charAt(0).toUpperCase()}</span>
              )
            ) : (
              <User className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {/* User Drops menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-64 bg-[#18181c] border border-zinc-850 rounded-xl shadow-2xl p-4 z-50 animate-scale-up text-left">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="pb-2 border-b border-zinc-800/60">
                    <span className="text-[9px] uppercase font-black tracking-wider text-red-500 py-0.5 block">Socio Activo</span>
                    <h4 className="font-display font-bold text-sm text-white leading-tight mt-1">{currentUser.displayName}</h4>
                    <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{currentUser.email}</p>
                  </div>
                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/40 text-[10px] text-zinc-400 space-y-1">
                    <p className="flex items-center justify-between font-medium">
                      <span>Sync Firebase Auth:</span> <span className="text-green-500 font-black">Activa ✅</span>
                    </p>
                    <p className="flex items-center justify-between font-medium">
                      <span>Origen:</span> <span className="text-zinc-300 font-semibold">{currentUser.authProvider === 'google' ? 'Google OAuth' : 'Registro Manual'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full py-2 bg-red-950/45 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white rounded-lg text-xs font-bold font-sans transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center pb-2">
                    <p className="text-xs text-zinc-400 font-bold">¡Unite a BurgerControl!</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Registrate en Firebase Auth para guardar tu dirección, sumar cupones y pedir más rápido.</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setAuthTab('login');
                      setAuthModalOpen(true);
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión / Registrarse
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero simple gourmet style with search and categories */}
      <section className="bg-gradient-to-b from-[#0d0d0f] to-[#121212] px-4 pt-6 pb-2 shrink-0 max-w-7xl mx-auto w-full">
        {/* Search tool - Smooth round pill */}
        <div className="relative max-w-md mx-auto mb-5">
          <Search className="w-4 h-4 text-zinc-550 text-zinc-550 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar hamburguesa, papas, bebidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-650 text-white placeholder-zinc-550 placeholder-zinc-500 transition-all focus:border-red-650"
          />
        </div>

        {/* Categories Carousel - Rounded Pills with mobile touch scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-none max-w-md md:max-w-xl mx-auto justify-start sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-950/20 scale-105'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. MENU ITEMS CONTAINER (Ultra Adaptive Redesigned Grid) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 pb-28">
        
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 max-w-sm mx-auto">
            <p className="text-sm font-semibold">No se encontraron delicias con estos filtros.</p>
            <p className="text-xs mt-1 text-zinc-650 text-zinc-600">Probá borrando el texto de la barra de búsqueda o eligiendo otra sección del menú.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const qtyInCart = cart.find((i) => i.product.id === p.id)?.quantity || 0;
              const prodImg = p.imageUrl || getProductImage(p.id, p.name, p.category);

              return (
                <div 
                  key={p.id}
                  className="bg-[#18181c] rounded-2xl border border-zinc-850 hover:border-red-600/30 transition-all duration-300 shadow-md group overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-black/40"
                  id={`customer-item-${p.id}`}
                >
                  {/* Image Container */}
                  <div className="w-full h-24 sm:h-36 md:h-48 lg:h-52 relative overflow-hidden shrink-0 bg-zinc-900 border-b border-zinc-850/40">
                    <img 
                      src={prodImg} 
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        // Beautiful warm gourmet fallback burger image on error (like Agua Mineral with broken link)
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Floating badge by category */}
                    <span className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-zinc-800/60 shadow">
                      {p.category}
                    </span>
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between">
                    <div>
                      {/* Mobile small category text */}
                      <span className="inline-block md:hidden text-[8px] font-black text-red-500 uppercase tracking-widest">
                        {p.category}
                      </span>
                      <h3 className="text-zinc-50 font-display font-extrabold text-[11px] sm:text-base leading-tight mt-0.5 md:mt-0 group-hover:text-red-500 transition-colors line-clamp-1" title={p.name}>
                        {p.name}
                      </h3>
                      <p className="text-zinc-300 font-sans text-[10px] sm:text-xs mt-1 md:mt-2 line-clamp-2 md:line-clamp-3 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-800/40 gap-1.5">
                      {/* Price with deep aesthetic red contrast */}
                      <span className="font-display font-black text-xs sm:text-base md:text-lg text-red-500 whitespace-nowrap">
                        {formatCurrency(p.price)}
                      </span>

                      {/* Add block */}
                      <div className="shrink-0">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center bg-red-950/25 border border-red-900/45 rounded-lg p-0.5 select-none">
                            <button
                              onClick={() => updateQuantity(p.id, -1)}
                              className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-950/65 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <span className="px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-black text-white">{qtyInCart}</span>
                            <button
                              onClick={() => updateQuantity(p.id, 1)}
                              className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-950/65 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(p)}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-[10px] sm:text-xs font-bold tracking-wide flex items-center gap-1 shadow-md shadow-red-950/30 transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. PERSISTENT FLOATING BASKET PANEL */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0d0d0f]/95 backdrop-blur-md p-4 md:py-5 border-t border-zinc-850 flex items-center justify-center z-40 shadow-2xl">
          <div className="max-w-3xl w-full flex items-center justify-between gap-6 px-2 md:px-4">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-red-500" />
                Mi Canasta
              </p>
              <p className="text-lg md:text-xl font-display font-black text-white mt-0.5">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-6 py-3 bg-red-650 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-extrabold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40 transition-all hover:shadow-xl"
            >
              <span>Generar Pedido</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </button>
          </div>
        </div>
      )}

      {/* 5. REDESIGNED CHECKOUT MODAL FRAME */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[90%] overflow-auto text-zinc-150 scrollbar-thin">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-display font-black text-white text-base flex items-center gap-1.5 uppercase tracking-wide">
                <MessageSquare className="w-5 h-5 text-red-500" />
                Detalles del Despacho
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold bg-zinc-850 hover:bg-zinc-800 px-3 py-1.5 rounded-full transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSendOrder} className="space-y-4 text-xs font-semibold text-zinc-300">
              {/* Form: Name */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                  {orderType === 'local' ? 'Tu Nombre (Opcional)' : 'Tu Nombre *'}
                </label>
                <input
                  type="text"
                  required={orderType !== 'local'}
                  placeholder={orderType === 'local' ? "Ej: Tomás Carretero (Opcional)" : "Ej: Tomás Carretero"}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-650"
                />
              </div>

              {/* Form: Delivery Mode Selection */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-2">
                  ¿Cómo vas a consumir hoy? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'local', label: '🍽️ En Mesa', desc: 'Pedir con QR' },
                    { key: 'takeaway', label: '🛍️ Retirar', desc: 'Llevar a casa' },
                    { key: 'delivery', label: '🛵 Delivery', desc: 'Envío rápido' },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setOrderType(mode.key as any)}
                      className={`p-2.5 border rounded-xl flex flex-col items-center transition-all cursor-pointer ${
                        orderType === mode.key
                          ? 'border-red-650 bg-red-950/20 text-red-400'
                          : 'border-zinc-800 text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300'
                      }`}
                    >
                      <span className="font-extrabold text-[11px]">{mode.label}</span>
                      <span className="text-[8px] text-zinc-500 font-normal mt-1">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Table Selector */}
              {orderType === 'local' && (
                <div>
                  <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                    Número de Mesa *
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white cursor-pointer focus:ring-1 focus:ring-red-500 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => `Mesa ${i + 1}`).map((mesa) => (
                      <option key={mesa} className="bg-zinc-900" value={mesa}>
                        📍 {mesa}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Address */}
              {orderType === 'delivery' && (
                <div>
                  <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                    Dirección de Entrega *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Av. Pellegrini 1420, Piso 3A"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
                  />
                </div>
              )}

              {/* Contact phone */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                  Tu celular de Contacto (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 3415559876"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
                />
              </div>

              {/* Extra instructions */}
              <div>
                <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                  Aclaraciones / Adicionales
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Sin cebolla en la de Doble Cheddar, por favor..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none resize-none focus:ring-1 focus:ring-red-500 placeholder-zinc-650"
                />
              </div>

              {/* Account summary details */}
              <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Resumen de Cuenta</p>
                <div className="flex justify-between font-bold text-xs pt-1.5">
                  <span className="text-zinc-450">Subtotal de Compra:</span>
                  <span className="text-white text-sm font-black">{formatCurrency(cartTotal)}</span>
                </div>
                <p className="text-[9px] text-zinc-500 mt-1.5 italic">El costo de envío (si corresponde) se acuerda con el local.</p>
              </div>

              {/* WhatsApp dispatcher */}
              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <span>Enviar Pedido a WhatsApp</span>
                <MessageSquare className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== FIREBASE AUTH MODAL ==================== */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scale-up text-zinc-150">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-display font-black text-white text-sm flex items-center gap-1.5 uppercase">
                <Shield className="w-4 h-4 text-red-500" />
                Firebase Authentication Sincronización
              </h3>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-zinc-400 hover:text-white font-bold text-xs bg-zinc-850 px-3 py-1 rounded-full cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Class tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-xl mb-4">
              <button
                onClick={() => setAuthTab('login')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  authTab === 'login' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setAuthTab('register')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  authTab === 'register' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Nuevo Usuario
              </button>
            </div>

            {/* Google provider */}
            <button
              onClick={startGoogleSignIn}
              type="button"
              className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl font-bold text-xs text-zinc-200 flex items-center justify-center gap-2 mb-4 cursor-pointer transition-all active:scale-98 shadow-sm"
            >
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-serif text-sm italic font-extrabold shadow-sm">
                G
              </span>
              Sincronizar con cuenta de Google
            </button>

            <div className="relative text-center my-3.5">
              <span className="text-[9px] bg-[#141417] px-2.5 text-zinc-500 font-bold uppercase tracking-widest relative z-10">
                O ingresá de forma clásica
              </span>
              <div className="absolute top-1/2 inset-x-0 h-px bg-zinc-800 z-0"></div>
            </div>

            {/* Standard manual fields */}
            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmitted} className="space-y-3.5 text-xs font-semibold text-zinc-300">
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Email registrado
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-650"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-650"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer shadow-sm text-xs"
                >
                  Confirmar Ingreso
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmitted} className="space-y-3 text-xs font-semibold text-zinc-300">
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Tomás Bianchi"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tomas@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Número Celular (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 3415559876"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Definí tu clave de acceso"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer shadow-sm text-xs"
                >
                  Registrarse con Firebase
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== SIMULATED GMAIL POPUP (GOOGLE OAUTH) ==================== */}
      {googlePopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-scale-up text-zinc-100">
            {/* Header Google Identity Provider */}
            <div className="p-4 bg-[#1e1e24] border-b border-zinc-800 text-center relative">
              <div className="flex justify-center items-center gap-1.5 text-base font-extrabold">
                <span className="text-blue-500 font-serif font-black">G</span>
                <span className="text-red-500 font-serif font-black">o</span>
                <span className="text-yellow-500 font-serif font-black">o</span>
                <span className="text-blue-500 font-serif font-black">g</span>
                <span className="text-green-500 font-serif font-black">l</span>
                <span className="text-red-500 font-serif font-black">e</span>
                <span className="text-[10px] text-zinc-400 font-sans ml-1 font-bold">Sign-In</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5 font-bold">Acceder a <span className="text-red-500">{businessName}</span> con Gmail</p>
              
              {!googleProcessing && (
                <button
                  onClick={() => setGooglePopupOpen(false)}
                  className="absolute top-2.5 right-2.5 text-[10px] text-zinc-450 hover:text-white bg-zinc-800 p-1.5 rounded-full cursor-pointer font-bold border border-zinc-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* google accounts selector */}
            <div className="p-5">
              {googleProcessing ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-red-500 rounded-full animate-spin"></div>
                  <span className="text-xs font-black text-zinc-100 tracking-wider animate-pulse">Sincronizando OAuth...</span>
                  <span className="text-[9px] text-zinc-500">Verificando credenciales con Firebase Realtime...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                    Selecciona una Cuenta Gmail
                  </span>

                  {[
                    { email: 'elcarreterodelibres@gmail.com', name: 'Tomás Carretero (Usuario)' },
                    { email: 'cliente.gourmet@gmail.com', name: 'Laura Martínez' },
                    { email: 'invitado.express@gmail.com', name: 'Invitado Express' },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleGoogleAccountSelect(acc.email, acc.name)}
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-lg text-left flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="font-extrabold text-[11px] text-white block leading-tight truncate">
                          {acc.name}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 block truncate">
                          {acc.email}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                    </button>
                  ))}

                  {/* Manual add accounts */}
                  <div className="pt-2 border-t border-zinc-800/80 mt-2">
                    <button
                      onClick={() => handleGoogleAccountSelect('nuevo.cliente@gmail.com', 'Cliente Nuevo')}
                      className="w-full py-2 bg-zinc-850 hover:bg-zinc-800 rounded text-[9.5px] font-bold text-zinc-300 text-center cursor-pointer transition-colors border border-zinc-800"
                    >
                      ➕ Usar otra cuenta de Google
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details footer block */}
            <div className="bg-[#141417] p-3 text-[8px] text-zinc-500 text-center font-normal leading-relaxed border-t border-zinc-850">
              Google comparte de manera segura tu nombre, dirección de correo electrónico y foto de perfil con {businessName}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
