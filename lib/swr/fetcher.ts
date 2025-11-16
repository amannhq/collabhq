/**
 * SWR Fetcher - Handles API requests with error handling
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include', // Include cookies for auth
  });

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    const info = await res.json().catch(() => ({ error: 'Failed to fetch' }));
    Object.assign(error, { info, status: res.status });
    throw error;
  }

  return res.json();
};

/**
 * POST Fetcher for mutations
 */
export const postFetcher = async (url: string, data?: unknown) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const error = new Error('An error occurred while posting data.');
    const info = await res.json().catch(() => ({ error: 'Failed to post' }));
    Object.assign(error, { info, status: res.status });
    throw error;
  }

  return res.json();
};
