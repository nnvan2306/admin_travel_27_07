export const formatCurrencyVND = (number: number) => {
  if (number === null || number === undefined) return "N/A";
  return number.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

export const formatNumberUnit = (number: number) => {
  if (number == null) return "N/A";
  return Math.abs(number).toLocaleString("vi-VN").replace(/,/g, ".");
};