export async function ftpAdapterFetch(
  endpoint: string,
  credentials?: string
): Promise<string> {
  // Parse FTP connection details
  // endpoint format: ftp://host:port/path/to/file.csv
  // credentials format: {"username": "...", "password": "..."}

  let username = 'anonymous';
  let password = '';

  if (credentials) {
    try {
      const parsed = JSON.parse(credentials);
      username = parsed.username || 'anonymous';
      password = parsed.password || '';
    } catch {
      // Use defaults
    }
  }

  // For FTP, we use a HTTP proxy approach or fetch if the server supports it
  // In production, you'd use a proper FTP library like basic-ftp
  // For now, we try HTTP fetch which works for HTTP-accessible CSV files
  // and log a warning for actual FTP endpoints

  if (endpoint.startsWith('ftp://') || endpoint.startsWith('sftp://')) {
    // In production, implement with basic-ftp or ssh2-sftp-client
    // For now, convert to HTTP if possible
    console.warn(
      'FTP/SFTP adapter: Native FTP support requires basic-ftp package. ' +
      'Configure an HTTP-accessible URL or install basic-ftp for FTP support.'
    );

    // Try HTTP fallback
    const httpUrl = endpoint.replace(/^s?ftp:\/\//, 'https://');
    try {
      const response = await fetch(httpUrl);
      if (response.ok) {
        return response.text();
      }
    } catch {
      // HTTP fallback failed
    }

    throw new Error(
      'FTP adapter: Install basic-ftp package for native FTP support. ' +
      `Endpoint: ${endpoint}`
    );
  }

  // HTTP/HTTPS endpoint
  const headers: Record<string, string> = {};
  if (username !== 'anonymous') {
    headers['Authorization'] = `Basic ${Buffer.from(
      `${username}:${password}`
    ).toString('base64')}`;
  }

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    throw new Error(
      `FTP adapter fetch failed: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}
