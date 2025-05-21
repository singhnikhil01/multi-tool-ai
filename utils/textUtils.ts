// Utility functions for text manipulation

/**
 * Counts the number of words in a given string.
 * Words are defined as sequences of characters separated by whitespace.
 * @param text The string to count words in.
 * @returns The number of words.
 */
export const countWords = (text: string): number => {
  if (!text || text.trim() === '') {
    return 0;
  }
  // Match sequences of non-whitespace characters
  const words = text.match(/\S+/g);
  return words ? words.length : 0;
};
