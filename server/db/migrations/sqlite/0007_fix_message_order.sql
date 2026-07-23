-- DATA FIX: batch-synced messages share the same second-precision created_at,
-- and the id tie-break sorts `turn_N:assistant` before `turn_N:user` — finished
-- chats looked unanswered and the resume logic replayed the prompt. Spread the
-- ties by turn index and role so each user message sorts before its reply.
UPDATE messages
SET created_at = created_at
  + (CAST(substr(id, 6, instr(id, ':') - 6) AS INTEGER) * 2)
  + (CASE WHEN role = 'assistant' THEN 1 ELSE 0 END)
WHERE id GLOB 'turn_*:*';
