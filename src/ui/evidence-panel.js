function renderEvidencePanel(container, decision) {
  container.replaceChildren();
  container.dataset.confidence = decision.confidence;

  const summary = document.createElement("strong");
  summary.textContent = `VenueTrace: ${decision.summary}`;
  container.append(summary);

  if (decision.evidence.length > 0) {
    const list = document.createElement("ul");

    for (const evidence of decision.evidence) {
      const item = document.createElement("li");
      const details = [evidence.venue, evidence.year].filter(Boolean).join(" · ");
      const text = details ? `${evidence.source}: ${details}` : evidence.source;
      const url = getSafeHttpUrl(evidence.url);

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = text;
        item.append(link);
      } else {
        item.textContent = text;
      }

      if (evidence.official) {
        item.append(" (공식 proceedings)");
      }

      list.append(item);
    }

    container.append(list);
  }

  if (decision.errors.length > 0) {
    const errors = document.createElement("small");
    errors.className = "venuetrace-errors";
    errors.textContent = `조회하지 못한 출처: ${decision.errors
      .map((error) => error.source)
      .join(", ")}`;
    container.append(errors);
  }
}

function getSafeHttpUrl(value) {
  const urlValue = Array.isArray(value) ? value[0] : value;

  try {
    const url = new URL(urlValue);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
