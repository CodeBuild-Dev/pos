/** Convert rupees to paisa */
export const toPaisa = (rupees: number): number => Math.round(rupees * 100);

/** Convert paisa to rupees */
export const toRupees = (paisa: number): number => paisa / 100;

/** Format paisa as PKR display string */
export const formatPKR = (paisa: number): string =>
  `Rs. ${toRupees(paisa).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

