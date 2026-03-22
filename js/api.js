const BASE_URL = "http://localhost:3000";

async function getUnits(type) {
  const res = await fetch(`${BASE_URL}/units?type=${encodeURIComponent(type.toLowerCase())}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return await res.json();
}

async function getConversion(from, to) {
  const res = await fetch(
    `${BASE_URL}/conversions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();

  if (!data.length) {
    throw new Error("No conversion found");
  }

  return data[0];
}

async function saveHistory(record) {
  const res = await fetch(`${BASE_URL}/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });

  return await res.json();
}

async function getHistory() {
  try {
    const res = await fetch(`${BASE_URL}/history?_sort=timestamp&_order=desc`);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to load history", error);
    return [];
  }
}
