function findNeuripsEvidence(records) {
  const url = findOfficialProceedingsUrl(records, [
    "papers.nips.cc",
    "proceedings.neurips.cc",
  ]);
  return url ? { source: "NeurIPS", url } : null;
}
