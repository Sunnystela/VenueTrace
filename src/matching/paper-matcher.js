function getDblpAuthors(hit) {
  const authors = hit.info?.authors?.author ?? [];
  const authorList = Array.isArray(authors) ? authors : [authors];

  return authorList
    .map((author) => (typeof author === "string" ? author : author.text))
    .filter(Boolean);
}

function findMatchingPaper(paper, hits) {
  const normalizedTitle = normalizeText(paper.title ?? "");
  const normalizedAuthors = paper.authors.map(normalizeText);

  return (
    hits.find((hit) => {
      const titleMatches = normalizeText(hit.info?.title ?? "") === normalizedTitle;
      const dblpAuthors = getDblpAuthors(hit).map(normalizeText);
      const authorMatches = normalizedAuthors.some((author) =>
        dblpAuthors.includes(author),
      );

      return titleMatches && authorMatches;
    }) ?? null
  );
}
