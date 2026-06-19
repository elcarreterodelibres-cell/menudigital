import React, { useState } from 'react';
import { Copy, Check, Lock, Database, FileCode, Lightbulb } from 'lucide-react';

export default function ArchitecturePanel() {
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'folders' | 'whatsapp'>('sql');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const sqlSchemaCode = `// ==========================================
// ESQUEMA NOSQL (GOOGLE FIREBASE FIRESTORE)
// Webapp: Fast Food Control con Sincronización Firebase Live
// ==========================================

// 1. COLECCIÓN: users (Firebase Authentication & Firestore Profiles)
{
  "uid": "usr_748293",                       // ID único provisto por Firebase Auth
  "email": "cliente@gmail.com",
  "displayName": "Tomás Bianchi",
  "phoneNumber": "3415559876",
  "authProvider": "google"                   // 'google' o 'email'
}

// 2. COLECCIÓN: products (Menú digital autogestionado)
{
  "id": "prod_1",
  "name": "Hamburguesa Doble Cheddar",
  "description": "Doble medallón con queso cheddar derretido",
  "price": 9500,
  "category": "Hamburguesas",
  "isActive": true,
  "imageUrl": "https://img..."
}

// 3. COLECCIÓN: ingredients (Control de Stock de Materias Primas)
{
  "id": "ing_pan",
  "name": "Pan Brioche",
  "unit": "unidades",
  "currentStock": 80,
  "minStock": 15,
  "targetStock": 100,
  "unitCost": 120
}

// 4. COLECCIÓN: product_ingredients (Recetas / Fórmulas de coste instantáneo)
{
  "id": "rec_1",
  "productId": "prod_1",
  "ingredientId": "ing_pan",
  "quantityRequired": 1                      // 1 pan por hamburguesa
}

// 5. COLECCIÓN: orders (Ventas con sincronización en tiempo real)
{
  "id": "ord_817293",
  "customerName": "Tomas Bianchi",
  "customerPhone": "3415559876",
  "orderType": "delivery",                  // 'delivery', 'local', 'takeaway'
  "deliveryAddress": "Av. Pellegrini 1200",
  "totalPrice": 12500,
  "totalCost": 4100,                        // Calculado según las recetas
  "status": "pending",                      // 'pending', 'cooking', 'delivered', 'cancelled'
  "viaWhatsapp": true,
  "createdAt": "2026-06-19T10:30:00Z"
}

// 6. COLECCIÓN: inventory_logs (Histórico de reabastecimiento y cálculo de mermas)
{
  "id": "log_a82",
  "ingredientId": "ing_pan",
  "quantityChanged": 50,
  "logType": "restock",                     // 'restock', 'sale_deduction', 'waste'
  "notes": "Compra proveedor central",
  "createdAt": "2026-06-19T08:00:00Z"
}`;

  const folderStructureText = `mi-local-fastfood/
├── firebase.json                   # Configuración del CLI de Google Firebase
├── firestore.rules                 # Reglas de Seguridad en la nube para Firestore
├── package.json                    # Dependencias NPM (Vite + React + Firebase SDK)
│
├── src/
│   ├── main.tsx                    # Punto de entrada de la aplicación
│   ├── App.tsx                     # Orquestador: enrutamiento inteligente e isolation Vercel
│   │
│   ├── components/                 # Componentes UI reutilizables
│   │   ├── CustomerMenu.tsx        # Menú digital responsivo (Mesa QR + Auto-pedido)
│   │   ├── AdminPanel.tsx          # Panel autogestionado con KPI financieros
│   │   ├── InventoryPanel.tsx      # Control de Stock e insumos críticos
│   │   └── SettingsPanel.tsx       # Configuración dinámica del negocio y PIN de seguridad admin
│   │
│   ├── lib/                        # Integraciones de servicios externos
│   │   └── db.ts                   # Motor de datos: Cliente Firebase / Firestore offline-first
│   │
│   └── types.ts                    # Tipos de TypeScript compartidos por todo el negocio`;

  const whatsappIntegText = `ESTRATEGIA DE INTEGRACIÓN EFICIENTE CON WHATSAPP y FIREBASE

Para un negocio gastronómico liviano, existen dos niveles de arquitectura recomendados para conectar la webapp en Vercel con WhatsApp:

Opción A: Esquema Gratuito por Redirección Directa (Recomendado para Startups)
----------------------------------------------------------------------------------
1. El cliente arma el pedido en el "Menú Digital" y la web lo persiste en Firebase Firestore.
2. Al dar clic en "Confirmar", el frontend genera un texto formateado con saltos de línea y emojis.
3. El frontend de React redirige al cliente usando un link universal codificado:
   https://api.whatsapp.com/send?phone=TELEFONO_NEGOCIO&text=MENSAJE_CODIFICADO
4. BENEFICIO: El cliente es quien pulsa el botón en su propio WhatsApp para mandar el mensaje.
   - Es 100% gratis.
   - El negocio recibe el historial consolidado con el código del pedido de Firebase en su chat.
   - No requiere aprobaciones de plantillas de Meta.

Opción B: API Oficial Programática (WhatsApp Cloud API) para Notificaciones en Cocina
----------------------------------------------------------------------------------
Si deseas notificar al negocio EN TIEMPO REAL sin que el cliente tenga que abrir WhatsApp (ó enviar notificaciones post-compra automatizadas):

1. **Flujo de Base de Datos**:
   Frontend ➔ Inserta Registro en Firebase Document Store (Firestore).
   
2. **Firebase Cloud Functions (Triggers)**:
   Configurás un trigger onWrite() o onCreate() en la colección 'orders' para eventos de inserción.
   
3. **Llamada de Función Cloud**:
   El Trigger dispara una función en Node.js llamando a la API Oficial de Meta o Twilio:
   POST https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages
   Headers: 
     Authorization: Bearer WHATSAPP_API_TOKEN
     Content-Type: application/json
   Payload (JSON):
     {
       "messaging_product": "whatsapp",
       "to": "NUMERO_DEL_DUEÑO_O_CLIENTE",
       "type": "template",
       "template": {
         "name": "nuevo_pedido_comida",
         "language": { "code": "es" },
         "components": [
           { "type": "body", "parameters": [{"type": "text", "text": "Tomás Bianchi"}, {"type": "text", "text": "🍔 Doble Burger"}] }
         ]
       }
     }

4. BENEFICIOS:
   - Notificaciones 100% autónomas.
   - Permite despachar alertas de "Tu pedido está en cocina" ó "Tu delivery va en viaje" de manera profesional y desatendida.`;

  const triggerCopy = (txt: string, keyName: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedText(keyName);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">Arquitectura de Software y Base de Datos Pro</h2>
        <p className="text-xs text-slate-500 mt-1">
          Analizá las definiciones NoSQL, la estructura ideal del proyecto de Firebase y las soluciones sugeridas para la integración con WhatsApp.
        </p>
      </div>

      {/* Selector SubTabs */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-lg shrink-0 gap-1 self-start">
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'sql'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Esquema NoSQL (Firebase)
        </button>
        <button
          onClick={() => setActiveSubTab('folders')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'folders'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" /> Estructura de Carpetas
        </button>
        <button
          onClick={() => setActiveSubTab('whatsapp')}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'whatsapp'
              ? 'bg-slate-950 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" /> Flujo API WhatsApp
        </button>
      </div>

      {/* Main code viewer boxes */}
      <div className="flex-1 min-h-0 bg-slate-950 rounded-xl shadow-lg border border-slate-800 text-slate-200 flex flex-col overflow-hidden relative">
        <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="text-xs text-slate-400 font-mono ml-2">
              {activeSubTab === 'sql' ? 'firestore_schema.json' : activeSubTab === 'folders' ? 'project_directory.txt' : 'whatsapp_integration.md'}
            </span>
          </div>

          <button
            onClick={() => {
              const activeText =
                activeSubTab === 'sql'
                  ? sqlSchemaCode
                  : activeSubTab === 'folders'
                  ? folderStructureText
                  : whatsappIntegText;
              triggerCopy(activeText, activeSubTab);
            }}
            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedText === activeSubTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar Código
              </>
            )}
          </button>
        </div>

        {/* Console Text block */}
        <div className="flex-1 overflow-auto p-5 font-mono text-[11px] sm:text-xs leading-relaxed selection:bg-slate-700 selection:text-white">
          {activeSubTab === 'sql' && (
            <pre className="text-emerald-450 text-emerald-300 tab-size-4">{sqlSchemaCode}</pre>
          )}
          {activeSubTab === 'folders' && (
            <pre className="text-blue-300 whitespace-pre leading-5">{folderStructureText}</pre>
          )}
          {activeSubTab === 'whatsapp' && (
            <pre className="text-orange-200 whitespace-pre-wrap leading-5">{whatsappIntegText}</pre>
          )}
        </div>

        {/* Sticky warning about Firebase Firestore security rules */}
        <div className="p-3 bg-slate-900 border-t border-slate-850/80 shrink-0 text-[10px] text-slate-400 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>💡 <strong>Consejo Firebase Security:</strong> Configurar Firestore Security Rules (firestore.rules) para restringir las escrituras públicas de precios o stock, permitiendo solo que clientes autenticados suban órdenes sin modificar el catálogo.</span>
        </div>
      </div>
    </div>
  );
}
