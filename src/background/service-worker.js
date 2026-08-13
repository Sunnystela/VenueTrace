importScripts("../sources/dblp.js");

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

      return { received: true, dblpHitCount: hits.length };
    })
    .catch((error) => {
      console.error("DBLP request error:", error);
      return { received: false, error: error.message };
    });
});
