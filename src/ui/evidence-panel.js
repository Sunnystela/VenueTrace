function renderEvidencePanel(container, decision, projectLinks = []) {
  container.replaceChildren();
  container.dataset.confidence = decision.confidence;

  const heading = document.createElement("div");
  const title = document.createElement("strong");
  const status = document.createElement("span");
  const summary = document.createElement("span");

  title.textContent = `VenueTrace v${chrome.runtime.getManifest().version}`;
  status.className = "venuetrace-status";
  status.textContent = decision.statusLabel;
  summary.textContent = decision.summary;
  heading.append(title, " ", status, " ", summary);
  container.append(heading);

  if (decision.venue) {
    const venue = document.createElement("div");
    const venueLabel =
      decision.status === "confirmed" ? "확인된 학회" : "후보 학회";
    const year = decision.year ? ` (${decision.year})` : "";
    venue.className = "venuetrace-venue";
    venue.textContent = `${venueLabel}: ${decision.venue}${year}`;
    container.append(venue);
  }

  if (decision.evidence.length > 0) {
    const list = document.createElement("ul");

    for (const evidence of decision.evidence) {
      const item = document.createElement("li");
      const details = [evidence.venue, evidence.year].filter(Boolean).join(" · ");
      const text = details ? `${evidence.source}: ${details}` : evidence.source;
      const url = getSafeHttpUrl(evidence.url);

      item.append(text);

      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `${new URL(url).hostname} 열기`;
        item.append(" · ");
        item.append(link);
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

  if (projectLinks.length > 0) {
    const projectSection = document.createElement("div");
    const projectTitle = document.createElement("strong");
    const projectList = document.createElement("ul");

    projectSection.className = "venuetrace-projects";
    projectTitle.textContent = "프로젝트 링크";

    for (const project of projectLinks) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const url = getSafeHttpUrl(project.url);

      if (!url) {
        continue;
      }

      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = project.host;
      item.append(link);
      projectList.append(item);
    }

    projectSection.append(projectTitle, projectList);
    container.append(projectSection);
  }
}

function renderPdfDownloadButton(container, onDownload) {
  const button = document.createElement("button");
  button.className = "venuetrace-download";
  button.type = "button";
  button.textContent = "PDF 다운로드";

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "다운로드 준비 중...";

    try {
      const response = await onDownload();

      if (!response.downloadStarted) {
        throw new Error("Download did not start.");
      }

      button.textContent = "다운로드 시작됨";
    } catch (error) {
      button.disabled = false;
      button.textContent = `다운로드 실패: ${error.message}`;
    }
  });

  container.append(button);
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
