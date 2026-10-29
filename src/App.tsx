import { useEffect, useMemo, useRef, useState } from 'react';
import ApiaryScene from './world/ApiaryScene';

type HiveStatus = 'Activa' | 'Revisar' | 'Atención';
type Hive = {
  id: string; name: string; kind: 'Colmena' | 'Núcleo'; status: HiveStatus; note: string;
  queen: string; queenYear: number; population: string; reserves: string; brood: string;
  lastReview: string; production: number; apiary: string;
};
type LogEntry = { id: string; hiveId: string; date: string; kind: 'Revisión' | 'Sanidad' | 'Alimentación' | 'Nota'; detail: string };
type Task = { id: string; hiveId: string; title: string; due: string; priority: 'Normal' | 'Alta'; done: boolean };
type Harvest = { id: string; date: string; product: string; quantity: number; lot: string };
type DemoState = { version: 1; hives: Hive[]; logs: LogEntry[]; tasks: Task[]; harvests: Harvest[] };

const STORAGE_KEY = 'mi-apiario-3d.demo.v1';
const today = () => new Date().toISOString().slice(0, 10);
const seedHives: Hive[] = [
  { id:'DEMO-001', name:'Colmena 01', kind:'Colmena', status:'Activa', note:'Colonia de ejemplo con actividad normal.', queen:'Amarillo', queenYear:2025, population:'Media-alta', reserves:'Buenas', brood:'Presente', lastReview:'2026-10-12', production:8.5, apiary:'Apiario Demo' },
  { id:'DEMO-002', name:'Colmena 02', kind:'Colmena', status:'Revisar', note:'Revisión ficticia pendiente.', queen:'Blanco', queenYear:2024, population:'Media', reserves:'Medias', brood:'Por comprobar', lastReview:'2026-09-28', production:5.2, apiary:'Apiario Demo' },
  { id:'DEMO-003', name:'Colmena 03', kind:'Colmena', status:'Activa', note:'Registro ficticio para probar el cuaderno.', queen:'Verde', queenYear:2026, population:'Fuerte', reserves:'Buenas', brood:'Abundante', lastReview:'2026-10-15', production:9.1, apiary:'Apiario Demo' },
  { id:'DEMO-004', name:'Colmena 04', kind:'Colmena', status:'Atención', note:'Aviso ficticio; no es una alerta sanitaria real.', queen:'Rojo', queenYear:2023, population:'Débil', reserves:'Bajas', brood:'Por comprobar', lastReview:'2026-10-02', production:2.0, apiary:'Apiario Demo' },
  { id:'DEMO-005', name:'Colmena 05', kind:'Colmena', status:'Activa', note:'Registro de demostración.', queen:'Amarillo', queenYear:2025, population:'Media', reserves:'Buenas', brood:'Normal', lastReview:'2026-10-10', production:6.7, apiary:'Apiario Demo' },
  { id:'DEMO-006', name:'Colmena 06', kind:'Colmena', status:'Activa', note:'Registro de demostración.', queen:'Azul', queenYear:2024, population:'Media-alta', reserves:'Medias', brood:'Normal', lastReview:'2026-10-14', production:7.4, apiary:'Apiario Demo' },
];
const seedState: DemoState = {
  version: 1, hives: seedHives,
  logs: [
    {id:'LOG-001',hiveId:'DEMO-001',date:'2026-10-12',kind:'Revisión',detail:'Ejemplo: población media-alta, cría presente.'},
    {id:'LOG-002',hiveId:'DEMO-002',date:'2026-09-28',kind:'Sanidad',detail:'Ejemplo pendiente de comprobación; no es diagnóstico.'},
    {id:'LOG-003',hiveId:'DEMO-003',date:'2026-10-15',kind:'Alimentación',detail:'Ejemplo de registro, sin cantidad real.'},
  ],
  tasks: [
    {id:'TASK-001',hiveId:'DEMO-002',title:'Revisar reservas y puesta',due:'2026-10-30',priority:'Alta',done:false},
    {id:'TASK-002',hiveId:'DEMO-004',title:'Realizar revisión sanitaria de ejemplo',due:'2026-10-31',priority:'Alta',done:false},
    {id:'TASK-003',hiveId:'DEMO-001',title:'Comprobar espacio disponible',due:'2026-11-03',priority:'Normal',done:false},
  ],
  harvests: [
    {id:'LOT-001',date:'2026-07-20',product:'Miel',quantity:18.4,lot:'DEMO-MIEL-2026-01'},
    {id:'LOT-002',date:'2026-08-05',product:'Miel',quantity:12.6,lot:'DEMO-MIEL-2026-02'},
  ],
};
function readState(): { state: DemoState; writable: boolean; message: string } {
  if (typeof window === 'undefined') return {state:seedState,writable:false,message:''};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {state:seedState,writable:true,message:''};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && (parsed as DemoState).version === 1 &&
        Array.isArray((parsed as DemoState).hives) && Array.isArray((parsed as DemoState).logs) &&
        Array.isArray((parsed as DemoState).tasks) && Array.isArray((parsed as DemoState).harvests)) {
      return {state:parsed as DemoState,writable:true,message:''};
    }
    return {state:seedState,writable:false,message:'La copia local de demostración no tiene el formato esperado. Se conserva sin sobrescribir; exporta cualquier copia que necesites antes de reiniciar.'};
  } catch {
    return {state:seedState,writable:false,message:'No se ha podido leer el almacenamiento local. No se guardarán cambios para evitar sobrescribir datos existentes.'};
  }
}
const initial = readState();
const makeId = (prefix: string) => prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
const fmtDate = (value: string) => value ? new Date(value + 'T12:00:00').toLocaleDateString('es-ES') : 'Sin fecha';

type Tab = 'Resumen' | 'Colmenas' | 'Revisiones' | 'Sanidad' | 'Alimentación' | 'Producción' | 'Tareas';
const tabs: Tab[] = ['Resumen','Colmenas','Revisiones','Sanidad','Alimentación','Producción','Tareas'];

export default function App() {
  const [data, setData] = useState<DemoState>(initial.state);
  const [canSave, setCanSave] = useState(initial.writable);
  const [storageWarning, setStorageWarning] = useState(initial.message);
  const [selectedId, setSelectedId] = useState(data.hives[0]?.id ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<HiveStatus>('Revisar');
  const [bulkTaskTitle, setBulkTaskTitle] = useState('');
  const [bulkTaskDue, setBulkTaskDue] = useState(today());
  const [bulkTaskPriority, setBulkTaskPriority] = useState<Task['priority']>('Normal');
  const [night, setNight] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tab, setTab] = useState<Tab>('Resumen');
  const [query, setQuery] = useState('');
  const [logKind, setLogKind] = useState<LogEntry['kind']>('Revisión');
  const [logDetail, setLogDetail] = useState('');
  const [logDate, setLogDate] = useState(today());
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(today());
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('Normal');
  const [newHiveName, setNewHiveName] = useState('');
  const [newHiveKind, setNewHiveKind] = useState<Hive['kind']>('Colmena');
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestDate, setHarvestDate] = useState(today());
  const [harvestProduct, setHarvestProduct] = useState('Miel');
  const [harvestLot, setHarvestLot] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState('');

  useEffect(() => {
    if (!canSave) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setStorageWarning(''); }
    catch { setCanSave(false); setStorageWarning('El navegador no permite guardar ahora. Los cambios de esta sesión no están garantizados; exporta una copia JSON.'); }
  }, [data, canSave]);

  const selected = data.hives.find(h => h.id === selectedId) ?? data.hives[0];
  const visibleHives = useMemo(() => data.hives.filter(h => (h.name + ' ' + h.id + ' ' + h.kind + ' ' + h.status).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))), [data.hives, query]);
  const pendingTasks = data.tasks.filter(t => !t.done).sort((a,b) => a.due.localeCompare(b.due));
  const totalHarvest = data.harvests.reduce((sum, item) => sum + item.quantity, 0);
  const toggleHiveSelection = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectVisibleHives = () => setSelectedIds(prev => [...new Set([...prev, ...visibleHives.map(h => h.id)])]);
  const clearHiveSelection = () => setSelectedIds([]);
  const applyBulkStatus = () => { if (!selectedIds.length) return; setData(prev => ({...prev, hives:prev.hives.map(h => selectedIds.includes(h.id) ? {...h,status:bulkStatus} : h)})); };
  const addBulkTasks = (event: React.FormEvent) => { event.preventDefault(); if (!bulkTaskTitle.trim() || !selectedIds.length) return; const created = selectedIds.map(hiveId => ({id:makeId('TASK'),hiveId,title:bulkTaskTitle.trim(),due:bulkTaskDue,priority:bulkTaskPriority,done:false} as Task)); setData(prev=>({...prev,tasks:[...created,...prev.tasks]})); setBulkTaskTitle(''); setTab('Tareas'); };

  const updateHive = (id: string, changes: Partial<Hive>) => setData(prev => ({...prev,hives:prev.hives.map(h=>h.id===id?{...h,...changes}:h)}));
  const addLog = (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !logDetail.trim()) return;
    const entry: LogEntry = {id:makeId('LOG'),hiveId:selected.id,date:logDate,kind:logKind,detail:logDetail.trim()};
    setData(prev=>({...prev,logs:[entry,...prev.logs],hives:prev.hives.map(h=>h.id===selected.id?{...h,lastReview:logKind==='Revisión'?logDate:h.lastReview}:h)}));
    setLogDetail(''); setTab('Revisiones');
  };
  const addTask = (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !taskTitle.trim()) return;
    setData(prev=>({...prev,tasks:[{id:makeId('TASK'),hiveId:selected.id,title:taskTitle.trim(),due:taskDue,priority:taskPriority,done:false},...prev.tasks]}));
    setTaskTitle(''); setTab('Tareas');
  };
  const addHive = (event: React.FormEvent) => {
    event.preventDefault(); if (!newHiveName.trim()) return;
    const hive: Hive = {id:makeId('DEMO'),name:newHiveName.trim(),kind:newHiveKind,status:'Activa',note:'Nueva ficha creada en el entorno de demostración.',queen:'Sin marcar',queenYear:new Date().getFullYear(),population:'Sin registrar',reserves:'Sin registrar',brood:'Sin registrar',lastReview:'',production:0,apiary:'Apiario Demo'};
    setData(prev=>({...prev,hives:[...prev.hives,hive]})); setSelectedId(hive.id); setNewHiveName(''); setTab('Colmenas');
  };
  const addHarvest = (event: React.FormEvent) => {
    event.preventDefault(); const quantity=Number(harvestQty);
    if (!Number.isFinite(quantity) || quantity<=0 || !harvestLot.trim()) return;
    setData(prev=>({...prev,harvests:[{id:makeId('LOT'),date:harvestDate,product:harvestProduct,quantity,lot:harvestLot.trim()},...prev.harvests]}));
    setHarvestQty(''); setHarvestLot(''); setTab('Producción');
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({app:'mi-apiario-3d-demo',version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='mi-apiario-3d-demo-copia.json'; link.click(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    setBackupMessage('Copia JSON exportada. Guárdala fuera del dispositivo para tener una segunda copia.');
  };
  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file=event.target.files?.[0];
    if (!file) return;
    setBackupMessage('');
    try {
      if (file.size > 5_000_000) throw new Error('El archivo supera el límite de 5 MB.');
      const parsed: unknown = JSON.parse(await file.text());
      if (typeof parsed !== 'object' || parsed === null) throw new Error('El archivo no contiene un objeto JSON válido.');
      const backup=parsed as {app?:unknown;version?:unknown;data?:unknown};
      if (backup.app !== 'mi-apiario-3d-demo' || backup.version !== 1 || typeof backup.data !== 'object' || backup.data === null) throw new Error('No es una copia compatible de Mi Apiario 3D de demostración. No se ha cambiado ningún dato.');
      const candidate=backup.data as Partial<DemoState>;
      if (candidate.version !== 1 || !Array.isArray(candidate.hives) || !Array.isArray(candidate.logs) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.harvests)) throw new Error('La copia está incompleta o tiene una estructura no válida. No se ha cambiado ningún dato.');
      const ids=new Set<string>();
      for (const hive of candidate.hives) {
        if (!hive || typeof hive.id !== 'string' || !hive.id || typeof hive.name !== 'string' || !['Colmena','Núcleo'].includes(hive.kind) || ids.has(hive.id)) throw new Error('La copia contiene fichas inválidas o identificadores repetidos. No se ha cambiado ningún dato.');
        ids.add(hive.id);
      }
      for (const row of [...candidate.logs,...candidate.tasks]) if (!row || typeof row.id !== 'string' || typeof row.hiveId !== 'string' || !ids.has(row.hiveId)) throw new Error('Hay registros o tareas vinculados a colmenas inexistentes. No se ha cambiado ningún dato.');
      for (const lot of candidate.harvests) if (!lot || typeof lot.id !== 'string' || typeof lot.quantity !== 'number' || !Number.isFinite(lot.quantity) || lot.quantity < 0 || typeof lot.lot !== 'string') throw new Error('La copia contiene lotes de producción inválidos. No se ha cambiado ningún dato.');
      if (!window.confirm(`Vas a restaurar ${candidate.hives.length} fichas, ${candidate.logs.length} registros, ${candidate.tasks.length} tareas y ${candidate.harvests.length} lotes. Esto reemplazará los datos actuales de DEMOSTRACIÓN de este navegador. Exporta una copia antes si quieres conservarlos. ¿Continuar?`)) { setBackupMessage('Restauración cancelada. Los datos actuales no se han modificado.'); return; }
      const safeState=candidate as DemoState;
      try { window.localStorage.setItem(STORAGE_KEY,JSON.stringify(safeState)); }
      catch { setCanSave(false); setStorageWarning('No hay espacio disponible para restaurar la copia. Los datos anteriores no se han reemplazado.'); throw new Error('El navegador no ha podido guardar la copia. Libera espacio y vuelve a intentarlo.'); }
      setData(safeState); setSelectedIds([]); setSelectedId(safeState.hives[0]?.id ?? ''); setCanSave(true); setStorageWarning(''); setBackupMessage('Copia restaurada y validada correctamente.');
    } catch (error) { setBackupMessage(error instanceof Error ? error.message : 'No se pudo leer la copia. No se han importado datos.'); }
    finally { event.target.value=''; }
  };

  return <main className={night ? 'app night' : 'app'}>
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">🐝</div>
      <div className="brand"><strong>Mi Apiario <span>3D</span></strong><small>El cuaderno apícola dentro de tu apiario</small></div>
      <div className="header-actions"><span className="offline-pill">● Modo demostración</span><button onClick={()=>setNight(v=>!v)}>{night?'☀️ Día':'🌙 Noche'}</button><button onClick={()=>setShowHelp(v=>!v)} aria-expanded={showHelp}>ⓘ Ayuda</button></div>
    </header>
    {showHelp && <div className="help-banner"><strong>Prototipo funcional:</strong> puedes crear fichas, registrar revisiones, sanidad, alimentación, tareas y producción. Todo se guarda localmente en este navegador bajo una clave exclusiva de demostración. No se conecta a Mi Apiario real.</div>}
    {storageWarning && <div className="storage-warning" role="alert">{storageWarning} <button onClick={exportBackup}>Exportar copia visible</button></div>}
    <nav className="app-tabs" aria-label="Secciones del cuaderno">{tabs.map(item=><button key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}>{item}</button>)}<button className="backup-tab" onClick={exportBackup}>⇩ Copia JSON</button><button type="button" className="backup-tab" onClick={()=>importFileRef.current?.click()}>↥ Restaurar copia</button><input ref={importFileRef} type="file" accept="application/json,.json" onChange={importBackup} hidden aria-label="Seleccionar copia JSON para restaurar"/></nav>
    {backupMessage && <div className="backup-message" role="status"><span>{backupMessage}</span><button type="button" onClick={()=>setBackupMessage('')} aria-label="Cerrar aviso">×</button></div>

    {tab==='Resumen' && <>
      <section className="workspace">
        <div className="scene-panel"><div className="scene-label"><span className="live-dot" /> APIARIO EN 3D <span>· {data.hives.length} fichas de prueba</span></div><ApiaryScene selectedId={selected?.id ?? ''} onSelect={setSelectedId} night={night}/><div className="scene-footer"><span>↔ Arrastra para mirar alrededor</span><span>Selecciona una colmena</span></div></div>
        {selected && <aside className="side-panel">
          <div className="panel-heading"><div><small>FICHA SELECCIONADA</small><h1>{selected.name}</h1></div><span className="hive-emoji">▦</span></div>
          <div className="id-chip">{selected.id}</div>
          <div className="status-row"><span>Estado</span><select aria-label="Estado de la colmena" value={selected.status} onChange={e=>updateHive(selected.id,{status:e.target.value as HiveStatus})}><option>Activa</option><option>Revisar</option><option>Atención</option></select></div>
          <p className="note">{selected.note}</p>
          <div className="detail-card"><small>DATOS APÍCOLAS DE EJEMPLO</small>
            <div className="detail-line"><span>Tipo</span><strong>{selected.kind}</strong></div><div className="detail-line"><span>Apiario</span><strong>{selected.apiary}</strong></div>
            <div className="detail-line"><span>Reina · color</span><strong><i className={'queen-dot queen-'+selected.queen.toLowerCase()}/>{selected.queen}</strong></div>
            <div className="detail-line"><span>Año de reina</span><strong>{selected.queenYear}</strong></div><div className="detail-line"><span>Población</span><strong>{selected.population}</strong></div>
            <div className="detail-line"><span>Reservas</span><strong>{selected.reserves}</strong></div><div className="detail-line"><span>Cría</span><strong>{selected.brood}</strong></div>
            <div className="detail-line"><span>Última revisión</span><strong>{fmtDate(selected.lastReview)}</strong></div><div className="detail-line"><span>Producción orientativa</span><strong>{selected.production.toLocaleString('es-ES')} kg</strong></div>
          </div>
          <div className="quick-actions"><button onClick={()=>{setLogKind('Revisión');setTab('Revisiones')}}>＋ Registrar revisión</button><button onClick={()=>setTab('Sanidad')}>＋ Sanidad</button><button onClick={()=>setTab('Alimentación')}>＋ Alimentación</button></div>
          <p className="panel-footnote">Datos ficticios · Proyecto independiente · Sin conexión con Mi Apiario real.</p>
        </aside>}
      </section>
      <section className="stats-grid"><Stat label="Colonias" value={data.hives.length} detail="Colmenas y núcleos demo"/><Stat label="Tareas pendientes" value={pendingTasks.length} detail="Seguimiento de trabajo"/><Stat label="Registros" value={data.logs.length} detail="Revisiones y actividad"/><Stat label="Producción demo" value={totalHarvest.toLocaleString('es-ES')+' kg'} detail="Lotes de ejemplo"/></section>
      <section className="lower-grid"><div className="list-card"><h2>Próximas tareas</h2>{pendingTasks.slice(0,4).map(t=><TaskRow key={t.id} task={t} hive={data.hives.find(h=>h.id===t.hiveId)?.name??'Sin colmena'} onToggle={()=>setData(prev=>({...prev,tasks:prev.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}))}/>)}</div><div className="list-card"><h2>Actividad reciente</h2>{data.logs.slice(0,4).map(log=><div className="activity-row" key={log.id}><span className="activity-icon">◷</span><div><strong>{log.kind} · {data.hives.find(h=>h.id===log.hiveId)?.name??'Colmena'}</strong><p>{fmtDate(log.date)} · {log.detail}</p></div></div>)}</div></section>
    </>}

    {tab==='Colmenas' && <section className="feature-page"><PageTitle title="Colmenas y núcleos" subtitle="Crea fichas de demostración y selecciona cada colonia para consultar su información."/><form className="inline-form" onSubmit={addHive}><input value={newHiveName} onChange={e=>setNewHiveName(e.target.value)} placeholder="Nombre o número de colmena" aria-label="Nombre de nueva colmena" required/><select value={newHiveKind} onChange={e=>setNewHiveKind(e.target.value as Hive['kind'])}><option>Colmena</option><option>Núcleo</option></select><button className="primary-button">＋ Añadir ficha</button></form><input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre, ID o estado…"/>
      <div className="bulk-toolbar"><div className="bulk-heading"><strong>Acciones sobre varias colmenas</strong><span>{selectedIds.length} seleccionada(s)</span></div><div className="bulk-buttons"><button type="button" onClick={selectVisibleHives}>Seleccionar resultados</button><button type="button" onClick={clearHiveSelection}>Quitar selección</button><label>Estado común<select value={bulkStatus} onChange={e=>setBulkStatus(e.target.value as HiveStatus)}><option>Activa</option><option>Revisar</option><option>Atención</option></select></label><button type="button" className="primary-button" disabled={!selectedIds.length} onClick={applyBulkStatus}>Aplicar estado</button></div>
      <form className="bulk-task-form" onSubmit={addBulkTasks}><input value={bulkTaskTitle} onChange={e=>setBulkTaskTitle(e.target.value)} placeholder="Tarea para todas las seleccionadas" required/><input type="date" value={bulkTaskDue} onChange={e=>setBulkTaskDue(e.target.value)} required/><select value={bulkTaskPriority} onChange={e=>setBulkTaskPriority(e.target.value as Task['priority'])}><option>Normal</option><option>Alta</option></select><button type="submit" className="primary-button" disabled={!selectedIds.length}>Crear tarea para cada una</button></form>
      <p className="bulk-hint">Marca varias fichas y aplica el mismo estado o crea una tarea individual para cada colmena. No se borran registros.</p></div>
      <div className="hive-grid">{visibleHives.map(h=><article className={'hive-list-card '+(selectedId===h.id?'selected':'')+(selectedIds.includes(h.id)?' bulk-selected':'')} key={h.id}><label className="hive-select-check"><input type="checkbox" checked={selectedIds.includes(h.id)} onChange={()=>toggleHiveSelection(h.id)} aria-label={'Seleccionar '+h.name}/><span>Seleccionar</span></label><button type="button" className="hive-open-button" onClick={()=>{setSelectedId(h.id);setTab('Resumen')}}><span className="hive-list-icon">▦</span><span className="hive-list-main"><strong>{h.name}</strong><small>{h.id} · {h.kind}</small></span><span className={'status '+h.status.toLowerCase().replace(' ','-')}>{h.status}</span><span className="hive-list-foot">Reina {h.queen} · Última revisión: {fmtDate(h.lastReview)}</span></button></article>)}</div></section>}

    {tab==='Revisiones' && <section className="feature-page"><PageTitle title="Revisiones y actividad" subtitle="Registra inspecciones, observaciones y actuaciones por colonia."/><form className="record-form" onSubmit={addLog}><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name} ({h.id})</option>)}</select></label><label>Tipo de registro<select value={logKind} onChange={e=>setLogKind(e.target.value as LogEntry['kind'])}><option>Revisión</option><option>Sanidad</option><option>Alimentación</option><option>Nota</option></select></label><label>Fecha<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} required/></label><label className="full-field">Observaciones<textarea value={logDetail} onChange={e=>setLogDetail(e.target.value)} placeholder="Población, cría, reservas, comportamiento…" required rows={3}/></label><button className="primary-button">Guardar registro de demostración</button></form><RecordList logs={data.logs} hives={data.hives} onDelete={id=>setData(prev=>({...prev,logs:prev.logs.filter(l=>l.id!==id)}))}/></section>}

    {tab==='Sanidad' && <section className="feature-page"><PageTitle title="Sanidad" subtitle="Registro básico de tratamientos y observaciones. No es un diagnóstico ni sustituye la orientación veterinaria."/><form className="record-form" onSubmit={addLog}><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Registro sanitario<select value={logKind} onChange={e=>setLogKind(e.target.value as LogEntry['kind'])}><option>Sanidad</option><option>Revisión</option><option>Nota</option></select></label><label>Fecha<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} required/></label><label className="full-field">Producto o observación<textarea value={logDetail} onChange={e=>setLogDetail(e.target.value)} placeholder="Producto autorizado, fecha, observaciones o seguimiento…" required rows={3}/></label><button className="primary-button">Guardar registro sanitario</button></form><div className="notice-card"><strong>Importante:</strong> este prototipo solo guarda notas de ejemplo. No calcula dosis ni recomienda tratamientos. Comprueba siempre la etiqueta y las indicaciones profesionales.</div><RecordList logs={data.logs.filter(l=>l.kind==='Sanidad')} hives={data.hives} onDelete={id=>setData(prev=>({...prev,logs:prev.logs.filter(l=>l.id!==id)}))}/></section>}

    {tab==='Alimentación' && <section className="feature-page"><PageTitle title="Alimentación" subtitle="Anota alimentación suministrada y deja un historial por colmena."/><form className="record-form" onSubmit={addLog}><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Tipo<select value={logKind} onChange={e=>setLogKind(e.target.value as LogEntry['kind'])}><option>Alimentación</option><option>Revisión</option><option>Nota</option></select></label><label>Fecha<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} required/></label><label className="full-field">Tipo, cantidad y observaciones<textarea value={logDetail} onChange={e=>setLogDetail(e.target.value)} placeholder="Ej.: jarabe / cantidad / motivo / próxima comprobación…" required rows={3}/></label><button className="primary-button">Guardar alimentación</button></form><RecordList logs={data.logs.filter(l=>l.kind==='Alimentación')} hives={data.hives} onDelete={id=>setData(prev=>({...prev,logs:prev.logs.filter(l=>l.id!==id)}))}/></section>}

    {tab==='Producción' && <section className="feature-page"><PageTitle title="Producción y lotes" subtitle="Registra cosechas por producto, fecha, cantidad y lote."/><div className="stats-grid compact-stats"><Stat label="Producción registrada" value={totalHarvest.toLocaleString('es-ES')+' kg'} detail="Todos los lotes demo"/><Stat label="Lotes" value={data.harvests.length} detail="Histórico local"/></div><form className="record-form" onSubmit={addHarvest}><label>Producto<select value={harvestProduct} onChange={e=>setHarvestProduct(e.target.value)}><option>Miel</option><option>Polen</option><option>Propóleo</option><option>Cera</option><option>Jalea real</option></select></label><label>Cantidad (kg)<input type="number" min="0.01" step="0.01" value={harvestQty} onChange={e=>setHarvestQty(e.target.value)} placeholder="0,00" required/></label><label>Fecha<input type="date" value={harvestDate} onChange={e=>setHarvestDate(e.target.value)} required/></label><label>Lote<input value={harvestLot} onChange={e=>setHarvestLot(e.target.value)} placeholder="Ej. DEMO-MIEL-2026-03" required/></label><button className="primary-button">＋ Registrar producción</button></form><div className="record-list">{data.harvests.map(h=><article className="record-row" key={h.id}><span className="record-symbol">⚖</span><div className="record-main"><strong>{h.product} · {h.quantity.toLocaleString('es-ES')} kg</strong><p>{fmtDate(h.date)} · Lote {h.lot}</p></div><button className="danger-link" onClick={()=>setData(prev=>({...prev,harvests:prev.harvests.filter(x=>x.id!==h.id)}))}>Eliminar</button></article>)}</div></section>}

    {tab==='Tareas' && <section className="feature-page"><PageTitle title="Tareas y seguimiento" subtitle="Organiza revisiones pendientes y marca las tareas completadas."/><form className="record-form" onSubmit={addTask}><label className="full-field">Tarea<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Ej. revisar reservas" required/></label><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Fecha prevista<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)} required/></label><label>Prioridad<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value as Task['priority'])}><option>Normal</option><option>Alta</option></select></label><button className="primary-button">＋ Crear tarea</button></form><div className="record-list">{[...data.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||a.due.localeCompare(b.due)).map(t=><TaskRow key={t.id} task={t} hive={data.hives.find(h=>h.id===t.hiveId)?.name??'Colmena'} onToggle={()=>setData(prev=>({...prev,tasks:prev.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)}))} onDelete={()=>setData(prev=>({...prev,tasks:prev.tasks.filter(x=>x.id!==t.id)}))}/>)}</div></section>}

    <footer className="app-footer">MI APIARIO 3D <span>·</span> Funciones inspiradas en el cuaderno apícola <span>·</span> Datos ficticios aislados</footer>
  </main>;
}

function PageTitle({title,subtitle}:{title:string;subtitle:string}) { return <div className="page-title"><p>CUADERNO APÍCOLA · DEMOSTRACIÓN</p><h1>{title}</h1><span>{subtitle}</span></div>; }
function Stat({label,value,detail}:{label:string;value:string|number;detail:string}) { return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function TaskRow({task,hive,onToggle,onDelete}:{task:Task;hive:string;onToggle:()=>void;onDelete?:()=>void}) { return <div className={'task-row '+(task.done?'task-done':'')}><button className="check-task" onClick={onToggle} aria-label={task.done?'Marcar pendiente':'Marcar completada'}>{task.done?'✓':''}</button><div className="task-row-main"><strong>{task.title}</strong><p>{hive} · {fmtDate(task.due)} · Prioridad {task.priority.toLowerCase()}</p></div>{onDelete&&<button className="danger-link" onClick={onDelete}>Eliminar</button>}</div>; }
function RecordList({logs,hives,onDelete}:{logs:LogEntry[];hives:Hive[];onDelete:(id:string)=>void}) { const rows=[...logs].sort((a,b)=>b.date.localeCompare(a.date)); return <div className="record-list"><h2>Historial ({rows.length})</h2>{rows.length===0?<p className="empty-note">Todavía no hay registros en esta sección.</p>:rows.map(log=><article className="record-row" key={log.id}><span className="record-symbol">◷</span><div className="record-main"><strong>{log.kind} · {hives.find(h=>h.id===log.hiveId)?.name??'Colmena'}</strong><p>{fmtDate(log.date)} · {log.detail}</p></div><button className="danger-link" onClick={()=>onDelete(log.id)}>Eliminar</button></article>)}</div>; }
