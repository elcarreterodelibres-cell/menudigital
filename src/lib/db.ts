import { Product, Ingredient, Order, AppUser } from '../types';
import { INITIAL_PRODUCTS, INITIAL_INGREDIENTS, INITIAL_ORDERS } from '../data/initialData';

// Simulated Firebase Realtime Store using LocalStorage
class FirestoreSimulator {
  constructor() {
    this.migrateOldBurgerControlData();
    // Force clean previous simulation orders to start strictly from 0 (sin pedidos, sin ventas)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('fs_orders');
    }
  }

  private migrateOldBurgerControlData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // 1. Check all localStorage keys for old names and migrate/delete
        const keysToMigrate: { oldKey: string; newKey: string }[] = [];
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            const keyLower = key.toLowerCase();
            // If the key has the old applet ID or name
            if (keyLower.includes('burgercontrol') || keyLower.includes('burger-control')) {
              // Map old keys to our new standard fs_* keys if they aren't already set
              let newKey = key;
              if (keyLower.includes('config')) newKey = 'fs_business_config';
              else if (keyLower.includes('orders')) newKey = 'fs_orders';
              else if (keyLower.includes('products')) newKey = 'fs_products';
              else if (keyLower.includes('ingredients')) newKey = 'fs_ingredients';
              else if (keyLower.includes('users')) newKey = 'fs_users';
              else if (keyLower.includes('current_user')) newKey = 'fs_current_user';
              
              if (newKey !== key) {
                keysToMigrate.push({ oldKey: key, newKey });
              } else {
                keysToRemove.push(key);
              }
            }
          }
        }

        // Apply key migrations
        keysToMigrate.forEach(({ oldKey, newKey }) => {
          const val = window.localStorage.getItem(oldKey);
          if (val && !window.localStorage.getItem(newKey)) {
            window.localStorage.setItem(newKey, val);
          }
          window.localStorage.removeItem(oldKey);
        });

        keysToRemove.forEach(k => window.localStorage.removeItem(k));

        // 2. Scan standard keys to ensure no 'BurgerControl' text remains in businessName
        const configKey = 'fs_business_config';
        const configStr = window.localStorage.getItem(configKey);
        if (configStr) {
          try {
            const config = JSON.parse(configStr);
            if (config && (config.businessName === 'BurgerControl' || !config.businessName || config.businessName.toLowerCase().includes('burgercontrol'))) {
              config.businessName = 'El Carretero';
              window.localStorage.setItem(configKey, JSON.stringify(config));
            }
          } catch(e) {}
        }
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }

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
    const saved = localStorage.getItem('fs_products');
    if (!saved) {
      this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    try {
      const currentProducts: Product[] = JSON.parse(saved);
      let modified = false;

      // Auto-merge any default products that might be missing by checking their IDs
      const updatedProducts = [...currentProducts];
      INITIAL_PRODUCTS.forEach((defaultProd) => {
        const exists = updatedProducts.some(p => p.id === defaultProd.id || p.name.toLowerCase() === defaultProd.name.toLowerCase());
        if (!exists) {
          updatedProducts.push(defaultProd);
          modified = true;
        }
      });

      if (modified) {
        this.saveProducts(updatedProducts);
        return updatedProducts;
      }

      return currentProducts;
    } catch (e) {
      return INITIAL_PRODUCTS;
    }
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
    const config = this.getStorage<{
      whatsappPhone: string;
      businessName: string;
      qrUrl: string;
      tablesCount: number;
      adminPin: string;
    }>('fs_business_config', {
      whatsappPhone: '5493415551234',
      businessName: 'El Carretero',
      qrUrl: window.location.origin,
      tablesCount: 12,
      adminPin: '1234',
    });
    if (config.businessName === 'BurgerControl') {
      config.businessName = 'El Carretero';
      this.saveBusinessConfig(config);
    }
    return config;
  }

  saveBusinessConfig(config: any) {
    this.setStorage('fs_business_config', config);
  }
}

export const db = new FirestoreSimulator();
