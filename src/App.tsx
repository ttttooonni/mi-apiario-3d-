import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { queenColorForYear, queenDotClass } from './queenColor';
import { seedState } from './demoData';
import { buildExport, loadState, parseImport, safeStorage, saveState, TUTORIAL_KEY, type DemoState, type Harvest, type Hive, type HiveStatus, type LogEntry, type Task } from './storage';
import { TUTORIAL_DONE, TUTORIAL_STEPS, tutorialBack, tutorialOnEvent, tutorialTab, type TutorialEvent } from './tutorial';

// three.js (~600 kB) is only downloaded when the 3D view is shown, so the notebook appears first.
const ApiaryScene = lazy(() => import('./world/ApiaryScene'));

const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const makeId = (prefix: string) => prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
const fmtDate = (value: string) => value ? new Date(value + 'T12:00:00').toLocaleDateString('es-ES') : 'Sin fecha';
const askConfirm = (text: string) => { try { return window.confirm(text); } catch { return false; } };

type Tab = 'Resumen' | 'Colmenas' | 'Revisiones' | 'Sanidad' | 'Alimentación' | 'Producción' | 'Tareas';
const tabs: Tab[] = ['Resumen','Colmenas','Revisiones','Sanidad','Alimentación','Producción','Tareas'];
type Notice = { kind: 'ok' | 'error'; text: string } | null;

export default function App() {
  const storage = useMemo(() => safeStorage(), []);
  const [initial] = useState(() => loadState(storage, seedState));
  const [data, setData] = useState<DemoState>(initial.state);
  const dataRef = useRef(data);
  const [canSave, setCanSave] = useState(initial.writable);
  const [storageWarning, setStorageWarning] = useState(initial.message);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedId, setSelectedId] = useState(initial.state.hives[0]?.id ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<HiveStatus>('Revisar');
  const [bulkTaskTitle, setBulkTaskTitle] = useState('');
  const [bulkTaskDue, setBulkTaskDue] = useState(today());
  const [bulkTaskPriority, setBulkTaskPriority] = useState<Task['priority']>('Normal');
  const [night, setNight] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => { try { return storage?.getItem(TUTORIAL_KEY) !== '1'; } catch { return true; } });
  const [tutorialStep, setTutorialStep] = useState(-1);
  const lastTutorialStep = useRef(0);
  const [showHiveModal, setShowHiveModal] = useState(false);
  const [tab, setTab] = useState<Tab>('Resumen');
  const [query, setQuery] = useState('');
  const [logKind, setLogKind] = useState<LogEntry['kind']>('Revisión');
  const [logDetail, setLogDetail] = useState('');
  const [logDate, setLogDate] = useState(today());
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(today());
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('Normal');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newHiveName, setNewHiveName] = useState('');
  const [newHiveKind, setNewHiveKind] = useState<Hive['kind']>('Colmena');
  const [harvestQty, setHarvestQty] = useState('');
  const [harvestDate, setHarvestDate] = useState(today());
  const [harvestProduct, setHarvestProduct] = useState('Miel');
  const [harvestLot, setHarvestLot] = useState('');
  const submitLock = useRef<Record<string, number>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  /** Applies a change, writes it synchronously and reports whether it really reached storage. */
  const commit = useCallback((update: (prev: DemoState) => DemoState): boolean => {
    const next = update(dataRef.current);
    dataRef.current = next; setData(next);
    if (!canSave) return false;
    if (saveState(storage, next)) { setStorageWarning(''); return true; }
    setCanSave(false);
    setStorageWarning('No se ha podido guardar en este navegador (sin espacio o bloqueado). El último cambio solo está en pantalla; descarga una copia JSON antes de cerrar.');
    return false;
  }, [canSave, storage]);

  // First visit: write the demo data once so reloads keep the same records.
  useEffect(() => { if (initial.writable && initial.raw === null) commit(prev => prev); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Blocks accidental double taps on submit buttons (two identical records). */
  const lockSubmit = (form: string) => { const now = Date.now(); if (now - (submitLock.current[form] ?? 0) < 700) return false; submitLock.current[form] = now; return true; };
  const say = (kind: 'ok' | 'error', text: string) => setNotice({ kind, text });
  const savedMsg = (ok: boolean, what: string) => say(ok ? 'ok' : 'error', ok ? `${what} guardado en este navegador.` : `${what} visible, pero NO guardado: el almacenamiento no está disponible.`);

  const advanceTutorial = (event: TutorialEvent) => setTutorialStep(step => { const next = tutorialOnEvent(step, event); if (next !== step) { const t = tutorialTab(next); if (t) setTab(t); } return next; });
  const openTutorial = () => { const step = lastTutorialStep.current >= TUTORIAL_DONE ? 0 : lastTutorialStep.current; setShowHelp(false); setTutorialStep(step); setTab(tutorialTab(step) ?? 'Resumen'); };
  useEffect(() => { if (tutorialStep >= 0) lastTutorialStep.current = tutorialStep; }, [tutorialStep]);
  const startWelcome = (withTutorial: boolean) => { setShowWelcome(false); try { storage?.setItem(TUTORIAL_KEY, '1'); } catch { /* sin almacenamiento: se volverá a mostrar */ } if (withTutorial) { setTutorialStep(0); setTab('Resumen'); } };

  const selected = data.hives.find(h => h.id === selectedId) ?? data.hives[0];
  const visibleHives = useMemo(() => data.hives.filter(h => (h.name + ' ' + h.id + ' ' + h.kind + ' ' + h.status).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))), [data.hives, query]);
  const pendingTasks = data.tasks.filter(t => !t.done).sort((a,b) => a.due.localeCompare(b.due));
  const totalHarvest = data.harvests.reduce((sum, item) => sum + item.quantity, 0);
  const sceneHives = useMemo(() => data.hives.map(({id,name,kind,status,queen,queenYear}) => ({id,name,kind,status,queen,queenYear})), [data.hives]);
  const toggleHiveSelection = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectVisibleHives = () => setSelectedIds(prev => [...new Set([...prev, ...visibleHives.map(h => h.id)])]);
  const clearHiveSelection = () => setSelectedIds([]);
  const applyBulkStatus = () => { if (!selectedIds.length) return; savedMsg(commit(prev => ({...prev, hives:prev.hives.map(h => selectedIds.includes(h.id) ? {...h,status:bulkStatus} : h)})), 'Estado'); };
  const addBulkTasks = (event: React.FormEvent) => { event.preventDefault(); if (!bulkTaskTitle.trim() || !selectedIds.length || !lockSubmit('bulk')) return; const created = selectedIds.map(hiveId => ({id:makeId('TASK'),hiveId,title:bulkTaskTitle.trim(),due:bulkTaskDue,priority:bulkTaskPriority,done:false} as Task)); savedMsg(commit(prev=>({...prev,tasks:[...created,...prev.tasks]})), `${created.length} tareas`); setBulkTaskTitle(''); setTab('Tareas'); };

  const updateHive = (id: string, changes: Partial<Hive>) => savedMsg(commit(prev => ({...prev,hives:prev.hives.map(h=>h.id===id?{...h,...changes}:h)})), 'Cambio');
  const addLog = (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !logDetail.trim() || !lockSubmit('log')) return;
    const detail = logDetail.trim();
    let ok: boolean;
    if (editingLogId) {
      ok = commit(prev => ({...prev, logs: prev.logs.map(l => l.id === editingLogId ? {...l, hiveId: selected.id, date: logDate, kind: logKind, detail} : l)}));
      setEditingLogId(null); savedMsg(ok, 'Registro editado');
    } else {
      const entry: LogEntry = {id:makeId('LOG'),hiveId:selected.id,date:logDate,kind:logKind,detail};
      ok = commit(prev=>({...prev,logs:[entry,...prev.logs],hives:prev.hives.map(h=>h.id===selected.id&&logKind==='Revisión'&&logDate>(h.lastReview||'')?{...h,lastReview:logDate}:h)}));
      savedMsg(ok, 'Registro');
      if (ok) advanceTutorial('logSaved');
    }
    setLogDetail('');
  };
  const editLog = (log: LogEntry) => { setEditingLogId(log.id); setSelectedId(log.hiveId); setLogKind(log.kind); setLogDate(log.date); setLogDetail(log.detail); setTab(log.kind === 'Sanidad' ? 'Sanidad' : log.kind === 'Alimentación' ? 'Alimentación' : 'Revisiones'); };
  const deleteLog = (id: string) => { if (askConfirm('¿Eliminar este registro de demostración? Esta acción no se puede deshacer.')) savedMsg(commit(prev=>({...prev,logs:prev.logs.filter(l=>l.id!==id)})), 'Borrado'); };
  const addTask = (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !taskTitle.trim() || !taskDue || !lockSubmit('task')) return;
    const title = taskTitle.trim();
    if (editingTaskId) {
      savedMsg(commit(prev => ({...prev, tasks: prev.tasks.map(t => t.id === editingTaskId ? {...t, hiveId: selected.id, title, due: taskDue, priority: taskPriority} : t)})), 'Tarea editada');
      setEditingTaskId(null);
    } else {
      const ok = commit(prev=>({...prev,tasks:[{id:makeId('TASK'),hiveId:selected.id,title,due:taskDue,priority:taskPriority,done:false},...prev.tasks]}));
      savedMsg(ok, 'Tarea');
      if (ok) advanceTutorial('taskSaved');
    }
    setTaskTitle(''); setTab('Tareas');
  };
  const editTask = (task: Task) => { setEditingTaskId(task.id); setSelectedId(task.hiveId); setTaskTitle(task.title); setTaskDue(task.due); setTaskPriority(task.priority); setTab('Tareas'); };
  const toggleTask = (id: string) => commit(prev=>({...prev,tasks:prev.tasks.map(x=>x.id===id?{...x,done:!x.done}:x)}));
  const deleteTask = (id: string) => { if (askConfirm('¿Eliminar esta tarea de demostración?')) savedMsg(commit(prev=>({...prev,tasks:prev.tasks.filter(x=>x.id!==id)})), 'Borrado'); };
  const addHive = (event: React.FormEvent) => {
    event.preventDefault(); if (!newHiveName.trim() || !lockSubmit('hive')) return;
    const hive: Hive = {id:makeId('DEMO'),name:newHiveName.trim(),kind:newHiveKind,status:'Activa',note:'Nueva ficha creada en el entorno de demostración.',queen:'Sin marcar',queenYear:new Date().getFullYear(),population:'Sin registrar',reserves:'Sin registrar',brood:'Sin registrar',lastReview:'',production:0,apiary:'Apiario Demo'};
    savedMsg(commit(prev=>({...prev,hives:[...prev.hives,hive]})), 'Ficha'); setSelectedId(hive.id); setNewHiveName(''); setTab('Colmenas');
  };
  const addHarvest = (event: React.FormEvent) => {
    event.preventDefault(); const quantity=Number(harvestQty.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity<=0 || quantity>10000) { say('error', 'Indica una cantidad mayor que 0 kg.'); return; }
    if (!harvestLot.trim() || !harvestDate) { say('error', 'Faltan el lote o la fecha.'); return; }
    if (!lockSubmit('harvest')) return;
    const lot: Harvest = {id:makeId('LOT'),date:harvestDate,product:harvestProduct,quantity,lot:harvestLot.trim()};
    savedMsg(commit(prev=>({...prev,harvests:[lot,...prev.harvests]})), 'Lote');
    setHarvestQty(''); setHarvestLot(''); setTab('Producción');
  };
  const deleteHarvest = (id: string) => { if (askConfirm('¿Eliminar este lote de demostración?')) savedMsg(commit(prev=>({...prev,harvests:prev.harvests.filter(x=>x.id!==id)})), 'Borrado'); };
  const download = (text: string, name: string) => {
    const blob = new Blob([text],{type:'application/json'});
    const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=name; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const exportBackup = () => {
    // If stored data could not be validated, offer the original text untouched instead of the sample data.
    if (!initial.writable && initial.raw) { download(initial.raw, 'mi-apiario-3d-almacenamiento-original.txt'); say('ok', 'Descargado el contenido original del almacenamiento, sin modificar.'); return; }
    download(buildExport(dataRef.current), 'mi-apiario-3d-demo-copia.json');
    say('ok', 'Descarga iniciada. Comprueba que el archivo aparece en Descargas.');
  };
  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    const result = parseImport(await file.text());
    if (fileInput.current) fileInput.current.value = '';
    if (!result.ok) { say('error', 'Importación cancelada; tus datos no se han tocado. ' + result.errors.slice(0, 3).join(' ')); return; }
    if (!askConfirm(`Vas a SUSTITUIR los datos de demostración actuales por la copia (${result.summary}). Se descargará antes una copia de lo actual. ¿Continuar?`)) { say('ok', 'Importación cancelada. Tus datos no se han tocado.'); return; }
    download(buildExport(dataRef.current), 'mi-apiario-3d-demo-antes-de-importar.json');
    if (!initial.writable && initial.raw) download(initial.raw, 'mi-apiario-3d-almacenamiento-original.txt');
    const next = result.state;
    dataRef.current = next; setData(next); setSelectedId(next.hives[0]?.id ?? '');
    const ok = saveState(storage, next);
    if (ok) { setCanSave(true); setStorageWarning(''); }
    say(ok ? 'ok' : 'error', ok ? `Copia importada: ${result.summary}.` : 'Copia cargada en pantalla, pero no se ha podido guardar en este navegador.');
  };
  const inspectFrame = (hiveId: string, frameIndex: number) => {
    const date = today();
    const entry: LogEntry = {id:makeId('LOG'),hiveId,date,kind:'Revisión',detail:`Inspección visual del cuadro ${frameIndex} desde la escena 3D (dato de demostración).`};
    const inTutorial = tutorialStep === 1;
    setSelectedId(hiveId);
    if (inTutorial) {
      // Tutorial: the observation is pre-filled in the form; it is only stored when the user saves it (no duplicates).
      setLogKind('Revisión'); setLogDate(date); setEditingLogId(null);
      setLogDetail(`Práctica del tutorial: cuadro ${frameIndex} de ${data.hives.find(h=>h.id===hiveId)?.name ?? hiveId}. Cría y reservas por comprobar.`);
      setShowHiveModal(false); advanceTutorial('frameInspected');
    } else {
      savedMsg(commit(prev=>({...prev,logs:[entry,...prev.logs],hives:prev.hives.map(h=>h.id===hiveId?{...h,lastReview:date}:h)})), `Inspección del cuadro ${frameIndex}`);
      setShowHiveModal(true);
    }
  };
  // Each notebook section opens with its own record type so a feeding note is never saved as a review by accident.
  useEffect(() => { if (editingLogId) return; if (tab === 'Sanidad') setLogKind('Sanidad'); else if (tab === 'Alimentación') setLogKind('Alimentación'); else if (tab === 'Revisiones') setLogKind(k => (k === 'Sanidad' || k === 'Alimentación') ? 'Revisión' : k); }, [tab, editingLogId]);
  useEffect(() => { if (!showHiveModal) return; const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowHiveModal(false); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [showHiveModal]);
  const onSceneSelect = (id: string) => { setSelectedId(id); if (tutorialStep === 0) { setShowHiveModal(false); advanceTutorial('hiveSelected'); } else if (tutorialStep < 0 || tutorialStep >= TUTORIAL_DONE) setShowHiveModal(true); };

  return <main className={night ? 'app night' : 'app'}>
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">🐝</div>
      <div className="brand"><strong>Mi Apiario <span>3D</span></strong><small>El cuaderno apícola dentro de tu apiario</small></div>
      <div className="header-actions"><span className="offline-pill">● Modo demostración</span><button type="button" onClick={()=>setNight(v=>!v)} aria-pressed={night}>{night?'☀️ Día':'🌙 Noche'}</button><button type="button" onClick={()=>setShowHelp(v=>!v)} aria-expanded={showHelp}>ⓘ Ayuda</button><button type="button" onClick={openTutorial}>🎓 Tutorial</button></div>
    </header>
    {tutorialStep >= 0 && tutorialStep < TUTORIAL_DONE && <section className="tutorial-banner" aria-live="polite" aria-label="Tutorial guiado">
      <div className="tutorial-step-count">PASO {tutorialStep + 1} DE {TUTORIAL_DONE}</div>
      <div className="tutorial-copy"><strong>{TUTORIAL_STEPS[tutorialStep].title}</strong><p>{TUTORIAL_STEPS[tutorialStep].text}</p><small className="tutorial-waiting">El paso avanza solo cuando hagas la acción indicada.</small></div>
      <div className="tutorial-actions">{tutorialStep > 0 && <button type="button" onClick={()=>{const prev=tutorialBack(tutorialStep);setTutorialStep(prev);setTab(tutorialTab(prev)??'Resumen')}}>← Anterior</button>}<button type="button" className="tutorial-next" onClick={()=>setTab(tutorialTab(tutorialStep)??'Resumen')}>Ir a donde toca</button><button type="button" className="tutorial-skip" onClick={()=>setTutorialStep(-1)}>Salir del tutorial</button></div>
    </section>}
    {tutorialStep === TUTORIAL_DONE && <section className="tutorial-banner tutorial-finished" aria-live="polite"><div className="tutorial-copy"><strong>¡Tutorial completado!</strong><p>Has explorado el apiario, inspeccionado un cuadro, guardado una observación y creado una tarea. Todo queda guardado en este navegador como datos ficticios.</p></div><div className="tutorial-actions"><button type="button" className="tutorial-next" onClick={()=>setTutorialStep(-1)}>Cerrar</button></div></section>}
    {showWelcome && <div className="tutorial-backdrop"><section className="tutorial-welcome" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-bee">🐝</div><p className="tutorial-eyebrow">MI APIARIO 3D · MODO APRENDIZAJE</p><h1 id="tutorial-title">Tu apiario, paso a paso</h1>
      <p className="tutorial-intro">Empieza con un apiario de ejemplo ya preparado: 10 colmenas, fichas de reina, registros, tareas pendientes y lotes de miel. No necesitas introducir datos para comenzar.</p>
      <div className="tutorial-facts"><span><strong>10</strong> colmenas ficticias</span><span><strong>3</strong> registros de ejemplo</span><span><strong>3</strong> tareas para practicar</span></div>
      <div className="tutorial-warning">Todo es ficticio. Los datos se guardan únicamente en este navegador. No hay ninguna conexión con tu Mi Apiario real: no se leen ni se modifican sus datos.</div>
      <button type="button" className="tutorial-start" onClick={()=>startWelcome(true)}>Empezar con datos de ejemplo →</button>
      <button type="button" className="tutorial-later" onClick={()=>startWelcome(false)}>Entrar directamente</button>
    </section></div>}
    {showHelp && <div className="help-banner"><strong>Prototipo funcional:</strong> puedes crear fichas, registrar revisiones, sanidad, alimentación, tareas y producción. Todo se guarda localmente en este navegador bajo una clave exclusiva de demostración. No se conecta a Mi Apiario real. Puedes descargar una copia JSON e importarla después (se pide confirmación antes de sustituir nada).</div>}
    {notice && <div className={'save-notice '+notice.kind} role={notice.kind==='error'?'alert':'status'}>{notice.text}<button type="button" aria-label="Cerrar aviso" onClick={()=>setNotice(null)}>×</button></div>}
    {storageWarning && <div className="storage-warning" role="alert">{storageWarning} <button type="button" onClick={exportBackup}>{!initial.writable && initial.raw ? 'Descargar contenido original' : 'Descargar copia JSON'}</button></div>}
    <nav className="app-tabs" aria-label="Secciones del cuaderno">{tabs.map(item=><button type="button" key={item} className={tab===item?'active':''} aria-current={tab===item?'page':undefined} onClick={()=>setTab(item)}>{item}</button>)}<button type="button" className="backup-tab" onClick={exportBackup}>⇩ Copia JSON</button><button type="button" className="backup-tab" onClick={()=>fileInput.current?.click()}>⇧ Importar JSON</button><input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label="Archivo de copia JSON" onChange={e=>void importBackup(e.target.files?.[0])}/></nav>

    {tab==='Resumen' && <>
      <section className="workspace">
        <div className="scene-panel"><div className="scene-label"><span className="live-dot" /> APIARIO EN 3D <span>· {data.hives.length} fichas de prueba</span></div><Suspense fallback={<div className="three-host scene-loading" role="status">Cargando escena 3D…</div>}><ApiaryScene selectedId={selected?.id ?? ''} onSelect={onSceneSelect} onFrameInspect={inspectFrame} night={night} hives={sceneHives}/></Suspense><div className="scene-footer"><span>↔ Arrastra para mirar alrededor</span><span>Selecciona una colmena</span></div></div>
        {selected && <aside className="side-panel">
          <div className="panel-heading"><div><small>FICHA SELECCIONADA</small><h1>{selected.name}</h1></div><span className="hive-emoji">▦</span></div>
          <div className="id-chip">{selected.id}</div>
          <div className="status-row"><span>Estado</span><select aria-label="Estado de la colmena" value={selected.status} onChange={e=>updateHive(selected.id,{status:e.target.value as HiveStatus})}><option>Activa</option><option>Revisar</option><option>Atención</option></select></div>
          <p className="note">{selected.note}</p>
          <div className="detail-card"><small>DATOS APÍCOLAS DE EJEMPLO</small>
            <div className="detail-line"><span>Tipo</span><strong>{selected.kind}</strong></div><div className="detail-line"><span>Apiario</span><strong>{selected.apiary}</strong></div>
            <div className="detail-line"><span>Reina · color</span><strong><i className={selected.queen==='Sin marcar'?queenDotClass(selected.queenYear,false):queenDotClass(selected.queenYear)}/>{selected.queen==='Sin marcar'?'Sin marcar · pendiente de identificar':queenColorForYear(selected.queenYear)}</strong></div>
            <div className="detail-line"><span>Año de reina</span><strong>{selected.queenYear}</strong></div><div className="detail-line"><span>Población</span><strong>{selected.population}</strong></div>
            <div className="detail-line"><span>Reservas</span><strong>{selected.reserves}</strong></div><div className="detail-line"><span>Cría</span><strong>{selected.brood}</strong></div>
            <div className="detail-line"><span>Última revisión</span><strong>{fmtDate(selected.lastReview)}</strong></div><div className="detail-line"><span>Producción orientativa</span><strong>{selected.production.toLocaleString('es-ES')} kg</strong></div>
          </div>
          <div className="quick-actions"><button type="button" onClick={()=>inspectFrame(selected.id, 5)}>🔍 Inspeccionar un cuadro</button><button type="button" onClick={()=>{setLogKind('Revisión');setTab('Revisiones')}}>＋ Registrar revisión</button><button type="button" onClick={()=>{setLogKind('Sanidad');setTab('Sanidad')}}>＋ Sanidad</button><button type="button" onClick={()=>{setLogKind('Alimentación');setTab('Alimentación')}}>＋ Alimentación</button></div>
          <p className="panel-footnote">Datos ficticios · Proyecto independiente · Sin conexión con Mi Apiario real.</p>
        </aside>}
      </section>
      <section className="stats-grid"><Stat label="Colonias" value={data.hives.length} detail="Colmenas y núcleos demo"/><Stat label="Tareas pendientes" value={pendingTasks.length} detail="Seguimiento de trabajo"/><Stat label="Registros" value={data.logs.length} detail="Revisiones y actividad"/><Stat label="Producción demo" value={totalHarvest.toLocaleString('es-ES')+' kg'} detail="Lotes de ejemplo"/></section>
      <section className="lower-grid"><div className="list-card"><h2>Próximas tareas</h2>{pendingTasks.slice(0,4).map(t=><TaskRow key={t.id} task={t} hive={data.hives.find(h=>h.id===t.hiveId)?.name??'Sin colmena'} onToggle={()=>toggleTask(t.id)}/>)}</div><div className="list-card"><h2>Actividad reciente</h2>{data.logs.slice(0,4).map(log=><div className="activity-row" key={log.id}><span className="activity-icon">◷</span><div><strong>{log.kind} · {data.hives.find(h=>h.id===log.hiveId)?.name??'Colmena'}</strong><p>{fmtDate(log.date)} · {log.detail}</p></div></div>)}</div></section>
    </>}

    {tab==='Colmenas' && <section className="feature-page"><PageTitle title="Colmenas y núcleos" subtitle="Crea fichas de demostración y selecciona cada colonia para consultar su información."/><form className="inline-form" onSubmit={addHive}><input value={newHiveName} onChange={e=>setNewHiveName(e.target.value)} placeholder="Nombre o número de colmena" aria-label="Nombre de nueva colmena" required/><select aria-label="Tipo de ficha" value={newHiveKind} onChange={e=>setNewHiveKind(e.target.value as Hive['kind'])}><option>Colmena</option><option>Núcleo</option></select><button className="primary-button">＋ Añadir ficha</button></form><input className="search-input" type="search" aria-label="Buscar colmenas" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre, ID o estado…"/>
      <div className="bulk-toolbar"><div className="bulk-heading"><strong>Acciones sobre varias colmenas</strong><span>{selectedIds.length} seleccionada(s)</span></div><div className="bulk-buttons"><button type="button" onClick={selectVisibleHives}>Seleccionar resultados</button><button type="button" onClick={clearHiveSelection}>Quitar selección</button><label>Estado común<select value={bulkStatus} onChange={e=>setBulkStatus(e.target.value as HiveStatus)}><option>Activa</option><option>Revisar</option><option>Atención</option></select></label><button type="button" className="primary-button" disabled={!selectedIds.length} onClick={applyBulkStatus}>Aplicar estado</button></div>
      <form className="bulk-task-form" onSubmit={addBulkTasks}><input aria-label="Tarea para las colmenas seleccionadas" value={bulkTaskTitle} onChange={e=>setBulkTaskTitle(e.target.value)} placeholder="Tarea para todas las seleccionadas" required/><input type="date" aria-label="Fecha de la tarea común" value={bulkTaskDue} onChange={e=>setBulkTaskDue(e.target.value)} required/><select aria-label="Prioridad de la tarea común" value={bulkTaskPriority} onChange={e=>setBulkTaskPriority(e.target.value as Task['priority'])}><option>Normal</option><option>Alta</option></select><button type="submit" className="primary-button" disabled={!selectedIds.length}>Crear tarea para cada una</button></form>
      <p className="bulk-hint">Marca varias fichas y aplica el mismo estado o crea una tarea individual para cada colmena. No se borran registros.</p></div>
      <div className="hive-grid">{visibleHives.map(h=><article className={'hive-list-card '+(selectedId===h.id?'selected':'')+(selectedIds.includes(h.id)?' bulk-selected':'')} key={h.id}><label className="hive-select-check"><input type="checkbox" checked={selectedIds.includes(h.id)} onChange={()=>toggleHiveSelection(h.id)} aria-label={'Seleccionar '+h.name}/><span>Seleccionar</span></label><button type="button" className="hive-open-button" onClick={()=>{setSelectedId(h.id);setTab('Resumen')}}><span className="hive-list-icon">▦</span><span className="hive-list-main"><strong>{h.name}</strong><small>{h.id} · {h.kind}</small></span><span className={'status '+h.status.toLowerCase().replace(' ','-')}>{h.status}</span><span className="hive-list-foot">Reina {h.queen==='Sin marcar'?'Sin marcar':queenColorForYear(h.queenYear)} · Última revisión: {fmtDate(h.lastReview)}</span></button></article>)}</div></section>}

    {tab==='Revisiones' && <section className="feature-page"><PageTitle title="Revisiones y actividad" subtitle="Registra inspecciones, observaciones y actuaciones por colonia."/><form className="record-form" onSubmit={addLog}><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name} ({h.id})</option>)}</select></label><label>Tipo de registro<select value={logKind} onChange={e=>setLogKind(e.target.value as LogEntry['kind'])}><option>Revisión</option><option>Sanidad</option><option>Alimentación</option><option>Nota</option></select></label><label>Fecha<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} required/></label><label className="full-field">Observaciones<textarea value={logDetail} onChange={e=>setLogDetail(e.target.value)} placeholder="Población, cría, reservas, comportamiento…" required rows={3}/></label><button type="submit" className="primary-button">{editingLogId?'Guardar cambios del registro':'Guardar registro de demostración'}</button>{editingLogId&&<button type="button" onClick={()=>{setEditingLogId(null);setLogDetail('')}}>Cancelar edición</button>}</form><RecordList logs={data.logs} hives={data.hives} onEdit={editLog} onDelete={deleteLog}/></section>}

    {tab==='Sanidad' && <section className="feature-page"><PageTitle title="Sanidad" subtitle="Registro básico de tratamientos y observaciones. No es un diagnóstico ni sustituye la orientación veterinaria."/><form className="record-form" onSubmit={addLog}><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Registro sanitario<select value={logKind} onChange={e=>setLogKind(e.target.value as LogEntry['kind'])}><option>Sanidad</option><option>Revisión</option><option>Nota</option></select></label><label>Fecha<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} required/></label><label className="full-field">Producto o observación<textarea value={logDetail} onChange={e=>setLogDetail(e.target.value)} placeholder="Producto autorizado, fecha, observaciones o seguimiento…" required rows={3}/></label><button className="primary-button">Guardar registro sanitario</button></form><div className="notice-card"><strong>Importante:</strong> este prototipo solo guarda notas de ejemplo. No calcula dosis ni recomienda tratamientos. Comprueba siempre la etiqueta y las indicaciones profesionales.</div><RecordList logs={data.logs.filter(l=>l.kind==='Sanidad')} hives={data.hives} onEdit={editLog} onDelete={deleteLog}/></section>}

    {tab==='Alimentación' && <section className="feature-page"><PageTitle title="Alimentación" subtitle="Anota alimentación suministrada y deja un historial por colmena."/><form className="record-form" onSubmit={addLog}><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Tipo<select value={logKind} onChange={e=>setLogKind(e.target.value as LogEntry['kind'])}><option>Alimentación</option><option>Revisión</option><option>Nota</option></select></label><label>Fecha<input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} required/></label><label className="full-field">Tipo, cantidad y observaciones<textarea value={logDetail} onChange={e=>setLogDetail(e.target.value)} placeholder="Ej.: jarabe / cantidad / motivo / próxima comprobación…" required rows={3}/></label><button className="primary-button">Guardar alimentación</button></form><RecordList logs={data.logs.filter(l=>l.kind==='Alimentación')} hives={data.hives} onEdit={editLog} onDelete={deleteLog}/></section>}

    {tab==='Producción' && <section className="feature-page"><PageTitle title="Producción y lotes" subtitle="Registra cosechas por producto, fecha, cantidad y lote."/><div className="stats-grid compact-stats"><Stat label="Producción registrada" value={totalHarvest.toLocaleString('es-ES')+' kg'} detail="Todos los lotes demo"/><Stat label="Lotes" value={data.harvests.length} detail="Histórico local"/></div><form className="record-form" onSubmit={addHarvest}><label>Producto<select value={harvestProduct} onChange={e=>setHarvestProduct(e.target.value)}><option>Miel</option><option>Polen</option><option>Propóleo</option><option>Cera</option><option>Jalea real</option></select></label><label>Cantidad (kg)<input type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" value={harvestQty} onChange={e=>setHarvestQty(e.target.value)} placeholder="0,00" required/></label><label>Fecha<input type="date" value={harvestDate} onChange={e=>setHarvestDate(e.target.value)} required/></label><label>Lote<input value={harvestLot} onChange={e=>setHarvestLot(e.target.value)} placeholder="Ej. DEMO-MIEL-2026-03" required/></label><button className="primary-button">＋ Registrar producción</button></form><div className="record-list">{data.harvests.map(h=><article className="record-row" key={h.id}><span className="record-symbol">⚖</span><div className="record-main"><strong>{h.product} · {h.quantity.toLocaleString('es-ES')} kg</strong><p>{fmtDate(h.date)} · Lote {h.lot}</p></div><button type="button" className="danger-link" onClick={()=>deleteHarvest(h.id)} aria-label={'Eliminar lote '+h.lot}>Eliminar</button></article>)}</div></section>}

    {tab==='Tareas' && <section className="feature-page"><PageTitle title="Tareas y seguimiento" subtitle="Organiza revisiones pendientes y marca las tareas completadas."/><form className="record-form" onSubmit={addTask}><label className="full-field">Tarea<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Ej. revisar reservas" required/></label><label>Colmena<select value={selected?.id??''} onChange={e=>setSelectedId(e.target.value)}>{data.hives.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><label>Fecha prevista<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)} required/></label><label>Prioridad<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value as Task['priority'])}><option>Normal</option><option>Alta</option></select></label><button type="submit" className="primary-button">{editingTaskId?'Guardar cambios de la tarea':'＋ Crear tarea'}</button>{editingTaskId&&<button type="button" onClick={()=>{setEditingTaskId(null);setTaskTitle('')}}>Cancelar edición</button>}</form><div className="record-list">{[...data.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||a.due.localeCompare(b.due)).map(t=><TaskRow key={t.id} task={t} hive={data.hives.find(h=>h.id===t.hiveId)?.name??'Colmena'} onToggle={()=>toggleTask(t.id)} onEdit={()=>editTask(t)} onDelete={()=>deleteTask(t.id)}/>)}</div></section>}

    {showHiveModal && selected && <div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setShowHiveModal(false)}}><section className="hive-modal digital-hive-modal" role="dialog" aria-modal="true" aria-labelledby="digital-hive-title"><button type="button" className="modal-close" aria-label="Cerrar ficha" onClick={()=>setShowHiveModal(false)}>×</button><small>FICHA DIGITAL · APIARIO DE DEMOSTRACIÓN</small><h2 id="digital-hive-title">{selected.name}</h2><p className="modal-subtitle">{selected.id} · {selected.kind} · {selected.apiary}</p><div className="digital-status"><span className={'status '+selected.status.toLowerCase().replace(' ','-')}>{selected.status}</span><span>Última revisión: {fmtDate(selected.lastReview)}</span></div><div className="modal-section-title">Colonia y reina</div><div className="modal-grid"><div><span>Reina · color</span><strong>{selected.queen==='Sin marcar'?'Sin marcar':queenColorForYear(selected.queenYear)}</strong></div><div><span>Año de reina</span><strong>{selected.queenYear}</strong></div><div><span>Población estimada</span><strong>{selected.population}</strong></div><div><span>Estado de cría</span><strong>{selected.brood}</strong></div><div><span>Reservas estimadas</span><strong>{selected.reserves}</strong></div><div><span>Producción registrada</span><strong>{selected.production.toLocaleString('es-ES')} kg</strong></div></div><div className="modal-section-title">Observaciones</div><p className="digital-note">{selected.note}</p><div className="modal-section-title">Últimos registros</div>{data.logs.filter(log=>log.hiveId===selected.id).length===0?<p className="digital-empty">Todavía no hay revisiones registradas para esta ficha.</p>:data.logs.filter(log=>log.hiveId===selected.id).slice(0,3).map(log=><div className="digital-log" key={log.id}><strong>{log.kind} · {fmtDate(log.date)}</strong><span>{log.detail}</span></div>)}<div className="modal-section-title">Tareas pendientes</div>{data.tasks.filter(task=>task.hiveId===selected.id&&!task.done).length===0?<p className="digital-empty">No hay tareas pendientes asociadas.</p>:data.tasks.filter(task=>task.hiveId===selected.id&&!task.done).map(task=><div className="digital-log" key={task.id}><strong>{task.title}</strong><span>{fmtDate(task.due)} · Prioridad {task.priority}</span></div>)}<p className="modal-notice">Datos simulados para probar la ficha digital. Las reservas, población y producción son ejemplos, no mediciones reales ni recomendaciones sanitarias.</p><div className="digital-actions"><button type="button" onClick={()=>{setShowHiveModal(false);setLogKind('Revisión');setTab('Revisiones')}}>＋ Registrar revisión</button><button type="button" onClick={()=>{setShowHiveModal(false);setTab('Sanidad')}}>Abrir sanidad</button><button type="button" onClick={()=>{setShowHiveModal(false);setTab('Tareas')}}>Ver tareas</button></div></section></div>}
    <footer className="app-footer">MI APIARIO 3D <span>·</span> Funciones inspiradas en el cuaderno apícola <span>·</span> Datos ficticios aislados</footer>
  </main>;
}

function PageTitle({title,subtitle}:{title:string;subtitle:string}) { return <div className="page-title"><p>CUADERNO APÍCOLA · DEMOSTRACIÓN</p><h1>{title}</h1><span>{subtitle}</span></div>; }
function Stat({label,value,detail}:{label:string;value:string|number;detail:string}) { return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function TaskRow({task,hive,onToggle,onEdit,onDelete}:{task:Task;hive:string;onToggle:()=>void;onEdit?:()=>void;onDelete?:()=>void}) { return <div className={'task-row '+(task.done?'task-done':'')}><button type="button" className="check-task" onClick={onToggle} aria-label={(task.done?'Marcar pendiente: ':'Marcar completada: ')+task.title}>{task.done?'✓':''}</button><div className="task-row-main"><strong>{task.title}</strong><p>{hive} · {fmtDate(task.due)} · Prioridad {task.priority.toLowerCase()}</p></div>{onEdit&&<button type="button" className="danger-link edit-link" onClick={onEdit} aria-label={'Editar tarea '+task.title}>Editar</button>}{onDelete&&<button type="button" className="danger-link" onClick={onDelete} aria-label={'Eliminar tarea '+task.title}>Eliminar</button>}</div>; }
function RecordList({logs,hives,onEdit,onDelete}:{logs:LogEntry[];hives:Hive[];onEdit:(log:LogEntry)=>void;onDelete:(id:string)=>void}) { const rows=[...logs].sort((a,b)=>b.date.localeCompare(a.date)); return <div className="record-list"><h2>Historial ({rows.length})</h2>{rows.length===0?<p className="empty-note">Todavía no hay registros en esta sección.</p>:rows.map(log=><article className="record-row" key={log.id}><span className="record-symbol">◷</span><div className="record-main"><strong>{log.kind} · {hives.find(h=>h.id===log.hiveId)?.name??'Colmena'}</strong><p>{fmtDate(log.date)} · {log.detail}</p></div><button type="button" className="danger-link edit-link" onClick={()=>onEdit(log)}>Editar</button><button type="button" className="danger-link" onClick={()=>onDelete(log.id)}>Eliminar</button></article>)}</div>; }
