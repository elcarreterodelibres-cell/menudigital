import React, { useState } from 'react';
import { Smartphone, Check, HelpCircle, Save, QrCode, Clipboard } from 'lucide-react';

interface SettingsPanelProps {
  config: {
    whatsappPhone: string;
    businessName: string;
    qrUrl: string;
    tablesCount: number;
    adminPin?: string;
  };
  setConfig: React.Dispatch<React.SetStateAction<{
    whatsappPhone: string;
    businessName: string;
    qrUrl: string;
    tablesCount: number;
    adminPin?: string;
  }>>;
}

export default function SettingsPanel({ config, setConfig }: SettingsPanelProps) {
  const [whatsappPhone, setWhatsappPhone] = useState(config.whatsappPhone);
  const [businessName, setBusinessName] = useState(config.businessName);
  const [qrUrl, setQrUrl] = useState(config.qrUrl);
  const [tablesCount, setTablesCount] = useState(config.tablesCount);
  const [adminPin, setAdminPin] = useState(config.adminPin || '1234');
  const [selectedMesaQR, setSelectedMesaQR] = useState(1);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig({
      whatsappPhone,
      businessName,
      qrUrl,
      tablesCount,
      adminPin,
    });
    alert('¡Configuración modificada correctamente! Los datos ya impactan en tiempo real en los accesos QR correspondientes.');
  };

  const getFullQRUrl = () => {
    return `${qrUrl}?mesa=${selectedMesaQR}`;
  };

  const copyQRLink = () => {
    navigator.clipboard.writeText(getFullQRUrl());
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-auto text-slate-800">
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">Configuración del Local & Emisor de QR Mesa</h2>
        <p className="text-xs text-slate-500 mt-1">
          Cambia la información comercial y genera códigos QR personalizados para pegar en cada mesa de tu establecimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Form Settings Left Side */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-5 text-xs font-semibold text-slate-700">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
              ⚙️ Integración & Negocio
            </h3>

            {/* Business name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nombre Comercial del Negocio
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-1 focus:ring-red-650"
              />
            </div>

            {/* Whatsapp */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Celular del Negocio para Recibir Pedidos (WhatsApp)*
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 5493415551234"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:ring-1 focus:ring-red-650"
              />
              <p className="text-[9px] text-slate-400 font-normal mt-1">
                Colocá el código de país sin el símbolo "+", espacios ni guiones. Ej: 5493415551234
              </p>
            </div>

            {/* App URL (QR Target) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                URL Base del Menú Digital (QR URL base)
              </label>
              <input
                type="text"
                required
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:ring-1 focus:ring-red-650"
              />
              <p className="text-[9px] text-slate-400 font-normal mt-1">
                Dirección en producción donde está alojada tu webapp (ej: Vercel, Firebase Hosting o local).
              </p>
            </div>

            {/* Tables Count */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cantidad de Mesas Disponibles en Salón
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={tablesCount}
                onChange={(e) => setTablesCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-1 focus:ring-red-650"
              />
            </div>

            {/* Admin PIN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                PIN de Seguridad para Administración (Restricción de Acceso)
              </label>
              <input
                type="text"
                pattern="\d{4}"
                maxLength={4}
                required
                placeholder="Ej: 1234"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:ring-1 focus:ring-red-650 tracking-widest"
              />
              <p className="text-[9px] text-amber-600 font-bold mt-1">
                ⚠️ Para evitar que los clientes que escanean QR accedan a ver tus costos y reportes, establece un código de 4 números.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Guardar Configuración
            </button>
          </form>
        </div>

        {/* QR Code and mesa preview Generator */}
        <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-1.5 text-red-500">
                <QrCode className="w-4 h-4" />
                Generador de QR por Mesa
              </h3>
              <select
                value={selectedMesaQR}
                onChange={(e) => setSelectedMesaQR(Number(e.target.value))}
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none"
              >
                {Array.from({ length: tablesCount }, (_, i) => i + 1).map((idx) => (
                  <option key={idx} value={idx}>
                    Mesa {idx}
                  </option>
                ))}
              </select>
            </div>

            {/* QR Code display representation card */}
            <div className="flex flex-col items-center justify-center bg-white rounded-lg p-5 border border-slate-200 shadow-lg text-slate-900 w-fit mx-auto">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 mb-2">
                {businessName.toUpperCase()}
              </div>

              {/* High-fidelity Vector simulated QR code representation */}
              <div className="w-40 h-40 bg-zinc-150 rounded border border-zinc-300 p-2 flex items-center justify-center relative bg-slate-50">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer boundaries / QR squares */}
                  <rect x="5" y="5" width="22" height="22" rx="2" fill="black" />
                  <rect x="8" y="8" width="16" height="16" rx="1" fill="white" />
                  <rect x="11" y="11" width="10" height="10" fill="black" />

                  <rect x="73" y="5" width="22" height="22" rx="2" fill="black" />
                  <rect x="76" y="8" width="16" height="16" rx="1" fill="white" />
                  <rect x="79" y="11" width="10" height="10" fill="black" />

                  <rect x="5" y="73" width="22" height="22" rx="2" fill="black" />
                  <rect x="8" y="76" width="16" height="16" rx="1" fill="white" />
                  <rect x="11" y="79" width="10" height="10" fill="black" />

                  {/* Interspersed simulated bit pattern points */}
                  <rect x="35" y="5" width="6" height="6" fill="black" />
                  <rect x="45" y="12" width="6" height="6" fill="black" />
                  <rect x="60" y="8" width="6" height="6" fill="black" />
                  <rect x="35" y="20" width="12" height="6" fill="black" />
                  <rect x="55" y="20" width="6" height="12" fill="black" />

                  <rect x="5" y="35" width="6" height="12" fill="black" />
                  <rect x="15" y="45" width="12" height="6" fill="black" />
                  <rect x="5" y="55" width="18" height="6" fill="black" />

                  <rect x="73" y="35" width="6" height="6" fill="black" />
                  <rect x="85" y="40" width="10" height="6" fill="black" />
                  <rect x="80" y="50" width="6" height="12" fill="black" />

                  <rect x="35" y="73" width="6" height="12" fill="black" />
                  <rect x="45" y="85" width="12" height="6" fill="black" />
                  <rect x="60" y="75" width="6" height="18" fill="black" />

                  {/* Beautiful icon in the middle */}
                  <rect x="42" y="42" width="16" height="16" rx="2" fill="red" />
                  <text x="50" y="53" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">B</text>
                </svg>
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  📍 MESA {selectedMesaQR}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Escanea para pedir directo
                </span>
              </div>
            </div>

            {/* Quick URL preview Copy tool */}
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">URL del QR Asociado</span>
              <div className="bg-slate-900 px-3 py-1.5 rounded text-[10px] font-mono text-slate-350 truncate">
                {getFullQRUrl()}
              </div>
              <button
                onClick={copyQRLink}
                className="w-full mt-2 py-1 bg-slate-700 hover:bg-slate-650 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                {showCopySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" /> ¡Enlace Copiado!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" /> Copiar Enlace QR de Mesa {selectedMesaQR}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-4 leading-relaxed border-t border-slate-800 pt-3">
            Pegá esta imagen o QR en el local. Cuando el cliente escanea con su celular ingresa directamente sin descargar ninguna aplicación, selecciona la mesa en el menú digital de manera automática y envía el pedido al WhatsApp del local.
          </div>
        </div>
      </div>
    </div>
  );
}
