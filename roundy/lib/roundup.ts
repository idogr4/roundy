export function calculateRoundUp(amount: number, roundTo: number = 10): number {
  const rounded = Math.ceil(amount / roundTo) * roundTo;
  return parseFloat((rounded - amount).toFixed(2));
}

export function calculateTotalRoundUps(
  transactions: { amount: number }[],
  roundTo: number = 10
): number {
  const total = transactions.reduce((sum, tx) => {
    return sum + calculateRoundUp(tx.amount, roundTo);
  }, 0);
  return parseFloat(total.toFixed(2));
}

export function categorizeTransaction(merchant: string): string {
  const categories: Record<string, string[]> = {
    'קפה': ['קפה', 'ארומה', 'גרג', 'נספרסו'],
    'אוכל': ['וולט', 'מקדונלד', 'בורגר', 'פיצה'],
    'סופר': ['שופרסל', 'רמי לוי', 'מגה', 'ויקטורי'],
    'תחבורה': ['פז', 'סונול', 'דלק', 'רב קו'],
    'בריאות': ['סופר פארם', 'בית מרקחת', 'קופת חולים'],
    'בידור': ['נטפליקס', 'ספוטיפיי', 'סינמה'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => merchant.includes(kw))) {
      return category;
    }
  }
  return 'כללי';
}
