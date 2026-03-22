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
    const typeGroup = document.querySelector(".content-wrap section .row.g-4");
    const actionGroup = document.querySelector(".content-wrap section .row.g-3");

    document.querySelectorAll(".type-card").forEach((card) => {
      card.addEventListener("click", async () => {
        state.type = card.dataset.type;
        setActive(typeGroup, card, ".type-card");

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
        setActive(actionGroup, button, ".action-button");
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

    populateDropdown(fromSelect, units);
    populateDropdown(toSelect, units);

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
    console.log("populateDropdown available:", typeof populateDropdown === "function");
    console.log("setActive available:", typeof setActive === "function");
    console.log("showResult available:", typeof showResult === "function");

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

    try {
      const tempSelect = document.createElement("select");
      populateDropdown(tempSelect, [
        { label: "Kilometer", symbol: "km" },
        { label: "Meter", symbol: "m" }
      ]);
      console.log("populateDropdown sample result:", tempSelect.innerHTML);
    } catch (error) {
      console.error("populateDropdown test failed:", error.message);
    }

    try {
      const parent = document.createElement("div");
      const first = document.createElement("button");
      const second = document.createElement("button");
      first.className = "sample-btn active";
      second.className = "sample-btn";
      parent.appendChild(first);
      parent.appendChild(second);

      setActive(parent, second, ".sample-btn");
      console.log("setActive sample result:", {
        firstActive: first.classList.contains("active"),
        secondActive: second.classList.contains("active")
      });
    } catch (error) {
      console.error("setActive test failed:", error.message);
    }

    try {
      showResult("1000", "m");
      console.log("showResult sample result:", {
        value: document.querySelector("#result-value")?.textContent,
        unit: document.querySelector("#result-unit")?.textContent
      });
    } catch (error) {
      console.error("showResult test failed:", error.message);
    }
  }

  attachEventListeners();
  setActive(
    document.querySelector(".content-wrap section .row.g-4"),
    document.querySelector('.type-card[data-type="Length"]'),
    ".type-card"
  );
  setActive(
    document.querySelector(".content-wrap section .row.g-3"),
    document.querySelector('.action-button[data-action="Conversion"]'),
    ".action-button"
  );
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
