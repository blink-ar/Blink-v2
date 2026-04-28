export interface BankAccent {
  bg: string;
  text: string;
  border: string;
}

export const getBankAccent = (name: string): BankAccent => {
  const n = name.toLowerCase();

  // ── Reds ────────────────────────────────────────────────────────────────
  // Galicia — red brand (#E5002B)
  if (n.includes('galicia'))    return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
  // Santander — red (#EC0000)
  if (n.includes('santander'))  return { bg: '#FEE2E2', text: '#CC0000', border: '#FECACA' };
  // HSBC — red (#DB0011)
  if (n.includes('hsbc'))       return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
  // ICBC — red
  if (n.includes('icbc'))       return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };

  // ── Blues ────────────────────────────────────────────────────────────────
  // BBVA — medium blue (#004481)
  if (n.includes('bbva'))                        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
  // Banco Macro — deep blue (#003DA5)
  if (n.includes('macro'))                       return { bg: '#EFF6FF', text: '#1E3A8A', border: '#BFDBFE' };
  // Banco Nación — blue (#00539B)
  if (n.includes('nacion') || n.includes('nación')) return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
  // Banco Patagonia — blue (#0057A8)
  if (n.includes('patagonia'))                   return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
  // Banco Provincia / BAPRO — blue (#005BAA)
  if (n.includes('provincia') || n.includes('bapro')) return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
  // Banco Hipotecario — blue
  if (n.includes('hipotecario'))                 return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
  // Banco Comafi — blue
  if (n.includes('comafi'))                      return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
  // Banco Columbia — blue
  if (n.includes('columbia'))                    return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
  // Mercado Pago — sky blue (#009EE3)
  if (n.includes('mercado'))                     return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };

  // ── Oranges ──────────────────────────────────────────────────────────────
  // Naranja / Naranja X — orange (#FF6200)
  if (n.includes('naranja'))                     return { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' };
  // Supervielle — orange (#FF7800)
  if (n.includes('supervielle'))                 return { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' };
  // Banco Itaú — orange (#EC7000)
  if (n.includes('ita') && !n.includes('capital')) return { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA' };

  // ── Greens ───────────────────────────────────────────────────────────────
  // Banco Ciudad — green
  if (n.includes('ciudad'))                      return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  // Banco Credicoop — green
  if (n.includes('credicoop'))                   return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  // Lemon — bright green
  if (n.includes('lemon'))                       return { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' };

  // ── Teals ────────────────────────────────────────────────────────────────
  // Brubank — teal/turquoise
  if (n.includes('brubank'))                     return { bg: '#CCFBF1', text: '#0F766E', border: '#99F6E4' };
  // Prex — teal
  if (n.includes('prex'))                        return { bg: '#CCFBF1', text: '#0F766E', border: '#99F6E4' };

  // ── Purples ──────────────────────────────────────────────────────────────
  // Modo — purple/violet
  if (n.includes('modo'))                        return { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' };
  // Ualá — purple/magenta
  if (n.includes('ual'))                         return { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' };
  // Personal Pay — purple (Telecom Personal)
  if (n.includes('personal'))                    return { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' };

  // ── Fallback ─────────────────────────────────────────────────────────────
  return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
};
