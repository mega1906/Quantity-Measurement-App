function populateDropdown(selectEl, units) {
  if (!selectEl) {
    console.warn("populateDropdown called with null select element");
    return;
  }

  selectEl.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select Unit --";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectEl.appendChild(defaultOption);

  units.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.symbol;
    opt.textContent = `${u.label} (${u.symbol})`;
    selectEl.appendChild(opt);
  });
}

function setActive(parentEl, clickedEl, childSelector) {
  if (!parentEl) {
    return;
  }

  parentEl.querySelectorAll(childSelector).forEach((el) => el.classList.remove("active"));
  clickedEl.classList.add("active");
}

function showResult(value, unitSymbol) {
  const resultValueEl = document.querySelector("#result-value");
  const resultUnitEl = document.querySelector("#result-unit");
  const resultPanelEl = document.querySelector("#result-panel");

  if (!resultValueEl || !resultUnitEl || !resultPanelEl) {
    return;
  }

  resultValueEl.textContent = value === null ? "—" : value;
  resultUnitEl.textContent = unitSymbol || "";

  resultPanelEl.classList.add("highlight");

  setTimeout(() => {
    resultPanelEl.classList.remove("highlight");
  }, 1500);
}

function toggleOperators(show) {
  const operatorSelectorEl = document.querySelector("#operator-selector");

  if (!operatorSelectorEl) {
    console.warn("toggleOperators could not find #operator-selector");
    return;
  }

  operatorSelectorEl.style.display = show ? "flex" : "none";
}

function renderHistory(records) {
  const list = document.querySelector("#history-list");

  if (!list) {
    return;
  }

  const safeRecords = Array.isArray(records) ? records : [];

  list.innerHTML = "";

  if (!safeRecords.length) {
    list.innerHTML = '<li class="history-item history-empty">No history yet.</li>';
    return;
  }

  safeRecords.forEach((r) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="history-meta">
        <span class="history-badge">${r.type || "Unknown"}</span>
        <span class="history-badge history-badge-soft">${r.action || "Unknown"}</span>
      </div>
      <div class="history-expression">${r.expression || "No expression"}</div>
      <div class="history-footer">
        <span class="history-result">${r.result || "—"}</span>
        <span class="history-time">${new Date(r.timestamp).toLocaleString()}</span>
      </div>
      <button type="button" class="history-delete-btn" data-history-id="${r.id}">Delete</button>
    `;
    list.appendChild(li);
  });
}
