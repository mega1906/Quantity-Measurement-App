document.addEventListener("DOMContentLoaded", async () => {
  const STORAGE_KEY = "quantity-measurement-ui-state";
  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  const state = {
    type: savedState?.type || "Length",
    action: savedState?.action || "Conversion",
    fromVal: savedState?.fromVal ?? 1,
    fromUnit: savedState?.fromUnit || "",
    toVal: savedState?.toVal ?? 0,
    toUnit: savedState?.toUnit || "",
    operator: savedState?.operator || "+"
  };
  let currentUnits = [];
  let calculationRunId = 0;
  let historySaveTimer = null;
  const defaultValuesByAction = {
    Conversion: { from: "1", to: "0" },
    Comparison: { from: "1", to: "1" },
    Arithmetic: { from: "1", to: "1" }
  };

  function persistUiState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function scheduleHistorySave() {
    if (historySaveTimer) {
      clearTimeout(historySaveTimer);
    }

    historySaveTimer = setTimeout(async () => {
      await calculate({ persistHistory: true });
    }, 500);
  }

  function attachEventListeners() {
    const typeGroup = document.querySelector(".content-wrap section .row.g-4");
    const actionGroup = document.querySelector(".content-wrap section .row.g-3");
    const fromInput = document.getElementById("from-value");
    const toInput = document.getElementById("to-value");
    const fromIncrement = document.getElementById("from-increment");
    const fromDecrement = document.getElementById("from-decrement");
    const historyList = document.getElementById("history-list");

    document.querySelectorAll(".type-card").forEach((card) => {
      card.addEventListener("click", async () => {
        await handleTypeCardClick(card, typeGroup);
      });
    });

    document.querySelectorAll(".action-button").forEach((button) => {
      button.addEventListener("click", async () => {
        await handleActionTabClick(button, actionGroup);
      });
    });

    const fromSelect = document.getElementById("from-unit");
    const toSelect = document.getElementById("to-unit");
    const operatorSelect = document.getElementById("operator-select");

    if (fromSelect) {
      fromSelect.addEventListener("change", async (event) => {
        state.fromUnit = event.target.value;
        persistUiState();
        await calculate({ persistHistory: false });
      });
    }

    if (toSelect) {
      toSelect.addEventListener("change", async (event) => {
        state.toUnit = event.target.value;
        persistUiState();
        await calculate({ persistHistory: false });
      });
    }

    if (operatorSelect) {
      operatorSelect.addEventListener("change", async (event) => {
        state.operator = event.target.value;
        persistUiState();
        await calculate({ persistHistory: false });
      });
    }

    if (fromInput) {
      fromInput.addEventListener("input", async () => {
        state.fromVal = parseFloat(fromInput.value);
        persistUiState();
        await calculate({ persistHistory: false });
        scheduleHistorySave();
      });
    }

    if (toInput) {
      toInput.addEventListener("input", async () => {
        if (state.action !== "Conversion") {
          state.toVal = parseFloat(toInput.value);
          persistUiState();
          await calculate({ persistHistory: false });
          scheduleHistorySave();
        }
      });
    }

    if (fromIncrement) {
      fromIncrement.addEventListener("click", async () => {
        const nextValue = (parseFloat(fromInput.value) || 0) + 1;
        fromInput.value = nextValue;
        state.fromVal = nextValue;
        persistUiState();
        await calculate({ persistHistory: true });
      });
    }

    if (fromDecrement) {
      fromDecrement.addEventListener("click", async () => {
        const nextValue = (parseFloat(fromInput.value) || 0) - 1;
        fromInput.value = nextValue;
        state.fromVal = nextValue;
        persistUiState();
        await calculate({ persistHistory: true });
      });
    }

    if (historyList) {
      historyList.addEventListener("click", async (event) => {
        const deleteButton = event.target.closest(".history-delete-btn");

        if (!deleteButton) {
          return;
        }

        const historyId = deleteButton.dataset.historyId;

        if (!historyId) {
          return;
        }

        try {
          await deleteHistory(historyId);
          renderHistory(await getHistory());
        } catch (error) {
          showErrorBanner("Failed to delete history item");
        }
      });
    }
  }

  async function loadUnits(type) {
    const units = await getUnits(type);
    currentUnits = units;
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

  async function handleTypeCardClick(card, typeGroup) {
    const fromValueEl = document.getElementById("from-value");
    const toValueEl = document.getElementById("to-value");
    const fromSelect = document.getElementById("from-unit");
    const toSelect = document.getElementById("to-unit");

    state.type = card.dataset.type;
    setActive(typeGroup, card, ".type-card");

    showResult(0, "");

    try {
      const units = await getUnits(state.type);
      currentUnits = units;
      populateDropdown(fromSelect, units);
      populateDropdown(toSelect, units);
      const [firstUnit, secondUnit] = units;
      state.fromUnit =
        units.some((unit) => unit.symbol === state.fromUnit)
          ? state.fromUnit
          : firstUnit
            ? firstUnit.symbol
            : "";
      state.toUnit =
        units.some((unit) => unit.symbol === state.toUnit)
          ? state.toUnit
          : secondUnit
            ? secondUnit.symbol
            : state.fromUnit;
      fromSelect.value = state.fromUnit;
      toSelect.value = state.toUnit;
      state.fromVal = Number.isFinite(state.fromVal) ? state.fromVal : parseFloat(defaultValuesByAction[state.action].from);
      state.toVal = Number.isFinite(state.toVal) ? state.toVal : parseFloat(defaultValuesByAction[state.action].to);
      if (fromValueEl) {
        fromValueEl.value = state.fromVal;
      }
      if (toValueEl) {
        toValueEl.value = state.toVal;
      }
      persistUiState();
      showErrorBanner("");
      await calculate({ persistHistory: false });
    } catch (error) {
      handleServerError(error, "Failed to load units");
    }
  }

  async function handleActionTabClick(button, actionGroup) {
    const fromInput = document.getElementById("from-value");
    const toInput = document.getElementById("to-value");
    state.action = button.dataset.action;
    setActive(actionGroup, button, ".action-btn");
    toggleOperators(state.action === "Arithmetic");
    showResult(0, "");

    if (toInput) {
      toInput.readOnly = state.action === "Conversion";
    }

    if (!Number.isFinite(state.fromVal)) {
      state.fromVal = parseFloat(defaultValuesByAction[state.action].from);
    }

    if (!Number.isFinite(state.toVal)) {
      state.toVal = parseFloat(defaultValuesByAction[state.action].to);
    }

    if (fromInput) {
      fromInput.value = state.fromVal;
    }

    if (toInput) {
      toInput.value = state.toVal;
    }

    persistUiState();
    await calculate({ persistHistory: false });
  }

  function getDisplayNumber(elementId) {
    const element = document.getElementById(elementId);

    if (!element) {
      return NaN;
    }

    return parseFloat(element.value.trim());
  }

  function getBaseUnit(type) {
    const baseUnits = {
      Length: "m",
      Weight: "g",
      Temperature: "C",
      Volume: "mL"
    };

    return baseUnits[type] || "";
  }

  async function convertValueBetweenUnits(value, fromUnit, toUnit, visited = new Set()) {
    if (fromUnit === toUnit) {
      return value;
    }

    const pathKey = `${fromUnit}->${toUnit}`;

    if (visited.has(pathKey)) {
      throw new Error("Conversion not available for this pair");
    }

    try {
      const directConversion = await getConversion(fromUnit, toUnit);
      return applyConversion(value, directConversion);
    } catch (error) {
      const nextVisited = new Set(visited);
      nextVisited.add(pathKey);

      for (const unit of currentUnits) {
        if (unit.symbol === fromUnit || unit.symbol === toUnit) {
          continue;
        }

        try {
          const stepConversion = await getConversion(fromUnit, unit.symbol);
          const stepValue = applyConversion(value, stepConversion);
          return await convertValueBetweenUnits(stepValue, unit.symbol, toUnit, nextVisited);
        } catch (stepError) {
          continue;
        }
      }

      throw new Error("Conversion not available for this pair");
    }
  }

  async function calculate({ persistHistory = false } = {}) {
    const runId = ++calculationRunId;

    const isStale = () => runId !== calculationRunId;

    try {
      state.fromVal = getDisplayNumber("from-value");
      state.toVal = getDisplayNumber("to-value");

      if (state.action === "Conversion") {
        if (!Number.isFinite(state.fromVal) || !state.fromUnit || !state.toUnit) {
          return;
        }

        const res =
          state.fromUnit === state.toUnit
            ? applyConversion(state.fromVal, {
                from: state.fromUnit,
                to: state.toUnit,
                factor: null,
                formula: null
              })
            : await convertValueBetweenUnits(state.fromVal, state.fromUnit, state.toUnit);
        if (isStale()) {
          return;
        }
        document.getElementById("to-value").value = res;
        state.toVal = res;
        persistUiState();
        showResult(res, state.toUnit);

        if (persistHistory) {
          const record = {
            type: state.type,
            action: state.action,
            expression: `${state.fromVal} ${state.fromUnit} to ${state.toUnit}`,
            result: `${res}`,
            timestamp: new Date().toISOString()
          };

          await saveHistory(record);
          if (isStale()) {
            return;
          }
          renderHistory(await getHistory());
        }
        return;
      }

      if (state.action === "Comparison") {
        if (
          !Number.isFinite(state.fromVal) ||
          !Number.isFinite(state.toVal) ||
          !state.fromUnit ||
          !state.toUnit
        ) {
          return;
        }

        const baseUnit = getBaseUnit(state.type);
        const base1 =
          state.fromUnit === baseUnit
            ? state.fromVal
            : await convertValueBetweenUnits(state.fromVal, state.fromUnit, baseUnit);
        const base2 =
          state.toUnit === baseUnit
            ? state.toVal
            : await convertValueBetweenUnits(state.toVal, state.toUnit, baseUnit);
        if (isStale()) {
          return;
        }
        const sentence = compareValues(
          state.fromVal,
          state.fromUnit,
          state.toVal,
          state.toUnit,
          base1,
          base2
        );

        showResult(sentence, "");
        document.getElementById("to-value").value = state.toVal;
        persistUiState();

        if (persistHistory) {
          const record = {
            type: state.type,
            action: state.action,
            expression: `${state.fromVal}${state.fromUnit} vs ${state.toVal}${state.toUnit}`,
            result: sentence,
            timestamp: new Date().toISOString()
          };

          await saveHistory(record);
          if (isStale()) {
            return;
          }
          renderHistory(await getHistory());
        }
        return;
      }

      if (
        !Number.isFinite(state.fromVal) ||
        !Number.isFinite(state.toVal) ||
        !state.fromUnit ||
        !state.toUnit
      ) {
        return;
      }

      const normalisedToValue =
        state.toUnit === state.fromUnit
          ? state.toVal
          : await convertValueBetweenUnits(state.toVal, state.toUnit, state.fromUnit);
      if (isStale()) {
        return;
      }
      const arithmeticResult = performArithmetic(state.fromVal, normalisedToValue, state.operator);

      document.getElementById("to-value").value = state.toVal;
      persistUiState();
      showResult(arithmeticResult, state.fromUnit);

      if (persistHistory) {
        const record = {
          type: state.type,
          action: state.action,
          expression: `${state.fromVal} ${state.fromUnit} ${state.operator} ${state.toVal} ${state.toUnit}`,
          result: `${arithmeticResult} ${state.fromUnit}`,
          timestamp: new Date().toISOString()
        };

        await saveHistory(record);
        if (isStale()) {
          return;
        }
        renderHistory(await getHistory());
      }
    } catch (error) {
      if (isStale()) {
        return;
      }
      showResult(`Error: ${error.message}`, "");
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
    console.log("toggleOperators available:", typeof toggleOperators === "function");
    console.log("renderHistory available:", typeof renderHistory === "function");
    console.log("type-card click wiring available:", typeof handleTypeCardClick === "function");
    console.log("action-tab click wiring available:", typeof handleActionTabClick === "function");
    console.log("calculate available:", typeof calculate === "function");

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

    // Commented out because it mutates the live result panel during normal use.
    // try {
    //   showResult("1000", "m");
    //   console.log("showResult sample result:", {
    //     value: document.querySelector("#result-value")?.textContent,
    //     unit: document.querySelector("#result-unit")?.textContent
    //   });
    // } catch (error) {
    //   console.error("showResult test failed:", error.message);
    // }

    try {
      toggleOperators(true);
      const shown = document.querySelector("#operator-selector")?.style.display;
      toggleOperators(false);
      const hidden = document.querySelector("#operator-selector")?.style.display;
      console.log("toggleOperators sample result:", { shown, hidden });
    } catch (error) {
      console.error("toggleOperators test failed:", error.message);
    }
    // try {
    //   renderHistory([
    //     {
    //       expression: "1 km to m",
    //       result: "1000",
    //       timestamp: "2025-01-01T10:00:00.000Z"
    //     }
    //   ]);
    //   console.log(
    //     "renderHistory sample result:",
    //     document.querySelector("#history-list")?.textContent?.trim()
    //   );
    // } catch (error) {
    //   console.error("renderHistory test failed:", error.message);
    // }

    try {
      console.log("handleTypeCardClick sample result:", {
        typeCards: document.querySelectorAll(".type-card").length,
        defaultResultValue: document.querySelector("#result-value")?.textContent
      });
    } catch (error) {
      console.error("handleTypeCardClick test failed:", error.message);
    }

    try {
      // const actionGroup = document.querySelector(".content-wrap section .row.g-3");
      // const arithmeticButton = document.querySelector('.action-btn[data-action="Arithmetic"]');
      // handleActionTabClick(arithmeticButton, actionGroup);
      console.log("handleActionTabClick sample result: commented out to avoid changing active action");
    } catch (error) {
      console.error("handleActionTabClick test failed:", error.message);
    }

    console.log("calculate sample skipped to avoid saving test records to history");
  }

  attachEventListeners();
  setActive(
    document.querySelector(".content-wrap section .row.g-4"),
    document.querySelector(`.type-card[data-type="${state.type}"]`),
    ".type-card"
  );
  setActive(
    document.querySelector(".content-wrap section .row.g-3"),
    document.querySelector(`.action-btn[data-action="${state.action}"]`),
    ".action-btn"
  );
  toggleOperators(state.action === "Arithmetic");
  await handleActionTabClick(
    document.querySelector(`.action-btn[data-action="${state.action}"]`),
    document.querySelector(".content-wrap section .row.g-3")
  );
  logMethodChecks();

  try {
    await loadUnits(state.type);
    showErrorBanner("");
  } catch (error) {
    handleServerError(error, "Failed to load units");
  }

  await loadHistory();
});
