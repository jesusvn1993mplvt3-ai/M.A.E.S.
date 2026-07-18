import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, SaveAll, FilePlus, FolderOpen, Factory, Ticket, Layers, 
  Info, Loader2, FileDown, Activity, Minus, Square, X, Boxes, Hammer,
  Printer, Hash, Scissors
} from 'lucide-react';

// Librerías de utilidades reales
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// ============================================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================================
// COMPONENTES UI (Cinta de Opciones)
// ============================================================================
const RibbonButton = ({ icon: Icon, label, onClick, disabled = false, colorClass = "text-blue-700" }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`flex flex-col items-center justify-start py-1.5 px-3 rounded border border-transparent min-w-[68px] text-center transition-all
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-200 hover:border-slate-300 active:bg-slate-300 cursor-pointer'} 
      text-slate-700 bg-transparent`}
  >
    <Icon size={26} strokeWidth={1.5} className={`${colorClass} mb-1`} />
    <span className="text-[11px] leading-tight font-medium tracking-tight">{label}</span>
  </button>
);

const RibbonSeparator = () => <div className="w-[1px] bg-slate-300 h-10 mx-2 self-center"></div>;

// ============================================================================
// MÓDULO 1: NUEVA ORDEN
// ============================================================================
const ModuleNuevaOrden = ({ onSaveRequest }: any) => {
  const [formData, setFormData] = useState({
    cliente: '',
    partida: '',
    articulo: '',
    color: '',
    talla: 'UNITALLA',
    maquina: '',
    totalPrendas: '',
    prendasPorPaquete: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (onSaveRequest > 0) {
      const save = async () => {
        const { cliente, partida, maquina, totalPrendas, prendasPorPaquete }: any = formData;
        if (!cliente.trim() || !partida.trim() || !maquina.trim() || !totalPrendas || !prendasPorPaquete) {
          alert("Faltan datos críticos: Cliente, Partida, Máquina, Total Prendas o Prendas por Paquete.");
          return;
        }

        setIsSaving(true);
        try {
          const prendasTotal = parseInt(totalPrendas, 10);
          const porPaquete = parseInt(prendasPorPaquete, 10);
          const numPaquetes = Math.ceil(prendasTotal / porPaquete);
          const paquetes = [];

          for (let i = 1; i <= numPaquetes; i++) {
            const prendasEnEste = (i === numPaquetes && prendasTotal % porPaquete !== 0) 
              ? (prendasTotal % porPaquete) 
              : porPaquete;
            
            const shortCode = `${partida}-${maquina}-${String(i).padStart(3, '0')}`;
            
            paquetes.push({
              paqueteNum: i,
              prendas: prendasEnEste,
              shortCode: shortCode,
              impreso: false
            });
          }

          const newOrder = { 
            ...formData,
            paquetes: paquetes,
            totalPaquetes: numPaquetes,
            fechaCreacion: new Date().toISOString(),
            status: 'pendiente',
            createdAt: Date.now() 
          };
          
          const colRef = collection(db, 'a-orders');
          await addDoc(colRef, newOrder);
          
          setFormData({ cliente: '', partida: '', articulo: '', color: '', talla: 'UNITALLA', maquina: '', totalPrendas: '', prendasPorPaquete: '' });
          alert(`¡Orden guardada! Se generaron ${numPaquetes} paquetes para la máquina ${maquina}.`);
        } catch(e) { 
          console.error("Error al guardar:", e); 
          alert("Error al guardar la orden.");
        } finally {
          setIsSaving(false);
        }
      };
      save();
    }
  }, [onSaveRequest]);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm border border-slate-200 mt-6 rounded-md text-left">
      <h2 className="text-2xl font-light text-slate-800 mb-6 border-b border-slate-200 pb-3 flex items-center gap-2">
        <FilePlus size={26} className="text-blue-600"/> Alta de Producción y Paquetes
      </h2>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Cliente</label>
          <input name="cliente" type="text" value={formData.cliente} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500" placeholder="LIVERPOOL" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Partida</label>
          <input name="partida" type="text" value={formData.partida} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500 font-mono font-bold text-blue-900" placeholder="P-1025" />
        </div>

        <div className="col-span-3 border-t border-slate-100 pt-4 mt-2 flex items-center gap-2">
          <Scissors size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Ficha Técnica de la Prenda</h3>
        </div>

        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Artículo / Modelo</label>
          <input name="articulo" type="text" value={formData.articulo} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500" placeholder="SUÉTER CUELLO V" />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Color Base</label>
          <input name="color" type="text" value={formData.color} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500" placeholder="NEGRO REY" />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Talla</label>
          <input name="talla" type="text" value={formData.talla} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500" placeholder="UNITALLA" />
        </div>

        <div className="col-span-3 border-t border-slate-100 pt-4 mt-2 flex items-center gap-2">
          <Factory size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Asignación y Metraje (Generación de Paquetes)</h3>
        </div>

        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Máquina Asignada</label>
          <input name="maquina" type="text" value={formData.maquina} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500 font-mono" placeholder="MQ-15" />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total de Prendas</label>
          <input name="totalPrendas" type="number" value={formData.totalPrendas} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500" placeholder="0" />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Prendas por Paquete</label>
          <input name="prendasPorPaquete" type="number" value={formData.prendasPorPaquete} onChange={handleChange} className="w-full border border-slate-300 p-2 outline-none rounded bg-slate-50 focus:bg-white focus:border-blue-500" placeholder="Ejem: 20" />
        </div>
      </div>
      
      {formData.totalPrendas && formData.prendasPorPaquete && (
        <div className="mt-6 bg-slate-800 text-white p-4 rounded-md flex justify-between items-center shadow-inner">
          <div className="flex items-center gap-3">
            <Boxes size={24} className="text-blue-400" />
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Proyección del Sistema</div>
              <div className="text-sm font-medium">Se generarán <span className="text-blue-400 font-bold text-lg">{Math.ceil(Number(formData.totalPrendas) / Number(formData.prendasPorPaquete))}</span> paquetes para esta orden.</div>
            </div>
          </div>
        </div>
      )}

      {isSaving && (
        <div className="mt-4 text-sm text-blue-600 flex items-center gap-2 font-bold uppercase tracking-wider justify-center">
          <Loader2 size={18} className="animate-spin" /> Procesando e insertando lotes...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MÓDULO 2: PAPELETAS
// ============================================================================
const ModulePapeletas = ({ orders }: any) => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPaquete, setSelectedPaquete] = useState<any>(null);
  const barcodeRef = useRef<any>(null);

  useEffect(() => {
    if (selectedPaquete && barcodeRef.current) {
      try {
        const codeValue = selectedPaquete.shortCode || "N/A";
        JsBarcode(barcodeRef.current, codeValue, {
          format: "CODE128",
          width: 3,
          height: 90,
          displayValue: true,
          fontSize: 24,
          fontOptions: "bold",
          margin: 15,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (error) {
        console.error("Error al generar JsBarcode:", error);
      }
    }
  }, [selectedPaquete]);

  const handlePrint = () => window.print();

  return (
    <div className="flex h-full text-left">
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-10 shadow-sm print:hidden">
        <div className="p-3 bg-slate-800 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <Ticket size={16} /> Lotes Disponibles
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {orders.map((o: any) => (
            <div key={o.id} className="border border-slate-200 rounded overflow-hidden">
              <button 
                onClick={() => {
                  setSelectedOrder(selectedOrder?.id === o.id ? null : o);
                  setSelectedPaquete(null);
                }} 
                className={`w-full text-left p-3 text-sm transition-all flex justify-between items-center
                  ${selectedOrder?.id === o.id ? 'bg-blue-50 text-blue-900 border-b border-blue-200' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <div>
                  <div className="font-bold text-sm tracking-tight">{o.partida}</div>
                  <div className="text-[10px] opacity-70 uppercase font-bold">{o.maquina} • {o.totalPaquetes} Paquetes</div>
                </div>
                <Hash size={16} className={selectedOrder?.id === o.id ? 'text-blue-500' : 'text-slate-400'} />
              </button>
              
              {selectedOrder?.id === o.id && (
                <div className="bg-slate-50 p-2 grid grid-cols-3 gap-2">
                  {o.paquetes?.map((pq: any) => (
                    <button
                      key={pq.paqueteNum}
                      onClick={() => setSelectedPaquete({ ...pq, parentOrder: o })}
                      className={`py-2 text-xs font-bold rounded border transition-all text-center
                        ${selectedPaquete?.shortCode === pq.shortCode ? 'bg-slate-800 text-white border-slate-800 shadow-inner' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                    >
                      P-{pq.paqueteNum}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">No hay datos en a-orders.</div>}
        </div>
      </div>
      
      <div className="flex-1 bg-slate-300 p-8 flex flex-col items-center justify-start overflow-y-auto print:bg-white print:p-0">
        <div className="mb-6 flex gap-4 print:hidden">
           <button disabled={!selectedPaquete} onClick={handlePrint} className="bg-slate-800 disabled:bg-slate-400 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-slate-700 hover:scale-105 transition-all">
             <Printer size={16} /> Imprimir Etiqueta
           </button>
        </div>

        {selectedPaquete ? (
          <div className="bg-white shadow-2xl w-[100mm] min-h-[150mm] p-4 flex flex-col justify-between border-2 border-slate-200 print:shadow-none print:border-none print:m-0 relative">
            <div className="border-b-4 border-black pb-2 mb-3 text-center">
              <h1 className="text-3xl font-black tracking-tighter text-black leading-none m-0">CIRINEO</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest m-0">Control de Producción</p>
            </div>

            <div className="flex-1 flex flex-col gap-2 text-black">
              <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2">
                 <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest">Partida</div>
                    <div className="text-2xl font-black leading-none">{selectedPaquete.parentOrder.partida}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-widest">Máquina</div>
                    <div className="text-2xl font-black leading-none">{selectedPaquete.parentOrder.maquina}</div>
                 </div>
              </div>

              <div className="border-b-2 border-black pb-2">
                <div className="text-[9px] font-bold uppercase tracking-widest">Cliente</div>
                <div className="text-lg font-bold leading-tight">{selectedPaquete.parentOrder.cliente}</div>
              </div>

              <div className="border-b-2 border-black pb-2">
                <div className="text-[9px] font-bold uppercase tracking-widest">Artículo / Prenda</div>
                <div className="text-lg font-bold leading-tight">{selectedPaquete.parentOrder.articulo}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest">Color</div>
                  <div className="text-sm font-bold leading-tight">{selectedPaquete.parentOrder.color}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold uppercase tracking-widest">Talla</div>
                  <div className="text-sm font-bold leading-tight">{selectedPaquete.parentOrder.talla}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black text-white p-2 mt-2">
                 <div className="flex flex-col justify-center items-center border-r border-gray-600">
                    <div className="text-[9px] font-bold uppercase tracking-widest">Paquete</div>
                    <div className="text-3xl font-black">{selectedPaquete.paqueteNum}<span className="text-lg text-gray-300">/{selectedPaquete.parentOrder.totalPaquetes}</span></div>
                 </div>
                 <div className="flex flex-col justify-center items-center">
                    <div className="text-[9px] font-bold uppercase tracking-widest">Cantidad</div>
                    <div className="text-3xl font-black">{selectedPaquete.prendas} <span className="text-sm font-bold">pz</span></div>
                 </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center justify-center">
              <svg ref={barcodeRef} className="w-full h-auto max-h-[25mm]"></svg>
            </div>
            
            <div className="text-center text-[8px] font-bold mt-2">
              FECHA: {new Date(selectedPaquete.parentOrder.createdAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 h-full opacity-60 print:hidden">
            <Ticket size={72} strokeWidth={1} className="mb-4" />
            <p className="text-lg font-light text-center max-w-sm">Selecciona una Orden y luego un Paquete para visualizar su papeleta.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL: APP
// ============================================================================
export default function App() {
  const [activeModule, setActiveModule] = useState('papeletas');
  const [saveRequest, setSaveRequest] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, 'a-orders');
    const unsub = onSnapshot(colRef, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 shrink-0 z-20 shadow-sm print:hidden">
        <div className="bg-blue-800 text-white px-4 py-1 text-[11px] font-bold flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white text-blue-800 px-1.5 rounded text-[10px]">MAES</div>
            <span className="tracking-widest uppercase">Sistema de Control de Producción Industrial</span>
          </div>
          <div className="flex items-center gap-4 opacity-80">
            <span className="flex items-center gap-1"><Activity size={12}/> Servidor: Vercel Cloud</span>
            <span className="flex items-center gap-1"><Info size={12}/> v2.5.0</span>
          </div>
        </div>

        <div className="flex items-center px-2 py-1 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-1 px-3 border-r border-slate-300 mr-2">
            <div className="w-8 h-8 bg-blue-700 rounded-md flex items-center justify-center text-white shadow-inner">
              <Factory size={20} />
            </div>
            <div className="leading-none ml-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Archivo</div>
              <div className="text-xs font-bold text-blue-900">CIRINEO</div>
            </div>
          </div>

          <div className="flex gap-0.5">
            <RibbonButton 
              icon={FilePlus} 
              label="Nueva Orden" 
              onClick={() => setActiveModule('nueva')}
              colorClass={activeModule === 'nueva' ? 'text-blue-600' : 'text-slate-500'}
            />
            <RibbonButton 
              icon={Ticket} 
              label="Papeletas" 
              onClick={() => setActiveModule('papeletas')}
              colorClass={activeModule === 'papeletas' ? 'text-blue-600' : 'text-slate-500'}
            />
            <RibbonSeparator />
            <RibbonButton 
              icon={Save} 
              label="Guardar" 
              onClick={() => setSaveRequest(prev => prev + 1)}
              disabled={activeModule !== 'nueva'}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 z-50">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando con Firebase...</div>
          </div>
        ) : (
          <>
            {activeModule === 'nueva' && <ModuleNuevaOrden onSaveRequest={saveRequest} />}
            {activeModule === 'papeletas' && <ModulePapeletas orders={orders} />}
          </>
        )}
      </div>

      <div className="bg-slate-800 text-white px-4 py-1 text-[10px] flex justify-between items-center shrink-0 print:hidden">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 opacity-70"><Hash size={12}/> Órdenes: {orders.length}</span>
          <span className="flex items-center gap-1 opacity-70"><Boxes size={12}/> Lotes: {orders.reduce((acc, o) => acc + (o.totalPaquetes || 0), 0)}</span>
        </div>
        <div className="font-medium tracking-widest opacity-50">LISTO | PRODUCCIÓN MAES</div>
      </div>
    </div>
  );
}
