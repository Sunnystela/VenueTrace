const titleElement = document.querySelector("h1.title");

if (titleElement) {
  const title = titleElement.textContent.replace(/^Title:\s*/, "").trim();
  console.log(title);
}
