export interface ChatMessageShape {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    fullName: string | null;
    profileImage: string | null;
  };
  isCallMessage?: boolean;
  callStatus?: string | null;
  callDuration?: number | null;
  callSummary?: string | null;
}

/**
 * Same rules as chat-and-talk-frontend `chatMessageContent.ts`:
 * plain image URL (S3 etc.) or `<img src="...">` HTML.
 */
const IMG_SRC_RE = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i;

const decodeHtmlEntities = (s: string): string =>
  s
    ?.replace?.(/&amp;/g, '&')
    ?.replace?.(/&quot;/g, '"')
    ?.replace?.(/&#39;/g, "'")
    ?.replace?.(/&lt;/g, '<')
    ?.replace?.(/&gt;/g, '>');

const stripOuterQuotes = (s: string): string => {
  const t = s?.trim?.() ?? '';
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1)?.trim?.() ?? '';
  }
  return t;
};

const isHttpOrAppMediaUrl = (s: string): boolean => {
  if (!s || s.length > 8192) {
    return false;
  }
  return (
    /^https?:\/\/\S+$/i.test(s) ||
    /^file:\/\//i.test(s) ||
    /^content:\/\//i.test(s) ||
    /^ph:\/\//i.test(s)
  );
};

/** URL for <Image source={{ uri }} /> — aligns with web <img src>. */
export const getChatImageDisplayUrl = (
  content: string | undefined | null,
): string | null => {
  const raw = content?.trim?.() ?? '';
  if (!raw) {
    return null;
  }

  const imgMatch = raw.match(IMG_SRC_RE);
  if (imgMatch?.[1]) {
    const src = decodeHtmlEntities(imgMatch[1]?.trim?.() ?? '');
    if (isHttpOrAppMediaUrl(src)) {
      return src;
    }
  }

  const firstLine = raw.split(/\r?\n/)?.[0]?.trim?.() ?? '';
  const candidate = stripOuterQuotes(firstLine);

  if (
    !raw.includes('<') &&
    candidate?.length > 0 &&
    isHttpOrAppMediaUrl(candidate)
  ) {
    return candidate;
  }

  return null;
};

export const isChatImageContent = (content: string | undefined): boolean =>
  getChatImageDisplayUrl(content) != null;

export const mergeIncomingSocketMessage = <T extends ChatMessageShape>(
  prev: T[],
  incoming: any,
): T[] => {
  const mid = incoming?.id;
  if (mid == null) {
    return prev;
  }
  if (prev.some(m => m.id === mid)) {
    return prev;
  }

  const cleared = prev.filter(m => {
    if (m.id >= 0) {
      return true;
    }
    if (m?.sender?.id !== incoming?.sender?.id) {
      return true;
    }
    if (m.content === incoming?.content) {
      return false;
    }
    const inc = incoming?.content ?? '';
    const mc = m.content ?? '';
    if (
      /^https?:/i.test(inc) &&
      (mc.startsWith('file://') ||
        mc.startsWith('content://') ||
        mc.startsWith('ph://'))
    ) {
      return false;
    }
    return true;
  });

  const createdRaw = incoming?.createdAt;
  let createdAt: string;
  if (typeof createdRaw === 'string') {
    createdAt = createdRaw;
  } else if (createdRaw instanceof Date) {
    createdAt = createdRaw.toISOString();
  } else {
    createdAt = new Date().toISOString();
  }

  const next = {
    id: mid,
    content: incoming?.content ?? '',
    createdAt,
    sender: {
      id: incoming?.sender?.id ?? 0,
      fullName: incoming?.sender?.fullName ?? null,
      profileImage: incoming?.sender?.profileImage ?? null,
    },
    isCallMessage: Boolean(incoming?.isCallMessage),
    callStatus:
      typeof incoming?.callStatus === 'string' ? incoming.callStatus : null,
    callDuration: (() => {
      const v = incoming?.callDuration;
      if (typeof v === 'number' && Number.isFinite(v)) {
        return v;
      }
      if (v != null) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    })(),
    callSummary:
      typeof incoming?.callSummary === 'string'
        ? incoming.callSummary
        : incoming?.callSummary ?? null,
  } as T;

  return [...cleared, next];
};
