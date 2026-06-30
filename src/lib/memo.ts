// ─────────────────────────────────────────────────────────────
// CredVault – Memo Encoding / Decoding
// ─────────────────────────────────────────────────────────────
// Format: "CV:{SKILL_CODE}:{NOTE}"
// Max 28 characters (Stellar memo_text limit)
// ─────────────────────────────────────────────────────────────

import { type SkillTag, SKILL_MAP } from '@/types';
import { MemoTooLongError } from './errors';

const MEMO_PREFIX = 'CV';
const MEMO_MAX_LENGTH = 28;
const MEMO_SEPARATOR = ':';

/**
 * Build the "CV:{SKILL}:{note}" memo string.
 * Auto-truncates note to fit the 28-char Stellar limit.
 */
export function encodeMemo(skillTag: SkillTag, note?: string): string {
  const base = `${MEMO_PREFIX}${MEMO_SEPARATOR}${skillTag}${MEMO_SEPARATOR}`;
  const maxNoteLen = MEMO_MAX_LENGTH - base.length;

  let trimmedNote = '';
  if (note && note.trim().length > 0) {
    trimmedNote = note.trim().slice(0, maxNoteLen);
  }

  const memo = `${base}${trimmedNote}`;

  if (memo.length > MEMO_MAX_LENGTH) {
    throw new MemoTooLongError(memo.length);
  }

  return memo;
}

/**
 * Decode a memo_text string back to skillTag + note.
 * Non-CredVault memos return { skillTag: 'OTHER', note: memoText }.
 */
export function decodeMemo(memoText: string): {
  skillTag: SkillTag;
  note: string;
  isCredVault: boolean;
} {
  if (!memoText || !memoText.startsWith(`${MEMO_PREFIX}${MEMO_SEPARATOR}`)) {
    return {
      skillTag: 'OTHER',
      note: memoText || '',
      isCredVault: false,
    };
  }

  const parts = memoText.split(MEMO_SEPARATOR);
  // parts[0] = "CV", parts[1] = skill code, parts[2..] = note (may contain colons)
  const rawTag = parts[1] || '';
  const note = parts.slice(2).join(MEMO_SEPARATOR); // rejoin if note had colons

  // Validate skill tag against known codes
  const skillTag: SkillTag = (rawTag in SKILL_MAP) ? rawTag as SkillTag : 'OTHER';

  return {
    skillTag,
    note,
    isCredVault: true,
  };
}

/**
 * Calculate remaining note length for the given skill tag.
 */
export function getMaxNoteLength(skillTag: SkillTag): number {
  const base = `${MEMO_PREFIX}${MEMO_SEPARATOR}${skillTag}${MEMO_SEPARATOR}`;
  return MEMO_MAX_LENGTH - base.length;
}

/**
 * Preview what the encoded memo will look like.
 */
export function previewMemo(skillTag: SkillTag, note?: string): string {
  try {
    return encodeMemo(skillTag, note);
  } catch {
    return `CV:${skillTag}:${(note || '').slice(0, 15)}`;
  }
}
