function integrateEvidence(result) {
  const evidence = [];
  const errors = [
    ["DBLP", result.dblpError],
    ["OpenReview", result.openReviewError],
    ["Crossref", result.crossrefError],
    ["OpenAlex", result.openAlexError],
  ]
    .filter(([, error]) => Boolean(error))
    .map(([source, message]) => ({ source, message }));

  if (result.match) {
    evidence.push({
      source: "DBLP",
      venue: result.match.info?.venue ?? null,
      year: result.match.info?.year ?? null,
      url: result.match.info?.ee ?? result.match.info?.url ?? null,
      official: false,
    });
  }

  if (result.openReviewMatch) {
    evidence.push({
      source: "OpenReview",
      venue:
        result.openReviewMatch.content?.venue?.value ??
        result.openReviewMatch.content?.venueid?.value ??
        null,
      year: null,
      url: `https://openreview.net/forum?id=${result.openReviewMatch.forum}`,
      official: false,
    });
  }

  if (result.crossrefMatch) {
    evidence.push({
      source: "Crossref",
      venue: result.crossrefMatch["container-title"]?.[0] ?? null,
      year: result.crossrefMatch.published?.["date-parts"]?.[0]?.[0] ?? null,
      url: result.crossrefMatch.URL ?? null,
      official: false,
    });
  }

  if (result.openAlexMatch) {
    evidence.push({
      source: "OpenAlex",
      venue:
        result.openAlexMatch.primary_location?.source?.display_name ?? null,
      year: result.openAlexMatch.publication_year ?? null,
      url: result.openAlexMatch.id ?? null,
      official: false,
    });
  }

  for (const proceeding of result.proceedings ?? []) {
    evidence.push({ ...proceeding, venue: proceeding.source, year: null, official: true });
  }

  const confidence = calculateConfidence(evidence);
  const summaries = {
    high: "공식 proceedings 수록 근거를 찾았습니다.",
    medium: "여러 학술 데이터 출처에서 일치 논문을 찾았습니다.",
    low: "한 개 학술 데이터 출처에서 일치 논문을 찾았습니다.",
    none: "현재 확인 가능한 출판 근거를 찾지 못했습니다.",
  };

  return { confidence, summary: summaries[confidence], evidence, errors };
}
