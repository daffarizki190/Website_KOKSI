export const getDisplayOrderId = (orderId: number, dateString?: string): string => {
  if (!orderId) return '';
  
  let datePart = 'XXXX';
  if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
          // Format as DDMMYY
          const dd = date.getDate().toString().padStart(2, '0');
          const mm = (date.getMonth() + 1).toString().padStart(2, '0');
          const yy = date.getFullYear().toString().slice(-2);
          datePart = `${dd}${mm}${yy}`;
      }
  }

  // Use modulo arithmetic with a prime to create a deterministic, non-sequential looking hash
  // Guaranteed unique for the first 99,991 orders
  const scrambled = ((orderId * 9973) % 99991).toString().padStart(5, '0');
  
  return `INV-${datePart}-${scrambled}`;
};
