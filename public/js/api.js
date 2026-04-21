(function () {
  async function api(url, options = {}) {
    const config = {
      method: options.method || 'GET',
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      ...options,
    };

    const response = await fetch(url, config);

    let result;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      const message =
        typeof result === 'object' && result !== null
          ? result.message || '서버 요청 중 오류가 발생했습니다.'
          : result || '서버 요청 중 오류가 발생했습니다.';
      throw new Error(message);
    }

    if (typeof result === 'object' && result !== null) {
      if (result.success === false) {
        throw new Error(result.message || '요청 실패');
      }
      return Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
    }

    return result;
  }

  function buildQuery(params = {}) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      search.append(key, value);
    });

    const query = search.toString();
    return query ? `?${query}` : '';
  }

  api.get = function (url, params = {}, options = {}) {
    return api(`${url}${buildQuery(params)}`, {
      method: 'GET',
      ...options,
    });
  };

  api.post = function (url, body = {}, options = {}) {
    return api(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  };

  api.put = function (url, body = {}, options = {}) {
    return api(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  };

  api.delete = function (url, body = null, options = {}) {
    return api(url, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...options,
    });
  };

  api.download = async function (url, filename = 'download.json') {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let msg = '다운로드에 실패했습니다.';
      try {
        const data = await response.json();
        msg = data.message || msg;
      } catch (_e) {}
      throw new Error(msg);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  api.health = function () {
    return api.get('/api/test-db');
  };

  window.api = api;
})();
