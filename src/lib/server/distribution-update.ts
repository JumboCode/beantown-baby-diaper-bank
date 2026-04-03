export function allocateLargestRemainder(total: number, percentages: number[]) {
  const rows = percentages.map((p, index) => {
    const exact = total * p;
    const floor = Math.floor(exact);
    return { index, value: floor, remainder: exact - floor };
  });

  let remaining = total - rows.reduce((sum, row) => sum + row.value, 0);

  rows.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.index - b.index;
  });

  for (let i = 0; i < remaining; i += 1) {
    rows[i].value += 1;
  }

  rows.sort((a, b) => a.index - b.index);
  return rows.map((row) => row.value);
}