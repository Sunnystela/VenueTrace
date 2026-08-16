const title = document.querySelector('meta[name="citation_title"]')?.content ?? null;
const authors = [
  ...document.querySelectorAll('meta[name="citation_author"]'),
].map((authorElement) => authorElement.content);
const doi = document.querySelector('meta[name="citation_doi"]')?.content ?? null;
const arxivId =
  document.querySelector('meta[name="citation_arxiv_id"]')?.content ?? null;

const paper = { title, authors, doi, arxivId };
const resultElement = document.createElement("div");
resultElement.className = "venuetrace-result";
resultElement.textContent = "VenueTrace: DBLP에서 검색 중...";

document
  .querySelector("h1.title")
  ?.insertAdjacentElement("afterend", resultElement);

chrome.runtime
  .sendMessage({ type: "PAPER_METADATA", paper })
  .then((response) => {
    console.log("VenueTrace response:", response);

    renderEvidencePanel(resultElement, response.decision);
  })
  .catch((error) => {
    resultElement.textContent = `VenueTrace: 메시지 오류 (${error.message})`;
  });
