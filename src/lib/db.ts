import { Product, Ingredient, Order, AppUser } from '../types';
import { INITIAL_PRODUCTS, INITIAL_INGREDIENTS, INITIAL_ORDERS } from '../data/initialData';

// Simulated Firebase Realtime Store using LocalStorage
class FirestoreSimulator {
  private getStorage<T>(key: string, defaultValue: T): T {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  private setStorage<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Auth simulators
  getUsers(): AppUser[] {
    return this.getStorage<AppUser[]>('fs_users', []);
  }

  saveUser(newUser: AppUser) {
    const users = this.getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (exists) {
      const updated = users.map((u) => u.email.toLowerCase() === newUser.email.toLowerCase() ? { ...u, ...newUser } : u);
      this.setStorage('fs_users', updated);
    } else {
      this.setStorage('fs_users', [...users, newUser]);
    }
    this.setCurrentUser(newUser);
  }

  getCurrentUser(): AppUser | null {
    return this.getStorage<AppUser | null>('fs_current_user', null);
  }

  setCurrentUser(user: AppUser | null) {
    this.setStorage('fs_current_user', user);
  }

  clearCurrentUser() {
    localStorage.removeItem('fs_current_user');
  }

  // Active collections
  getProducts(): Product[] {
    return this.getStorage<Product[]>('fs_products', INITIAL_PRODUCTS);
  }

  saveProducts(products: Product[]) {
    this.setStorage('fs_products', products);
  }

  getIngredients(): Ingredient[] {
    return this.getStorage<Ingredient[]>('fs_ingredients', INITIAL_INGREDIENTS);
  }

  saveIngredients(ingredients: Ingredient[]) {
    this.setStorage('fs_ingredients', ingredients);
  }

  getOrders(): Order[] {
    return this.getStorage<Order[]>('fs_orders', INITIAL_ORDERS);
  }

  saveOrders(orders: Order[]) {
    this.setStorage('fs_orders', orders);
  }

  getBusinessConfig() {
    return this.getStorage<{
      whatsappPhone: string;
      businessName: string;
      qrUrl: string;
      tablesCount: number;
      adminPin: string;
    }>('fs_business_config', {
      whatsappPhone: '5493415551234',
      businessName: 'BurgerControl',
      qrUrl: window.location.origin,
      tablesCount: 12,
      adminPin: '1234',
    });
  }

  saveBusinessConfig(config: any) {
    this.setStorage('fs_business_config', config);
  }
}

export const db = new FirestoreSimulator();
