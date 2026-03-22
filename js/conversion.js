function applyConversion(value, convObj) {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid number");
  }

  if (!convObj || typeof convObj !== "object") {
    throw new Error("Invalid conversion object");
  }

  if (convObj.from === convObj.to) {
    return parseFloat(value.toFixed(6));
  }

  if (convObj.factor !== null) {
    return parseFloat((value * convObj.factor).toFixed(6));
  }

  try {
    const expr = convObj.formula.replace("x", value);
    const result = eval(expr);
    return parseFloat(result.toFixed(6));
  } catch (error) {
    throw new Error("Bad formula");
  }
}
