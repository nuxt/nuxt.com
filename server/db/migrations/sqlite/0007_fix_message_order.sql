-- DATA FIX: every eve state sync used to delete and re-insert all chat
-- messages in one batch, so they share the same second-precision created_at.
-- Reads tie-broke on id, where `turn_N:assistant` sorts before `turn_N:user`:
-- the user prompt came back last and finished chats looked like they still
-- needed a generation (the resume logic then replayed the prompt). Spread the
-- ties out by turn index and role so each user message sorts right before its
-- assistant reply.
UPDATE messages
SET created_at = created_at
  + (CAST(substr(id, 6, instr(id, ':') - 6) AS INTEGER) * 2)
  + (CASE WHEN role = 'assistant' THEN 1 ELSE 0 END)
WHERE id GLOB 'turn_*:*';
