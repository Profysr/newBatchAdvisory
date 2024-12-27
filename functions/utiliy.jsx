export const generatePassword = (key, index) => {
  return `${key}${index + 1}`; // Generates adv1, adv2, etc.
};
