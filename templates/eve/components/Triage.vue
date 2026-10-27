<script setup lang="ts">
import { activeTurn } from 'eve/events'
import { CONFIDENCE_THRESHOLD, type Issue, type Row, type TriageOutput } from '../agent/lib/triage'

const props = defineProps<{
  issues: Issue[]
}>()

const PROMPT = 'Triage the open issues.'

type Phase = 'idle' | 'running' | 'done'
type StageState = 'pending' | 'active' | 'done'
type TileState = Row['status'] | 'deciding' | 'idle'

const PIPELINE = [
  { label: 'Load issues', kind: 'code', detail: 'step' },
  { label: 'Decision model', kind: 'model', detail: 'every issue' },
  { label: 'Reviewer subagent', kind: 'model', detail: 'only if unsure' },
] as const

const agent = useEveAgent({ prewarm: true })
const { messages, status, view, error } = agent

const running = computed(() => status.value === 'busy' || activeTurn(view.value) !== undefined)
const started = computed(() => messages.value.some(message => message.role === 'user'))
const phase = computed<Phase>(() => running.value ? 'running' : started.value ? 'done' : 'idle')

const output = computed(() => {
  const call = messages.value
    .flatMap(message => message.parts)
    .findLast(part => part.type === 'tool' && part.name === 'triage_issues')
  return call?.type === 'tool' ? call.output as TriageOutput | undefined : undefined
})
const reply = computed(() => messages.value
  .filter(message => message.role === 'assistant')
  .flatMap(message => message.parts)
  .map(part => part.type === 'text' ? part.text : '')
  .join('')
  .trim())

const rows = computed(() => new Map(output.value?.issues.map(row => [row.number, row])))
const unsure = computed(() => output.value?.issues.filter(row => row.confidence < CONFIDENCE_THRESHOLD))

const stages = computed<StageState[]>(() => {
  if (phase.value === 'idle') return ['pending', 'pending', 'pending']
  if (phase.value === 'done') return ['done', 'done', 'done']
  if (!output.value) return ['done', 'active', 'pending']
  return output.value.issues.some(row => row.status === 'reviewing') ? ['done', 'done', 'active'] : ['done', 'done', 'done']
})

const activity = computed(() => {
  if (phase.value === 'done') return 'Done'
  if (!output.value) return 'Deciding every issue'
  const reviewing = output.value.issues.filter(row => row.status === 'reviewing').length
  return reviewing > 0 ? `Reviewing ${reviewing} unsure ${reviewing === 1 ? 'issue' : 'issues'}` : 'Summarizing'
})

// Time since the run started, frozen when it ends.
const startedAt = ref<number>()
const now = ref<number>()
let timer: ReturnType<typeof setInterval> | undefined
watch(phase, (value) => {
  clearInterval(timer)
  if (value === 'idle') startedAt.value = undefined
  if (value !== 'running') return
  const start = Date.now()
  startedAt.value ??= start
  now.value = start
  timer = setInterval(() => now.value = Date.now(), 100)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))
const elapsed = computed(() => startedAt.value === undefined || now.value === undefined ? undefined : Math.max(0, now.value - startedAt.value))

function tileState(issue: Issue): TileState {
  return rows.value.get(issue.number)?.status ?? (phase.value === 'running' ? 'deciding' : 'idle')
}

function isEscalated(row: Row | undefined) {
  return row !== undefined && row.confidence < CONFIDENCE_THRESHOLD
}

function percent(row: Row | undefined) {
  return row ? `${Math.round(row.confidence * 100)}%` : ''
}

const entryIndex = (index: number) => String(index).padStart(2, '0')
</script>

<template>
  <div :class="$style.console">
    <div :class="$style.pipeline">
      <div
        v-for="(stage, index) in PIPELINE"
        :key="stage.label"
        :class="$style.stageWrap"
      >
        <span
          v-if="index > 0"
          :class="[$style.connector, stages[index] !== 'pending' && $style.connectorOn]"
        />
        <span :class="[$style.stage, $style[stages[index]!]]">
          <span :class="$style.stageKind">{{ stage.kind }}</span>
          <span :class="$style.stageLabel">{{ stage.label }}</span>
          <span :class="$style.stageDetail">{{ stage.detail }}</span>
        </span>
      </div>
    </div>

    <div :class="$style.main">
      <div :class="$style.panel">
        <div
          v-if="phase === 'idle'"
          :class="$style.promptCard"
        >
          <p :class="$style.kicker">
            Prompt
          </p>
          <p :class="$style.promptText">
            {{ PROMPT }}
          </p>
          <button
            type="button"
            :class="$style.runButton"
            :disabled="status === 'resuming'"
            @click="agent.send(PROMPT)"
          >
            Run triage
          </button>
        </div>
        <template v-else>
          <div :class="$style.log">
            <p :class="$style.userText">
              {{ PROMPT }}
            </p>
            <ol :class="$style.entries">
              <li>
                <span :class="$style.entryIndex">{{ entryIndex(1) }}</span>
                <span :class="[$style.entryKind, $style.step]">step</span>
                <span :class="$style.entryText">Load issues · {{ props.issues.length }} issues</span>
              </li>
              <li v-if="unsure">
                <span :class="$style.entryIndex">{{ entryIndex(2) }}</span>
                <span :class="[$style.entryKind, $style.model]">model</span>
                <span :class="$style.entryText">Decision model · {{ props.issues.length - unsure.length }} confident, {{ unsure.length }} unsure</span>
              </li>
              <li
                v-for="(row, index) in unsure"
                :key="row.number"
              >
                <span :class="$style.entryIndex">{{ entryIndex(3 + index) }}</span>
                <span :class="[$style.entryKind, $style.agent]">agent</span>
                <span :class="$style.entryText">Reviewer · #{{ row.number }}</span>
              </li>
            </ol>
            <p
              v-if="reply"
              :class="$style.reply"
            >
              {{ reply }}
            </p>
            <p
              v-if="error"
              :class="$style.error"
            >
              {{ error.message }}
            </p>
          </div>
          <div :class="$style.footer">
            <span :class="$style.activity">
              <span
                :class="phase === 'running' ? $style.spinner : $style.dot"
                aria-hidden="true"
              />
              {{ activity }}
              <span
                v-if="elapsed !== undefined"
                :class="$style.elapsed"
              >{{ (elapsed / 1000).toFixed(1) }}s</span>
            </span>
            <button
              v-if="phase === 'running'"
              type="button"
              :class="$style.ghostButton"
              @click="agent.cancel()"
            >
              Stop
            </button>
            <button
              v-else
              type="button"
              :class="$style.ghostButton"
              @click="agent.newSession()"
            >
              Reset
            </button>
          </div>
        </template>
      </div>

      <div :class="$style.grid">
        <div
          v-for="issue in props.issues"
          :key="issue.number"
          :class="[$style.tile, $style[`tile_${tileState(issue)}`], isEscalated(rows.get(issue.number)) && $style.escalated]"
        >
          <div :class="$style.tileTop">
            <span :class="$style.tileNumber">#{{ issue.number }}</span>
            <span
              v-if="tileState(issue) === 'deciding'"
              :class="$style.tileStatus"
            >
              <span
                :class="$style.spinner"
                aria-hidden="true"
              />
              Deciding
            </span>
            <span
              v-else-if="tileState(issue) === 'reviewing'"
              :class="$style.tileStatus"
            >
              <span
                :class="$style.spinner"
                aria-hidden="true"
              />
              Reviewer
              <span :class="$style.amber">{{ percent(rows.get(issue.number)) }}</span>
            </span>
            <span
              v-else-if="tileState(issue) === 'decided' || tileState(issue) === 'reviewed'"
              :class="$style.tileStatus"
            >
              <span
                :class="$style.dot"
                aria-hidden="true"
              />
              {{ tileState(issue) === 'decided' ? 'Decision' : 'Reviewer' }}
              <span :class="isEscalated(rows.get(issue.number)) ? $style.amber : $style.white">{{ percent(rows.get(issue.number)) }}</span>
            </span>
            <span
              v-else-if="tileState(issue) === 'failed'"
              :class="[$style.tileStatus, $style.red]"
            >No answer</span>
          </div>
          <p :class="$style.tileTitle">
            {{ issue.title }}
          </p>
          <p :class="$style.tileBody">
            {{ rows.get(issue.number)?.summary ?? issue.body }}
          </p>
          <div :class="$style.tileBottom">
            <span
              v-if="rows.get(issue.number)"
              :class="$style.finding"
            >
              <span>{{ rows.get(issue.number)!.category }}</span>
              <span :class="rows.get(issue.number)!.priority === 'high' && $style.amber">{{ rows.get(issue.number)!.priority }}</span>
            </span>
          </div>
          <!-- Decision confidence along the bottom edge, with a tick at the threshold. -->
          <span
            v-if="rows.get(issue.number)"
            :class="$style.confidence"
            aria-hidden="true"
          >
            <span
              :class="$style.confidenceFill"
              :style="{
                transform: `scaleX(${rows.get(issue.number)!.confidence})`,
                background: isEscalated(rows.get(issue.number)) ? 'var(--amber)' : 'var(--white)',
              }"
            />
            <span
              :class="$style.confidenceMark"
              :style="{ left: `${CONFIDENCE_THRESHOLD * 100}%` }"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style module>
.console {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---------- Pipeline ---------- */

.pipeline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.stageWrap {
  display: flex;
  align-items: center;
}

.connector {
  width: 20px;
  height: 1px;
  background: var(--line);
}

.connectorOn {
  background: var(--gray);
}

.stage {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 10px;
  row-gap: 2px;
  align-items: baseline;
  padding: 8px 12px;
  border: var(--border);
  transition:
    border-color 250ms,
    color 250ms;
}

.stageKind {
  grid-row: span 2;
  align-self: center;
  padding: 2px 5px;
  border: 1px solid currentColor;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--gray-dim);
}

.stageLabel {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  white-space: nowrap;
}

.stageDetail {
  font-size: 12px;
  color: var(--gray-dim);
  white-space: nowrap;
}

.pending {
  color: var(--gray);
}

.active {
  border-color: var(--white);
  color: var(--white);
}

.active .stageKind {
  color: var(--white);
}

.done {
  color: var(--gray);
  border-color: var(--line);
}

/* ---------- Main ---------- */

.main {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
  min-height: 460px;
}

@media (max-width: 860px) {
  .main {
    grid-template-columns: 1fr;
  }
}

/* ---------- Prompt and run log ---------- */

.panel {
  display: flex;
  flex-direction: column;
  border: var(--border);
}

.promptCard {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 28px;
}

.kicker {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--gray-dim);
}

.promptText {
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
}

.runButton {
  align-self: flex-start;
  margin-top: 6px;
  padding: 10px 18px;
  border: 0;
  background: var(--white);
  color: var(--black);
  font-family: var(--font-mono);
  font-size: 13px;
  text-transform: uppercase;
  cursor: pointer;
}

.runButton:disabled {
  cursor: progress;
  opacity: 0.75;
}

.log {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
}

.userText {
  margin: 0;
  padding-left: 12px;
  border-left: 2px solid var(--line);
  font-size: 15px;
  line-height: 1.4;
  color: var(--gray);
}

.entries {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entries li {
  display: grid;
  grid-template-columns: 22px 48px 1fr;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.4;
}

.entryIndex {
  color: var(--gray-dim);
}

.entryKind {
  justify-self: start;
  padding: 3px 5px;
  border: 1px solid currentColor;
  font-size: 10px;
  line-height: 1;
  text-transform: uppercase;
}

.step {
  color: var(--gray);
}

.model,
.agent {
  color: var(--white);
}

.entryText {
  color: var(--white);
}

.reply {
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
}

.error {
  margin: 0;
  color: var(--red);
  font-size: 14px;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: var(--border);
}

.activity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--gray);
  white-space: nowrap;
}

.elapsed {
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

.ghostButton {
  flex: none;
  padding: 5px 10px;
  border: var(--border);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  color: var(--gray);
  cursor: pointer;
}

/* ---------- Issue grid ---------- */

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 10px;
}

@media (max-width: 860px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 14px 18px;
  border: var(--border);
  overflow: hidden;
  transition:
    border-color 250ms,
    opacity 250ms;
}

.tileTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tileNumber {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--gray);
}

.tileStatus {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--gray);
  white-space: nowrap;
}

.tileTitle {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  color: var(--white);
}

.tileBody {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--gray);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tileBottom {
  margin-top: auto;
  min-height: 18px;
}

.finding {
  display: flex;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
}

.confidence {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--line-soft);
}

.confidenceFill {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.confidenceMark {
  position: absolute;
  top: -3px;
  bottom: 0;
  width: 2px;
  background: var(--gray);
}

.tile_idle {
  opacity: 0.75;
}

.tile_deciding,
.tile_reviewing {
  border-color: var(--white);
}

.tile_decided,
.tile_reviewed {
  border-color: var(--line);
}

.tile_failed {
  border-color: var(--red);
}

.escalated {
  border-color: var(--amber);
}

.tile_reviewed.escalated {
  border-color: color-mix(in srgb, var(--amber) 55%, var(--line));
}

/* ---------- Shared ---------- */

.white {
  color: var(--white);
}

.amber {
  color: var(--amber);
}

.red {
  color: var(--red);
}

.dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--green);
}

.spinner {
  width: 11px;
  height: 11px;
  flex: none;
  border: 2px solid var(--line);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
