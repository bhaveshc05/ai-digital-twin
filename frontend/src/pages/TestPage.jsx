import { useEffect, useMemo, useState, useContext } from 'react'
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
  Alert,
  Spinner,
} from 'react-bootstrap'
import { AuthContext } from '../context/AuthContext'
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
  transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
}

.test-page-shell .mode-card:hover {
  transform: translateY(-1px);
  border-color: #3d4b57;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
}

.test-page-shell .mode-card.active {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.18), 0 18px 40px rgba(0, 0, 0, 0.3);
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
}

.test-page-shell .question-option:hover {
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
}

.test-page-shell .mic-button.idle {
  background: linear-gradient(180deg, #334155, #1E293B) !important;
  color: #8a94a6 !important;
}

.test-page-shell .mic-button.listening {
  background: linear-gradient(
    180deg,
    rgba(56, 189, 248, 0.28),
    rgba(56, 189, 248, 0.14)
  ) !important;
  color: #d9f3ff !important;
  animation: pulseRing 1.8s ease-in-out infinite;
}

.test-page-shell .mic-button.speaking {
  background: linear-gradient(
    180deg,
    rgba(18, 18, 18, 0.97),
    rgba(14, 14, 14, 0.97)
  ) !important;
  color: #38bdf8 !important;
}

@keyframes pulseRing {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.35);
  }

  70% {
    box-shadow: 0 0 0 18px rgba(56, 189, 248, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
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
`

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`
}

function getElapsedSeconds(startedAt, completedAt) {
  if (!startedAt || !completedAt) return 0

  return Math.max(
    0,
    Math.round((completedAt - startedAt) / 1000)
  )
}

function buildGeneratedQuestions(subjectIds, requestedCount) {
  const selectedSet = new Set(subjectIds)

  const filtered = practiceQuestionBank.filter(
    (question) =>
      selectedSet.size === 0 ||
      selectedSet.has(question.subjectId)
  )

  return filtered.slice(0, requestedCount)
}

/*
 * Convert values such as:
 *
 * A
 * a
 * option A
 * Option A
 * 0
 * "0"
 * answer text
 *
 * into a comparable option id.
 */
function normalizeAnswerId(value, options = []) {
  if (value === null || value === undefined) {
    return null
  }

  const raw = String(value).trim()

  if (!raw) return null

  const lower = raw.toLowerCase()

  const directMatch = options.find(
    (option) =>
      String(option.id).toLowerCase() === lower
  )

  if (directMatch) {
    return directMatch.id
  }

  const letterMatch = lower.match(
    /^(?:option|answer|choice)?\s*[\(\[]?([a-z])[\)\]]?$/
  )

  if (letterMatch) {
    const letter = letterMatch[1]

    const letterMatchOption = options.find(
      (option) =>
        String(option.id).toLowerCase() === letter
    )

    if (letterMatchOption) {
      return letterMatchOption.id
    }
  }

  const numericValue = Number(raw)

  if (
    Number.isInteger(numericValue) &&
    numericValue >= 0 &&
    numericValue < options.length
  ) {
    return options[numericValue].id
  }

  const textMatch = options.find(
    (option) =>
      String(option.text).trim().toLowerCase() === lower
  )

  if (textMatch) {
    return textMatch.id
  }

  return raw
}

/*
 * Handles all common backend formats:
 *
 * data.questions
 * data.test.questions
 * data.data.questions
 * data.items
 * data.test_questions
 * data.results
 * data itself as an array
 */
function extractQuestionArray(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const directKeys = [
    'questions',
    'test_questions',
    'items',
    'results',
    'data',
  ]

  for (const key of directKeys) {
    const value = payload[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  const nestedKeys = [
    'test',
    'response',
    'result',
    'generated_test',
    'generatedTest',
    'data',
  ]

  for (const key of nestedKeys) {
    const value = payload[key]

    if (value && typeof value === 'object') {
      const nestedResult = extractQuestionArray(value)

      if (nestedResult.length) {
        return nestedResult
      }
    }
  }

  /*
   * Some APIs return:
   *
   * {
   *   "question_1": {...},
   *   "question_2": {...}
   * }
   */
  const objectValues = Object.values(payload)

  const objectQuestionValues = objectValues.filter(
    (value) =>
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (
        value.question ||
        value.question_text ||
        value.text
      )
  )

  if (objectQuestionValues.length) {
    return objectQuestionValues
  }

  return []
}

function normalizeGeneratedQuestions(rawPayload) {
  const rawQuestions = extractQuestionArray(rawPayload)

  if (!Array.isArray(rawQuestions)) {
    return []
  }

  return rawQuestions
    .map((question, index) => {
      if (!question || typeof question !== 'object') {
        return null
      }

      const rawOptions =
        Array.isArray(question.options)
          ? question.options
          : Array.isArray(question.choices)
          ? question.choices
          : Array.isArray(question.answers)
          ? question.answers
          : Array.isArray(question.answer_options)
          ? question.answer_options
          : Array.isArray(question.answerOptions)
          ? question.answerOptions
          : []

      const options = rawOptions
        .map((option, optionIndex) => {
          if (typeof option === 'string') {
            return {
              id: String.fromCharCode(97 + optionIndex),
              text: option,
            }
          }

          if (!option || typeof option !== 'object') {
            return null
          }

          const generatedId =
            option.id ??
            option.key ??
            option.option_id ??
            option.optionId ??
            String.fromCharCode(97 + optionIndex)

          const generatedText =
            option.text ??
            option.value ??
            option.label ??
            option.option_text ??
            option.optionText ??
            ''

          return {
            id: String(generatedId),
            text: String(generatedText),
          }
        })
        .filter(
          (option) =>
            option &&
            option.text.trim().length > 0
        )

      const questionText =
        question.question ??
        question.question_text ??
        question.questionText ??
        question.text ??
        question.prompt ??
        ''

      const id =
        question.id ??
        question.question_id ??
        question.questionId ??
        `generated-${index}`

      const subjectName =
        question.subjectName ??
        question.subject_name ??
        question.subject ??
        question.domain ??
        'General'

      const category =
        question.category ??
        question.topic ??
        question.topic_name ??
        question.topicName ??
        'General'

      const sourceLabel =
        question.sourceLabel ??
        question.source_label ??
        question.source ??
        'Generated'

      const rawCorrectAnswer =
        question.correctOptionId ??
        question.correct_option_id ??
        question.correctOption ??
        question.correct_option ??
        question.correct_answer ??
        question.correctAnswer ??
        question.answer ??
        question.expected_answer ??
        question.expectedAnswer ??
        null

      const correctOptionId = normalizeAnswerId(
        rawCorrectAnswer,
        options
      )

      return {
        ...question,

        id: String(id),

        question: String(
          questionText || 'Question unavailable'
        ),

        options,

        correctOptionId,

        subjectName: String(
          subjectName || 'General'
        ),

        category: String(
          category || 'General'
        ),

        sourceLabel: String(
          sourceLabel || 'Generated'
        ),

        sampleStudentResponse:
          question.sampleStudentResponse ??
          question.sample_student_response ??
          '',
      }
    })
    .filter(
      (question) =>
        question &&
        question.question &&
        question.question !== 'Question unavailable'
    )
}

/*
 * Safely display the backend response in console.
 * This is very useful if the API changes its shape again.
 */
function logGeneratedResponse(data) {
  console.log(
    'GENERATE TEST RAW RESPONSE:',
    data
  )

  console.log(
    'EXTRACTED QUESTION ARRAY:',
    extractQuestionArray(data)
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

  const breakdown = safeQuestions.map(
    (question) => {
      const selectedOptionId =
        answers?.[question.id] ?? null

      const options =
        Array.isArray(question.options)
          ? question.options
          : []

      const selectedOption =
        options.find(
          (option) =>
            String(option.id) ===
            String(selectedOptionId)
        ) || null

      const correctOption =
        options.find(
          (option) =>
            String(option.id) ===
            String(question.correctOptionId)
        ) || null

      const isCorrect =
        selectedOptionId !== null &&
        question.correctOptionId !== null &&
        String(selectedOptionId) ===
          String(question.correctOptionId)

      return {
        id: question.id,

        subjectName:
          question.subjectName || 'General',

        category:
          question.category || 'General',

        sourceLabel:
          question.sourceLabel || 'Generated',

        question:
          question.question || 'Question unavailable',

        selectedOptionText:
          selectedOption?.text ||
          'No answer selected',

        correctOptionText:
          correctOption?.text ||
          question.correctOptionId ||
          'Unavailable',

        isCorrect,
      }
    }
  )

  const correctCount =
    breakdown.filter(
      (item) => item.isCorrect
    ).length

  const incorrectCount =
    breakdown.length - correctCount

  return {
    accuracy: breakdown.length
      ? Math.round(
          (correctCount / breakdown.length) * 100
        )
      : 0,

    correctCount,
    incorrectCount,
    reviewedCount: breakdown.length,

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
    sourceQuestionCount: questionCount,

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
            className={`bi ${
              expanded
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
        {safeSummaryCards.map((card) => (
          <Col key={card.title}>
            <ResultsMetricCard {...card} />
          </Col>
        ))}
      </Row>

      {footerNote ? (
        <Card
          className="panel-surface"
          body
          style={{ padding: 18 }}
        >
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div style={{ color: '#8a94a6' }}>
              {footerNote.left}
            </div>

            <div style={{ color: '#cbd5e1' }}>
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
  const { user } = useContext(AuthContext)

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

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    initializing,
    setInitializing,
  ] = useState(false)

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
      window.clearInterval(intervalId)
  }, [sessionState, sessionStartedAt])

  const subjectMap = useMemo(() => {
    const safeSubjects =
      Array.isArray(practiceSubjects)
        ? practiceSubjects
        : []

    return new Map(
      safeSubjects.map((subject) => [
        subject.id,
        subject,
      ])
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
    activeQuestions[currentQuestionIndex] ||
    null

  const elapsedSeconds =
    sessionStartedAt
      ? getElapsedSeconds(
          sessionStartedAt,
          sessionCompletedAt ?? displayNow
        )
      : 0

  const elapsedLabel =
    formatDuration(elapsedSeconds)

  const selectedSubjectNames =
    selectedSubjects.length
      ? selectedSubjects
          .map(
            (subjectId) =>
              subjectMap.get(subjectId)?.name
          )
          .filter(Boolean)
      : practiceSubjects.map(
          (subject) => subject.name
        )

  /*
   * ============================================================
   * INITIALIZE SESSION
   * ============================================================
   */
  const initializeSession = async () => {
    if (initializing) return

    console.log('🔥 INITIALIZE SESSION CLICKED')

    setErrorMessage('')
    setInitializing(true)

    try {
      /*
       * ----------------------------------------------------------
       * GET LOGGED-IN STUDENT
       * ----------------------------------------------------------
       */
      const storedUser = JSON.parse(
        localStorage.getItem('user') || 'null'
      )

      console.log(
        'STORED USER:',
        storedUser
      )

      const studentId =
        storedUser?.student_id ||
        storedUser?.studentId ||
        storedUser?.id ||
        user?.student_id ||
        user?.studentId ||
        user?.id

      console.log(
        'STUDENT ID USED:',
        studentId
      )

      if (!studentId) {
        throw new Error(
          'No logged-in student found. Please login again.'
        )
      }

      /*
       * ----------------------------------------------------------
       * TOPIC
       * ----------------------------------------------------------
       */
      const topic =
        selectedSubjectNames.length
          ? selectedSubjectNames.join(', ')
          : 'General'

      console.log(
        'SELECTED TOPIC:',
        topic
      )

      /*
       * ----------------------------------------------------------
       * GET STUDENT DOCUMENTS
       * ----------------------------------------------------------
       */
      const documentUrl =
        `${API_URL}/api/v1/documents/${studentId}`

      console.log(
        'FETCHING DOCUMENTS FROM:',
        documentUrl
      )

      const documentResponse =
        await fetch(documentUrl)

      if (!documentResponse.ok) {
        const errorText =
          await documentResponse.text()

        throw new Error(
          `Failed to fetch student documents: ${documentResponse.status} ${errorText}`
        )
      }

      const documentData =
        await documentResponse.json()

      console.log(
        'STUDENT DOCUMENT RESPONSE:',
        documentData
      )

      const documentList =
        Array.isArray(documentData)
          ? documentData
          : Array.isArray(
              documentData?.documents
            )
          ? documentData.documents
          : Array.isArray(
              documentData?.data
            )
          ? documentData.data
          : []

      console.log(
        'DOCUMENT LIST:',
        documentList
      )

      console.log(
        'DOCUMENT COUNT:',
        documentList.length
      )

      if (!documentList.length) {
        throw new Error(
          `No document found for student ${studentId}. Please upload a PDF first.`
        )
      }

      /*
       * ----------------------------------------------------------
       * SELECT DOCUMENT
       * ----------------------------------------------------------
       */
      const selectedDocument =
        documentList[0]

      const documentId =
        selectedDocument?.document_id ||
        selectedDocument?.documentId ||
        selectedDocument?.id

      console.log(
        'SELECTED DOCUMENT:',
        selectedDocument
      )

      console.log(
        'DOCUMENT ID:',
        documentId
      )

      if (!documentId) {
        throw new Error(
          'Document found, but document_id is missing.'
        )
      }

      /*
       * ----------------------------------------------------------
       * GENERATE TEST
       * ----------------------------------------------------------
       */
      const generateUrl =
        `${API_URL}/api/v1/tests/generate`

      const requestBody = {
        student_id: studentId,
        document_id: documentId,
        num_questions: questionCount,
        topic,
      }

      console.log(
        'GENERATING TEST:',
        generateUrl
      )

      console.log(
        'GENERATE TEST REQUEST:',
        requestBody
      )

      const response =
        await fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            requestBody
          ),
        })

      const responseText =
        await response.text()

      console.log(
        'RAW GENERATE RESPONSE:',
        responseText
      )

      if (!response.ok) {
        throw new Error(
          `Test generation failed: ${response.status} ${responseText}`
        )
      }

      let data

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(
          'Backend returned an invalid JSON response.'
        )
      }

      logGeneratedResponse(data)

      /*
       * ----------------------------------------------------------
       * NORMALIZE QUESTIONS
       * ----------------------------------------------------------
       */
      let generatedQuestions =
        normalizeGeneratedQuestions(data)

      console.log(
        'NORMALIZED QUESTIONS:',
        generatedQuestions
      )

      console.log(
        'NORMALIZED QUESTION COUNT:',
        generatedQuestions.length
      )

      /*
       * ----------------------------------------------------------
       * FALLBACK TO LOCAL BANK
       *
       * Only used if backend really returned no questions.
       * This prevents the UI from becoming completely unusable
       * during development.
       * ----------------------------------------------------------
       */
      if (!generatedQuestions.length) {
        console.warn(
          'Backend returned no usable questions. Trying local question bank.'
        )

        generatedQuestions =
          normalizeGeneratedQuestions(
            buildGeneratedQuestions(
              selectedSubjects,
              questionCount
            )
          )

        console.log(
          'FALLBACK QUESTIONS:',
          generatedQuestions
        )
      }

      if (!generatedQuestions.length) {
        throw new Error(
          'The backend successfully responded, but no usable questions were returned. Check the FastAPI /tests/generate response format.'
        )
      }

      /*
       * ----------------------------------------------------------
       * START SESSION
       * ----------------------------------------------------------
       */
      setQuestions(
        generatedQuestions
      )

      setCurrentQuestionIndex(0)
      setAnswers({})
      setTranscript([])
      setQuizResults(null)
      setVivaResults(null)
      setMasteryResult(null)
      setExpandedRows({})
      setSessionCompletedAt(null)

      const startedAt = Date.now()

      setSessionStartedAt(startedAt)

      setSessionState(
        mode === 'quiz'
          ? 'quiz'
          : 'viva'
      )

      console.log(
        '✅ TEST SESSION INITIALIZED SUCCESSFULLY'
      )

    } catch (error) {
      console.error(
        '❌ Failed to generate test questions:',
        error
      )

      setErrorMessage(
        error?.message ||
          'Failed to initialize test session.'
      )
    } finally {
      setInitializing(false)
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
    setErrorMessage('')
    setInitializing(false)
  }

  const toggleSubject = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter(
            (value) =>
              value !== subjectId
          )
        : [...prev, subjectId]
    )
  }

  const toggleExpandedRow = (rowId) => {
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
   * ============================================================
   * QUIZ SUBMISSION
   * ============================================================
   */
  const handleSubmitQuiz = async () => {
    if (submitting) return

    const completedAt =
      Date.now()

    const result =
      createQuizResults(
        questions,
        answers,
        sessionStartedAt,
        completedAt
      )

    setSubmitting(true)
    setQuizResults(result)
    setSessionCompletedAt(
      completedAt
    )

    const studentId =
      user?.student_id ||
      user?.studentId ||
      user?.id ||
      JSON.parse(
        localStorage.getItem('user') ||
          'null'
      )?.student_id ||
      JSON.parse(
        localStorage.getItem('user') ||
          'null'
      )?.studentId ||
      JSON.parse(
        localStorage.getItem('user') ||
          'null'
      )?.id

    if (!studentId) {
      console.warn(
        'No logged-in student found. Mastery was not updated.'
      )

      setSubmitting(false)
      setSessionState('results')
      return
    }

    try {
      const masteryResults = {}

      for (const item of result.breakdown) {
        const subject =
          item.subjectName ||
          'General'

        const topic =
          item.category ||
          'General'

        try {
          const response =
            await fetch(
              `${API_URL}/api/v1/mastery/update`,
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                },
                body: JSON.stringify({
                  student_id:
                    studentId,
                  subject,
                  topic,
                  is_correct:
                    Boolean(
                      item.isCorrect
                    ),
                }),
              }
            )

          if (!response.ok) {
            const errorText =
              await response.text()

            throw new Error(
              `Mastery update failed: ${response.status} ${errorText}`
            )
          }

          const masteryData =
            await response.json()

          console.log(
            `MASTERY UPDATED: ${subject} -> ${topic}`,
            masteryData
          )

          masteryResults[
            `${subject}-${topic}`
          ] = masteryData
        } catch (error) {
          console.error(
            `Failed to update mastery for ${subject} -> ${topic}:`,
            error
          )
        }
      }

      const allMasteryResults =
        Object.values(
          masteryResults
        )

      if (allMasteryResults.length) {
        /*
         * Store all mastery results.
         */
        setMasteryResult(
          allMasteryResults
        )

        console.log(
          'FINAL MASTERY RESULTS:',
          allMasteryResults
        )
      } else {
        console.warn(
          'No mastery response received.'
        )
      }
    } catch (error) {
      console.error(
        'Mastery processing failed:',
        error
      )
    } finally {
      setSubmitting(false)
      setSessionState('results')
    }
  }

  const completedExchangesCount =
    useMemo(() => {
      return transcript.filter(
        (entry) =>
          entry.studentText !== null
      ).length
    }, [transcript])

  /*
   * ============================================================
   * VIVA
   * ============================================================
   */
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
          ]

        return [
          ...prev,
          {
            id:
              typeof crypto !==
              'undefined' &&
              crypto.randomUUID
                ? crypto.randomUUID()
                : `viva-${Date.now()}`,

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

  /*
   * ============================================================
   * SETUP VIEW
   * ============================================================
   */
  const setupView = (
    <Row className="g-4 align-items-start">
      <Col xxl={8}>
        <Card className="hero-shell p-4 p-xl-5 h-100">
          <div className="mb-4">
            <div
              className="text-uppercase small mb-2"
              style={{
                letterSpacing: '0.16em',
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

          {errorMessage ? (
            <Alert
              variant="danger"
              className="mb-4"
              style={{
                background: '#450a0a',
                border:
                  '1px solid #991b1b',
                color: '#fca5a5',
              }}
            >
              <strong>
                Unable to initialize session
              </strong>

              <div className="mt-1">
                {errorMessage}
              </div>
            </Alert>
          ) : null}

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
                        className={`mode-card w-100 text-start p-4 ${
                          isActive
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
                              {card.title}
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
                      className={`subject-chip ${
                        isActive
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
                letterSpacing: '0.16em',
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
                mock questions currently
                available for this selection.
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
              disabled={
                !mode || initializing
              }
              style={{
                borderRadius: 18,
                minHeight: 56,
              }}
            >
              {initializing ? (
                <>
                  <Spinner
                    size="sm"
                    animation="border"
                    className="me-2"
                  />
                  Generating Questions...
                </>
              ) : (
                'Initialize Session'
              )}
            </Button>
          </Stack>
        </Card>
      </Col>
    </Row>
  )

  /*
   * ============================================================
   * QUIZ VIEW
   * ============================================================
   */
  const quizView =
    currentQuestion ? (
      <div className="d-flex flex-column gap-4">
        <div className="hero-shell p-4 p-xl-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <div
              className="text-uppercase small mb-2"
              style={{
                letterSpacing:
                  '0.16em',
                color: '#8a94a6',
              }}
            >
              Quiz Mode
            </div>

            <h2
              className="m-0 fw-semibold"
              style={{
                fontSize: 34,
                color: '#f8fafc',
              }}
            >
              Question{' '}
              {currentQuestionIndex +
                1}{' '}
              of {questions.length}
            </h2>
          </div>

          <div className="d-flex flex-column align-items-lg-end gap-2">
            <Badge className="summary-badge rounded-pill px-3 py-2">
              Timer {elapsedLabel}
            </Badge>

            <div
              style={{
                color: '#8a94a6',
                fontSize: 13,
              }}
            >
              Objective practice with answer review
            </div>
          </div>
        </div>

        <Card className="panel-surface p-4 p-xl-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <Badge className="summary-badge rounded-pill px-3 py-2">
              Source:{' '}
              {currentQuestion.sourceLabel ||
                'Generated'}
            </Badge>

            <Badge className="summary-badge rounded-pill px-3 py-2">
              {currentQuestion.category ||
                'General'}
            </Badge>
          </div>

          <ProgressBar
            now={
              questions.length
                ? ((currentQuestionIndex +
                    1) /
                    questions.length) *
                  100
                : 0
            }
            style={{
              height: 10,
              backgroundColor:
                '#1E293B',
            }}
            className="mb-4"
          />

          <h3
            className="mb-4"
            style={{
              fontSize: 28,
              lineHeight: 1.3,
              color: '#f8fafc',
            }}
          >
            {currentQuestion.question}
          </h3>

          <div className="d-grid gap-3">
            {currentQuestion.options.map(
              (option) => {
                const selected =
                  String(
                    answers[
                      currentQuestion.id
                    ]
                  ) ===
                  String(option.id)

                return (
                  <Button
                    key={option.id}
                    type="button"
                    className={`question-option ${
                      selected
                        ? 'active'
                        : ''
                    }`}
                    variant="secondary"
                    onClick={() =>
                      handleAnswerSelect(
                        currentQuestion.id,
                        option.id
                      )
                    }
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 10,
                          border:
                            '1px solid #262626',
                          background:
                            selected
                              ? 'rgba(56, 189, 248, 0.16)'
                              : '#121212',
                          color:
                            selected
                              ? '#7dd3fc'
                              : '#8a94a6',
                          flex:
                            '0 0 auto',
                        }}
                      >
                        {String(
                          option.id
                        ).toUpperCase()}
                      </div>

                      <div className="flex-grow-1">
                        {option.text}
                      </div>
                    </div>
                  </Button>
                )
              }
            )}
          </div>

          {!currentQuestion.options.length ? (
            <Alert
              variant="warning"
              className="mt-3"
            >
              No answer options were returned
              for this question.
            </Alert>
          ) : null}

          <div
            className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mt-4 pt-4 border-top"
            style={{
              borderColor:
                '#262626',
            }}
          >
            <Button
              type="button"
              variant="outline-secondary"
              onClick={() =>
                setCurrentQuestionIndex(
                  (prev) =>
                    Math.max(
                      0,
                      prev - 1
                    )
                )
              }
              disabled={
                currentQuestionIndex ===
                0
              }
              style={{
                minWidth: 132,
                minHeight: 48,
              }}
            >
              Previous
            </Button>

            <div
              style={{
                color: '#8a94a6',
              }}
            >
              {elapsedLabel} elapsed
            </div>

            <div className="d-flex gap-2">
              {currentQuestionIndex <
              questions.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() =>
                    setCurrentQuestionIndex(
                      (prev) =>
                        Math.min(
                          questions.length -
                            1,
                          prev + 1
                        )
                    )
                  }
                  style={{
                    minWidth: 132,
                    minHeight: 48,
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={
                    handleSubmitQuiz
                  }
                  disabled={
                    submitting
                  }
                  style={{
                    minWidth: 132,
                    minHeight: 48,
                  }}
                >
                  {submitting
                    ? 'Submitting...'
                    : 'Submit'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    ) : (
      <Card className="panel-surface p-5 text-center">
        <h4 style={{ color: '#f8fafc' }}>
          No quiz questions available
        </h4>

        <p style={{ color: '#8a94a6' }}>
          Please return to setup and try again.
        </p>

        <Button onClick={resetToSetup}>
          Return to Home
        </Button>
      </Card>
    )

  /*
   * ============================================================
   * VIVA VIEW
   * ============================================================
   */
  const vivaView = (
    <div className="d-flex flex-column gap-4">
      <div className="hero-shell p-4 p-xl-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <div
            className="text-uppercase small mb-2"
            style={{
              letterSpacing: '0.16em',
              color: '#8a94a6',
            }}
          >
            Viva Mode
          </div>

          <h2
            className="m-0 fw-semibold"
            style={{
              fontSize: 34,
              color: '#f8fafc',
            }}
          >
            Spoken Practice
          </h2>
        </div>

        <div className="d-flex flex-column align-items-lg-end gap-2">
          <Badge className="summary-badge rounded-pill px-3 py-2">
            Timer {elapsedLabel}
          </Badge>

          <div
            style={{
              color: '#8a94a6',
              fontSize: 13,
            }}
          >
            {completedExchangesCount} exchanges completed
          </div>
        </div>
      </div>

      <Card className="panel-surface p-4 p-xl-5 text-center">
        <div className="mb-4">
          <div
            className="text-uppercase small mb-2"
            style={{
              letterSpacing: '0.16em',
              color: '#8a94a6',
            }}
          >
            Voice Practice
          </div>

          <h3
            style={{
              color: '#f8fafc',
            }}
          >
            Practice your explanation
          </h3>

          <p
            style={{
              color: '#8a94a6',
            }}
          >
            Click the microphone to move through
            examiner prompts and record responses.
          </p>
        </div>

        <div className="mic-wrap">
          <Button
            type="button"
            className={`mic-button ${micState}`}
            onClick={handleMicClick}
          >
            <i
              className={`bi ${
                micState === 'listening'
                  ? 'bi-mic'
                  : micState ===
                    'speaking'
                  ? 'bi-volume-up'
                  : 'bi-mic-mute'
              }`}
              style={{
                fontSize: 34,
              }}
            />
          </Button>
        </div>

        <div
          className="mt-3 mb-4"
          style={{
            color: '#8a94a6',
          }}
        >
          {micState === 'idle'
            ? 'Click to hear the next prompt'
            : micState === 'speaking'
            ? 'Examiner is presenting the prompt'
            : 'Click again to record the response'}
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleEndViva}
          disabled={
            completedExchangesCount === 0
          }
          style={{
            minWidth: 180,
            borderRadius: 16,
          }}
        >
          End Viva
        </Button>
      </Card>

      {transcript.length ? (
        <Card className="panel-surface p-4 p-xl-5">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <div
                className="text-uppercase small mb-2"
                style={{
                  letterSpacing:
                    '0.16em',
                  color: '#8a94a6',
                }}
              >
                Live Transcript
              </div>

              <h3
                className="m-0"
                style={{
                  color: '#f8fafc',
                }}
              >
                Current exchanges
              </h3>
            </div>

            <Badge className="summary-badge rounded-pill px-3 py-2">
              {transcript.length}
            </Badge>
          </div>

          <div className="d-flex flex-column gap-3">
            {transcript.map(
              (entry) => (
                <div
                  key={entry.id}
                  className="review-row p-4"
                >
                  <div
                    className="fw-semibold mb-2"
                    style={{
                      color: '#f8fafc',
                    }}
                  >
                    Examiner
                  </div>

                  <div
                    className="mb-3"
                    style={{
                      color: '#cbd5e1',
                    }}
                  >
                    {entry.examinerText}
                  </div>

                  <div
                    className="fw-semibold mb-2"
                    style={{
                      color: '#f8fafc',
                    }}
                  >
                    Student
                  </div>

                  <div
                    style={{
                      color: '#8a94a6',
                    }}
                  >
                    {entry.studentText ||
                      'Waiting for response...'}
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      ) : null}
    </div>
  )

  /*
   * ============================================================
   * RESULTS VIEW
   * ============================================================
   */
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
            value:
              Array.isArray(
                masteryResult
              ) &&
              masteryResult.length
                ? `${Math.round(
                    (
                      masteryResult.reduce(
                        (
                          sum,
                          item
                        ) =>
                          sum +
                          Number(
                            item.mastery_percentage ??
                              item.mastery_score ??
                              0
                          ),
                        0
                      ) /
                      masteryResult.length
                    )
                  )}%`
                : 'N/A',
            subtitle:
              Array.isArray(
                masteryResult
              ) &&
              masteryResult.length
                ? `${masteryResult.length} topic updates`
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
          left:
            'Expanded rows show the selected answer and the expected answer for each item.',
          right:
            `${quizResults.reviewedCount} questions reviewed`,
        }}
      >
        {Array.isArray(
          masteryResult
        ) &&
        masteryResult.length ? (
          <Card className="panel-surface p-4">
            <div
              className="text-uppercase small mb-3"
              style={{
                letterSpacing:
                  '0.16em',
                color: '#8a94a6',
              }}
            >
              Updated Mastery
            </div>

            <div className="d-flex flex-wrap gap-2">
              {masteryResult.map(
                (item, index) => (
                  <Badge
                    key={`${item.subject}-${item.topic}-${index}`}
                    className="rounded-pill px-3 py-2"
                  >
                    {item.subject ||
                      'General'}{' '}
                    •{' '}
                    {item.topic ||
                      'General'}{' '}
                    •{' '}
                    {Math.round(
                      Number(
                        item.mastery_percentage ??
                          item.mastery_score ??
                          0
                      )
                    )}
                    %
                  </Badge>
                )
              )}
            </div>
          </Card>
        ) : null}

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
            {quizResults.breakdown.map(
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
                            Selected answer:
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
                            Correct answer:
                          </span>{' '}
                          {
                            item.correctOptionText
                          }
                        </div>
                      </div>
                    }
                  />
                )
              }
            )}
          </div>
        </Card>
      </ResultsShell>
    ) : sessionState === 'results' &&
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
          left:
            'Transcript entries expand to show the full examiner prompt and student response.',
          right:
            `${vivaResults.reviewedCount} exchanges reviewed`,
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
                {vivaResults.strengths.map(
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
                {vivaResults.areasToImprove.map(
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
            {vivaResults.transcript.length ? (
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
                              {entry.studentText ||
                                'No response recorded'}
                            </div>
                          </div>

                          <i
                            className={`bi ${
                              expanded
                                ? 'bi-chevron-up'
                                : 'bi-chevron-down'
                            }`}
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
                                  Examiner prompt:
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
                                  Student response:
                                </span>{' '}
                                {
                                  entry.studentText ||
                                  'No response recorded'
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
      <style>{pageStyles}</style>

      <div className="page-frame">
        {sessionState === 'setup' ? (
          <div className="hero-shell p-4 p-xl-5 mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
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

        {sessionState === 'setup'
          ? setupView
          : null}

        {sessionState === 'quiz'
          ? quizView
          : null}

        {sessionState === 'viva'
          ? vivaView
          : null}

        {resultsView}
      </div>
    </div>
  )
}