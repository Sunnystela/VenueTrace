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

    if (!response.received) {
      resultElement.textContent = `VenueTrace: 조회 실패 (${response.error})`;
      return;
    }

    if (!response.match) {
      resultElement.textContent = "VenueTrace: 일치하는 DBLP 논문을 찾지 못했습니다.";
      return;
    }

    const venue = response.match.info?.venue ?? "venue 정보 없음";
    const year = response.match.info?.year ?? "연도 정보 없음";
    resultElement.textContent = `VenueTrace: ${venue} (${year})`;
  })
  .catch((error) => {
    resultElement.textContent = `VenueTrace: 메시지 오류 (${error.message})`;
  });
