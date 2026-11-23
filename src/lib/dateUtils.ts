/**
 * Formatea una fecha ISO o string (YYYY-MM-DD) al formato estándar hispano / venezolano DD/MM/YYYY
 */
export function formatDateDMY(dateStr: string | null | undefined, separator: '/' | '-' = '/'): string {
  if (!dateStr) return '';
  const clean = dateStr.trim().split('T')[0];
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    // Si viene en formato YYYY-MM-DD
    if (parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}${separator}${month.padStart(2, '0')}${separator}${year}`;
    }
    // Si ya viene en formato DD-MM-YYYY o DD/MM/YYYY
    if (parts[2].length === 4) {
      const [day, month, year] = parts;
      return `${day.padStart(2, '0')}${separator}${month.padStart(2, '0')}${separator}${year}`;
    }
  }
  return dateStr;
}
