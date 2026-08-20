function integrateEvidence(result) {
  const evidence = [];
  const errors = [
    ["DBLP", result.dblpError],
    ["OpenReview", result.openReviewError],
    ["Crossref", result.crossrefError],
    ["OpenAlex", result.openAlexError],
    ["NeurIPS", result.neuripsError],
  ]
    .filter(([, error]) => Boolean(error))
    .map(([source, message]) => ({ source, message }));

  if (result.match) {
    const dblpUrl = result.match.info?.url;
    const dblpKey = result.match.info?.key;

    evidence.push({
      source: "DBLP",
      venue: normalizePublicationVenue(result.match.info?.venue),
      year: result.match.info?.year ?? null,
      url: dblpUrl ?? (dblpKey ? `https://dblp.org/rec/${dblpKey}` : null),
      official: false,
      kind: normalizePublicationVenue(result.match.info?.venue)
        ? "publication"
        : "metadata",
    });
  }

  if (result.openReviewMatch) {
    const openReviewVenue =
      getOpenReviewValue(result.openReviewMatch.content?.venue) ??
      getOpenReviewValue(result.openReviewMatch.content?.venueid);
    const officialDecision = parseOfficialOpenReviewVenue(
      result.openReviewMatch,
      openReviewVenue,
    );

    evidence.push({
      source: "OpenReview",
      venue: officialDecision?.venue ?? openReviewVenue ?? null,
      year: officialDecision?.year ?? null,
      position: officialDecision?.position ?? null,
      url: `https://openreview.net/forum?id=${result.openReviewMatch.forum}`,
      official: Boolean(officialDecision),
      kind: officialDecision ? "official_decision" : "submission",
    });
  }

  if (result.crossrefMatch) {
    const crossrefVenue = normalizePublicationVenue(
      result.crossrefMatch["container-title"]?.[0],
    );

    evidence.push({
      source: "Crossref",
      venue: crossrefVenue,
      year: result.crossrefMatch.published?.["date-parts"]?.[0]?.[0] ?? null,
      url: result.crossrefMatch.URL ?? null,
      official: false,
      kind: crossrefVenue ? "publication" : "metadata",
    });
  }

  if (result.openAlexMatch) {
    const openAlexVenue = [
      result.openAlexMatch.primary_location?.source?.display_name,
      ...(result.openAlexMatch.locations ?? []).map(
        (location) => location.source?.display_name,
      ),
    ]
      .map(normalizePublicationVenue)
      .find(Boolean) ?? null;

    evidence.push({
      source: "OpenAlex",
      venue: openAlexVenue,
      year: result.openAlexMatch.publication_year ?? null,
      url: result.openAlexMatch.id ?? null,
      official: false,
      kind: openAlexVenue ? "publication" : "metadata",
    });
  }

  for (const proceeding of result.proceedings ?? []) {
    evidence.push({
      ...proceeding,
      venue: proceeding.venue ?? proceeding.source,
      year: proceeding.year ?? null,
      official: true,
      kind: "official",
    });
  }

  const successfulSourceCount = [
    result.dblpHitCount,
    result.openReviewHitCount,
    result.crossrefHitCount,
    result.openAlexHitCount,
  ].filter(Number.isInteger).length;
  const publicationEvidence = evidence.filter(
    (item) => item.official || item.kind === "publication",
  );
  const decision = decidePublicationStatus(
    publicationEvidence,
    errors,
    successfulSourceCount,
  );

  if (publicationEvidence.length === 0 && evidence.length > 0) {
    decision.summary =
      "논문 레코드는 찾았지만 학회 수록 정보는 확인하지 못했습니다.";
  }

  return {
    ...decision,
    confidence: calculateConfidence(publicationEvidence),
    evidence,
    errors,
  };
}

function decidePublicationStatus(evidence, errors, successfulSourceCount) {
  const officialEvidence = evidence.find((item) => item.official);
  const generalEvidence = evidence.filter((item) => !item.official);
  const preferredSources = ["DBLP", "Crossref", "OpenAlex", "OpenReview"];
  const metadataEvidence =
    preferredSources
      .map((source) => evidence.find((item) => item.source === source))
      .find((item) => item?.venue) ?? null;
  const primaryEvidence = metadataEvidence ?? officialEvidence ?? null;

  let status;

  if (officialEvidence) {
    status = "confirmed";
  } else if (generalEvidence.length >= 2) {
    status = "supported";
  } else if (generalEvidence.length === 1) {
    status = "candidate";
  } else if (successfulSourceCount === 0 && errors.length > 0) {
    status = "inconclusive";
  } else {
    status = "not_found";
  }

  const labels = {
    confirmed: "공식 수록 확인",
    supported: "출판 정보 확인",
    candidate: "출판 후보",
    not_found: "정보 미확인",
    inconclusive: "판단 보류",
  };
  const summaries = {
    confirmed: "공식 학회 수록 또는 채택 근거를 확인했습니다.",
    supported: "여러 출처에서 일치하는 출판 정보를 확인했습니다.",
    candidate: "출판 후보를 찾았지만 추가 확인이 필요합니다.",
    not_found: "현재 연결된 출처에서 출판 정보를 확인하지 못했습니다.",
    inconclusive: "출처 조회에 실패하여 출판 여부를 판단할 수 없습니다.",
  };

  return {
    status,
    statusLabel: labels[status],
    summary: summaries[status],
    venue: normalizeVenueName(primaryEvidence?.venue),
    year: metadataEvidence?.year ?? officialEvidence?.year ?? null,
    position: primaryEvidence?.position ?? officialEvidence?.position ?? null,
  };
}

function normalizeVenueName(venue) {
  if (typeof venue !== "string") {
    return null;
  }

  return /^(nips|neural information processing systems)$/i.test(venue.trim())
    ? "NeurIPS"
    : venue;
}

function normalizePublicationVenue(venue) {
  if (typeof venue !== "string") {
    return null;
  }

  const preprintSources = /^(arxiv|corr)$|cornell university/i;
  return preprintSources.test(venue.trim()) ? null : venue;
}

function parseOfficialOpenReviewVenue(note, venueText) {
  if (typeof venueText !== "string" || typeof note.domain !== "string") {
    return null;
  }

  const match = venueText
    .trim()
    .match(/^(.+?)\s+(20\d{2})\s+(poster|oral|spotlight)$/i);

  if (!match) {
    return null;
  }

  const venue = match[1].trim();
  const year = Number.parseInt(match[2], 10);
  const expectedDomain = `${venue}.cc/${year}/Conference`;

  if (note.domain.toLowerCase() !== expectedDomain.toLowerCase()) {
    return null;
  }

  const position =
    match[3][0].toUpperCase() + match[3].slice(1).toLowerCase();

  return { venue, year, position };
}
