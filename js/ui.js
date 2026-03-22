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
