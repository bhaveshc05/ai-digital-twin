import { useEffect, useMemo, useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import {
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  ProgressBar,
  Row,
  Stack,
} from 'react-bootstrap'
import {
  practiceQuestionBank,
  practiceSubjects,
} from '../data/mockData.js'

const API_URL = 'http://localhost:8000'

const pageStyles = `
.test-page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(56, 189, 248, 0.13), transparent 34%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.05), transparent 24%),
    #0F172A;
  color: #e2e8f0;
}

.test-page-shell .page-frame {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.test-page-shell .hero-shell,
.test-page-shell .panel-surface {
  background: #1E293B;
  border: 1px solid #262626;
  border-radius: 24px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38);
}

.test-page-shell .mode-card {
  min-height: 152px;
  border-radius: 22px;
  border: 1px solid #262626;
  background: linear-gradient(180deg, rgba(18, 18, 18, 0.96), rgba(10, 10, 10, 0.96));
  transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.test-page-shell .mode-card:hover {
  transform: translateY(-1px);
  border-color: #3d4b57;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
}

.test-page-shell .mode-card.active {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.18), 0 18px 40px rgba(0, 0, 0, 0.3);
  background: linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(10, 10, 10, 0.98));
}

.test-page-shell .mode-card .mode-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #262626;
  background: rgba(255, 255, 255, 0.02);
  color: #38bdf8;
  font-size: 20px;
}

.test-page-shell .subject-chip {
  border-radius: 999px !important;
  border: 1px solid #262626 !important;
  background: #121212 !important;
  color: #c7d0db !important;
  padding: 10px 14px !important;
}

.test-page-shell .subject-chip.active {
  border-color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.13) !important;
  color: #7dd3fc !important;
}

.test-page-shell .question-option {
  border-radius: 16px !important;
  min-height: 58px;
  padding: 14px 16px !important;
  border: 1px solid #262626 !important;
  background: #334155 !important;
  color: #e2e8f0 !important;
  text-align: left !important;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms ease;
}

.test-page-shell .question-option:hover {
  transform: translateY(-1px);
  border-color: #3b5165 !important;
}

.test-page-shell .question-option.active {
  border-color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.12) !important;
  color: #f8fbff !important;
}

.test-page-shell .mic-wrap {
  width: 220px;
  height: 220px;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  position: relative;
}

.test-page-shell .mic-wrap::before,
.test-page-shell .mic-wrap::after {
  content: '';
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.16);
  pointer-events: none;
}

.test-page-shell .mic-wrap::after {
  inset: 0;
  border-color: rgba(56, 189, 248, 0.1);
}

.test-page-shell .mic-button {
  width: 118px;
  height: 118px;
  border-radius: 50% !important;
  border: 1px solid #262626 !important;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.36);
  position: relative;
}

.test-page-shell .mic-button.idle {
  background: linear-gradient(180deg, #334155, #1E293B) !important;
  color: #8a94a6 !important;
}

.test-page-shell .mic-button.listening {
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.28), rgba(56, 189, 248, 0.14)) !important;
  color: #d9f3ff !important;
  animation: pulseRing 1.8s ease-in-out infinite;
}

.test-page-shell .mic-button.speaking {
  background: linear-gradient(180deg, rgba(18, 18, 18, 0.97), rgba(14, 14, 14, 0.97)) !important;
  color: #38bdf8 !important;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.24), 0 18px 32px rgba(0, 0, 0, 0.34);
}

@keyframes pulseRing {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.35), 0 18px 32px rgba(0, 0, 0, 0.34);
  }
  70% {
    box-shadow: 0 0 0 18px rgba(56, 189, 248, 0), 0 18px 32px rgba(0, 0, 0, 0.34);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0), 0 18px 32px rgba(0, 0, 0, 0.34);
  }
}

.test-page-shell .review-row {
  border: 1px solid #262626;
  background: #0f0f0f;
  border-radius: 18px;
  overflow: hidden;
}

.test-page-shell .review-toggle {
  cursor: pointer;
  user-select: none;
}

.test-page-shell .soft-divider {
  border-color: #262626 !important;
  opacity: 1;
}

.test-page-shell .summary-badge,
.test-page-shell .badge {
  border: 1px solid #262626 !important;
  background-color: #121212 !important;
  color: #e2e8f0 !important;
  font-weight: 400 !important;
}

.test-page-shell .badge.bg-success {
  border: 1px solid #166534 !important;
  background-color: #052e16 !important;
  color: #4ade80 !important;
}

.test-page-shell .badge.bg-danger {
  border: 1px solid #991b1b !important;
  background-color: #450a0a !important;
  color: #f87171 !important;
}

.test-page-shell .custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #262626 transparent;
}

.test-page-shell .custom-scroll::-webkit-scrollbar {
  width: 6px;
}

.test-page-shell .custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.test-page-shell .custom-scroll::-webkit-scrollbar-thumb {
  background: #262626;
  border-radius: 3px;
}

.test-page-shell .custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #38bdf8;
}


/* ================= DYNAMIC QUIZ UI ================= */
.dynamic-quiz { animation: dynamicQuizIn .4s ease both; }
@keyframes dynamicQuizIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.dynamic-quiz-header { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:28px 32px; margin-bottom:18px; border:1px solid #262626; border-radius:24px; background:linear-gradient(135deg,#121212,#0b0b0b); box-shadow:0 20px 60px rgba(0,0,0,.25); }
.dynamic-eyebrow { color:#64748b; font-size:10px; font-weight:800; letter-spacing:.16em; margin-bottom:7px; }
.dynamic-title { margin:0; color:#f8fafc; font-size:clamp(28px,4vw,40px); font-weight:700; }
.dynamic-title span { color:#64748b; font-weight:500; }
.dynamic-meta { display:flex; gap:18px; margin-top:9px; color:#8a94a6; font-size:12px; }
.dynamic-meta span { display:flex; align-items:center; gap:6px; }
.dynamic-meta i { color:#38bdf8; }
.dynamic-timer { display:flex; align-items:center; gap:12px; min-width:165px; padding:13px 17px; border:1px solid #292929; border-radius:17px; background:#101010; }
.dynamic-timer-icon { width:42px; height:42px; display:flex; align-items:center; justify-content:center; border-radius:13px; color:#38bdf8; background:rgba(56,189,248,.1); font-size:18px; }
.dynamic-timer-label { color:#64748b; font-size:9px; font-weight:800; letter-spacing:.13em; }
.dynamic-timer-value { color:#f8fafc; font-size:19px; font-weight:700; margin-top:2px; }
.dynamic-progress-wrap { margin:0 4px 22px; }
.dynamic-progress-info { display:flex; justify-content:space-between; color:#94a3b8; font-size:13px; font-weight:600; margin-bottom:8px; }
.dynamic-progress-info strong { color:#38bdf8; }
.dynamic-progress-track { height:8px; overflow:hidden; border-radius:999px; background:#1e293b; }
.dynamic-progress-fill { height:100%; border-radius:inherit; background:linear-gradient(90deg,#38bdf8,#818cf8); transition:width .45s cubic-bezier(.4,0,.2,1); box-shadow:0 0 18px rgba(56,189,248,.35); }
.dynamic-progress-caption { color:#64748b; font-size:11px; margin-top:6px; }
.dynamic-quiz-layout { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:20px; align-items:start; }
.dynamic-question-card { padding:clamp(22px,4vw,42px); border-radius:26px; background:linear-gradient(145deg,#111,#0c0c0c); border:1px solid #262626; box-shadow:0 25px 70px rgba(0,0,0,.25); animation:questionIn .35s ease both; }
@keyframes questionIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
.dynamic-question-head { display:flex; justify-content:space-between; align-items:center; gap:15px; margin-bottom:28px; }
.dynamic-tags { display:flex; flex-wrap:wrap; gap:8px; }
.dynamic-tags span { display:inline-flex; align-items:center; gap:6px; padding:7px 11px; border:1px solid #292929; border-radius:999px; background:#161616; color:#94a3b8; font-size:10px; }
.dynamic-tags i { color:#38bdf8; }
.dynamic-q-number { color:#475569; font-size:14px; font-weight:800; }
.dynamic-question-title-row { display:flex; align-items:flex-start; gap:17px; margin-bottom:31px; }
.dynamic-question-icon { flex:0 0 auto; width:46px; height:46px; display:flex; align-items:center; justify-content:center; border-radius:15px; color:#38bdf8; background:rgba(56,189,248,.1); border:1px solid rgba(56,189,248,.18); font-size:20px; }
.dynamic-question-title-row h3 { margin:0; color:#f8fafc; font-size:clamp(20px,3vw,29px); line-height:1.4; font-weight:650; }
.dynamic-options { display:grid; gap:12px; }
.dynamic-option { width:100%; display:flex; align-items:center; gap:14px; padding:15px 17px; border-radius:17px; background:#111; border:1px solid #292929; color:#cbd5e1; text-align:left; cursor:pointer; transition:transform .2s ease,border-color .2s ease,background .2s ease,box-shadow .2s ease; }
.dynamic-option:hover { transform:translateY(-2px); border-color:#3f3f46; background:#151515; box-shadow:0 10px 25px rgba(0,0,0,.18); }
.dynamic-option.selected { transform:translateY(-2px); background:linear-gradient(135deg,rgba(56,189,248,.12),rgba(129,140,248,.08)); border-color:#38bdf8; color:#f8fafc; box-shadow:0 0 0 1px rgba(56,189,248,.1),0 10px 30px rgba(56,189,248,.08); }
.dynamic-option-letter { flex:0 0 auto; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:12px; background:#181818; border:1px solid #303030; color:#64748b; font-weight:800; transition:.2s ease; }
.dynamic-option.selected .dynamic-option-letter { background:#38bdf8; border-color:#38bdf8; color:#06131a; }
.dynamic-option-text { flex:1; font-size:15px; line-height:1.5; }
.dynamic-option-check { color:#475569; font-size:18px; transition:.2s ease; }
.dynamic-option.selected .dynamic-option-check { color:#38bdf8; transform:scale(1.12); }
.dynamic-navigation { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:30px; padding-top:25px; border-top:1px solid #262626; }
.dynamic-nav { min-height:48px; padding:0 18px; border-radius:14px !important; display:inline-flex !important; align-items:center; justify-content:center; gap:8px; font-weight:700 !important; transition:transform .2s ease,box-shadow .2s ease !important; }
.dynamic-nav:hover:not(:disabled) { transform:translateY(-2px); }
.dynamic-nav.secondary { background:#151515 !important; border:1px solid #303030 !important; color:#cbd5e1 !important; }
.dynamic-nav.primary { background:linear-gradient(135deg,#38bdf8,#6366f1) !important; border:0 !important; color:white !important; box-shadow:0 8px 25px rgba(56,189,248,.18); }
.dynamic-nav.submit { background:linear-gradient(135deg,#22c55e,#16a34a) !important; border:0 !important; color:white !important; }
.dynamic-nav-center { display:flex; flex-direction:column; align-items:center; color:#64748b; font-size:10px; }
.dynamic-nav-center strong { color:#e2e8f0; font-size:14px; }
.dynamic-navigator { position:sticky; top:20px; padding:22px; border-radius:24px; background:#101010; border:1px solid #262626; box-shadow:0 20px 50px rgba(0,0,0,.2); }
.dynamic-navigator-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
.dynamic-navigator-head h4 { margin:4px 0 0; color:#f8fafc; font-size:18px; }
.dynamic-navigator-head > span { padding:6px 9px; border-radius:10px; background:#181818; color:#38bdf8; font-size:12px; font-weight:800; }
.dynamic-answer-progress { height:5px; overflow:hidden; margin-bottom:20px; border-radius:999px; background:#1e293b; }
.dynamic-answer-progress div { height:100%; border-radius:inherit; background:#22c55e; transition:width .3s ease; }
.dynamic-question-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.dynamic-question-btn { aspect-ratio:1; border-radius:11px; background:#151515; border:1px solid #292929; color:#64748b; font-size:12px; font-weight:800; cursor:pointer; transition:.2s ease; }
.dynamic-question-btn:hover { transform:translateY(-2px); border-color:#38bdf8; color:#e2e8f0; }
.dynamic-question-btn.answered { background:rgba(34,197,94,.12); border-color:rgba(34,197,94,.35); color:#4ade80; }
.dynamic-question-btn.current { background:#38bdf8; border-color:#38bdf8; color:#06131a; transform:scale(1.05); box-shadow:0 0 15px rgba(56,189,248,.25); }
.dynamic-question-btn.current.answered { background:#38bdf8; border-color:#38bdf8; color:#06131a; }
.dynamic-legend { display:flex; flex-direction:column; gap:9px; margin-top:22px; padding-top:18px; border-top:1px solid #262626; color:#64748b; font-size:10px; }
.dynamic-legend span { display:flex; align-items:center; gap:8px; }
.dynamic-legend b { width:8px; height:8px; border-radius:50%; display:inline-block; }
.current-dot { background:#38bdf8; }.answered-dot { background:#22c55e; }.pending-dot { background:#475569; }
.dynamic-session-tip { display:flex; gap:10px; margin-top:20px; padding:13px; border-radius:15px; background:rgba(56,189,248,.06); border:1px solid #242424; }
.dynamic-session-tip > div { flex:0 0 auto; width:33px; height:33px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:rgba(56,189,248,.12); color:#38bdf8; }
.dynamic-session-tip p { margin:0; color:#64748b; font-size:10px; line-height:1.5; }.dynamic-session-tip strong { color:#e2e8f0; }
@media (max-width:1100px) { .dynamic-quiz-layout { grid-template-columns:1fr; } .dynamic-navigator { position:static; } .dynamic-question-grid { grid-template-columns:repeat(10,1fr); } }
@media (max-width:768px) { .dynamic-quiz-header { flex-direction:column; align-items:stretch; padding:22px; } .dynamic-timer { width:100%; } .dynamic-question-title-row { flex-direction:column; } .dynamic-navigation { flex-wrap:wrap; } .dynamic-nav { flex:1; } .dynamic-nav-center { order:3; width:100%; } .dynamic-question-grid { grid-template-columns:repeat(8,1fr); } }
@media (max-width:480px) { .dynamic-meta { flex-direction:column; gap:5px; } .dynamic-question-card { padding:18px; } .dynamic-option { padding:13px; } .dynamic-option-letter { width:34px; height:34px; } .dynamic-option-text { font-size:13px; } .dynamic-question-grid { grid-template-columns:repeat(5,1fr); } }
`

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds)
  )

  const minutes = Math.floor(
    safeSeconds / 60
  )

  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`
}

function getElapsedSeconds(
  startedAt,
  completedAt
) {
  if (!startedAt) return 0

  return Math.max(
    0,
    Math.round(
      (completedAt - startedAt) / 1000
    )
  )
}

function buildGeneratedQuestions(
  subjectIds,
  requestedCount
) {
  const selectedSet = new Set(subjectIds)

  const filtered =
    practiceQuestionBank.filter(
      (question) =>
        selectedSet.size === 0 ||
        selectedSet.has(question.subjectId)
    )

  return filtered.slice(
    0,
    requestedCount
  )
}

function normalizeGeneratedQuestions(
  rawQuestions
) {
  if (!Array.isArray(rawQuestions)) {
    return []
  }

  return rawQuestions.map(
    (question, index) => {
      const rawOptions = Array.isArray(
        question?.options
      )
        ? question.options
        : Array.isArray(
          question?.choices
        )
          ? question.choices
          : Array.isArray(
            question?.answers
          )
            ? question.answers
            : []

      const options = rawOptions.map(
        (option, optionIndex) => {
          if (typeof option === 'string') {
            return {
              id: String.fromCharCode(
                97 + optionIndex
              ),
              text: option,
            }
          }

          return {
            id:
              option?.id ||
              option?.key ||
              option?.value ||
              String.fromCharCode(
                97 + optionIndex
              ),

            text:
              option?.text ||
              option?.value ||
              option?.label ||
              '',
          }
        }
      )

      return {
        ...question,

        id:
          question?.id ||
          question?.question_id ||
          `generated-${index}`,

        question:
          question?.question ||
          question?.question_text ||
          question?.text ||
          'Question unavailable',

        options,

        correctOptionId:
          question?.correctOptionId ||
          question?.correct_option_id ||
          question?.correct_answer ||
          question?.answer ||
          null,

        subjectName:
          question?.subjectName ||
          question?.subject ||
          'General',

        category:
          question?.category ||
          question?.topic ||
          'General',

        sourceLabel:
          question?.sourceLabel ||
          question?.source ||
          'Generated',

        sampleStudentResponse:
          question?.sampleStudentResponse ||
          question?.sample_student_response ||
          '',
      }
    }
  )
}

function createQuizResults(
  questions,
  answers,
  startedAt,
  completedAt
) {
  const safeQuestions =
    Array.isArray(questions)
      ? questions
      : []

  const breakdown =
    safeQuestions.map((question) => {
      const selectedOptionId =
        answers?.[question.id] ||
        null

      const options =
        Array.isArray(question?.options)
          ? question.options
          : []

      const selectedOption =
        options.find(
          (option) =>
            option.id ===
            selectedOptionId
        ) || null

      const correctOption =
        options.find(
          (option) =>
            option.id ===
            question.correctOptionId
        ) || null

      return {
        id: question.id,

        subjectName:
          question.subjectName ||
          'General',

        category:
          question.category ||
          'General',

        sourceLabel:
          question.sourceLabel ||
          'Generated',

        question:
          question.question ||
          'Question unavailable',

        selectedOptionText:
          selectedOption
            ? selectedOption.text
            : 'No answer selected',

        correctOptionText:
          correctOption
            ? correctOption.text
            : 'Unavailable',

        isCorrect:
          selectedOptionId ===
          question.correctOptionId,
      }
    })

  const correctCount =
    breakdown.filter(
      (item) => item.isCorrect
    ).length

  const incorrectCount =
    breakdown.length - correctCount

  return {
    accuracy: breakdown.length
      ? Math.round(
        (correctCount /
          breakdown.length) *
        100
      )
      : 0,

    correctCount,
    incorrectCount,

    reviewedCount:
      breakdown.length,

    timeElapsedSeconds:
      getElapsedSeconds(
        startedAt,
        completedAt
      ),

    breakdown,
  }
}

function createVivaResults(
  transcript,
  startedAt,
  completedAt,
  questionCount
) {
  const safeTranscript =
    Array.isArray(transcript)
      ? transcript
      : []

  const pairedCount =
    safeTranscript.length

  const performanceLabel =
    pairedCount >= 5
      ? 'Strong Conceptual Grasp'
      : pairedCount >= 3
        ? 'Solid Conceptual Base'
        : 'Needs More Articulation'

  const strengths =
    pairedCount >= 5
      ? [
        'Uses subject terminology with confidence',
        'Keeps answers structured and complete',
        'Connects concepts across prompts',
      ]
      : pairedCount >= 3
        ? [
          'Shows core recall under prompt changes',
          'Responds clearly with minimal hesitation',
          'Maintains topic alignment during follow-ups',
        ]
        : [
          'Shows baseline familiarity with the topic',
          'Responds to prompts with simple recall',
        ]

  const areasToImprove =
    pairedCount >= 5
      ? [
        'Add one more concrete example per answer',
        'Slow slightly on transitions between points',
      ]
      : [
        'Expand answers with supporting detail',
        'Use stronger signposting before concluding',
        'Practice a fuller explanation rhythm',
      ]

  return {
    performanceLabel,
    strengths,
    areasToImprove,
    reviewedCount: pairedCount,
    sourceQuestionCount:
      questionCount,

    timeElapsedSeconds:
      getElapsedSeconds(
        startedAt,
        completedAt
      ),

    transcript: safeTranscript,
  }
}

function ResultsMetricCard({
  title,
  value,
  subtitle,
  accent = false,
}) {
  return (
    <Card
      className="panel-surface h-100"
      body
      style={{ padding: 18 }}
    >
      <div
        className="text-uppercase small mb-2"
        style={{
          letterSpacing: '0.14em',
          color: '#8a94a6',
        }}
      >
        {title}
      </div>

      <div
        className="fw-semibold"
        style={{
          fontSize: accent ? 34 : 26,
          lineHeight: 1.05,
          color: accent
            ? '#7dd3fc'
            : '#f8fafc',
        }}
      >
        {value}
      </div>

      {subtitle ? (
        <div
          className="mt-2"
          style={{
            fontSize: 13,
            color: '#8a94a6',
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </Card>
  )
}

function ExpandableRow({
  item,
  expanded,
  onToggle,
  header,
  details,
  badge,
}) {
  return (
    <div className="review-row">
      <button
        type="button"
        className="review-toggle w-100 border-0 bg-transparent text-start text-light p-3 p-md-4"
        onClick={onToggle}
        style={{ outline: 'none' }}
      >
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              {header}
            </div>

            <div
              className="text-light"
              style={{ color: '#dbe3ea' }}
            >
              {item.questionPreview}
            </div>
          </div>

          <i
            className={`bi ${expanded
              ? 'bi-chevron-up'
              : 'bi-chevron-down'
              }`}
            aria-hidden="true"
            style={{
              color: '#8a94a6',
              fontSize: 18,
            }}
          />
        </div>
      </button>

      <Collapse in={expanded}>
        <div>
          <div className="px-3 px-md-4 pb-4 pt-0">
            <hr className="soft-divider my-0 mb-3" />

            {details}

            {badge ? (
              <div className="mt-3">
                {badge}
              </div>
            ) : null}
          </div>
        </div>
      </Collapse>
    </div>
  )
}

function ResultsShell({
  title,
  eyebrow,
  summaryCards,
  footerNote,
  children,
  onReset,
}) {
  const safeSummaryCards =
    Array.isArray(summaryCards)
      ? summaryCards
      : []

  const summaryClassName =
    safeSummaryCards.length >= 5
      ? 'row-cols-xl-5'
      : 'row-cols-xl-4'

  return (
    <div className="d-flex flex-column gap-4">
      <div className="hero-shell p-4 p-xl-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 gap-lg-4">
        <div>
          <div
            className="text-uppercase small mb-2"
            style={{
              letterSpacing: '0.16em',
              color: '#8a94a6',
            }}
          >
            {eyebrow}
          </div>

          <h2
            className="m-0 fw-semibold"
            style={{
              fontSize: 34,
              color: '#f8fafc',
            }}
          >
            {title}
          </h2>
        </div>

        <Button
          variant="outline-secondary"
          onClick={onReset}
          style={{ minWidth: 168 }}
        >
          Return to Home
        </Button>
      </div>

      <Row
        className={`g-3 row-cols-1 row-cols-md-2 ${summaryClassName}`}
      >
        {safeSummaryCards.map(
          (card) => (
            <Col key={card.title}>
              <ResultsMetricCard
                {...card}
              />
            </Col>
          )
        )}
      </Row>

      {footerNote ? (
        <Card
          className="panel-surface"
          body
          style={{ padding: 18 }}
        >
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div
              style={{
                color: '#8a94a6',
              }}
            >
              {footerNote.left}
            </div>

            <div
              style={{
                color: '#cbd5e1',
              }}
            >
              {footerNote.right}
            </div>
          </div>
        </Card>
      ) : null}

      {children}
    </div>
  )
}

export default function TestPage() {
  const { user } =
    useContext(AuthContext)

  const [sessionState, setSessionState] =
    useState('setup')

  const [mode, setMode] =
    useState(null)

  const [
    selectedSubjects,
    setSelectedSubjects,
  ] = useState([])

  const [
    questionCount,
    setQuestionCount,
  ] = useState(10)

  const [
    customGuidelines,
    setCustomGuidelines,
  ] = useState('')

  const [questions, setQuestions] =
    useState([])

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0)

  const [answers, setAnswers] =
    useState({})

  const [micState, setMicState] =
    useState('idle')

  const [transcript, setTranscript] =
    useState([])

  const [
    sessionStartedAt,
    setSessionStartedAt,
  ] = useState(null)

  const [
    sessionCompletedAt,
    setSessionCompletedAt,
  ] = useState(null)

  const [
    quizResults,
    setQuizResults,
  ] = useState(null)

  const [
    masteryResult,
    setMasteryResult,
  ] = useState(null)

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    vivaResults,
    setVivaResults,
  ] = useState(null)

  const [
    expandedRows,
    setExpandedRows,
  ] = useState({})

  const [
    displayNow,
    setDisplayNow,
  ] = useState(() => Date.now())

  useEffect(() => {
    if (
      sessionState !== 'quiz' &&
      sessionState !== 'viva'
    ) {
      return undefined
    }

    const intervalId =
      window.setInterval(() => {
        setDisplayNow(Date.now())
      }, 1000)

    return () =>
      window.clearInterval(
        intervalId
      )
  }, [
    sessionState,
    sessionStartedAt,
  ])

  const subjectMap = useMemo(() => {
    const safeSubjects =
      Array.isArray(
        practiceSubjects
      )
        ? practiceSubjects
        : []

    return new Map(
      safeSubjects.map(
        (subject) => [
          subject.id,
          subject,
        ]
      )
    )
  }, [])

  const setupPreviewQuestions =
    useMemo(() => {
      return buildGeneratedQuestions(
        selectedSubjects,
        questionCount
      )
    }, [
      questionCount,
      selectedSubjects,
    ])

  const activeQuestions =
    sessionState === 'setup'
      ? setupPreviewQuestions
      : Array.isArray(questions)
        ? questions
        : []

  const currentQuestion =
    activeQuestions[
    currentQuestionIndex
    ] || null

  const elapsedSeconds =
    sessionStartedAt
      ? getElapsedSeconds(
        sessionStartedAt,
        sessionCompletedAt ??
        displayNow
      )
      : 0

  const elapsedLabel =
    formatDuration(elapsedSeconds)

  const selectedSubjectNames =
    selectedSubjects.length
      ? selectedSubjects
        .map(
          (subjectId) =>
            subjectMap.get(
              subjectId
            )?.name
        )
        .filter(Boolean)
      : practiceSubjects.map(
        (subject) => subject.name
      )

  const initializeSession =
    async () => {
      try {
        const topic =
          selectedSubjectNames.length
            ? selectedSubjectNames.join(
              ', '
            )
            : 'General'

        const studentId =
          user?.student_id ||
          user?.id ||
          'unknown'

        const res = await fetch(
          `${API_URL}/api/v1/tests/generate`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              student_id: studentId,
              num_questions:
                questionCount,
              topic,
            }),
          }
        )

        if (!res.ok) {
          throw new Error(
            `Test generation failed: ${res.status}`
          )
        }

        const data =
          await res.json()

        console.log(
          'GENERATE TEST RESPONSE:',
          data
        )

        let generatedQuestions =
          normalizeGeneratedQuestions(
            data?.questions
          )

        if (
          !generatedQuestions.length
        ) {
          generatedQuestions =
            normalizeGeneratedQuestions(
              buildGeneratedQuestions(
                selectedSubjects,
                questionCount
              )
            )
        }

        if (mode === 'quiz') {
          generatedQuestions =
            generatedQuestions.filter(
              (question) =>
                Array.isArray(
                  question.options
                ) &&
                question.options.length >
                0
            )
        }

        if (
          !generatedQuestions.length
        ) {
          generatedQuestions =
            normalizeGeneratedQuestions(
              buildGeneratedQuestions(
                selectedSubjects,
                questionCount
              )
            )
        }

        setQuestions(
          generatedQuestions
        )

        setAnswers({})
        setCurrentQuestionIndex(0)
        setTranscript([])
        setMicState('idle')
        setQuizResults(null)
        setMasteryResult(null)
        setVivaResults(null)
        setExpandedRows({})
        setSessionStartedAt(
          Date.now()
        )
        setSessionCompletedAt(null)

        setSessionState(
          mode === 'quiz'
            ? 'quiz'
            : 'viva'
        )
      } catch (e) {
        console.error(
          'Failed to generate test questions',
          e
        )

        const generatedQuestions =
          normalizeGeneratedQuestions(
            buildGeneratedQuestions(
              selectedSubjects,
              questionCount
            )
          )

        setQuestions(
          generatedQuestions
        )

        setAnswers({})
        setCurrentQuestionIndex(0)
        setTranscript([])
        setMicState('idle')
        setQuizResults(null)
        setMasteryResult(null)
        setVivaResults(null)
        setExpandedRows({})
        setSessionStartedAt(
          Date.now()
        )
        setSessionCompletedAt(null)

        setSessionState(
          mode === 'quiz'
            ? 'quiz'
            : 'viva'
        )
      }
    }

  const resetToSetup = () => {
    setSessionState('setup')
    setMode(null)
    setSelectedSubjects([])
    setQuestionCount(10)
    setCustomGuidelines('')
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers({})
    setMicState('idle')
    setTranscript([])
    setSessionStartedAt(null)
    setSessionCompletedAt(null)
    setQuizResults(null)
    setMasteryResult(null)
    setSubmitting(false)
    setVivaResults(null)
    setExpandedRows({})
  }

  const toggleSubject = (
    subjectId
  ) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter(
          (value) =>
            value !== subjectId
        )
        : [...prev, subjectId]
    )
  }

  const toggleExpandedRow = (
    rowId
  ) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
  }

  const handleAnswerSelect = (
    questionId,
    optionId
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  /*
   * FINAL QUIZ SUBMISSION
   *
   * 1. Calculate frontend quiz result
   * 2. Send each answer to mastery endpoint
   * 3. Receive BKT mastery response
   * 4. Store mastery response in React
   * 5. Show mastery on Results page
   */
  const handleSubmitQuiz = async () => {
    if (submitting) return;

    const completedAt = Date.now();

    const result = createQuizResults(
      questions,
      answers,
      sessionStartedAt,
      completedAt
    );

    setSubmitting(true);
    setQuizResults(result);
    setSessionCompletedAt(completedAt);

    // Check logged-in student
    if (!user || (!user.student_id && !user.id)) {
      console.warn(
        "No logged-in student found. Mastery was not updated."
      );

      setSubmitting(false);
      setSessionState("results");
      return;
    }

    const studentId = user.student_id || user.id;

    try {
      /*
       * Store mastery response for each topic.
       *
       * Example:
       * Python -> Variables
       * Python -> Loops
       * DSA -> Algorithms
       */
      const masteryResults = {};

      for (const item of result.breakdown) {
        const subject = item.subjectName || "General";
        const topic = item.category || "General";

        try {
          const response = await fetch(
            `${API_URL}/api/v1/mastery/update`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                student_id: studentId,
                subject: subject,
                topic: topic,
                is_correct: Boolean(item.isCorrect),
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
              `Mastery update failed: ${response.status} ${errorText}`
            );
          }

          const masteryData = await response.json();

          console.log(
            `MASTERY UPDATED: ${subject} -> ${topic}`,
            masteryData
          );

          /*
           * Keep the latest mastery for this topic.
           * If multiple questions belong to the same topic,
           * the last response contains the updated value.
           */
          masteryResults[`${subject}-${topic}`] = masteryData;
        } catch (error) {
          console.error(
            `Failed to update mastery for ${subject} -> ${topic}:`,
            error
          );
        }
      }

      /*
       * Save all topic mastery results.
       *
       * If your UI currently expects only one mastery object,
       * this will still keep the last updated topic.
       */
      const allMasteryResults = Object.values(masteryResults);

      if (allMasteryResults.length > 0) {
        setMasteryResult(allMasteryResults);

        console.log(
          "FINAL MASTERY RESULTS:",
          allMasteryResults
        );
      } else {
        console.warn("No mastery response received.");
      }
    } catch (error) {
      console.error(
        "Mastery processing failed:",
        error
      );
    } finally {
      setSubmitting(false);
      setSessionState("results");
    }
  };

  const completedExchangesCount =
    useMemo(() => {
      return transcript.filter(
        (entry) =>
          entry.studentText !== null
      ).length
    }, [transcript])

  const handleMicClick = () => {
    if (!questions.length) return

    if (micState === 'idle') {
      setMicState('speaking')

      setTranscript((prev) => {
        const questionIndex =
          prev.length

        const question =
          questions[
          questionIndex %
          questions.length
          ] ||
          practiceQuestionBank[
          questionIndex %
          practiceQuestionBank.length
          ]

        return [
          ...prev,
          {
            id: crypto.randomUUID(),

            questionPreview:
              question.question,

            examinerText:
              question.question,

            studentText: null,

            subjectName:
              question.subjectName ||
              'General',

            category:
              question.category ||
              'General',

            sourceLabel:
              question.sourceLabel ||
              'Generated',

            sampleStudentResponse:
              question.sampleStudentResponse ||
              '',
          },
        ]
      })
    } else if (
      micState === 'speaking'
    ) {
      setMicState('listening')
    } else if (
      micState === 'listening'
    ) {
      setMicState('idle')

      setTranscript((prev) =>
        prev.map(
          (entry, index) => {
            if (
              index ===
              prev.length - 1
            ) {
              return {
                ...entry,
                studentText:
                  entry.sampleStudentResponse ||
                  'Student response recorded.',
              }
            }

            return entry
          }
        )
      )
    }
  }

  const handleEndViva = () => {
    const completedAt =
      Date.now()

    const completedTranscript =
      transcript.filter(
        (entry) =>
          entry.studentText !== null
      )

    const result =
      createVivaResults(
        completedTranscript,
        sessionStartedAt,
        completedAt,
        questions.length
      )

    setVivaResults(result)
    setSessionCompletedAt(
      completedAt
    )
    setSessionState('results')
  }

  const modeCards = [
    {
      id: 'quiz',
      title: 'Quiz Mode',
      description:
        'Answer objective questions with a reviewable score breakdown.',
      icon: 'bi-ui-checks-grid',
    },
    {
      id: 'viva',
      title: 'Viva Mode',
      description:
        'Practice spoken reasoning with a transcript-driven review.',
      icon: 'bi-mic-fill',
    },
  ]

  const setupView = (
    <Row className="g-4 align-items-start">
      <Col xxl={8}>
        <Card className="hero-shell p-4 p-xl-5 h-100">
          <div className="mb-4">
            <div
              className="text-uppercase small mb-2"
              style={{
                letterSpacing:
                  '0.16em',
                color: '#8a94a6',
              }}
            >
              Session Setup
            </div>

            <h2
              className="m-0 fw-semibold"
              style={{
                fontSize: 32,
                color: '#f8fafc',
              }}
            >
              Choose your practice flow
            </h2>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3
                className="m-0"
                style={{
                  fontSize: 18,
                  color: '#f8fafc',
                }}
              >
                Select Mode
              </h3>

              <span
                style={{
                  color: '#8a94a6',
                }}
              >
                Pick one to continue
              </span>
            </div>

            <Row className="g-3">
              {modeCards.map(
                (card) => {
                  const isActive =
                    mode === card.id

                  return (
                    <Col
                      md={6}
                      key={card.id}
                    >
                      <Button
                        type="button"
                        className={`mode-card w-100 text-start p-4 ${isActive
                          ? 'active'
                          : ''
                          }`}
                        onClick={() =>
                          setMode(
                            card.id
                          )
                        }
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div className="mode-icon">
                            <i
                              className={`bi ${card.icon}`}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="flex-grow-1">
                            <div
                              className="fw-semibold mb-2"
                              style={{
                                fontSize: 22,
                                color:
                                  '#f8fafc',
                              }}
                            >
                              {
                                card.title
                              }
                            </div>

                            <div
                              style={{
                                color:
                                  '#8a94a6',
                                lineHeight:
                                  1.5,
                              }}
                            >
                              {
                                card.description
                              }
                            </div>
                          </div>
                        </div>
                      </Button>
                    </Col>
                  )
                }
              )}
            </Row>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3
                className="m-0"
                style={{
                  fontSize: 18,
                  color: '#f8fafc',
                }}
              >
                Subject Domains
              </h3>

              <span
                style={{
                  color: '#8a94a6',
                }}
              >
                {selectedSubjects.length
                  ? `${selectedSubjects.length} selected`
                  : 'All available by default'}
              </span>
            </div>

            <div className="d-flex flex-wrap gap-2">
              {practiceSubjects.map(
                (subject) => {
                  const isActive =
                    selectedSubjects.includes(
                      subject.id
                    )

                  return (
                    <Button
                      key={subject.id}
                      type="button"
                      size="sm"
                      className={`subject-chip ${isActive
                        ? 'active'
                        : ''
                        }`}
                      onClick={() =>
                        toggleSubject(
                          subject.id
                        )
                      }
                    >
                      {subject.name}
                    </Button>
                  )
                }
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3
                className="m-0"
                style={{
                  fontSize: 18,
                  color: '#f8fafc',
                }}
              >
                Number of Questions
              </h3>

              <span
                style={{
                  color: '#8a94a6',
                }}
              >
                Range 5-100
              </span>
            </div>

            <div className="panel-surface p-3 p-md-4">
              <Form.Range
                min={5}
                max={100}
                value={questionCount}
                onChange={(event) =>
                  setQuestionCount(
                    Number(
                      event.target.value
                    )
                  )
                }
              />

              <div
                className="d-flex justify-content-between mt-2"
                style={{
                  color: '#8a94a6',
                  fontSize: 13,
                }}
              >
                <span>5</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3
                className="m-0"
                style={{
                  fontSize: 18,
                  color: '#f8fafc',
                }}
              >
                Custom Guidelines
              </h3>

              <span
                style={{
                  color: '#8a94a6',
                }}
              >
                Optional session notes
              </span>
            </div>

            <Form.Control
              as="textarea"
              rows={5}
              value={customGuidelines}
              onChange={(event) =>
                setCustomGuidelines(
                  event.target.value
                )
              }
              placeholder="Add any reminders, focus areas, or constraints for this session..."
              className="border-0"
              style={{
                borderRadius: 20,
                background: '#0d0d0d',
                color: '#e2e8f0',
                border:
                  '1px solid #262626',
                boxShadow: 'none',
              }}
            />
          </div>
        </Card>
      </Col>

      <Col xxl={4}>
        <Card className="hero-shell p-4 h-100">
          <div className="mb-4">
            <div
              className="text-uppercase small mb-1"
              style={{
                letterSpacing:
                  '0.16em',
                color: '#8a94a6',
              }}
            >
              Session Summary
            </div>

            <h3
              className="m-0 fw-semibold"
              style={{
                fontSize: 24,
                color: '#f8fafc',
              }}
            >
              Live preview
            </h3>
          </div>

          <Stack gap={3}>
            <Card
              className="panel-surface"
              body
              style={{ padding: 18 }}
            >
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.14em',
                  color: '#8a94a6',
                }}
              >
                Mode
              </div>

              <div
                className="fw-semibold"
                style={{
                  fontSize: 22,
                  color: '#f8fafc',
                }}
              >
                {mode
                  ? mode === 'quiz'
                    ? 'Quiz Mode'
                    : 'Viva Mode'
                  : 'Select a mode'}
              </div>
            </Card>

            <Card
              className="panel-surface"
              body
              style={{ padding: 18 }}
            >
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.14em',
                  color: '#8a94a6',
                }}
              >
                Subjects
              </div>

              <div className="d-flex flex-wrap gap-2">
                {selectedSubjectNames.map(
                  (name) => (
                    <span
                      key={name}
                      className="rounded-pill px-3 py-2 fw-normal"
                      style={{
                        backgroundColor:
                          '#121212',
                        border:
                          '1px solid #262626',
                        color:
                          '#e2e8f0',
                        fontSize: 13,
                        lineHeight: 1,
                        display:
                          'inline-block',
                      }}
                    >
                      {name}
                    </span>
                  )
                )}
              </div>

              <div
                className="mt-3"
                style={{
                  color: '#8a94a6',
                  fontSize: 13,
                }}
              >
                {selectedSubjects.length
                  ? 'Filtered to the selected domains.'
                  : 'No filter selected, so all available domains will be used.'}
              </div>
            </Card>

            <Card
              className="panel-surface"
              body
              style={{ padding: 18 }}
            >
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.14em',
                  color: '#8a94a6',
                }}
              >
                Question Count
              </div>

              <div
                className="fw-semibold"
                style={{
                  fontSize: 22,
                  color: '#f8fafc',
                }}
              >
                {questionCount}
              </div>

              <div
                className="mt-2"
                style={{
                  color: '#8a94a6',
                  fontSize: 13,
                }}
              >
                {
                  setupPreviewQuestions.length
                }{' '}
                mock questions currently available
                for this selection.
              </div>
            </Card>

            <Card
              className="panel-surface"
              body
              style={{ padding: 18 }}
            >
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.14em',
                  color: '#8a94a6',
                }}
              >
                Guidelines
              </div>

              <div
                style={{
                  color:
                    customGuidelines.trim()
                      ? '#e2e8f0'
                      : '#8a94a6',
                  lineHeight: 1.6,
                  whiteSpace:
                    'pre-wrap',
                }}
              >
                {customGuidelines.trim() ||
                  'No custom guidelines added.'}
              </div>
            </Card>

            <Button
              type="button"
              size="lg"
              className="w-100"
              onClick={
                initializeSession
              }
              disabled={!mode}
              style={{
                borderRadius: 18,
                minHeight: 56,
              }}
            >
              Initialize Session
            </Button>
          </Stack>
        </Card>
      </Col>
    </Row>
  )

  const answeredCount = Object.keys(answers).length
  const unansweredCount = Math.max(questions.length - answeredCount, 0)
  const quizProgress = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0
  const answerProgress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }

  const goNextQuestion = () => {
    setCurrentQuestionIndex((prev) =>
      Math.min(questions.length - 1, prev + 1)
    )
  }

  const goPreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
  }

  const quizView =
    currentQuestion ? (
      <div className="dynamic-quiz">
        <div className="dynamic-quiz-header">
          <div>
            <div className="dynamic-eyebrow">AI DIGITAL TWIN • QUIZ</div>
            <h2 className="dynamic-title">
              Question {currentQuestionIndex + 1}
              <span> / {questions.length}</span>
            </h2>
            <div className="dynamic-meta">
              <span><i className="bi bi-check-circle-fill" /> {answeredCount} answered</span>
              <span><i className="bi bi-circle" /> {unansweredCount} remaining</span>
            </div>
          </div>
          <div className="dynamic-timer">
            <div className="dynamic-timer-icon"><i className="bi bi-stopwatch-fill" /></div>
            <div>
              <div className="dynamic-timer-label">TIME ELAPSED</div>
              <div className="dynamic-timer-value">{elapsedLabel}</div>
            </div>
          </div>
        </div>

        <div className="dynamic-progress-wrap">
          <div className="dynamic-progress-info">
            <span>Quiz Progress</span>
            <strong>{Math.round(quizProgress)}%</strong>
          </div>
          <div className="dynamic-progress-track">
            <div className="dynamic-progress-fill" style={{ width: `${quizProgress}%` }} />
          </div>
          <div className="dynamic-progress-caption">
            {answeredCount} of {questions.length} questions answered
          </div>
        </div>

        <div className="dynamic-quiz-layout">
          <Card className="dynamic-question-card">
            <div className="dynamic-question-head">
              <div className="dynamic-tags">
                <span><i className="bi bi-stars" /> {currentQuestion.sourceLabel || 'Generated'}</span>
                <span>{currentQuestion.subjectName || currentQuestion.category || 'General'}</span>
                <span>{currentQuestion.category || 'General'}</span>
              </div>
              <div className="dynamic-q-number">Q{currentQuestionIndex + 1}</div>
            </div>

            <div className="dynamic-question-title-row">
              <div className="dynamic-question-icon"><i className="bi bi-question-lg" /></div>
              <h3>{currentQuestion.question}</h3>
            </div>

            <div className="dynamic-options">
              {(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((option, index) => {
                const selected = answers[currentQuestion.id] === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`dynamic-option ${selected ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                  >
                    <span className="dynamic-option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="dynamic-option-text">{option.text}</span>
                    <span className="dynamic-option-check">
                      <i className={selected ? 'bi bi-check-circle-fill' : 'bi bi-circle'} />
                    </span>
                  </button>
                )
              })}
            </div>

            {(!Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) && (
              <div className="alert alert-warning mt-3" role="alert">
                No answer options were returned for this question.
              </div>
            )}

            <div className="dynamic-navigation">
              <Button
                type="button"
                className="dynamic-nav secondary"
                onClick={goPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <i className="bi bi-arrow-left" /> Previous
              </Button>

              <div className="dynamic-nav-center">
                <strong>{answeredCount}/{questions.length}</strong>
                <span>answered</span>
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button type="button" className="dynamic-nav primary" onClick={goNextQuestion}>
                  Next <i className="bi bi-arrow-right" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="dynamic-nav submit"
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                >
                  {submitting ? <><span className="spinner-border spinner-border-sm" /> Submitting...</> : <>Submit Quiz <i className="bi bi-check2-circle" /></>}
                </Button>
              )}
            </div>
          </Card>

          <Card className="dynamic-navigator">
            <div className="dynamic-navigator-head">
              <div>
                <div className="dynamic-eyebrow">QUESTIONS</div>
                <h4>Quick Navigation</h4>
              </div>
              <span>{answeredCount}/{questions.length}</span>
            </div>

            <div className="dynamic-answer-progress">
              <div style={{ width: `${answerProgress}%` }} />
            </div>

            <div className="dynamic-question-grid">
              {questions.map((question, index) => {
                const isCurrent = index === currentQuestionIndex
                const isAnswered = answers[question.id] !== undefined
                return (
                  <button
                    key={question.id || index}
                    type="button"
                    title={`Question ${index + 1}`}
                    className={`dynamic-question-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                    onClick={() => goToQuestion(index)}
                  >
                    {isAnswered ? <i className="bi bi-check" /> : index + 1}
                  </button>
                )
              })}
            </div>

            <div className="dynamic-legend">
              <span><b className="current-dot" /> Current</span>
              <span><b className="answered-dot" /> Answered</span>
              <span><b className="pending-dot" /> Pending</span>
            </div>

            <div className="dynamic-session-tip">
              <div><i className="bi bi-lightning-charge-fill" /></div>
              <p><strong>Keep going!</strong><br />Complete all questions for the best performance analysis.</p>
            </div>
          </Card>
        </div>
      </div>
    ) : (
      <Card className="panel-surface p-5 text-center">
        <h4 style={{ color: '#f8fafc' }}>No quiz questions available</h4>
        <p style={{ color: '#8a94a6' }}>Please return to setup and try again.</p>
        <Button onClick={resetToSetup}>Return to Home</Button>
      </Card>
    )

  const resultsView =
    sessionState === 'results' &&
      mode === 'quiz' &&
      quizResults ? (
      <ResultsShell
        title="Quiz Results"
        eyebrow="Practice Complete"
        onReset={resetToSetup}
        summaryCards={[
          {
            title: 'Accuracy',
            value: `${quizResults.accuracy}%`,
            subtitle:
              'Score across all submitted questions',
            accent: true,
          },

          {
            title: 'Mastery',
            value: masteryResult
              ? `${masteryResult.mastery_percentage}%`
              : 'N/A',
            subtitle:
              masteryResult
                ? `${masteryResult.subject} • ${masteryResult.topic}`
                : 'BKT-based mastery score',
            accent: true,
          },

          {
            title: 'Correct',
            value:
              quizResults.correctCount,
            subtitle:
              'Questions matched with the key',
          },

          {
            title: 'Incorrect',
            value:
              quizResults.incorrectCount,
            subtitle:
              'Questions needing another pass',
          },

          {
            title: 'Time Elapsed',
            value:
              formatDuration(
                quizResults.timeElapsedSeconds
              ),
            subtitle:
              'Total active quiz time',
          },

          {
            title: 'Items Reviewed',
            value:
              quizResults.reviewedCount,
            subtitle:
              'Question set included in this run',
          },
        ]}
        footerNote={{
          left: 'Expanded rows show the selected answer and the expected answer for each item.',
          right: `${quizResults.reviewedCount} questions reviewed`,
        }}
      >
        <Card className="panel-surface p-4 p-xl-5">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
            <div>
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.16em',
                  color:
                    '#8a94a6',
                }}
              >
                Breakdown
              </div>

              <h3
                className="m-0 fw-semibold"
                style={{
                  fontSize: 28,
                  color:
                    '#f8fafc',
                }}
              >
                Question review
              </h3>
            </div>

            <Badge className="summary-badge rounded-pill px-3 py-2">
              Quiz Mode
            </Badge>
          </div>

          <div className="d-flex flex-column gap-3">
            {Array.isArray(
              quizResults.breakdown
            ) &&
              quizResults.breakdown.map(
                (item) => {
                  const expanded =
                    Boolean(
                      expandedRows[
                      item.id
                      ]
                    )

                  return (
                    <ExpandableRow
                      key={item.id}
                      item={{
                        ...item,
                        questionPreview:
                          item.question,
                      }}
                      expanded={
                        expanded
                      }
                      onToggle={() =>
                        toggleExpandedRow(
                          item.id
                        )
                      }
                      header={
                        <>
                          <Badge className="summary-badge rounded-pill px-3 py-2">
                            {
                              item.subjectName
                            }
                          </Badge>

                          <Badge className="summary-badge rounded-pill px-3 py-2">
                            {
                              item.category
                            }
                          </Badge>

                          <Badge
                            bg={
                              item.isCorrect
                                ? 'success'
                                : 'danger'
                            }
                            className="rounded-pill px-3 py-2"
                          >
                            {item.isCorrect
                              ? 'Correct'
                              : 'Incorrect'}
                          </Badge>
                        </>
                      }
                      details={
                        <div
                          style={{
                            color:
                              '#e2e8f0',
                            lineHeight:
                              1.6,
                          }}
                        >
                          <div className="mb-2">
                            <span
                              style={{
                                color:
                                  '#8a94a6',
                              }}
                            >
                              Source:
                            </span>{' '}
                            {
                              item.sourceLabel
                            }
                          </div>

                          <div className="mb-2">
                            <span
                              style={{
                                color:
                                  '#8a94a6',
                              }}
                            >
                              Selected
                              answer:
                            </span>{' '}
                            {
                              item.selectedOptionText
                            }
                          </div>

                          <div>
                            <span
                              style={{
                                color:
                                  '#8a94a6',
                              }}
                            >
                              Correct
                              answer:
                            </span>{' '}
                            {
                              item.correctOptionText
                            }
                          </div>
                        </div>
                      }
                      badge={null}
                    />
                  )
                }
              )}
          </div>
        </Card>
      </ResultsShell>
    ) : sessionState ===
      'results' &&
      mode === 'viva' &&
      vivaResults ? (
      <ResultsShell
        title="Viva Results"
        eyebrow="Practice Complete"
        onReset={resetToSetup}
        summaryCards={[
          {
            title:
              'Overall Performance',
            value:
              vivaResults.performanceLabel,
            subtitle:
              'Qualitative viva assessment',
            accent: true,
          },
          {
            title: 'Strengths',
            value:
              vivaResults.strengths.length,
            subtitle:
              'Areas showing solid articulation',
          },
          {
            title:
              'Areas To Improve',
            value:
              vivaResults.areasToImprove.length,
            subtitle:
              'Focus points for the next session',
          },
          {
            title: 'Time Elapsed',
            value:
              formatDuration(
                vivaResults.timeElapsedSeconds
              ),
            subtitle:
              'Total active viva time',
          },
        ]}
        footerNote={{
          left: 'Transcript entries expand to show the full examiner prompt and student response.',
          right: `${vivaResults.reviewedCount} exchanges reviewed`,
        }}
      >
        <Row className="g-3 mb-4">
          <Col lg={6}>
            <Card
              className="panel-surface h-100"
              body
              style={{ padding: 18 }}
            >
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.14em',
                  color:
                    '#8a94a6',
                }}
              >
                Strengths
              </div>

              <ul
                className="m-0 ps-3"
                style={{
                  color:
                    '#e2e8f0',
                  lineHeight:
                    1.7,
                }}
              >
                {Array.isArray(
                  vivaResults.strengths
                ) &&
                  vivaResults.strengths.map(
                    (item) => (
                      <li key={item}>
                        {item}
                      </li>
                    )
                  )}
              </ul>
            </Card>
          </Col>

          <Col lg={6}>
            <Card
              className="panel-surface h-100"
              body
              style={{ padding: 18 }}
            >
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.14em',
                  color:
                    '#8a94a6',
                }}
              >
                Areas To Improve
              </div>

              <ul
                className="m-0 ps-3"
                style={{
                  color:
                    '#e2e8f0',
                  lineHeight:
                    1.7,
                }}
              >
                {Array.isArray(
                  vivaResults.areasToImprove
                ) &&
                  vivaResults.areasToImprove.map(
                    (item) => (
                      <li key={item}>
                        {item}
                      </li>
                    )
                  )}
              </ul>
            </Card>
          </Col>
        </Row>

        <Card className="panel-surface p-4 p-xl-5">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
            <div>
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.16em',
                  color:
                    '#8a94a6',
                }}
              >
                Transcript Review
              </div>

              <h3
                className="m-0 fw-semibold"
                style={{
                  fontSize: 28,
                  color:
                    '#f8fafc',
                }}
              >
                Examiner and student
                exchanges
              </h3>
            </div>

            <Badge className="summary-badge rounded-pill px-3 py-2">
              Viva Mode
            </Badge>
          </div>

          <div className="d-flex flex-column gap-3">
            {Array.isArray(
              vivaResults.transcript
            ) &&
              vivaResults.transcript.length ? (
              vivaResults.transcript.map(
                (entry) => {
                  const expanded =
                    Boolean(
                      expandedRows[
                      entry.id
                      ]
                    )

                  return (
                    <div
                      key={entry.id}
                      className="review-row"
                    >
                      <button
                        type="button"
                        className="review-toggle w-100 border-0 bg-transparent text-start text-light p-3 p-md-4"
                        onClick={() =>
                          toggleExpandedRow(
                            entry.id
                          )
                        }
                        style={{
                          outline:
                            'none',
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                              <Badge className="summary-badge rounded-pill px-3 py-2">
                                {
                                  entry.subjectName
                                }
                              </Badge>

                              <Badge className="summary-badge rounded-pill px-3 py-2">
                                {
                                  entry.category
                                }
                              </Badge>
                            </div>

                            <div
                              className="fw-semibold mb-2"
                              style={{
                                color:
                                  '#f8fafc',
                              }}
                            >
                              Examiner:{' '}
                              {
                                entry.examinerText
                              }
                            </div>

                            <div
                              style={{
                                color:
                                  '#8a94a6',
                              }}
                            >
                              Student:{' '}
                              {
                                entry.studentText
                              }
                            </div>
                          </div>

                          <i
                            className={`bi ${expanded
                              ? 'bi-chevron-up'
                              : 'bi-chevron-down'
                              }`}
                            aria-hidden="true"
                            style={{
                              color:
                                '#8a94a6',
                              fontSize: 18,
                            }}
                          />
                        </div>
                      </button>

                      <Collapse
                        in={expanded}
                      >
                        <div>
                          <div className="px-3 px-md-4 pb-4 pt-0">
                            <hr className="soft-divider my-0 mb-3" />

                            <div
                              style={{
                                color:
                                  '#e2e8f0',
                                lineHeight:
                                  1.6,
                              }}
                            >
                              <div className="mb-2">
                                <span
                                  style={{
                                    color:
                                      '#8a94a6',
                                  }}
                                >
                                  Source:
                                </span>{' '}
                                {
                                  entry.sourceLabel
                                }
                              </div>

                              <div className="mb-2">
                                <span
                                  style={{
                                    color:
                                      '#8a94a6',
                                  }}
                                >
                                  Examiner
                                  prompt:
                                </span>{' '}
                                {
                                  entry.examinerText
                                }
                              </div>

                              <div>
                                <span
                                  style={{
                                    color:
                                      '#8a94a6',
                                  }}
                                >
                                  Student
                                  response:
                                </span>{' '}
                                {
                                  entry.studentText
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  )
                }
              )
            ) : (
              <div
                className="panel-surface p-4 text-center"
                style={{
                  color:
                    '#8a94a6',
                }}
              >
                No transcript exchanges
                were recorded.
              </div>
            )}
          </div>
        </Card>
      </ResultsShell>
    ) : null

  return (
    <div className="test-page-shell">
      <style>
        {pageStyles}
      </style>

      <div className="page-frame">
        {sessionState ===
          'setup' ? (
          <div className="hero-shell p-4 p-xl-5 mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 gap-lg-4">
            <div>
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.16em',
                  color:
                    '#8a94a6',
                }}
              >
                Digital Twin Practice
              </div>

              <h1
                className="m-0 fw-semibold"
                style={{
                  fontSize: 34,
                  color:
                    '#f8fafc',
                }}
              >
                Practice Flow
              </h1>
            </div>
          </div>
        ) : null}

        {sessionState ===
          'setup'
          ? setupView
          : null}

        {sessionState ===
          'quiz'
          ? quizView
          : null}

        {sessionState ===
          'viva'
          ? vivaView
          : null}

        {resultsView}
      </div>
    </div>
  )
}