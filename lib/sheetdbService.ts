const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/h08sww6zxko1g';

export interface CachedAnalysis {
  videoId: string;
  hash: string;
  title: string;
  analysis: string;
  score: number;
  decision: 'ALLOW' | 'REVIEW' | 'REMOVE';
  createdAt: string;
}

export async function getCachedResult(videoId: string): Promise<CachedAnalysis | null> {
  try {
    const response = await fetch(
      `${SHEETDB_API_URL}/search?videoId=${encodeURIComponent(videoId)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as CachedAnalysis;
    }

    return null;
  } catch (error) {
    console.error('SheetDB getCachedResult error:', error);
    return null;
  }
}

export async function getCachedResultByHash(hash: string): Promise<CachedAnalysis | null> {
  try {
    const response = await fetch(
      `${SHEETDB_API_URL}/search?hash=${encodeURIComponent(hash)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as CachedAnalysis;
    }

    return null;
  } catch (error) {
    console.error('SheetDB getCachedResultByHash error:', error);
    return null;
  }
}

export async function saveResult(data: CachedAnalysis): Promise<boolean> {
  try {
    const response = await fetch(SHEETDB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [data],
      }),
    });

    if (!response.ok) {
      console.error('SheetDB saveResult failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SheetDB saveResult error:', error);
    return false;
  }
}

export async function searchByHash(hash: string): Promise<CachedAnalysis | null> {
  return getCachedResultByHash(hash);
}
