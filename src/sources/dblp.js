async function searchDblp(title) {
  const url = new URL("https://dblp.org/search/publ/api");
  url.searchParams.set("q", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("h", "10");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`DBLP request failed: ${response.status}`);
  }

  return response.json();
}

function getDblpHits(data) {
  return data.result?.hits?.hit ?? [];
}
