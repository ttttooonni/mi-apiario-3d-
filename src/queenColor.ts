export const queenColorForYear = (year: number): string => {
  // Ciclo internacional de cinco años: 1/6 blanco, 2/7 amarillo, 3/8 rojo, 4/9 verde, 5/0 azul.
  const colors = ['Azul', 'Blanco', 'Amarillo', 'Rojo', 'Verde'];
  return Number.isInteger(year) && year >= 0 ? colors[year % 5] : 'Sin marcar';
};

export const queenDotClass = (year: number, marked = true): string =>
  marked ? 'queen-dot queen-' + queenColorForYear(year).toLowerCase() : 'queen-dot queen-sin-marcar';
