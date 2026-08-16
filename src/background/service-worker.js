importScripts("../sources/dblp.js");
importScripts("../matching/normalize.js");
importScripts("../matching/paper-matcher.js");

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "PAPER_METADATA") {
    return;
  }

  console.log("VenueTrace received:", message.paper);

  return searchDblp(message.paper.title)
    .then((data) => {
      const hits = getDblpHits(data);

      console.log("DBLP result summary:", {
        total: data.result?.hits?.["@total"] ?? "0",
        received: hits.length,
        hits,
      });

      const match = findMatchingPaper(message.paper, hits);
      console.log("VenueTrace match:", match);

      return { received: true, dblpHitCount: hits.length, match };
    })
    .catch((error) => {
      console.error("DBLP request error:", error);
      return { received: false, error: error.message };
    });
});
