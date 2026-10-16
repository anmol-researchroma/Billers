export function numberToIndianWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function inWords(val: number): string {
    let str = '';
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
    } else {
      str += a[val];
    }
    return str.trim();
  }

  const crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  const hundred = Math.floor(remainder / 100);
  remainder = remainder % 100;

  let result = '';
  if (crore > 0) {
    result += inWords(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += inWords(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += inWords(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    result += inWords(hundred) + ' Hundred ';
  }
  if (remainder > 0) {
    if (result !== '') result += 'and ';
    result += inWords(remainder) + ' ';
  }

  return 'Rupees ' + result.trim() + ' Only';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
