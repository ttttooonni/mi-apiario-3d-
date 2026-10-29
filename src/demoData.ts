import { queenColorForYear } from './queenColor';
import { SEED_REVISION, type DemoState, type Hive } from './storage';

// Código internacional de color de reina: blanco, amarillo, rojo, verde y azul en ciclos de cinco años.
export const seedHives: Hive[] = [
  { id:'DEMO-001', name:'Colmena 01 · La Reina', kind:'Colmena', status:'Activa', note:'Colonia fuerte, comportamiento tranquilo y buena entrada de pecoreadoras.', queen:queenColorForYear(2025), queenYear:2025, population:'Fuerte · 8 cuadros cubiertos', reserves:'Buenas · 7 kg estimados', brood:'Cría abierta y operculada · 6 cuadros', lastReview:'2026-10-22', production:18.4, apiary:'Apiario Norte · Sector A' },
  { id:'DEMO-002', name:'Colmena 02 · Romero', kind:'Colmena', status:'Revisar', note:'Comprobar reservas y continuidad de puesta en la próxima visita.', queen:queenColorForYear(2024), queenYear:2024, population:'Media · 6 cuadros', reserves:'Medias · 4 kg estimados', brood:'Presente · 4 cuadros', lastReview:'2026-10-08', production:12.6, apiary:'Apiario Norte · Sector A' },
  { id:'DEMO-003', name:'Colmena 03 · Tajinaste', kind:'Colmena', status:'Activa', note:'Colonia muy poblada; vigilar espacio disponible en época de entrada de néctar.', queen:queenColorForYear(2026), queenYear:2026, population:'Muy fuerte · 9 cuadros', reserves:'Buenas · 8 kg estimados', brood:'Abundante · 7 cuadros', lastReview:'2026-10-24', production:21.2, apiary:'Apiario Norte · Sector B' },
  { id:'DEMO-004', name:'Colmena 04 · Barranco', kind:'Colmena', status:'Atención', note:'Ficha de ejemplo: población baja y reservas escasas. Requiere comprobación presencial.', queen:queenColorForYear(2023), queenYear:2023, population:'Débil · 3 cuadros', reserves:'Bajas · 1,5 kg estimados', brood:'Irregular · 2 cuadros', lastReview:'2026-10-05', production:4.1, apiary:'Apiario Norte · Sector B' },
  { id:'DEMO-005', name:'Colmena 05 · Cardón', kind:'Colmena', status:'Activa', note:'Actividad regular en piquera y reservas suficientes según el registro ficticio.', queen:queenColorForYear(2025), queenYear:2025, population:'Media-alta · 7 cuadros', reserves:'Buenas · 6 kg estimados', brood:'Normal · 5 cuadros', lastReview:'2026-10-19', production:16.8, apiary:'Apiario Sur · Sector A' },
  { id:'DEMO-006', name:'Colmena 06 · Acebuche', kind:'Colmena', status:'Revisar', note:'Anotar peso y revisar reservas antes de decidir si necesita alimentación.', queen:queenColorForYear(2024), queenYear:2024, population:'Media · 5 cuadros', reserves:'Medias-bajas · 3 kg estimados', brood:'Presente · 3 cuadros', lastReview:'2026-10-11', production:10.3, apiary:'Apiario Sur · Sector A' },
  { id:'DEMO-007', name:'Colmena 07 · Verode', kind:'Colmena', status:'Activa', note:'Colonia estable; comprobar evolución de cría en la próxima revisión.', queen:queenColorForYear(2022), queenYear:2022, population:'Media-alta · 7 cuadros', reserves:'Medias · 4,5 kg estimados', brood:'Normal · 5 cuadros', lastReview:'2026-10-20', production:14.7, apiary:'Apiario Sur · Sector B' },
  { id:'DEMO-008', name:'Colmena 08 · Mocán', kind:'Colmena', status:'Activa', note:'Reina marcada en ficha; colonia con actividad regular y entrada moderada.', queen:queenColorForYear(2026), queenYear:2026, population:'Media · 6 cuadros', reserves:'Buenas · 5,5 kg estimados', brood:'Presente · 4 cuadros', lastReview:'2026-10-17', production:13.9, apiary:'Apiario Este · Sector A' },
  { id:'DEMO-009', name:'Colmena 09 · Guaydil', kind:'Colmena', status:'Revisar', note:'Seguimiento pendiente de peso, reservas y patrón de cría. Datos simulados.', queen:queenColorForYear(2021), queenYear:2021, population:'Media-baja · 4 cuadros', reserves:'Bajas-medias · 2,5 kg estimados', brood:'Por confirmar · 3 cuadros', lastReview:'2026-10-07', production:8.2, apiary:'Apiario Este · Sector A' },
  { id:'DEMO-010', name:'Colmena 10 · Malva', kind:'Colmena', status:'Activa', note:'Colonia de desarrollo reciente, mantener seguimiento de puesta y espacio.', queen:queenColorForYear(2025), queenYear:2025, population:'Media · 5 cuadros', reserves:'Medias · 3,5 kg estimados', brood:'En desarrollo · 4 cuadros', lastReview:'2026-10-21', production:11.5, apiary:'Apiario Este · Sector B' },
];
export const seedState: DemoState = {
  version: 1, seedRevision: SEED_REVISION, hives: seedHives,
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
