export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "MXN", symbol: "$", name: "Peso Mexicano", locale: "es-MX" },
  { code: "USD", symbol: "$", name: "Dólar Estadounidense", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "es-ES" },
  { code: "COP", symbol: "$", name: "Peso Colombiano", locale: "es-CO" },
  { code: "ARS", symbol: "$", name: "Peso Argentino", locale: "es-AR" },
  { code: "CLP", symbol: "$", name: "Peso Chileno", locale: "es-CL" },
  { code: "PEN", symbol: "S/", name: "Sol Peruano", locale: "es-PE" },
  { code: "BRL", symbol: "R$", name: "Real Brasileño", locale: "pt-BR" },
  { code: "BOB", symbol: "Bs", name: "Boliviano", locale: "es-BO" },
  { code: "GTQ", symbol: "Q", name: "Quetzal Guatemalteco", locale: "es-GT" },
  { code: "CRC", symbol: "₡", name: "Colón Costarricense", locale: "es-CR" },
  { code: "UYU", symbol: "$", name: "Peso Uruguayo", locale: "es-UY" },
  { code: "DOP", symbol: "RD$", name: "Peso Dominicano", locale: "es-DO" },
  { code: "PYG", symbol: "₲", name: "Guaraní Paraguayo", locale: "es-PY" },
  { code: "HNL", symbol: "L", name: "Lempira Hondureño", locale: "es-HN" },
  { code: "NIO", symbol: "C$", name: "Córdoba Nicaragüense", locale: "es-NI" },
  { code: "PAB", symbol: "B/.", name: "Balboa Panameño", locale: "es-PA" },
  { code: "VES", symbol: "Bs.S", name: "Bolívar Venezolano", locale: "es-VE" },
];

export function getCurrency(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function formatMoney(amount: number, currencyCode: string): string {
  const c = getCurrency(currencyCode);
  return `${c.symbol}${amount.toLocaleString(c.locale)} ${c.code}`;
}

export function formatMoneyShort(amount: number, currencyCode: string): string {
  const c = getCurrency(currencyCode);
  return `${c.symbol}${amount.toLocaleString(c.locale)}`;
}
