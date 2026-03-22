document.addEventListener("DOMContentLoaded", async () => {
  const state = {
    type: "Length",
    action: "Conversion",
    fromVal: null,
    fromUnit: "",
    toVal: null,
    toUnit: "",
    operator: "+"
  };

  function attachEventListeners() {
    document.querySelectorAll(".type-card").forEach((card) => {
      card.addEventListener("click", async () => {
        state.type = card.dataset.type;
        setActiveTypeCard(state.type);

        try {
          await loadUnits(state.type);
          showErrorBanner("");
        } catch (error) {
          handleServerError(error, "Failed to load units");
        }
      });
    });

    document.querySelectorAll(".action-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.action = button.dataset.action;
        setActiveActionButton(state.action);
        toggleOperators(state.action === "Arithmetic");
      });
    });

    const fromSelect = document.getElementById("from-unit");
    const toSelect = document.getElementById("to-unit");
    const operatorSelect = document.getElementById("operator-select");

    if (fromSelect) {
      fromSelect.addEventListener("change", (event) => {
        state.fromUnit = event.target.value;
      });
    }

    if (toSelect) {
      toSelect.addEventListener("change", (event) => {
        state.toUnit = event.target.value;
      });
    }

    if (operatorSelect) {
      operatorSelect.addEventListener("change", (event) => {
        state.operator = event.target.value;
      });
    }
  }

  async function loadUnits(type) {
    const units = await getUnits(type);
    const [firstUnit, secondUnit] = units;

    state.fromUnit = firstUnit ? firstUnit.symbol : "";
    state.toUnit = secondUnit ? secondUnit.symbol : state.fromUnit;

    populateUnitDropdowns(units, state.fromUnit, state.toUnit);
  }

  async function loadHistory() {
    try {
      const history = await getHistory();
      renderHistory(history);
    } catch (error) {
      renderHistory([]);
      handleServerError(error, "Server unavailable");
    }
  }

  function populateUnitDropdowns(units, selectedFrom, selectedTo) {
    const fromSelect = document.getElementById("from-unit");
    const toSelect = document.getElementById("to-unit");

    if (!fromSelect || !toSelect) {
      return;
    }

    const optionsMarkup = units
      .map((unit) => `<option value="${unit.symbol}">${unit.label} (${unit.symbol})</option>`)
      .join("");

    fromSelect.innerHTML = optionsMarkup;
    toSelect.innerHTML = optionsMarkup;

    if (selectedFrom) {
      fromSelect.value = selectedFrom;
    }

    if (selectedTo) {
      toSelect.value = selectedTo;
    }
  }

  function renderHistory(historyItems) {
    const historyList = document.getElementById("history-list");

    if (!historyList) {
      return;
    }

    if (!Array.isArray(historyItems) || historyItems.length === 0) {
      historyList.innerHTML = '<li class="history-item history-empty">No history yet.</li>';
      return;
    }

    historyList.innerHTML = historyItems
      .map((item) => {
        const summary =
          item.summary ||
          `${item.fromValue ?? ""} ${item.fromUnit ?? ""} -> ${item.toValue ?? ""} ${item.toUnit ?? ""}`;
        return `<li class="history-item">${summary}</li>`;
      })
      .join("");
  }

  function setActiveTypeCard(activeType) {
    document.querySelectorAll(".type-card").forEach((card) => {
      card.classList.toggle("choice-card-active", card.dataset.type === activeType);
    });
  }

  function setActiveActionButton(activeAction) {
    document.querySelectorAll(".action-button").forEach((button) => {
      button.classList.toggle("action-pill-active", button.dataset.action === activeAction);
    });
  }

  function toggleOperators(show) {
    const operatorRow = document.getElementById("operator-row");

    if (!operatorRow) {
      return;
    }

    operatorRow.classList.toggle("d-none", !show);
  }

  function showErrorBanner(message) {
    const banner = document.getElementById("error-banner");

    if (!banner) {
      return;
    }

    if (!message) {
      banner.textContent = "";
      banner.classList.add("d-none");
      return;
    }

    banner.textContent = message;
    banner.classList.remove("d-none");
  }

  function handleServerError(error, fallbackMessage) {
    if (error instanceof TypeError) {
      showErrorBanner("Server unavailable");
      return;
    }

    showErrorBanner(fallbackMessage || "Something went wrong");
  }

  function logMethodChecks() {
    console.log("getUnits available:", typeof getUnits === "function");
    console.log("getConversion available:", typeof getConversion === "function");
    console.log("saveHistory available:", typeof saveHistory === "function");
    console.log("getHistory available:", typeof getHistory === "function");
    console.log("compareValues available:", typeof compareValues === "function");
    console.log("performArithmetic available:", typeof performArithmetic === "function");

    try {
      const conversionResult = applyConversion(1, {
        from: "km",
        to: "m",
        factor: 1000,
        formula: null
      });
      console.log("applyConversion sample result:", conversionResult);
    } catch (error) {
      console.error("applyConversion test failed:", error.message);
    }

    try {
      const comparisonResult = compareValues(5, "kg", 5000, "g", 5000, 5000);
      console.log("compareValues sample result:", comparisonResult);
    } catch (error) {
      console.error("compareValues test failed:", error.message);
    }

    try {
      const arithmeticResult = performArithmetic(5, 2, "+");
      console.log("performArithmetic sample result:", arithmeticResult);
    } catch (error) {
      console.error("performArithmetic test failed:", error.message);
    }
  }

  attachEventListeners();
  setActiveTypeCard(state.type);
  setActiveActionButton(state.action);
  toggleOperators(false);
  logMethodChecks();

  try {
    await loadUnits("Length");
    showErrorBanner("");
  } catch (error) {
    handleServerError(error, "Failed to load units");
  }

  await loadHistory();
});
