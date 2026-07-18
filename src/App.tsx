import { useState, useEffect, useRef } from 'react';
import { 
  Save, FilePlus, Factory, Ticket, Layers, 
  Loader2, Activity, Boxes, 
  Printer, Hash, Scissors
} from 'lucide-react';

// Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// ============================================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================================
// Usamos placeholders para Vercel, el usuario puede configurar sus variables de entorno después
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
const appId = 'produccion-industrial';

// ============================================================================
// COMPONENTES UI (Cinta de Opciones)
// ============================================================================
const RibbonButton = ({ icon: Icon, label, onClick, disabled = false, colorClass = "text-blue-700" }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`flex flex-col items-center justify-start py-1.5 px-3 rounded border border-transparent min-w-[68px] text-center transition-all
      \${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-200 hover:border-slate-300 active:bg-slate-300 cursor-pointer'} 
      text-slate-700 bg-transparent`}
  >
    <Icon size={26} strokeWidth={1.5} className={`\${colorClass} mb-1`} />
    <span className="text-[11px] leading-tight font-medium tracking-tight">\${label}</span>
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
            
            const shortCode = `\${partida}-\${maquina}-\${String(i).padStart(3, '0')}`;
            
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
          alert(`¡Orden guardada! Se generaron \${numPaquetes} paquetes.`);
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
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm border border-slate-200 mt-6 rounded-md text-left print:hidden">
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
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Asignación y Generación de Paquetes</h3>
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
          <Loader2 size={18} className="animate-spin" /> Procesando Lotes...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MÓDULO 2: PAPELETAS (Simulación visual de código de barras)
// ============================================================================
const ModulePapeletas = ({ orders }: any) => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPaquete, setSelectedPaquete] = useState<any>(null);

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
                  \${selectedOrder?.id === o.id ? 'bg-blue-50 text-blue-900 border-b border-blue-200' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <div>
                  <div className="font-bold text-sm tracking-tight">\${o.partida}</div>
                  <div className="text-[10px] opacity-70 uppercase font-bold">\${o.maquina} • \${o.totalPaquetes} Paquetes</div>
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
                        \${selectedPaquete?.shortCode === pq.shortCode ? 'bg-slate-800 text-white border-slate-800 shadow-inner' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                    >
                      P-\${pq.paqueteNum}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">No hay datos.</div>}
        </div>
      </div>
      
      <div className="flex-1 bg-slate-300 p-8 flex flex-col items-center justify-start overflow-y-auto print:bg-white print:p-0 print:items-start">
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

            <div className="mt-4 flex flex-col items-center justify-center border-t-2 border-dashed border-gray-300 pt-4">
              <div className="h-12 w-full flex items-end justify-center space-x-[1px] opacity-90 px-4 overflow-hidden">
                {[...Array(60)].map((_, i) => (
                  <div key={i} className="bg-black" style={{ width: `${Math.random() * 3 + 1}px`, height: `${Math.random() > 0.8 ? '80%' : '100%'}` }}></div>
                ))}
              </div>
              <div className="mt-1 text-lg font-mono font-bold tracking-widest">
                *{selectedPaquete.shortCode}*
              </div>
            </div>
            
            <div className="text-center text-[8px] font-bold mt-2">
              FECHA: {new Date(selectedPaquete.parentOrder.createdAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 h-full opacity-60 print:hidden">
            <Ticket size={72} strokeWidth={1} className="mb-4" />
            <p className="text-lg font-light text-center max-w-sm">Selecciona una Orden y luego un Paquete.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MÓDULO 3: REQUISICIONES DE HILO (Impresión Nativa)
// ============================================================================
const ModuleRequisicion = ({ orders }: any) => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handlePrint = () => window.print();

  return (
    <div className="flex h-full flex-col text-left">
      <div className="bg-white p-2 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 print:hidden">
        <div className="flex items-center gap-3 ml-2">
          <Layers size={18} className="text-slate-400" />
          <select 
            className="border-2 border-slate-200 rounded p-2 text-sm w-80 bg-slate-50 focus:border-emerald-500 outline-none font-bold text-slate-700" 
            onChange={(e) => setSelectedOrder(orders.find((o: any) => o.id === e.target.value) || null)} 
            value={selectedOrder?.id || ""}
          >
            <option value="">-- SELECCIONAR PARTIDA --</option>
            {orders.map((o: any) => <option key={o.id} value={o.id}>{o.partida} ({o.totalPrendas} pz) - {o.cliente}</option>)}
          </select>
        </div>
        <button 
          disabled={!selectedOrder} 
          onClick={handlePrint} 
          className="bg-slate-800 disabled:bg-slate-300 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition mr-2"
        >
          <Printer size={16} /> Imprimir A4
        </button>
      </div>

      <div className="flex-1 bg-slate-400 overflow-y-auto py-8 flex justify-center items-start print:bg-white print:p-0 print:overflow-visible">
        {selectedOrder ? (
          <div className="shadow-2xl print:shadow-none bg-white relative text-black" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
              
              <div className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter leading-none m-0">REQUISICIÓN DE HILO</h1>
                  <p className="text-slate-600 mt-2 uppercase text-[10px] tracking-widest font-bold m-0">Documento de Almacén</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest m-0 text-slate-500">Número de Partida</div>
                  <div className="font-black text-4xl m-0 p-0 leading-none">{selectedOrder.partida}</div>
                  <div className="text-slate-600 text-xs mt-2 font-bold uppercase m-0">
                    Fecha: {new Date(selectedOrder.createdAt).toLocaleDateString('es-MX')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="col-span-2 bg-slate-100 p-4 rounded border border-slate-300 print:border-black print:bg-transparent">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 print:text-black">Cliente / Marca</div>
                  <div className="text-xl font-black text-slate-900">{selectedOrder.cliente}</div>
                </div>
                <div className="col-span-1 bg-slate-100 p-4 rounded border border-slate-300 print:border-black print:bg-transparent">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 print:text-black">Máquina</div>
                  <div className="text-xl font-black text-slate-900">{selectedOrder.maquina}</div>
                </div>
                <div className="col-span-2 bg-slate-100 p-4 rounded border border-slate-300 print:border-black print:bg-transparent">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 print:text-black">Artículo / Prenda</div>
                  <div className="text-lg font-bold text-slate-800">{selectedOrder.articulo}</div>
                </div>
                <div className="col-span-1 bg-slate-100 p-4 rounded border border-slate-300 print:border-black print:bg-transparent">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 print:text-black">Total a Producir</div>
                  <div className="text-lg font-bold text-slate-800">{selectedOrder.totalPrendas} PZ</div>
                </div>
              </div>

              <table className="w-full border-collapse mb-10 text-sm border-2 border-black">
                <thead>
                  <tr className="bg-black text-white print:bg-gray-200 print:text-black">
                    <th className="border border-black p-3 text-left font-bold uppercase tracking-wider w-1/3">Color Solicitado</th>
                    <th className="border border-black p-3 text-left font-bold uppercase tracking-wider w-1/3">Tipo de Hilo (Sugerido)</th>
                    <th className="border border-black p-3 text-center font-bold uppercase tracking-wider">Kilos.</th>
                    <th className="border border-black p-3 text-center font-bold uppercase tracking-wider">Surtido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-4 font-bold text-lg">{selectedOrder.color}</td>
                    <td className="border border-black p-4 text-slate-600 font-medium">Línea Regular</td>
                    <td className="border border-black p-4 text-center"></td>
                    <td className="border border-black p-4 text-center"><div className="w-6 h-6 border-2 border-slate-400 mx-auto rounded-sm"></div></td>
                  </tr>
                  {[...Array(4)].map((_, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-6"></td>
                      <td className="border border-black p-6"></td>
                      <td className="border border-black p-6"></td>
                      <td className="border border-black p-4 text-center"><div className="w-6 h-6 border-2 border-slate-200 mx-auto rounded-sm"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between px-10 absolute bottom-[30mm] left-[20mm] right-[20mm]">
                <div className="text-center w-56">
                  <div className="border-t-2 border-black pt-2 font-bold text-sm uppercase tracking-widest text-black">Firma Almacén</div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Entrega / Surtido</div>
                </div>
                <div className="text-center w-56">
                  <div className="border-t-2 border-black pt-2 font-bold text-sm uppercase tracking-widest text-black">Firma Producción</div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Recibe Conforme</div>
                </div>
              </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 text-2xl font-light tracking-tighter print:hidden">
            Selecciona una partida para generar la Requisición.
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// APLICACIÓN PRINCIPAL 
// ============================================================================
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('Archivo');
  const [activeModule, setActiveModule] = useState('dashboard');
  const [triggerSaveCounter, setTriggerSaveCounter] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) { console.error("Auth error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'a-orders');
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)); 
      setOrders(data);
    }, (err) => console.error("Error DB:", err));
    return () => unsubscribe();
  }, [user]);

  const handleAction = (actionName: string) => {
    switch(actionName) {
      case 'nuevo': setActiveModule('nueva-orden'); break;
      case 'guardar': 
        if (activeModule === 'nueva-orden') {
          setTriggerSaveCounter(prev => prev + 1);
        } else {
          alert("El botón Guardar es exclusivo del módulo Nueva Orden.");
        }
        break;
      case 'papeletas': setActiveModule('papeletas'); break;
      case 'requisicion': setActiveModule('requisicion'); break;
      default: break;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-900 font-sans overflow-hidden">
      
      <style>{\`
        @media print {
          body, html, #root { height: auto !important; overflow: visible !important; }
        }
      \`}</style>

      {/* Titlebar */}
      <div className="bg-[#1e3a8a] text-white flex items-center justify-between px-4 py-2 text-xs select-none z-50 print:hidden">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-blue-300" />
          <span className="font-bold tracking-widest uppercase">Cirineo ERP (Modo Sandbox)</span>
          <span className="opacity-50 mx-2">|</span>
          <span className="opacity-90 capitalize font-medium">{activeModule.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Ribbon */}
      <div className="bg-[#f1f5f9] border-b border-slate-300 flex flex-col shrink-0 select-none z-40 print:hidden">
        <div className="flex px-2 pt-1.5 space-x-1">
          {['Archivo', 'Inicio', 'Producción', 'Inventario'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 text-xs rounded-t-lg border-t-2 border-x border-x-transparent transition-all
                \${activeTab === tab 
                  ? 'bg-white border-t-[#2563eb] border-x-slate-200 text-[#1e3a8a] font-bold relative top-[1px]' 
                  : 'text-slate-600 border-t-transparent hover:bg-slate-200 border-b-slate-300 font-medium'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="h-[96px] bg-white flex items-center px-2 shadow-[inset_0_-1px_0_0_#e2e8f0]">
          {activeTab === 'Archivo' && (
            <div className="flex h-full py-2 items-center">
              <div className="flex space-x-2 px-4">
                <RibbonButton icon={Save} label="Guardar" onClick={() => handleAction('guardar')} colorClass="text-[#1e3a8a]" />
              </div>
              <RibbonSeparator />
              <div className="flex space-x-2 px-4">
                <RibbonButton icon={FilePlus} label="Nueva Orden" onClick={() => handleAction('nuevo')} colorClass="text-emerald-700" />
              </div>
            </div>
          )}
          {activeTab === 'Producción' && (
            <div className="flex h-full py-2 items-center">
              <div className="flex flex-col h-full border-r border-slate-200 pr-4 mr-4 px-4">
                <div className="flex flex-1 items-center space-x-2">
                  <RibbonButton icon={Ticket} label="Papeletas" onClick={() => handleAction('papeletas')} colorClass="text-orange-600" />
                </div>
                <div className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-1">Etiquetado</div>
              </div>
              <div className="flex flex-col h-full px-4">
                <div className="flex flex-1 items-center space-x-2">
                  <RibbonButton icon={Layers} label="Req. Hilo" onClick={() => handleAction('requisicion')} colorClass="text-teal-700" />
                </div>
                <div className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-1">Almacén</div>
              </div>
            </div>
          )}
          {(activeTab === 'Inicio' || activeTab === 'Inventario') && (
            <div className="px-6 text-slate-400 text-sm font-medium">Navega a Producción o Archivo.</div>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 relative overflow-hidden bg-slate-200 print:overflow-visible">
        {activeModule === 'nueva-orden' && <ModuleNuevaOrden onSaveRequest={triggerSaveCounter} />}
        {activeModule === 'papeletas' && <ModulePapeletas orders={orders} />}
        {activeModule === 'requisicion' && <ModuleRequisicion orders={orders} />}
        {activeModule === 'dashboard' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100 print:hidden">
            <Boxes size={90} strokeWidth={1} className="mb-6 text-slate-300" />
            <h2 className="text-3xl font-light text-slate-600 tracking-tight">Bienvenido a Producción</h2>
            <p className="mt-2 text-sm text-slate-500">Selecciona "Archivo > Nueva Orden" o navega en la pestaña "Producción".</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
