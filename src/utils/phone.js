// Indian mobile numbers, stored/sent as 10 plain digits (that's the vendor's username).
export const onlyDigits = (v) => v.replace(/\D/g, "").slice(0, 10);
export const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v);
export const maskPhone = (v) => (v ? `+91 ******${v.slice(-4)}` : "");
