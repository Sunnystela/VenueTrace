const title = document.querySelector('meta[name="citation_title"]')?.content ?? null;
const authors = [
  ...document.querySelectorAll('meta[name="citation_author"]'),
].map((authorElement) => authorElement.content);
const doi = document.querySelector('meta[name="citation_doi"]')?.content ?? null;
const arxivId =
  document.querySelector('meta[name="citation_arxiv_id"]')?.content ?? null;

const paper = { title, authors, doi, arxivId };

chrome.runtime
  .sendMessage({ type: "PAPER_METADATA", paper })
  .then((response) => console.log("VenueTrace response:", response));
