import { useState } from 'react';
import ApiaryScene from './world/ApiaryScene';

type Hive = {
  id: string; name: string; status: 'Activa' | 'Revisar' | 'Atención'; note: string;
  queen: string; queenYear: number; population: string; reserves: string; brood: string;
  lastReview: string; production: string; task: string; taskType: 'normal' | 'warning';
};
const demoHives: Hive[] = [
  { id:'DEMO-001', name:'Colmena 01', status:'Activa', note:'Ejemplo ficticio: colonia con actividad normal.', queen:'Amarillo', queenYear:2025, population:'Media-alta', reserves:'Buenas', brood:'Presente', lastReview:'12/10/2026', production:'8,5 kg (ejemplo)', task:'Comprobar espacio disponible', taskType:'normal' },
  { id:'DEMO-002', name:'Colmena 02', status:'Revisar', note:'Ejemplo ficticio: revisión pendiente de realizar.', queen:'Blanco', queenYear:2024, population:'Media', reserves:'Medias', brood:'Por comprobar', lastReview:'28/09/2026', production:'5,2 kg (ejemplo)', task:'Revisar reservas y puesta', taskType:'warning' },
  { id:'DEMO-003', name:'Colmena 03', status:'Activa', note:'Ejemplo ficticio para probar la ficha apícola.', queen:'Verde', queenYear:2026, population:'Fuerte', reserves:'Buenas', brood:'Abundante', lastReview:'15/10/2026', production:'9,1 kg (ejemplo)', task:'Próxima revisión rutinaria', taskType:'normal' },
  { id:'DEMO-004', name:'Colmena 04', status:'Atención', note:'Incidencia de demostración; no representa una alerta sanitaria real.', queen:'Rojo', queenYear:2023, population:'Débil', reserves:'Bajas', brood:'Por comprobar', lastReview:'02/10/2026', production:'2,0 kg (ejemplo)', task:'Inspección sanitaria de ejemplo', taskType:'warning' },
  { id:'DEMO-005', name:'Colmena 05', status:'Activa', note:'Registro ficticio de demostración.', queen:'Amarillo', queenYear:2025, population:'Media', reserves:'Buenas', brood:'Normal', lastReview:'10/10/2026', production:'6,7 kg (ejemplo)', task:'Controlar evolución de reservas', taskType:'normal' },
  { id:'DEMO-006', name:'Colmena 06', status:'Activa', note:'Registro ficticio para probar la interfaz.', queen:'Azul', queenYear:2024, population:'Media-alta', reserves:'Medias', brood:'Normal', lastReview:'14/10/2026', production:'7,4 kg (ejemplo)', task:'Próxima revisión rutinaria', taskType:'normal' },
];

export default function App() {
  const [selected, setSelected] = useState<Hive>(demoHives[0]);
  const [night, setNight] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFullFicha, setShowFullFicha] = useState(false);

  const selectHive = (id: string) => {
    const hive = demoHives.find(item => item.id === id);
    if (hive) setSelected(hive);
  };

  return <main className={night ? 'app night' : 'app'}>
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">🐝</div>
      <div className="brand"><strong>Mi Apiario <span>3D</span></strong><small>Explora tu apiario, colmena a colmena</small></div>
      <div className="header-actions">
        <span className="offline-pill">● Datos de prueba</span>
        <button onClick={() => setNight(v => !v)}>{night ? '☀️ Día' : '🌙 Noche'}</button>
        <button onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp}>ⓘ Ayuda</button>
      </div>
    </header>
    {showHelp && <div className="help-banner"><strong>Cómo usarlo:</strong> arrastra para girar la cámara, pellizca o usa la rueda para acercar y pulsa una colmena para consultar sus datos de ejemplo. Las revisiones, reservas y tareas no son datos reales.</div>}

    <section className="workspace">
      <div className="scene-panel">
        <div className="scene-label"><span className="live-dot" /> APIARIO EN 3D <span>· 6 colmenas de prueba</span></div>
        <ApiaryScene selectedId={selected.id} onSelect={selectHive} night={night} />
        <div className="scene-footer"><span>↔ Arrastra para mirar alrededor</span><span>Selecciona una colmena</span></div>
      </div>

      <aside className="side-panel">
        <div className="panel-heading"><div><small>FICHA DE COLMENA</small><h1>{selected.name}</h1></div><span className="hive-emoji" aria-hidden="true">▦</span></div>
        <div className="id-chip">{selected.id}</div>
        <div className="status-row"><span>Estado de ejemplo</span><strong className={'status ' + selected.status.toLowerCase().replace(' ', '-')}>{selected.status}</strong></div>
        <p className="note">{selected.note}</p>

        <div className="detail-card">
          <small>DATOS APÍCOLAS DE EJEMPLO</small>
          <div className="detail-line"><span>Apiario</span><strong>Apiario Demo</strong></div>
          <div className="detail-line"><span>Reina · color</span><strong><i className={'queen-dot queen-' + selected.queen.toLowerCase()} />{selected.queen}</strong></div>
          <div className="detail-line"><span>Año de reina</span><strong>{selected.queenYear}</strong></div>
          <div className="detail-line"><span>Población</span><strong>{selected.population}</strong></div>
          <div className="detail-line"><span>Reservas</span><strong>{selected.reserves}</strong></div>
          <div className="detail-line"><span>Cría</span><strong>{selected.brood}</strong></div>
          <div className="detail-line"><span>Última revisión</span><strong>{selected.lastReview}</strong></div>
          <div className="detail-line"><span>Producción</span><strong>{selected.production}</strong></div>
        </div>

        <div className={'task-card ' + (selected.taskType === 'warning' ? 'task-warning' : '')}>
          <div className="task-icon">{selected.taskType === 'warning' ? '!' : '✓'}</div>
          <div><small>TAREA DE DEMOSTRACIÓN</small><strong>{selected.task}</strong><p>Ejemplo orientativo; no es una recomendación sanitaria real.</p></div>
        </div>

        <button className="primary-button" onClick={() => setShowFullFicha(true)}>Abrir ficha detallada <span>↗</span></button>
        <p className="panel-footnote">Solo demostración · No se guarda ni se modifica información real.</p>
      </aside>
    </section>

    {showFullFicha && <div className="modal-backdrop" role="presentation" onClick={() => setShowFullFicha(false)}>
      <section className="hive-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={event => event.stopPropagation()}>
        <button className="modal-close" aria-label="Cerrar ficha" onClick={() => setShowFullFicha(false)}>×</button>
        <small>FICHA DETALLADA · DATOS FICTICIOS</small>
        <h2 id="modal-title">{selected.name}</h2>
        <p className="modal-subtitle">{selected.id} · Apiario Demo</p>
        <div className="modal-grid">
          <div><span>Estado de ejemplo</span><strong>{selected.status}</strong></div>
          <div><span>Reina</span><strong>{selected.queen} · {selected.queenYear}</strong></div>
          <div><span>Población</span><strong>{selected.population}</strong></div>
          <div><span>Reservas</span><strong>{selected.reserves}</strong></div>
          <div><span>Cría</span><strong>{selected.brood}</strong></div>
          <div><span>Última revisión</span><strong>{selected.lastReview}</strong></div>
          <div><span>Producción orientativa</span><strong>{selected.production}</strong></div>
          <div><span>Tarea de ejemplo</span><strong>{selected.task}</strong></div>
        </div>
        <div className="modal-notice"><strong>Prototipo seguro</strong><br />Esta ficha utiliza exclusivamente datos inventados para probar la interfaz. Todavía no lee ni escribe en Mi Apiario real y no persiste cambios.</div>
        <button className="primary-button" onClick={() => setShowFullFicha(false)}>Volver al apiario</button>
      </section>
    </div>}

    <footer className="app-footer">MI APIARIO 3D <span>·</span> Prototipo independiente <span>·</span> Datos ficticios</footer>
  </main>;
}