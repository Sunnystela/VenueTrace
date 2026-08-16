function findCvfEvidence(records) {
  const url = findOfficialProceedingsUrl(records, ["openaccess.thecvf.com"]);
  return url ? { source: "CVF", url } : null;
}
