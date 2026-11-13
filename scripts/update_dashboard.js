const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'DashboardView.tsx');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const targetStr = `  // Cálculo de proximidad cronológica a vencer
  const sortedClients = useMemo(() => {
    const list = clients.map((c) => {`;

const replacementStr = `  // Cálculo de proximidad cronológica a vencer (solo clientes con cobro mensual recurrente activo)
  const sortedClients = useMemo(() => {
    const recurringClients = clients.filter(c => c.active && Number(c.base_monthly_fee) > 0);
    const list = recurringClients.map((c) => {`;

if (!code.includes(targetStr)) {
  console.error('Target not found in DashboardView.tsx!');
  process.exit(1);
}

code = code.replace(targetStr, replacementStr);
fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated DashboardView.tsx');
