import { useState } from 'react';
import ApiaryScene from './world/ApiaryScene';

type Hive = { id: string; name: string; status: string; note: string };
const demoHives: Hive[] = [
  { id: 'DEMO-001', name: 'Colmena 01', status: 'Activa', note: 'Registro ficticio de demostración.' },
  { id: 'DEMO-002', name: 'Colmena 02', status: 'Revisar', note: 'Revisión de ejemplo pendiente; no es una alerta real.' },
  { id: 'DEMO-003', name: 'Colmena 03', status: 'Activa', note: 'Registro ficticio para probar la interfaz.' },
  { id: 'DEMO-004', name: 'Colmena 04', status: 'Atención', note: 'Incidencia ficticia, no representa una alerta real.' },
  { id: 'DEMO-005', name: 'Colmena 05', status: 'Activa', note: 'Registro ficticio de demostración.' },
  { id: 'DEMO-006', name: 'Colmena 06', status: 'Activa', note: 'Registro ficticio para probar la interfaz.' },
];

export default function App() {
  const [selected, setSelected] = useState<Hive>(demoHives[0]);
  const [night, setNight] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  return <main className={night ? 'app night' : 'app'}>
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true">🐝</div>
      <div className="brand"><strong>Mi Apiario <span>3D</span></strong><small>Tu apiario en un mundo realista e interactivo</small></div>
      <div className="header-actions">
        <span className="offline-pill">● Modo demostración</span>
        <button onClick={() => setNight(v => !v)}>{night ? '☀️ Día' : '🌙 Noche'}</button>
        <button onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp}>ⓘ Ayuda</button>
      </div>
    </header>
    {showHelp && <div className="help-banner"><strong>Controles:</strong> arrastra para girar la cámara, usa la rueda para acercar o alejar y pulsa una colmena para ver su ficha. Todos los datos son ficticios.</div>}
    <section className="workspace">
      <div className="scene-panel">
        <div className="scene-label"><span className="live-dot" /> ENTORNO 3D <span>· 6 colmenas de demostración</span></div>
        <ApiaryScene selectedId={selected.id} onSelect={id => setSelected(demoHives.find(h => h.id === id) ?? demoHives[0])} night={night} />
        <div className="scene-footer"><span>↔ Arrastra para mirar alrededor</span><span>Rueda: zoom</span></div>
      </div>
      <aside className="side-panel">
        <div className="panel-heading"><div><small>ELEMENTO SELECCIONADO</small><h1>{selected.name}</h1></div><span className="hive-emoji">▦</span></div>
        <div className="id-chip">{selected.id}</div>
        <div className="status-row"><span>Estado de ejemplo</span><strong className={'status ' + selected.status.toLowerCase().replace(' ', '-')}>{selected.status}</strong></div>
        <p className="note">{selected.note}</p>
        <div className="detail-card"><small>FICHA VISUAL</small>
          <div className="detail-line"><span>Apiario</span><strong>Apiario Demo</strong></div>
          <div className="detail-line"><span>Tipo</span><strong>Colmena estándar</strong></div>
          <div className="detail-line"><span>Última revisión</span><strong>Sin datos</strong></div>
          <div className="detail-line"><span>Producción</span><strong>Sin datos</strong></div>
        </div>
        <div className="warning"><strong>Modo demostración</strong><br />Aún no existe conexión con tu Mi Apiario real. No se han importado ni modificado datos.</div>
        <button className="primary-button" onClick={() => alert('La ficha real se incorporará en una fase posterior. No se han modificado datos.')}>Ver ficha completa <span>↗</span></button>
      </aside>
    </section>
    <footer className="app-footer">MI APIARIO 3D <span>·</span> Prototipo independiente <span>·</span> Datos ficticios</footer>
  </main>;
}