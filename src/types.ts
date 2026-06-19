export interface ProductIngredient {
  ingredientId: string;
  quantity: number; // Quantity consumed from ingredient inventory per product unit
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  cost: number; // Cost of making this product, for net margin analysis
  ingredientsRequired?: ProductIngredient[]; // Association of ingredients with this product
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  targetStock: number;
  unitCost: number; // For cost calculations
  category?: string; // Inventory classification
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cost: number;
  }[];
  totalPrice: number;
  totalCost: number;
  netProfit: number;
  createdAt: string;
  status: 'pending' | 'cooking' | 'delivered' | 'cancelled';
  viaWhatsApp: boolean;
  orderType: 'delivery' | 'local' | 'takeaway';
  customerContact?: string;
  deliveryAddress?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  authProvider: 'email' | 'google';
}

