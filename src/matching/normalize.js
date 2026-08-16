function normalizeText(text) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\p{M}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
