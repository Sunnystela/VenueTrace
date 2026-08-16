function getDblpAuthors(hit) {
  const authors = hit.info?.authors?.author ?? [];
  const authorList = Array.isArray(authors) ? authors : [authors];

  return authorList
    .map((author) => (typeof author === "string" ? author : author.text))
    .filter(Boolean);
}

function findMatchingPaper(paper, hits) {
  const normalizedTitle = normalizeText(paper.title ?? "");
  const normalizedAuthors = paper.authors.map(normalizeAuthorName);

  return (
    hits.find((hit) => {
      const titleMatches = normalizeText(hit.info?.title ?? "") === normalizedTitle;
      const dblpAuthors = getDblpAuthors(hit).map(normalizeAuthorName);
      const authorMatches = normalizedAuthors.some((author) =>
        dblpAuthors.includes(author),
      );

      return titleMatches && authorMatches;
    }) ?? null
  );
}

function findMatchingOpenReviewPaper(paper, notes) {
  const normalizedTitle = normalizeText(paper.title ?? "");
  const normalizedAuthors = paper.authors.map(normalizeAuthorName);

  return (
    notes.find((note) => {
      const title = getOpenReviewValue(note.content?.title) ?? "";
      const authors = getOpenReviewAuthors(note);
      const titleMatches = normalizeText(title) === normalizedTitle;
      const authorMatches = normalizedAuthors.some((author) =>
        authors.map(normalizeAuthorName).includes(author),
      );

      return titleMatches && authorMatches;
    }) ?? null
  );
}

function findMatchingCrossrefPaper(paper, works) {
  const normalizedTitle = normalizeText(paper.title ?? "");
  const normalizedAuthors = paper.authors.map(normalizeAuthorName);

  return (
    works.find((work) => {
      const title = work.title?.[0] ?? "";
      const authors = (work.author ?? []).map((author) =>
        [author.given, author.family].filter(Boolean).join(" "),
      );
      const titleMatches = normalizeText(title) === normalizedTitle;
      const authorMatches = normalizedAuthors.some((author) =>
        authors.map(normalizeAuthorName).includes(author),
      );

      return titleMatches && authorMatches;
    }) ?? null
  );
}

function findMatchingOpenAlexPaper(paper, works) {
  const normalizedTitle = normalizeText(paper.title ?? "");
  const normalizedAuthors = paper.authors.map(normalizeAuthorName);

  return (
    works.find((work) => {
      const titleMatches = normalizeText(work.title ?? "") === normalizedTitle;
      const authors = (work.authorships ?? [])
        .map((authorship) => authorship.author?.display_name)
        .filter(Boolean);
      const authorMatches = normalizedAuthors.some((author) =>
        authors.map(normalizeAuthorName).includes(author),
      );

      return titleMatches && authorMatches;
    }) ?? null
  );
}
