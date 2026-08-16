function calculateConfidence(evidence) {
  if (evidence.some((item) => item.official)) {
    return "high";
  }

  if (evidence.length >= 2) {
    return "medium";
  }

  if (evidence.length === 1) {
    return "low";
  }

  return "none";
}
