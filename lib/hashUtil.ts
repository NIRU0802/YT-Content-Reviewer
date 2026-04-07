import { createHash } from 'crypto';

export function generateHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
}

export function generateVideoHash(videoId: string, title: string, description: string): string {
  const combined = `${videoId}|${title}|${description || ''}`;
  return generateHash(combined);
}

export function isSimpleInput(text: string): boolean {
  const totalLength = text.length;
  
  if (totalLength < 100) return true;
  
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 20) return true;
  
  const hasComplexPatterns = /\b(because|therefore|however|although|nevertheless|consequently|furthermore|moreover)\b/i.test(text);
  if (!hasComplexPatterns) return true;
  
  return false;
}

export function shouldUseAI(text: string): boolean {
  return !isSimpleInput(text);
}
