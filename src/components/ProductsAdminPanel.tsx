import React, { useState } from 'react';
import { Product, ProductIngredient, Ingredient } from '../types';
import { Plus, Edit2, Trash2, Check, X, Tag, DollarSign, Image as ImageIcon, Sparkles, Filter, Percent, Settings } from 'lucide-react';
import { getProductImage } from './CustomerMenu';

interface ProductsAdminPanelProps {
  products: Product[];
  setProducts: (updater: Product[] | ((prev: Product[]) => Product[])) => void;
  ingredients: Ingredient[];
}

const IMAGE_PRESETS = [
  { name: '🍔 Hamburguesa Clásica', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60' },
  { name: '🍟 Papas Fritas', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60' },
  { name: '🥤 Gaseosa Cola', url: 'https://images.unsplash.com/photo-1437419764061-2473afe69fc2?w=400&auto=format&fit=crop&q=60' },
  { name: '🍺 Cerveza Tirada', url: 'https://images.unsplash.com/photo-1436018626274-89acd67ae29e?w=400&auto=format&fit=crop&q=60' },
  { name: '🍕 Pizza Muzza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60' },
  { name: '🍩 Dona Glaseada', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=60' },
];

export default function ProductsAdminPanel({ products, setProducts, ingredients }: ProductsAdminPanelProps) {
  // Navigation categories
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
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Toast notifications state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'warning' | 'danger';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'danger' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Custom confirmation modal states
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{
    isOpen: boolean;
    type: 'product' | 'category';
    id: string;
    name: string;
    message: string;
  }>({
    isOpen: false,
    type: 'product',
    id: '',
    name: '',
    message: '',
  });

  const executeDelete = () => {
    const { type, id, name } = deleteConfirmInfo;
    if (type === 'product') {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`🗑️ El producto "${name}" fue removido con éxito del catálogo.`, 'success');
    } else if (type === 'category') {
      setProducts((prev) =>
        prev.map((p) => (p.category === id ? { ...p, category: 'General' } : p))
      );
      
      if (selectedCategory === id) {
        setSelectedCategory('Todos');
      }

      showToast(`🗑️ Categoría "${name}" eliminada y sus productos reubicados a "General".`, 'success');
    }
    setDeleteConfirmInfo((prev) => ({ ...prev, isOpen: false }));
  };

  // Category management modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [newCatName, setNewCatName] = useState<string>('');

  // Form states (Add or Edit)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Hamburguesas');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isUsingCustomCategory, setIsUsingCustomCategory] = useState<boolean>(false);
  
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  // Recipe assignment states
  const [recipeIngredients, setRecipeIngredients] = useState<ProductIngredient[]>([]);
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState<string>('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const resetForm = () => {
    setName('');
    setCategory('Hamburguesas');
    setCustomCategory('');
    setIsUsingCustomCategory(false);
    setPrice(0);
    setCost(0);
    setDescription('');
    setImageUrl('');
    setEditingId(null);
    setIsFormOpen(false);
    setRecipeIngredients([]);
    setSelectedIngredientToAdd(ingredients[0]?.id || '');
    setQuantityToAdd(1);
  };

  // Open Form for Adding
  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const openEditForm = (prod: Product) => {
    setName(prod.name);
    
    // Check if the product category is one of the defaults
    const defaultCategories = ['Hamburguesas', 'Minutas', 'Entradas', 'Acompañamientos', 'Guarniciones', 'Platos', 'Bebidas'];
    if (defaultCategories.includes(prod.category)) {
      setCategory(prod.category);
      setIsUsingCustomCategory(false);
    } else {
      setCategory('Otra');
      setCustomCategory(prod.category);
      setIsUsingCustomCategory(true);
    }

    setPrice(prod.price);
    setCost(prod.cost || 0);
    setDescription(prod.description);
    setImageUrl(prod.imageUrl || '');
    setEditingId(prod.id);
    setRecipeIngredients(prod.ingredientsRequired || []);
    setSelectedIngredientToAdd(ingredients[0]?.id || '');
    setQuantityToAdd(1);
    setIsFormOpen(true);
  };

  // Recipe helpers
  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientToAdd) {
      showToast('⚠️ Por favor selecciona un insumo de la lista para agregarlo.', 'warning');
      return;
    }
    
    // Check if duplicate
    if (recipeIngredients.some((ri) => ri.ingredientId === selectedIngredientToAdd)) {
      showToast('ℹ️ Este insumo ya está asignado a la receta del producto. Podés editar su porción en la lista de abajo.', 'info');
      return;
    }

    setRecipeIngredients((prev) => [
      ...prev,
      { ingredientId: selectedIngredientToAdd, quantity: Number(quantityToAdd) || 1 }
    ]);
  };

  const handleRemoveIngredientFromRecipe = (ingId: string) => {
    setRecipeIngredients((prev) => prev.filter((ri) => ri.ingredientId !== ingId));
  };

  const handleUpdateRecipeIngredientQty = (ingId: string, qty: number) => {
    setRecipeIngredients((prev) =>
      prev.map((ri) => (ri.ingredientId === ingId ? { ...ri, quantity: Number(qty) || 0 } : ri))
    );
  };

  const handleCalculateCostFromRecipe = () => {
    if (recipeIngredients.length === 0) {
      showToast('⚠️ Para calcular el costo, primero debés asociar insumos en la sección "Receta & Consumo" más abajo.', 'warning');
      return;
    }

    let calculatedCost = 0;
    recipeIngredients.forEach((ri) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      if (ing) {
        calculatedCost += ri.quantity * (ing.unitCost || 0);
      }
    });

    setCost(Math.round(calculatedCost));
    showToast(`🧮 Costo de producción calculado automáticamente: ${formatCurrency(calculatedCost)} en base a los insumos declarados.`, 'success');
  };

  // Submit action (Save or update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('⚠️ Por favor, completa el nombre del producto.', 'warning');
      return;
    }

    const finalCategory = isUsingCustomCategory 
      ? (customCategory.trim() || 'General') 
      : category;

    if (price <= 0) {
      showToast('⚠️ Por favor, ingresá un precio de venta mayor a $0.', 'warning');
      return;
    }

    const finalImageUrl = imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

    if (editingId) {
      // Update
      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: name.trim(),
                category: finalCategory,
                price: Number(price),
                cost: Number(cost),
                description: description.trim(),
                imageUrl: finalImageUrl,
                ingredientsRequired: recipeIngredients,
              }
            : item
        )
      );
      showToast('🍔 ¡Producto actualizado en el catálogo y disponible en los QR!', 'success');
    } else {
      // Create new
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        name: name.trim(),
        category: finalCategory,
        price: Number(price),
        cost: Number(cost),
        description: description.trim(),
        imageUrl: finalImageUrl,
        ingredientsRequired: recipeIngredients,
      };

      setProducts((prev) => [...prev, newProduct]);
      showToast('🎉 ¡Nuevo producto incorporado con éxito! Se sincronizó en tiempo real en los celulares vinculados.', 'success');
    }

    resetForm();
  };

  // Modify / Manage Categories
  const handleRenameCategory = (oldName: string) => {
    if (!renameValue.trim() || renameValue.trim() === oldName) {
      setEditingCategory(null);
      return;
    }
    
    const nextName = renameValue.trim();
    
    // Update all products with this category
    setProducts((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: nextName } : p))
    );

    // If active selected category was the old one, update it to the new name
    if (selectedCategory === oldName) {
      setSelectedCategory(nextName);
    }

    showToast(`🏷️ Se renombró la categoría "${oldName}" a "${nextName}" en todo tu menú.`, 'success');
    setEditingCategory(null);
    setRenameValue('');
  };

  const handleDeleteCategory = (catName: string) => {
    const productsInCat = products.filter((p) => p.category === catName);
    const count = productsInCat.length;

    const confirmMsg = count > 0 
      ? `¿Estás seguro de que querés eliminar la categoría "${catName}"? Se reasignarán automáticamente ${count} productos a la categoría "General".`
      : `¿Estás seguro de que querés eliminar la categoría "${catName}"?`;

    setDeleteConfirmInfo({
      isOpen: true,
      type: 'category',
      id: catName,
      name: catName,
      message: confirmMsg,
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const name = newCatName.trim();
    const exists = products.some((p) => p.category.toLowerCase() === name.toLowerCase());
    if (exists) {
      showToast('⚠️ Esta categoría ya existe en el menú.', 'warning');
      return;
    }

    // Create a draft product inside this newly declared category to persist it in NoSQL simulation
    const newProduct: Product = {
      id: `prod_cat_${Date.now()}`,
      name: `Primer plato de ${name}`,
      category: name,
      price: 1500,
      cost: 500,
      description: `Borrador inicial para la nueva categoría ${name}. Podés editar este producto o agregar más con normalidad.`,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    };

    setProducts((prev) => [...prev, newProduct]);
    showToast(`🎉 ¡Categoría "${name}" creada con éxito! Se agregó un producto borrador inicial.`, 'success');
    setNewCatName('');
    setSelectedCategory(name);
    setIsCategoryModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteConfirmInfo({
      isOpen: true,
      type: 'product',
      id: productId,
      name: productName,
      message: `¿Estás seguro de que querés eliminar "${productName}" del Menú Digital? Esta acción es irreversible y retirará el producto del catálogo activo inmediatamente.`,
    });
  };

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight font-sans">
            Administración del Menú Digital <span className="text-slate-405 dark:text-slate-500 font-normal">/ Catálogo y Precios</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Agrega nuevos platos, actualiza precios al instante por la inflación, modifica costos y controla lo que el cliente ve en el QR.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={openAddForm}
            className="px-4 py-2.5 bg-red-650 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-sm hover:bg-red-700 shadow-sm hover:shadow-red-200 dark:hover:shadow-red-950/35 transition-all flex items-center gap-2 cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4" /> Agregar Producto al Menú
          </button>
        </div>
      </header>

      {/* LISTING CONTAINER */}
      <div className="w-full space-y-4">
        
        {/* Categories Filters & Search Header */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-450 dark:text-slate-500" />
              <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Categorías del Menú:</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-xs font-bold transition-all cursor-pointer border border-red-200/40 dark:border-red-900/30"
            >
              <Settings className="w-3" /> Modificar
            </button>
          </div>
          
          <div className="flex flex-wrap gap-1.5 justify-start md:justify-end items-center font-sans">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-105 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" /> Modificar Categorías
            </button>
          </div>
        </div>

        {/* Grid of existing items in the menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const profit = prod.price - (prod.cost || 0);
            const margin = prod.price > 0 ? (profit / prod.price) * 100 : 0;
            
            return (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
                id={`prod-card-${prod.id}`}
              >
                <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 relative group overflow-hidden">
                  <img
                    src={prod.imageUrl || getProductImage(prod.id, prod.name, prod.category)}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/75 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Tag className="w-3 h-3 text-red-500 fill-red-500" />
                    {prod.category}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="mb-3">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{prod.name}</h3>
                      <span className="text-sm font-black text-slate-950 dark:text-amber-500 shrink-0">{formatCurrency(prod.price)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 h-8 overflow-hidden select-text">{prod.description}</p>
                  </div>

                  {/* Miniature ingredients recipe */}
                  {prod.ingredientsRequired && prod.ingredientsRequired.length > 0 && (
                    <div className="mt-1 mb-2 flex flex-wrap gap-1">
                      {prod.ingredientsRequired.map((req) => {
                        const ing = ingredients.find((i) => i.id === req.ingredientId);
                        if (!ing) return null;
                        return (
                          <span key={req.ingredientId} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/25 text-red-700 dark:text-red-400 rounded text-[9px] font-sans font-extrabold border border-red-100/30 dark:border-red-900/30">
                            {ing.name}: {req.quantity} {ing.unit}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Financial analysis inline summary block */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] mt-2">
                    <div>
                      <span className="text-slate-405 dark:text-slate-500 font-medium block uppercase tracking-wider text-[8px]">Insumos / Costo</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{formatCurrency(prod.cost || 0)}</span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-slate-405 dark:text-slate-500 font-medium block uppercase tracking-wider text-[8px]">Ganancia Estimada</span>
                      <span className="font-extrabold text-green-600 dark:text-green-400 font-sans">+{formatCurrency(profit)} ({margin.toFixed(0)}%)</span>
                    </div>
                  </div>

                  {/* Modification Action Buttons */}
                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 font-sans">
                    <button
                      onClick={() => openEditForm(prod)}
                      className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-950 dark:text-slate-350 dark:hover:text-white border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                      id={`btn-edit-${prod.id}`}
                    >
                      <Edit2 className="w-3 h-3" /> Editar Datos
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="p-1.5 bg-white hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900 text-slate-400 hover:text-red-650 hover:text-red-600 rounded-lg transition-all cursor-pointer"
                      id={`btn-del-${prod.id}`}
                      title="Eliminar del catálogo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE COMPOSITOR FORM MODAL OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-805 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-950 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500" />
                <h2 className="font-bold text-sm uppercase tracking-wider font-sans">
                  {editingId ? '✏️ Editar Producto' : '✨ Agregar Nuevo Producto'}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-white dark:bg-slate-900">
              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left">
                
                {/* Product Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 font-sans">Nombre Comercial:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Burguer Triple Cheddar Bacon"
                    className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                  />
                </div>

                {/* Categories Select Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 font-sans">Categoría:</label>
                  <div className="flex gap-2">
                    <select
                      value={isUsingCustomCategory ? 'Otra' : category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Otra') {
                          setIsUsingCustomCategory(true);
                        } else {
                          setIsUsingCustomCategory(false);
                          setCategory(val);
                        }
                      }}
                      className="flex-1 text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                    >
                      <option value="Hamburguesas">Hamburguesas</option>
                      <option value="Minutas">Minutas</option>
                      <option value="Entradas">Entradas</option>
                      <option value="Acompañamientos">Acompañamientos</option>
                      <option value="Guarniciones">Guarniciones</option>
                      <option value="Platos">Platos</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Otra">Otra (Crear Categoría...)</option>
                    </select>

                    {isUsingCustomCategory && (
                      <input
                        type="text"
                        placeholder="Ej. Postres"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="flex-1 text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-650 focus:outline-hidden"
                      />
                    )}
                  </div>
                </div>

                {/* Price and Cost Input fields in row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-0.5 font-sans">
                      <DollarSign className="w-3 h-3 text-green-650 text-green-500" /> Precio Venta ($):
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="9500"
                      className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-sans font-bold text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-0.5 font-sans" title="Costo estimado de la materia prima para calcular reportes financieros">
                      <Percent className="w-3 h-3 text-red-500" /> Costo Insumos ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cost || ''}
                      onChange={(e) => setCost(Number(e.target.value))}
                      placeholder="Efe. 3800"
                      className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-sans font-medium text-slate-705 dark:text-slate-350 rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Dynamic Profit preview indicator block */}
                {price > 0 && (
                  <div className={`p-2.5 rounded-lg border flex justify-between items-center text-[10px] ${
                    price - cost >= 0 
                      ? 'bg-emerald-55 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/35' 
                      : 'bg-red-50 dark:bg-red-955/20 text-red-800 dark:text-red-400 border-red-150 dark:border-red-900/35'
                  }`}>
                    <span>Ganancia Neta Calculada:</span>
                    <span className="font-black text-xs font-mono">
                      {formatCurrency(price - cost)} ({(((price - cost) / price) * 100).toFixed(0)}% de margen)
                    </span>
                  </div>
                )}

                 {/* RECIPE SECTOR (Asociación de Insumos) */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      📋 Receta & Descuento de Insumos
                    </span>
                    <span className="text-[9px] bg-red-105 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase font-sans">
                      Descuento Automático
                    </span>
                  </div>

                  {/* Add ingredient row */}
                  <div className="flex gap-1.5 items-end">
                    <div className="flex-1 min-w-0">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 font-sans">Elegir Insumo:</label>
                      <select
                        value={selectedIngredientToAdd}
                        onChange={(e) => setSelectedIngredientToAdd(e.target.value)}
                        className="w-full text-[11px] p-2 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-hidden font-sans"
                      >
                        <option value="">-- Seleccionar --</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                            {ing.name} ({ing.unit}) - Costo: {formatCurrency(ing.unitCost)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 font-sans">Cantidad:</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                        className="w-full text-[11px] p-2 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-hidden font-sans font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddIngredientToRecipe}
                      className="p-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 border dark:border-slate-700"
                      title="Agregar insumo a la receta"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List of active recipe ingredients */}
                  <div className="space-y-1.5 max-h-44 overflow-auto">
                    {recipeIngredients.length === 0 ? (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-2 italic font-sans font-medium">
                        No hay insumos vinculados. Creá una receta para que al vender este producto se descuenten de forma automática.
                      </p>
                    ) : (
                      recipeIngredients.map((ri) => {
                        const ing = ingredients.find((i) => i.id === ri.ingredientId);
                        if (!ing) return null;
                        
                        return (
                          <div key={ri.ingredientId} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-150 dark:border-slate-800 text-[10px] font-sans">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {ing.name}
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal block font-sans">
                                Costo unitario: {formatCurrency(ing.unitCost)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  value={ri.quantity}
                                  onChange={(e) => handleUpdateRecipeIngredientQty(ri.ingredientId, Number(e.target.value))}
                                  className="w-12 text-center p-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded font-bold text-[10px]"
                                />
                                <span className="text-slate-450 text-slate-400 text-[9px] font-medium">{ing.unit}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveIngredientFromRecipe(ri.ingredientId)}
                                className="p-1 text-slate-405 dark:text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Auto cost generator helper button */}
                  {recipeIngredients.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCalculateCostFromRecipe}
                      className="w-full mt-2 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] tracking-wide uppercase rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer font-sans"
                    >
                      🧮 Auto-calcular Costo Insumos (${
                        recipeIngredients.reduce((sum, ri) => {
                          const ing = ingredients.find((i) => i.id === ri.ingredientId);
                          return sum + (ri.quantity * (ing?.unitCost || 0));
                        }, 0).toFixed(0)
                      } total)
                    </button>
                  )}
                </div>

                {/* Description input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center justify-between font-sans">
                    <span>Descripción corta para el cliente:</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Doble smash, queso cheddar, cebolla caramelizada y salsa BigMac."
                    className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                  />
                </div>

                {/* Image URL input with food preset options */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center justify-between font-sans">
                    <span>Enlace o Foto del Plato (URL):</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 lowercase font-medium">Previsualización inmediata</span>
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash..."
                    className="w-full text-xs p-2.5 border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                  />

                  {/* Built-in high quality presets for non-designers */}
                  <div className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 font-sans">¿No tenés un link? Tocá una foto de nuestro catálogo:</div>
                  <div className="grid grid-cols-3 gap-1 mt-1 text-[9px] font-semibold text-slate-650">
                    {IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-1.5 border border-slate-200 dark:border-slate-800 rounded-md text-left truncate transition-colors cursor-pointer text-[8px] hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white ${
                          imageUrl === preset.url ? 'bg-red-50 border-red-301 text-red-600 dark:bg-red-955/20 dark:border-red-900/40 dark:text-red-400 hover:text-red-100 hover:bg-red-50 dark:hover:bg-red-955/20' : ''
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form submit/cancel buttons */}
                <div className="flex gap-2.5 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer font-sans"
                  >
                    Cerrar / Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-lg transition-all shadow-sm hover:shadow-red-500/10 cursor-pointer font-sans"
                  >
                    {editingId ? 'Guardar Cambios' : 'Ingresar al Menú'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management Dialog */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-905 bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex justify-between items-center border-b dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500 animate-spin-slow" />
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider">Modificar Categorías</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Renombrá o eliminá las categorías de tu Menú.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setNewCatName('');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-auto space-y-5 text-left bg-white dark:bg-slate-900">
              {/* Add New Category form section */}
              <form onSubmit={handleCreateCategory} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-205 dark:border-slate-850">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  ✨ Nueva Categoría
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Postres, Minutas, Cafetería..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Crear
                  </button>
                </div>
                <p className="text-[9px] text-slate-404 dark:text-slate-500 mt-1.5 leading-normal">
                  Sugerencia: Se creará un primer plato borrador en esta categoría para que puedas editarlo y fijar su precio.
                </p>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  🏷️ Categorías Disponibles
                </label>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  {categories
                    .filter((cat) => cat !== 'Todos')
                    .map((cat) => {
                      const productCount = products.filter((p) => p.category === cat).length;
                      const isEditing = editingCategory === cat;

                      return (
                        <div key={cat} className="p-3 flex items-center justify-between gap-3 text-sm">
                          {isEditing ? (
                            <div className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs border border-red-300 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-red-600"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameCategory(cat)}
                                className="p-1 px-2.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Listo
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategory(null)}
                                className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                                <span className="font-semibold text-slate-950 dark:text-white">{cat}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-full">
                                  {productCount} {productCount === 1 ? 'producto' : 'productos'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setRenameValue(cat);
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-950 dark:text-slate-405 dark:hover:text-white hover:bg-slate-150 rounded cursor-pointer transition-colors"
                                  title="Renombrar categoría"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer transition-colors"
                                  title="Eliminar categoría"
                                  disabled={cat === 'General'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-100 dark:border-slate-850 text-right">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setNewCatName('');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirmInfo.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs text-left animate-in fade-in duration-155 duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-200">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-red-200/30 dark:border-red-900/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                ¿Confirmar Eliminación?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-semibold">
                {deleteConfirmInfo.message}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-850 flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmInfo((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer shadow-xs hover:shadow-red-500/10"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Banner */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-[110] max-w-sm w-full bg-slate-900 dark:bg-slate-950 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm shrink-0">
              {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : toast.type === 'danger' ? '🚨' : 'ℹ️'}
            </span>
            <p className="text-xs font-bold leading-normal text-slate-100 truncate">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-[10px] text-slate-400 hover:text-white font-bold p-1 hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
