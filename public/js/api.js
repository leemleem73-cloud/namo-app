window.api = async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof result === 'string'
        ? result
        : result?.message || '요청 처리 중 오류가 발생했습니다.';
    throw new Error(message);
  }

  if (typeof result === 'object' && result !== null) {
    if (result.success === false) {
      throw new Error(result.message || '요청 실패');
    }
    if ('data' in result) {
      return result.data;
    }
  }

  return result;
};
