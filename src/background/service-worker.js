importScripts("../config.local.js");
importScripts("../sources/dblp.js");
importScripts("../sources/openreview.js");
importScripts("../sources/crossref.js");
importScripts("../sources/openalex.js");
importScripts("../matching/normalize.js");
importScripts("../matching/paper-matcher.js");
importScripts("../sources/proceedings/pmlr.js");
importScripts("../sources/proceedings/neurips.js");
importScripts("../sources/proceedings/cvf.js");
importScripts("../sources/proceedings/acl.js");

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "PAPER_METADATA") {
    return;
  }

  return collectSourceResults(message.paper);
});

async function collectSourceResults(paper) {
  const result = { received: true };
  console.log("VenueTrace received:", paper);

  try {
    const data = await searchDblp(paper.title);
    const hits = getDblpHits(data);
    result.dblpHitCount = hits.length;
    result.match = findMatchingPaper(paper, hits);
    console.log("DBLP result:", { hits, match: result.match });
  } catch (error) {
    result.dblpError = error.message;
    console.error("DBLP request error:", error);
  }

  try {
    const data = await searchOpenReview(paper.title);
    const notes = getOpenReviewNotes(data);
    result.openReviewHitCount = notes.length;
    result.openReviewMatch = findMatchingOpenReviewPaper(paper, notes);
    console.log("OpenReview result:", {
      notes,
      match: result.openReviewMatch,
    });
  } catch (error) {
    result.openReviewError = error.message;
    console.error("OpenReview request error:", error);
  }

  try {
    const data = await searchCrossref(paper.title);
    const works = getCrossrefWorks(data);
    result.crossrefHitCount = works.length;
    result.crossrefMatch = findMatchingCrossrefPaper(paper, works);
    console.log("Crossref result:", { works, match: result.crossrefMatch });
  } catch (error) {
    result.crossrefError = error.message;
    console.error("Crossref request error:", error);
  }

  const openAlexApiKey = globalThis.VENUETRACE_CONFIG.openAlexApiKey;

  if (!openAlexApiKey) {
    result.openAlexError = "OpenAlex API key is not configured.";
    console.warn(result.openAlexError);
  } else {
    try {
      const data = await searchOpenAlex(paper.title, openAlexApiKey);
      const works = getOpenAlexWorks(data);
      result.openAlexHitCount = works.length;
      result.openAlexMatch = findMatchingOpenAlexPaper(paper, works);
      console.log("OpenAlex result:", { works, match: result.openAlexMatch });
    } catch (error) {
      result.openAlexError = error.message;
      console.error("OpenAlex request error:", error);
    }
  }

  const matchedRecords = {
    dblp: result.match,
    crossref: result.crossrefMatch,
    openAlex: result.openAlexMatch,
  };

  result.proceedings = [
    findPmlrEvidence(matchedRecords),
    findNeuripsEvidence(matchedRecords),
    findCvfEvidence(matchedRecords),
    findAclEvidence(matchedRecords),
  ].filter(Boolean);

  console.log("Proceedings evidence:", result.proceedings);

  return result;
}
