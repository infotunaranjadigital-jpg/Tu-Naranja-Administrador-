export interface LiveRates {
  bcv_usd: number;
  bcv_eur: number;
  binance_usdt: number;
  average_usd: number;
  date: string;
}

export async function fetchLiveRates(): Promise<LiveRates> {
  let bcvUsd = 888.12;
  let bcvEur = 989.72;
  let binanceUsdt = 1007.00;

  // 1. Consultar Tasas Oficiales BCV (Dólar y Euro)
  try {
    const [resUsd, resEur] = await Promise.all([
      fetch('https://ve.dolarapi.com/v1/dolares', { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' } 
      }),
      fetch('https://ve.dolarapi.com/v1/euros', { 
        cache: 'no-store',
        headers: { 'Accept': 'application/json' } 
      })
    ]);

    if (resUsd.ok) {
      const dataUsd = await resUsd.json();
      const oficialUsd = Array.isArray(dataUsd) ? dataUsd.find((d: any) => d.fuente === 'oficial') : null;
      if (oficialUsd?.promedio) {
        bcvUsd = Number(oficialUsd.promedio.toFixed(2));
      }
    }

    if (resEur.ok) {
      const dataEur = await resEur.json();
      const oficialEur = Array.isArray(dataEur) ? dataEur.find((d: any) => d.fuente === 'oficial') : null;
      if (oficialEur?.promedio) {
        bcvEur = Number(oficialEur.promedio.toFixed(2));
      }
    }
  } catch (err) {
    console.warn('Advertencia al consultar tasa BCV:', err);
  }

  // 2. Consultar Binance P2P directamente (USDT / VES)
  try {
    const resBinance = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'VES',
        merchantCheck: false,
        page: 1,
        rows: 10,
        tradeType: 'BUY'
      }),
      cache: 'no-store'
    });

    if (resBinance.ok) {
      const dataBinance = await resBinance.json();
      if (dataBinance?.data && Array.isArray(dataBinance.data)) {
        const prices = dataBinance.data
          .map((x: any) => parseFloat(x?.adv?.price))
          .filter((p: number) => !isNaN(p) && p > 500 && p < 5000);

        if (prices.length > 0) {
          prices.sort((a: number, b: number) => a - b);
          // Tomar la mediana de ofertas para evitar extremos o anomalías
          const mid = Math.floor(prices.length / 2);
          const medianPrice = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
          binanceUsdt = Number(medianPrice.toFixed(2));
        }
      }
    }
  } catch (err) {
    console.warn('Advertencia al consultar Binance P2P:', err);
  }

  const averageUsd = Number(((bcvUsd + binanceUsdt) / 2).toFixed(2));
  const date = new Date().toISOString().split('T')[0];

  return {
    bcv_usd: bcvUsd,
    bcv_eur: bcvEur,
    binance_usdt: binanceUsdt,
    average_usd: averageUsd,
    date
  };
}
