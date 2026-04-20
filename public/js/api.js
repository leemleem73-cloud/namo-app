async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'API 오류');
  }

  return data;
}
