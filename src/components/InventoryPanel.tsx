import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Settings, ShieldAlert, BadgePlus, RefreshCcw, Landmark, DollarSign, Plus, Edit2, Trash2, X } from 'lucide-react';

interface InventoryPanelProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

export default function InventoryPanel({ ingredients, setIngredients }: InventoryPanelProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(50);

  // Add/Edit Insumo modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Category and search select states
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('u.');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [targetStock, setTargetStock] = useState<number>(100);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [category, setCategory] = useState<string>('Varios');

  const openEditModal = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setName(ing.name);
    setUnit(ing.unit);
    setCurrentStock(ing.currentStock);
    setMinStock(ing.minStock);
    setTargetStock(ing.targetStock);
    setUnitCost(ing.unitCost);
    setCategory(ing.category || 'Varios');
    setIsFormOpen(true);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el insumo "${name}"?\nEsta acción es irreversible.`)) {
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
      alert(`🗑️ Insumo "${name}" eliminado.`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const ingredientData = {
      name: name.trim(),
      unit: unit.trim(),
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      targetStock: Number(targetStock),
      unitCost: Number(unitCost),
      category: category.trim() || 'Varios',
    };

    if (editingIngredient) {
      setIngredients((prev) =>
        prev.map((ing) =>
          ing.id === editingIngredient.id ? { ...ing, ...ingredientData } : ing
        )
      );
      alert(`📋 Insumo "${ingredientData.name}" editado con éxito.`);
    } else {
      const newIng: Ingredient = {
        id: `ing_${Date.now()}`,
        ...ingredientData,
      };
      setIngredients((prev) => [...prev, newIng]);
      alert(`🎉 Insumo "${ingredientData.name}" creado con éxito.`);
    }

    resetForm();
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingIngredient(null);
    setName('');
    setUnit('u.');
    setCurrentStock(0);
    setMinStock(10);
    setTargetStock(100);
    setUnitCost(0);
    setCategory('Varios');
  };

  // Quick increment/decrement
  const changeStockValue = (ingId: string, amount: number) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === ingId) {
          const newVal = Math.max(0, ing.currentStock + amount);
          return { ...ing, currentStock: newVal };
        }
        return ing;
      })
    );
  };

  // Restock form submit
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient) return;
    
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === selectedIngredient.id) {
          return { ...ing, currentStock: ing.currentStock + restockAmount };
        }
        return ing;
      })
    );
    
    alert(`Se agregaron ${restockAmount} ${selectedIngredient.unit} de stock a "${selectedIngredient.name}".`);
    setSelectedIngredient(null);
  };

  const getStockStatus = (ing: Ingredient) => {
    if (ing.currentStock <= ing.minStock) {
      return { label: 'CRÍTICO', colorClass: 'bg-red-500', textClass: 'text-red-600', borderClass: 'border-red-100 bg-red-50' };
    }
    if (ing.currentStock <= ing.minStock * 1.5) {
      return { label: 'ADVERTENCIA', colorClass: 'bg-orange-500', textClass: 'text-orange-600', borderClass: 'border-orange-100 bg-orange-50' };
    }
    return { label: 'SEGURO', colorClass: 'bg-green-500', textClass: 'text-green-600', borderClass: 'border-slate-100 bg-white' };
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const categoriesList = ['Todos', ...Array.from(new Set(ingredients.map((i) => i.category || 'Varios')))];

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesCategory = selectedInventoryCategory === 'Todos' || (ing.category || 'Varios') === selectedInventoryCategory;
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">Control de Inventario e Insumos Críticos</h2>
        <p className="text-xs text-slate-500 mt-1">
          Llevá control en tiempo real de los ingredientes antes de cocinar para evitar quiebres de servicio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients progress list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-150 pb-3 gap-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              Estado del Stock Físico
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingIngredient(null);
                setName('');
                setUnit('u.');
                setCurrentStock(0);
                setMinStock(10);
                setTargetStock(100);
                setUnitCost(0);
                setCategory('Varios');
                setIsFormOpen(true);
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Insumo
            </button>
          </div>

          {/* Filtering and Search Controls bar */}
          <div className="space-y-3">
            {/* Search Input bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar insumo por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-sans px-3.5 py-2 border border-slate-250 bg-slate-50 hover:bg-slate-100/50 rounded-lg focus:bg-white focus:outline-hidden transition-all placeholder-slate-400 font-medium text-slate-850"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-405 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category selection horizontal list */}
            <div className="flex flex-wrap gap-1 items-center pb-1">
              <span className="text-[10px] font-sans font-extrabold text-slate-400 uppercase mr-1">
                Filtrar:
              </span>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedInventoryCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer font-sans border ${
                    selectedInventoryCategory === cat
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-205 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-10 font-sans">
                <span className="text-3xl">📦</span>
                <p className="text-xs text-slate-450 text-slate-500 font-bold mt-2">No se encontraron insumos</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Probá cambiando el filtro de categoría o tu búsqueda.</p>
              </div>
            ) : (
              filteredIngredients.map((ing) => {
                const status = getStockStatus(ing);
                const percentage = Math.min(100, (ing.currentStock / ing.targetStock) * 100);

                return (
                  <div key={ing.id} className="space-y-2 border-b border-dashed border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between text-xs font-bold items-center">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-700 font-semibold">{ing.name.toUpperCase()}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-550 rounded text-[8.5px] uppercase font-sans tracking-wide">
                            {ing.category || 'Varios'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-405 text-slate-400 block mt-0.5 uppercase">
                          Costo unitario: {formatCurrency(ing.unitCost)} / {ing.unit}
                        </span>
                      </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold mr-2 ${
                        ing.currentStock <= ing.minStock 
                          ? 'bg-red-100 text-red-700' 
                          : ing.currentStock <= ing.minStock * 1.5 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {status.label}
                      </span>
                      <span className="text-slate-600 font-bold">
                        {ing.currentStock} / {ing.targetStock} <span className="text-[10px] font-normal text-slate-400">{ing.unit}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className={`${status.colorClass} h-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {/* Quick Adjust controls */}
                    <div className="flex items-center border border-slate-200 rounded-md bg-white shrink-0">
                      <button
                        onClick={() => changeStockValue(ing.id, -1)}
                        className="py-1 px-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 border-r border-slate-150 cursor-pointer"
                        title="Consumir 1 unidad"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => changeStockValue(ing.id, 1)}
                        className="py-1 px-2.5 text-xs font-bold text-slate-650 hover:bg-slate-50 border-r border-slate-150 cursor-pointer"
                        title="Reponer 1 unidad"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIngredient(ing);
                          setRestockAmount(ing.targetStock - ing.currentStock > 0 ? ing.targetStock - ing.currentStock : 20);
                        }}
                        className="py-1 px-2 text-xs font-bold text-red-650 hover:bg-red-50 text-red-650 border-r border-slate-150 flex items-center gap-0.5 cursor-pointer"
                        title="Carga masiva"
                      >
                        <BadgePlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(ing)}
                        className="py-1 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-r border-slate-150 cursor-pointer flex items-center"
                        title="Modificar parámetros"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                        className="py-1 px-2 text-slate-400 hover:text-red-650 hover:bg-red-50 flex items-center cursor-pointer"
                        title="Eliminar insumo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Min stock marker guidelines */}
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Mínimo seguro: {ing.minStock} {ing.unit}</span>
                    <span>Meta de abastecimiento: {ing.targetStock} {ing.unit}</span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Aside detail card or Quick Restock card */}
        <div className="flex flex-col gap-6">
          {selectedIngredient ? (
            <div className="bg-white rounded-xl border border-red-250 border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <BadgePlus className="w-4 h-4 text-red-600" />
                Registrar Reposición
              </h3>
              <p className="text-xs text-slate-500">
                Aumentá el stock total de <strong>{selectedIngredient.name}</strong> para restablecer niveles normales de cocina.
              </p>

              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cantidad a Incorporar ({selectedIngredient.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-950 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Inversión Estimada:</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(restockAmount * selectedIngredient.unitCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Stock Proyectado:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedIngredient.currentStock + restockAmount} {selectedIngredient.unit}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedIngredient(null)}
                    className="flex-1 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50"
                  >
                    Salir
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-red-650 text-white rounded font-bold hover:bg-red-700"
                  >
                    Reponer Stock
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl shadow-lg p-5 text-white flex flex-col justify-between h-full relative overflow-hidden min-h-[220px]">
              <div className="relative z-10">
                <span className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                  Fórmula de Costos
                </span>
                <h4 className="text-lg font-bold leading-tight mt-3">Receta Rentable</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Automatizá la actualización de costos. Al crear productos, Firebase vincula insumos con recetas, permitiendo recalcular al instante márgenes netos en caso de inflación o subas de precios de proveedores.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs z-10">
                <span className="text-slate-400">Ver consulta SQL de Recetas</span>
                <span className="text-red-500 font-bold">📋 Ver Esquema →</span>
              </div>
              <div className="absolute bottom-[-15px] right-[-15px] text-slate-800 text-8xl font-bold opacity-[0.08] select-none">
                $
              </div>
            </div>
          )}

          {/* Alert panel for critical items */}
          <div className="bg-red-50 rounded-xl border border-red-100 p-5 space-y-3">
            <h4 className="text-xs font-bold text-red-850 text-red-700 uppercase tracking-widest flex items-center gap-1.5">
              <span>🚨</span> INSUMOS CON STOCK BAJO
            </h4>
            <div className="space-y-2">
              {ingredients
                .filter((i) => i.currentStock <= i.minStock)
                .map((ing) => (
                  <div key={ing.id} className="flex justify-between items-center text-xs text-slate-800 font-medium">
                    <span>{ing.name}</span>
                    <span className="text-red-650 text-red-600 font-bold">
                      Faltan {ing.targetStock - ing.currentStock} {ing.unit}
                    </span>
                  </div>
                ))}
              {ingredients.filter((i) => i.currentStock <= i.minStock).length === 0 && (
                <p className="text-xs text-slate-600">¡Ningún insumo está por debajo del límite seguro hoy! Buen trabajo.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Ingredient Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-all animate-in zoom-in-95 duration-200 text-slate-800">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-red-500" />
                <div className="text-left">
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    {editingIngredient ? '📝 Editar Insumo' : '✨ Nuevo Insumo Físico'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {editingIngredient ? 'Modificá las especificaciones del insumo.' : 'Creá un nuevo insumo de cocina.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-auto p-5 space-y-4 text-left">
              {/* Insumo Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Medallón Carne burguer, Queso Cheddar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-405 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Insumo Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Categoría del Insumo *
                </label>
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-650 font-sans font-medium"
                  >
                    <option value="Panificados">🥖 Panificados</option>
                    <option value="Carnes">🥩 Carnes</option>
                    <option value="Lácteos">🧀 Lácteos</option>
                    <option value="Semicongelados">🍟 Semicongelados</option>
                    <option value="Verdulería">🥬 Verdulería</option>
                    <option value="Bebidas">🥤 Bebidas</option>
                    <option value="Aderezos y Salsas font-medium">🥫 Aderezos y Salsas</option>
                    <option value="Descartables">🥡 Descartables</option>
                    <option value="Varios">📦 Varios</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Otro (crear)..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-28 px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-650 font-sans"
                    title="Escribí una categoría personalizada si es requerida"
                  />
                </div>
              </div>

              {/* Unit of measure and Cost Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Unidad Medida *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. kgr, grs, u."
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Costo x Unidad ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Current Stock */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Stock Físico Inicial ({unit || 'u.'})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Min and Target Stocks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    🚨 Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    🎯 Meta Abastec.
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetStock}
                    onChange={(e) => setTargetStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-100/80 text-[9px] text-slate-500 leading-relaxed">
                💡 Los insumos con stock menor al Mínimo Seguro se alertarán en color rojo y se restarán automáticamente del inventario al procesarse ventas en el mostrador.
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer transition-colors"
                >
                  {editingIngredient ? 'Guardar Cambios 💾' : 'Crear Insumo ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
