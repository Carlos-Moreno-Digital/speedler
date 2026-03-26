export async function csvAdapterFetch(
  url: string,
  credentials?: string
): Promise<string> {
  const headers: Record<string, string> = {};

  if (credentials) {
    try {
      const parsed = JSON.parse(credentials);
      if (parsed.authType === 'basic') {
        headers['Authorization'] = `Basic ${Buffer.from(
          `${parsed.username}:${parsed.password}`
        ).toString('base64')}`;
      } else if (parsed.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    } catch {
      // No auth needed or invalid credentials format
    }
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}
