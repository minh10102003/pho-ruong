const UNITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readTriple(num: number, showZeroHundred = true): string {
  const hundred = Math.floor(num / 100);
  const ten = Math.floor((num % 100) / 10);
  const unit = num % 10;
  const parts: string[] = [];

  if (hundred > 0) {
    parts.push(`${UNITS[hundred]} trăm`);
  } else if (showZeroHundred && num > 0) {
    parts.push('không trăm');
  }

  if (ten > 1) {
    parts.push(`${UNITS[ten]} mươi`);
    if (unit === 1) parts.push('mốt');
    else if (unit === 5) parts.push('lăm');
    else if (unit > 0) parts.push(UNITS[unit]);
  } else if (ten === 1) {
    parts.push('mười');
    if (unit === 5) parts.push('lăm');
    else if (unit > 0) parts.push(UNITS[unit]);
  } else if (unit > 0) {
    if (hundred > 0 || !showZeroHundred) parts.push('lẻ');
    if (unit === 5 && hundred > 0) parts.push('năm');
    else parts.push(UNITS[unit]);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function numberToVietnameseWords(amount: number | string): string {
  const n = Math.round(typeof amount === 'string' ? parseFloat(amount) : amount);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n === 0) return 'Không đồng';

  const billion = Math.floor(n / 1_000_000_000);
  const million = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;
  const parts: string[] = [];

  if (billion > 0) parts.push(`${readTriple(billion)} tỷ`);
  if (million > 0) parts.push(`${readTriple(million, billion > 0)} triệu`);
  if (thousand > 0) {
    parts.push(`${readTriple(thousand, billion > 0 || million > 0)} nghìn`);
  }
  if (remainder > 0 || parts.length === 0) {
    parts.push(readTriple(remainder, parts.length > 0));
  }

  return `${capitalize(parts.join(' ').replace(/\s+/g, ' ').trim())} đồng`;
}
