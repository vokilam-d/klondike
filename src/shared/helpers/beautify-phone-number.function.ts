const phoneRegex = /(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})/;

export const beautifyPhoneNumber = (phone: string = ''): string => {
  const match = phone.match(phoneRegex);
  if (match === null) { return phone; }

  return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
}
