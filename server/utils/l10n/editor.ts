import { matchGlossary, recordStatus, sentenceDiff, type Glossary } from '@diglot/core'
import type { ContentFile } from 'comark-content'
import type { L10nEditorSegment } from '../../../shared/utils/l10n'
import type { L10nBundle } from './bundle'
import { pageSegments } from './write'

function newSentences(before: string, after: string): string[] {
  const diff = sentenceDiff(before, after)
  return diff.changed.map(index => diff.after[index]!)
}

/**
 * The translatable segments of an English page in document order, with their record in `bundle`
 * whether or not readers are shown it, and the glossary entries they use.
 */
export async function editorSegments(file: Pick<ContentFile, 'data' | 'nodes'>, bundle: L10nBundle, glossary: Glossary): Promise<L10nEditorSegment[]> {
  const segments: L10nEditorSegment[] = []
  for (const segment of (await pageSegments(file)).values()) {
    if (!segment.words) continue

    const record = bundle.record(segment.hash)
    const status = recordStatus(record, segment)
    const previous = status === 'pending-review' && record?.prev ? bundle.record(record.prev)?.source : undefined
    segments.push({
      hash: segment.hash,
      kind: segment.kind,
      format: segment.format,
      skeleton: segment.skeleton,
      words: segment.words,
      placeholders: segment.placeholders,
      status,
      ...(record
        ? {
            record: {
              text: record.text,
              origin: record.origin,
              review: record.review,
              ...(record.by ? { by: record.by } : {}),
              ...(record.verifiedBy ? { verifiedBy: record.verifiedBy.by } : {}),
              ...(record.rejectedBy ? { rejectedBy: record.rejectedBy.by } : {}),
              ...(record.mt ? { model: record.mt.model } : {}),
              updatedAt: record.updatedAt
            }
          }
        : {}),
      ...(previous ? { previous: { source: previous, changed: newSentences(previous, segment.skeleton) } } : {}),
      glossary: matchGlossary(glossary, segment.skeleton)
    })
  }
  return segments
}
