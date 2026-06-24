import React, { useState, useEffect, useRef } from 'react';
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
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { db } from '../lib/db';
import { useToast } from './ToastContext';

interface CustomerMenuProps {
  products: Product[];
  onOrderSubmitted: (newOrder: Order) => void;
  whatsappPhone: string;
  businessName: string;
  onGoToAdmin?: () => void;
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

export default function CustomerMenu({ products, onOrderSubmitted, whatsappPhone, businessName, onGoToAdmin }: CustomerMenuProps) {
  const toast = useToast();
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [lastWhatsAppLink, setLastWhatsAppLink] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Dressing Selection Modal State
  const [dressingProduct, setDressingProduct] = useState<Product | null>(null);
  const [dressingOptions, setDressingOptions] = useState<{[key: string]: boolean}>({
    'Mayonesa': true,
    'Ketchup': true,
    'Mostaza': true
  });

  // Side Dish Selection Modal State (for Category Platos)
  const [sideDishProduct, setSideDishProduct] = useState<Product | null>(null);
  const [selectedSideDishesMap, setSelectedSideDishesMap] = useState<{[key: string]: boolean}>({});

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
  // Customer choice fields (pre-filled if authenticated)
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'local' | 'takeaway'>('local');
  const [tableNumber, setTableNumber] = useState<string>('Mesa 4');
  const [customerContact, setCustomerContact] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Mercado Pago');

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

  // Dynamically auto-select mesa and local type if scanned from real QR URL query params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mesaParam = params.get('mesa');
      if (mesaParam) {
        const mesaNum = parseInt(mesaParam, 10);
        if (!isNaN(mesaNum)) {
          setTableNumber(`Mesa ${mesaNum}`);
          setOrderType('local');
        }
      }
    } catch (err) {
      console.error('Error auto-detecting table from URL:', err);
    }
  }, []);

  // Mouse drag scrolling state and handlers for categories carousel
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // multiplier for scrolling speed
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

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
      toast.warning('Por favor, completa todos los campos requeridos.');
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
    toast.success(`¡Registro exitoso! Bienvenido ${newUser.displayName}. Tus datos se guardaron para compras más rápidas.`);
  };

  const handleLoginSubmitted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      toast.warning('Por favor, ingresa tu email y contraseña.');
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
      toast.success(`¡Sesión iniciada con éxito! Bienvenido nuevamente, ${found.displayName}.`);
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
      toast.success(`¡Iniciaste sesión correctamente! Se ha creado un perfil Firebase con tu correo ${generatedUser.email}.`);
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Seguro que querés cerrar sesión?')) {
      db.clearCurrentUser();
      setCurrentUser(null);
      toast.success('Sesión cerrada correctamente.');
    }
  };

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

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCartItemUnitPrice = (item: CartItem): number => {
    let price = item.product.price;
    if (item.selectedSideDishes && item.selectedSideDishes.length > 1) {
      const sortedExtras = [...item.selectedSideDishes].sort((a, b) => b.price - a.price);
      const extraPrice = sortedExtras.slice(1).reduce((acc, curr) => acc + curr.price, 0);
      price += extraPrice;
    }
    return price;
  };

  const getCartItemUnitCost = (item: CartItem): number => {
    let cost = item.product.cost;
    if (item.selectedSideDishes && item.selectedSideDishes.length > 0) {
      const sideDishesCost = item.selectedSideDishes.reduce((acc, curr) => acc + curr.cost, 0);
      cost += sideDishesCost;
    }
    return cost;
  };

  const cartTotal = cart.reduce((acc, curr) => acc + getCartItemUnitPrice(curr) * curr.quantity, 0);
  const cartCost = cart.reduce((acc, curr) => acc + getCartItemUnitCost(curr) * curr.quantity, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const addToCart = (product: Product, selectedDressings?: string[]) => {
    setCart((prev) => {
      const dressingsKey = JSON.stringify(selectedDressings || []);
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedDressings || []) === dressingsKey
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedDressings || []) === dressingsKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedDressings }];
    });
  };

  const addPlateToCart = (product: Product, sideDishes: { id: string; name: string; price: number; cost: number }[]) => {
    setCart((prev) => {
      const sideDishesKey = JSON.stringify(sideDishes.map(d => d.id).sort() || []);
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify((item.selectedSideDishes || []).map(d => d.id).sort()) === sideDishesKey
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          JSON.stringify((item.selectedSideDishes || []).map(d => d.id).sort()) === sideDishesKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedSideDishes: sideDishes }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      // Find items matched to productId
      const matches = prev.filter((item) => item.product.id === productId);
      if (matches.length === 0) return prev;
      
      // Target the last added item to increment/decrement
      const target = matches[matches.length - 1];
      const targetDressingsKey = JSON.stringify(target.selectedDressings || []);
      const targetSideDishesKey = JSON.stringify((target.selectedSideDishes || []).map(d => d.id).sort());

      return prev
        .map((item) =>
          item.product.id === productId &&
          JSON.stringify(item.selectedDressings || []) === targetDressingsKey &&
          JSON.stringify((item.selectedSideDishes || []).map(d => d.id).sort()) === targetSideDishesKey
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddToCartClick = (p: Product) => {
    if (p.category === 'Hamburguesas' || p.category === 'Minutas') {
      setDressingProduct(p);
      setDressingOptions({
        'Mayonesa': true,
        'Ketchup': true,
        'Mostaza': true
      });
    } else if (p.category === 'Platos') {
      setSideDishProduct(p);
      // Auto-select the first available side dish!
      const availableGuarniciones = products.filter(g => g.category === 'Guarniciones');
      if (availableGuarniciones.length > 0) {
        setSelectedSideDishesMap({
          [availableGuarniciones[0].id]: true
        });
      } else {
        setSelectedSideDishesMap({});
      }
    } else {
      addToCart(p, []);
    }
  };

  const confirmAddWithDressings = () => {
    if (!dressingProduct) return;
    const selected = Object.entries(dressingOptions)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);
    addToCart(dressingProduct, selected);
    setDressingProduct(null);
  };

  const confirmAddWithSideDishes = () => {
    if (!sideDishProduct) return;
    
    // Find all items selected
    const selectedList = Object.entries(selectedSideDishesMap)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => products.find(p => p.id === id))
      .filter((p): p is Product => !!p)
      .map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        cost: p.cost
      }));
      
    if (selectedList.length === 0) {
      toast.warning('Por favor, seleccioná al menos 1 guarnición para tu plato.');
      return;
    }
    
    addPlateToCart(sideDishProduct, selectedList);
    setSideDishProduct(null);
  };

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderType !== 'local' && !customerName.trim()) {
      toast.warning('Por favor ingresá tu nombre para identificar el pedido.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      toast.warning('Por favor especificá la dirección de envío.');
      return;
    }

    const orderId = `#QR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderItems = cart.map((it) => {
      const dressingsStr = it.selectedDressings && it.selectedDressings.length > 0
        ? ` (Aderezos: ${it.selectedDressings.join(', ')})`
        : '';
      const sideDishesStr = it.selectedSideDishes && it.selectedSideDishes.length > 0
        ? ` (Guarnición: ${it.selectedSideDishes.map(d => d.name).join(', ')})`
        : '';
      return {
        productId: it.product.id,
        productName: `${it.product.name}${dressingsStr}${sideDishesStr}`,
        quantity: it.quantity,
        price: getCartItemUnitPrice(it),
        cost: getCartItemUnitCost(it),
      };
    });

    const finalCustomerName = customerName.trim() || `Mesa ${tableNumber.replace(/^\D+/g, '') || tableNumber}`;

    const costOfDelivery = orderType === 'delivery' ? 1200 : 0;

    const finalOrder: Order = {
      id: orderId,
      customerName: `${finalCustomerName} ${orderType === 'local' ? `(${tableNumber})` : ''}`,
      items: newOrderItems,
      totalPrice: cartTotal + costOfDelivery,
      totalCost: cartCost,
      netProfit: (cartTotal + costOfDelivery) - cartCost,
      createdAt: new Date().toISOString(),
      status: 'pending',
      viaWhatsApp: true,
      orderType,
      customerContact: customerContact || undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      notes: orderNotes.trim() || undefined,
      paymentMethod: orderType === 'local' ? 'Pago al finalizar' : paymentMethod,
      deliveryCost: costOfDelivery || undefined,
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
    if (orderType === 'local') {
      text += `💳 *Método de Pago:* Consumo en Mesa (Se pide la cuenta al final) 🍽️\n`;
    } else {
      text += `💳 *Método de Pago:* ${paymentMethod}\n`;
    }
    if (orderNotes.trim()) {
      text += `✍️ *Aclaraciones:* _"${orderNotes}"_\n`;
    }
    text += `------------------------------------------\n\n`;
    text += `🛍️ *PRODUCTOS SELECCIONADOS:*\n`;

    cart.forEach((it) => {
      const dressingsStr = it.selectedDressings && it.selectedDressings.length > 0
        ? `\n   └ _Aderezos: ${it.selectedDressings.join(', ')}_`
        : '';
      const sideDishesStr = it.selectedSideDishes && it.selectedSideDishes.length > 0
        ? `\n   └ _Guarnición: ${it.selectedSideDishes.map(d => d.name).join(', ')}_`
        : '';
      const customUnitPrice = getCartItemUnitPrice(it);
      text += `• *${it.quantity}x* ${it.product.name} ${dressingsStr}${sideDishesStr} (${formatCurrency(customUnitPrice * it.quantity)})\n`;
    });

    if (costOfDelivery > 0) {
      text += `🛵 *Costo de Envío:* ${formatCurrency(costOfDelivery)}\n`;
    }
    text += `\n💰 *Total del Pedido:* ${formatCurrency(cartTotal + costOfDelivery)}\n`;
    text += `------------------------------------------\n`;
    text += `💬 Enviar este mensaje para iniciar la preparación en cocina.`;

    onOrderSubmitted(finalOrder);

    const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappPhone}&text=${encodeURIComponent(text)}`;
    window.open(whatsappLink, '_blank');

    setCart([]);
    setIsCheckoutOpen(false);
    setSubmittedOrder(finalOrder);
    setLastWhatsAppLink(whatsappLink);
    toast.success('🎉 ¡Pedido enviado! Se abrió WhatsApp para enviar el mensaje de confirmación.');
  };

  if (submittedOrder) {
    return (
      <div className="w-full min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center p-4 font-sans text-zinc-150 animate-fade-in animate-scale-up">
        <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
          
          {/* Header Accent */}
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />
          
          <div className="p-6 flex flex-col items-center text-center">
            {/* Green Animated Success Check icon */}
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-4 animate-scale-up">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
              ¡Pedido Enviado!
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium max-w-xs">
              Tu orden ha sido registrada en la cocina de <span className="text-emerald-400 font-bold">{businessName}</span> y se abrió WhatsApp para su formalización.
            </p>

            {/* Receipt Box */}
            <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 mt-6 text-left space-y-4 font-sans text-xs">
              
              {/* Order Metadata */}
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800/80">
                <div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">ID de Pedido</span>
                  <span className="font-mono text-xs text-white font-extrabold">{submittedOrder.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Modalidad</span>
                  <span className="font-bold text-white text-xs bg-zinc-850 px-2 py-0.5 rounded-full border border-zinc-800">
                    {submittedOrder.orderType === 'delivery' 
                      ? '🛵 Envío' 
                      : submittedOrder.orderType === 'local' 
                        ? '🍽️ Mesa' 
                        : '🛍️ Retiro'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Detalle de Productos</span>
                {submittedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-zinc-200 truncate">
                        <span className="text-emerald-400 font-extrabold font-mono mr-1">{it.quantity}x</span> {it.productName || 'Producto'}
                      </p>
                    </div>
                    <span className="font-mono text-zinc-300 font-bold ml-3">{formatCurrency(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery cost & Total */}
              <div className="pt-2.5 border-t border-zinc-800/80 space-y-1.5">
                {submittedOrder.deliveryCost ? (
                  <div className="flex justify-between text-zinc-400 font-semibold">
                    <span>Costo de Envío:</span>
                    <span className="font-mono">{formatCurrency(submittedOrder.deliveryCost)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-sm font-black text-white pt-1">
                  <span>Total:</span>
                  <span className="font-mono text-emerald-400 text-base">{formatCurrency(submittedOrder.totalPrice)}</span>
                </div>
              </div>

              {/* Payment notification message */}
              {submittedOrder.orderType === 'local' ? (
                <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg flex items-start gap-2">
                  <span className="text-amber-400 text-sm">🍽️</span>
                  <p className="text-[10px] text-amber-300 font-semibold leading-relaxed">
                    Comé tranquilo. Podés pedirle la cuenta directamente al mozo cuando finalices de consumir en la mesa.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-zinc-850/60 border border-zinc-800 rounded-lg flex items-start gap-2">
                  <span className="text-zinc-400 text-sm">💳</span>
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                    Método de Pago Seleccionado: <strong className="text-zinc-200">{submittedOrder.paymentMethod}</strong>. Coordiná el pago final en el chat de WhatsApp que se ha abierto.
                  </p>
                </div>
              )}
            </div>

            {/* Help/Instruction */}
            {lastWhatsAppLink && (
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-bold">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                <span>¿No se abrió WhatsApp?</span>
                <button 
                  onClick={() => {
                    window.open(lastWhatsAppLink, '_blank');
                  }}
                  className="text-emerald-400 hover:underline cursor-pointer font-bold bg-transparent border-none p-0"
                >
                  Reabrir Chat de WhatsApp
                </button>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setSubmittedOrder(null)}
              className="w-full mt-6 py-3 px-4 bg-red-650 bg-red-600 hover:bg-red-500 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Volver al Menú Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#121212] flex flex-col font-sans text-zinc-150 relative">
      
      {/* 1. FIXED & COMPACT NAVBAR (Cabecera Optimizada) */}
      <header className="sticky top-0 bg-[#0d0d0f]/90 backdrop-blur-md z-40 border-b border-zinc-850 h-14 md:h-16 flex items-center justify-between px-4 md:px-8 shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          {/* Brand logo custom representation display */}
          <div className="w-8 h-8 rounded-lg bg-red-650 bg-red-650 flex items-center justify-center text-white font-display font-black text-lg animate-pulse shadow-sm">
            <Flame className="w-5 h-5 animate-bounce fill-white/10" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm md:text-lg font-display font-black tracking-tight text-white select-none uppercase">
                {businessName}
              </span>
              <span className="hidden sm:inline bg-zinc-800 text-[8px] tracking-widest px-1.5 py-0.5 rounded text-red-500 font-extrabold border border-zinc-700 uppercase">
                Gourmet
              </span>
            </div>
            <span className="text-[9px] font-bold text-red-500 tracking-wider uppercase leading-none mt-0.5">
              Lo de julia
            </span>
          </div>
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
                    <p className="text-xs text-zinc-400 font-bold">¡Registrate con nosotros!</p>
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
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar hamburguesa, papas, bebidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059] text-white placeholder-zinc-500 transition-all focus:border-[#C5A059]"
          />
        </div>

        {/* Categories Carousel - Rounded Pills with mobile touch scroll */}
        <div className="relative w-full max-w-4xl mx-auto overflow-hidden px-1 mb-2">
          {/* Subtle fade edges for overflow indicators */}
          <div className="absolute left-0 top-0 bottom-3 w-6 bg-gradient-to-r from-[#121212] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-3 w-6 bg-gradient-to-l from-[#121212] to-transparent pointer-events-none z-10" />

          <div
            ref={categoriesRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-2 overflow-x-auto pb-3 pt-1 px-4 scrollbar-none w-full justify-start lg:justify-center select-none whitespace-nowrap active:cursor-grabbing cursor-grab"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-[#C5A059] border-[#C5A059] text-[#121212] shadow-md shadow-[#C5A059]/20 scale-[1.02] font-extrabold'
                    : 'bg-[#1E1E1E] border-[#2A2A2A] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MENU ITEMS CONTAINER (Ultra Adaptive Redesigned Grid) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 pb-28">
        
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 max-w-sm mx-auto">
            <p className="text-sm font-semibold">No se encontraron delicias con estos filtros.</p>
            <p className="text-xs mt-1 text-zinc-600">Probá borrando el texto de la barra de búsqueda o eligiendo otra sección del menú.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const qtyInCart = cart.find((i) => i.product.id === p.id)?.quantity || 0;
              const prodImg = p.imageUrl || getProductImage(p.id, p.name, p.category);

              return (
                <div 
                  key={p.id}
                  className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] hover:border-[#C5A059]/40 transition-all duration-300 shadow-lg group overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-black/65"
                  id={`customer-item-${p.id}`}
                >
                  {/* Image Container */}
                  <div className="w-full h-24 sm:h-36 md:h-48 lg:h-52 relative overflow-hidden shrink-0 bg-zinc-900 border-b border-zinc-850/40">
                    <img 
                      src={prodImg} 
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        const cat = p.category.toLowerCase();
                        if (cat.includes('bebida')) {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&h=600&q=80';
                        } else if (cat.includes('acompañamiento') || cat.includes('papas')) {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&h=600&q=80';
                        } else {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=600&q=80';
                        }
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
                      <span className="inline-block md:hidden text-[8px] font-black text-[#C5A059] uppercase tracking-widest">
                        {p.category}
                      </span>
                      <h3 className="text-[#F5F5F5] font-display font-extrabold text-[11px] sm:text-base leading-tight mt-0.5 md:mt-0 group-hover:text-[#C5A059] transition-colors line-clamp-1" title={p.name}>
                        {p.name}
                      </h3>
                      <p className="text-[#A0A0A0] font-sans text-[10px] sm:text-xs mt-1 md:mt-2 line-clamp-2 md:line-clamp-3 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-800/40 gap-1.5">
                      {/* Price with deep aesthetic gold contrast */}
                      <span className="font-display font-bold text-xs sm:text-base md:text-lg text-[#C5A059] whitespace-nowrap">
                        {formatCurrency(p.price)}
                      </span>

                      {/* Add block */}
                      <div className="shrink-0">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-0.5 select-none">
                            <button
                              onClick={() => updateQuantity(p.id, -1)}
                              className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/25 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <span className="px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-bold text-white">{qtyInCart}</span>
                            <button
                              onClick={() => updateQuantity(p.id, 1)}
                              className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059]/25 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCartClick(p)}
                            className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#C5A059] hover:bg-[#b08d4b] text-[#121212] rounded-xl text-[10px] sm:text-xs font-bold tracking-wide flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#121212]" />
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

      {/* Discrete Footer with Admin Lock */}
      <footer className="mt-auto py-10 border-t border-zinc-900 bg-[#0c0c0f] text-center text-zinc-600 font-sans text-[11px] select-none pb-24">
        <p className="font-bold text-zinc-500 uppercase tracking-widest mb-1">
          {businessName} • Carta Digital QR
        </p>
        <p className="font-medium text-zinc-650 text-zinc-500">
          Desarrollado con sincronización en tiempo real. Todos los derechos reservados.
        </p>
        {onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="mt-4 px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-850 hover:text-zinc-400 border border-zinc-850 hover:border-zinc-800 text-zinc-500 rounded-md transition-all font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95 text-[9px] uppercase tracking-wider"
          >
            <Lock className="w-2.5 h-2.5 text-zinc-550" /> Acceso Administración
          </button>
        )}
      </footer>

      {/* 4. PERSISTENT FLOATING BASKET PANEL */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0d0d0f]/95 backdrop-blur-md p-4 md:py-5 border-t border-zinc-850 flex items-center justify-center z-40 shadow-2xl">
          <div className="max-w-3xl w-full flex items-center justify-between gap-6 px-2 md:px-4">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                Mi Canasta
              </p>
              <p className="text-lg md:text-xl font-display font-black text-[#F5F5F5] mt-0.5">
                {formatCurrency(cartTotal)}
              </p>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-6 py-3 bg-[#C5A059] hover:bg-[#b08d4b] text-[#121212] rounded-xl text-xs font-extrabold tracking-wide flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C5A059]/25 transition-all hover:shadow-xl hover:shadow-black/35"
            >
              <span>Generar Pedido</span>
              <ArrowRight className="w-4 h-4 animate-pulse text-[#121212]" />
            </button>
          </div>
        </div>
      )}

      {/* 5. REDESIGNED CHECKOUT MODAL FRAME */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl w-full max-w-md p-5 shadow-2xl max-h-[90%] overflow-auto text-zinc-150 scrollbar-thin">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4">
              <h3 className="font-display font-black text-white text-base flex items-center gap-1.5 uppercase tracking-wide">
                <MessageSquare className="w-5 h-5 text-[#C5A059]" />
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
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-zinc-500"
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
                          ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059]'
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
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white cursor-pointer focus:ring-1 focus:ring-[#C5A059] focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-zinc-600"
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
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#C5A059] placeholder-zinc-600"
                />
              </div>

              {/* Payment Method */}
              {orderType === 'local' ? (
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm shrink-0">
                    🍽️
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-zinc-200">
                      ¡Comés primero, pagás al final!
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
                      Pedí lo que quieras. Podés solicitar la cuenta directamente al mozo cuando termines de comer.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-zinc-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                    Método de Pago Preferido *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mercado Pago', 'Efectivo', 'Tarjeta'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#C5A059] font-bold shadow-md shadow-black/40'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {method === 'Mercado Pago' ? '📱 MP' : method === 'Efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none resize-none focus:ring-1 focus:ring-[#C5A059] placeholder-zinc-500"
                />
              </div>

              {/* Account summary details with full interactive list of chosen items */}
              <div className="bg-[#1E1E1E] p-3.5 rounded-xl border border-[#2A2A2A] space-y-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1">
                  Resumen de Cuenta
                </p>
                <div className="max-h-28 overflow-y-auto divide-y divide-zinc-800/40 pr-1 space-y-2">
                  {cart.map((it, idx) => {
                    const customUnitPrice = getCartItemUnitPrice(it);
                    return (
                      <div key={idx} className="pt-2 flex justify-between items-start gap-2 text-[11px]">
                        <div className="flex-1">
                          <p className="text-zinc-200 font-extrabold font-sans">
                            {it.quantity}x {it.product.name}
                          </p>
                          {it.selectedDressings && it.selectedDressings.length > 0 && (
                            <p className="text-[10px] text-[#C5A059] font-medium pl-1 mt-0.5">
                              Aderezos: {it.selectedDressings.join(', ')}
                            </p>
                          )}
                          {it.selectedSideDishes && it.selectedSideDishes.length > 0 && (
                            <p className="text-[10px] text-[#C5A059] font-semibold pl-1 mt-0.5">
                              Guarnición: {it.selectedSideDishes.map(d => d.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="text-zinc-400 font-mono">
                          {formatCurrency(customUnitPrice * it.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1 pt-2 border-t border-zinc-800/60 font-sans text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-zinc-400">Subtotal de Compra:</span>
                    <span className="text-zinc-200 font-mono">{formatCurrency(cartTotal)}</span>
                  </div>
                  {orderType === 'delivery' && (
                    <div className="flex justify-between font-medium text-[#C5A059]">
                      <span>Costo de Envío:</span>
                      <span className="font-mono">{formatCurrency(1200)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-2.5 border-t border-zinc-850">
                    <span className="text-zinc-200">Total a Pagar:</span>
                    <span className="text-[#C5A059] font-bold">{formatCurrency(cartTotal + (orderType === 'delivery' ? 1200 : 0))}</span>
                  </div>
                </div>
                {orderType === 'delivery' && (
                  <p className="text-[9px] text-zinc-500 italic mt-1 leading-relaxed">El total ya incluye el costo de envío tarifado para entregas a domicilio.</p>
                )}
              </div>

              {/* WhatsApp dispatcher */}
              <button
                type="submit"
                className="w-full py-3 bg-[#C5A059] hover:bg-[#b08d4b] text-[#121212] rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <span>Enviar Pedido a WhatsApp</span>
                <MessageSquare className="w-4 h-4 text-[#121212]" />
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

      {/* ==================== DRESSING SELECTION MODAL ==================== */}
      {dressingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl w-full max-w-sm p-5 shadow-2xl animate-scale-up text-zinc-150">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4 font-sans">
              <h3 className="font-display font-black text-white text-sm flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4 text-[#C5A059] animate-pulse" />
                Personalizar {dressingProduct.name}
              </h3>
              <button
                onClick={() => setDressingProduct(null)}
                className="text-zinc-400 hover:text-white font-bold text-xs bg-zinc-850 px-3 py-1 rounded-full cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 font-medium mb-4 leading-relaxed font-sans">
              Selecciona qué aderezos te gustaría sumarle a tu pedido:
            </p>

            <div className="space-y-2.5 mb-5 font-sans">
              {Object.keys(dressingOptions).map((optionName) => (
                <label
                  key={optionName}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    dressingOptions[optionName]
                      ? 'bg-[#C5A059]/10 border-[#C5A059]/30 text-white'
                      : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-sans">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      dressingOptions[optionName]
                        ? 'bg-[#C5A059] border-[#C5A059] text-[#121212]'
                        : 'border-zinc-700 bg-zinc-850'
                    }`}>
                      {dressingOptions[optionName] && <Check className="w-3 h-3 stroke-[3] text-[#121212]" />}
                    </div>
                    <span className="text-[12px] font-extrabold">{optionName}</span>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={dressingOptions[optionName]}
                    onChange={(e) => setDressingOptions(prev => ({
                      ...prev,
                      [optionName]: e.target.checked
                    }))}
                  />
                </label>
              ))}
            </div>

            <button
              onClick={confirmAddWithDressings}
              className="w-full py-3 bg-[#C5A059] hover:bg-[#b08d4b] text-[#121212] font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95"
            >
              <span>Añadir a la Canasta</span>
              <Plus className="w-4 h-4 text-[#121212]" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== PLATE SIDE-DISH SELECTION MODAL ==================== */}
      {sideDishProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl w-full max-w-sm p-5 shadow-2xl animate-scale-up text-zinc-150">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4 font-sans">
              <h3 className="font-display font-black text-white text-sm flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4 text-[#C5A059] animate-pulse" />
                Personalizar {sideDishProduct.name}
              </h3>
              <button
                onClick={() => setSideDishProduct(null)}
                className="text-zinc-400 hover:text-white font-bold text-xs bg-zinc-850 px-3 py-1 rounded-full cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 font-medium mb-4 leading-relaxed font-sans">
              Elegí **1 o más guarniciones** para tu plato. La primera guarnición ya está **incluida gratis** en el valor del plato. Las adicionales se suman al precio base.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2.5 mb-5 pr-1 select-none font-sans">
              {products.filter(g => g.category === 'Guarniciones').map((guarnicion) => {
                const isSelected = !!selectedSideDishesMap[guarnicion.id];
                
                // Determine price label dynamically
                const selectedGuarniciones = products.filter(g => g.category === 'Guarniciones' && selectedSideDishesMap[g.id]);
                const sortedSelected = [...selectedGuarniciones].sort((a, b) => b.price - a.price);
                const freeGuarnicionId = sortedSelected.length > 0 ? sortedSelected[0].id : null;
                
                let priceLabel = '';
                if (isSelected) {
                  if (guarnicion.id === freeGuarnicionId) {
                    priceLabel = '🔥 Incluida (Gratis)';
                  } else {
                    priceLabel = `+ ${formatCurrency(guarnicion.price)}`;
                  }
                } else {
                  priceLabel = formatCurrency(guarnicion.price);
                }

                return (
                  <label
                    key={guarnicion.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#C5A059]/10 border-[#C5A059]/30 text-white'
                        : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-sans">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#C5A059] border-[#C5A059] text-[#121212]'
                          : 'border-zinc-700 bg-zinc-850'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3] text-[#121212]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-extrabold">{guarnicion.name}</span>
                        {guarnicion.description && (
                          <span className="text-[9px] text-zinc-500 font-medium line-clamp-1">{guarnicion.description}</span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isSelected && guarnicion.id === freeGuarnicionId
                        ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/25'
                        : isSelected
                        ? 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/25'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {priceLabel}
                    </span>

                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={(e) => {
                        setSelectedSideDishesMap(prev => {
                          const updated = {
                            ...prev,
                            [guarnicion.id]: e.target.checked
                          };
                          return updated;
                        });
                      }}
                    />
                  </label>
                );
              })}
            </div>

            {/* Price Preview */}
            <div className="mb-4 bg-zinc-900/60 border border-zinc-850/60 p-3 rounded-xl flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-bold font-sans">Precio Total del Plato:</span>
              <span className="text-white font-mono font-black text-sm">
                {(() => {
                  const selectedGuarniciones = products.filter(g => g.category === 'Guarniciones' && selectedSideDishesMap[g.id]);
                  const sortedSelected = [...selectedGuarniciones].sort((a, b) => b.price - a.price);
                  const additionalCost = sortedSelected.slice(1).reduce((sum, g) => sum + g.price, 0);
                  return formatCurrency(sideDishProduct.price + additionalCost);
                })()}
              </span>
            </div>

            <button
              onClick={confirmAddWithSideDishes}
              className="w-full py-3 bg-[#C5A059] hover:bg-[#b08d4b] text-[#121212] font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95"
            >
              <span>Añadir a la Canasta</span>
              <Plus className="w-4 h-4 text-[#121212]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
