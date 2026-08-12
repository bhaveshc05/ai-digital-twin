import { useEffect, useMemo, useState, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Badge, Button, Card, Col, Collapse, Form, ProgressBar, Row, Stack } from 'react-bootstrap'
import { practiceQuestionBank, practiceSubjects } from '../data/mockData.js'

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
`

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getElapsedSeconds(startedAt, completedAt) {
  if (!startedAt) return 0
  return Math.max(0, Math.round((completedAt - startedAt) / 1000))
}

function buildGeneratedQuestions(subjectIds, requestedCount) {
  const selectedSet = new Set(subjectIds)
  const filtered = practiceQuestionBank.filter((question) => selectedSet.size === 0 || selectedSet.has(question.subjectId))
  return filtered.slice(0, requestedCount)
}

function cycleMicState(currentState) {
  if (currentState === 'idle') return 'listening'
  if (currentState === 'listening') return 'speaking'
  return 'idle'
}

function createQuizResults(questions, answers, startedAt, completedAt) {
  const breakdown = questions.map((question) => {
    const selectedOptionId = answers[question.id] || null
    const selectedOption = question.options.find((option) => option.id === selectedOptionId) || null
    const correctOption = question.options.find((option) => option.id === question.correctOptionId) || null

    return {
      id: question.id,
      subjectName: question.subjectName,
      category: question.category,
      sourceLabel: question.sourceLabel,
      question: question.question,
      selectedOptionText: selectedOption ? selectedOption.text : 'No answer selected',
      correctOptionText: correctOption ? correctOption.text : 'Unavailable',
      isCorrect: selectedOptionId === question.correctOptionId,
    }
  })

  const correctCount = breakdown.filter((item) => item.isCorrect).length
  const incorrectCount = breakdown.length - correctCount

  return {
    accuracy: breakdown.length ? Math.round((correctCount / breakdown.length) * 100) : 0,
    correctCount,
    incorrectCount,
    reviewedCount: breakdown.length,
    timeElapsedSeconds: getElapsedSeconds(startedAt, completedAt),
    breakdown,
  }
}

function createVivaResults(transcript, startedAt, completedAt, questionCount) {
  const pairedCount = transcript.length
  const performanceLabel =
    pairedCount >= 5 ? 'Strong Conceptual Grasp' : pairedCount >= 3 ? 'Solid Conceptual Base' : 'Needs More Articulation'

  const strengths =
    pairedCount >= 5
      ? ['Uses subject terminology with confidence', 'Keeps answers structured and complete', 'Connects concepts across prompts']
      : pairedCount >= 3
        ? ['Shows core recall under prompt changes', 'Responds clearly with minimal hesitation', 'Maintains topic alignment during follow-ups']
        : ['Shows baseline familiarity with the topic', 'Responds to prompts with simple recall']

  const areasToImprove =
    pairedCount >= 5
      ? ['Add one more concrete example per answer', 'Slow slightly on transitions between points']
      : ['Expand answers with supporting detail', 'Use stronger signposting before concluding', 'Practice a fuller explanation rhythm']

  return {
    performanceLabel,
    strengths,
    areasToImprove,
    reviewedCount: pairedCount,
    sourceQuestionCount: questionCount,
    timeElapsedSeconds: getElapsedSeconds(startedAt, completedAt),
    transcript,
  }
}

function ResultsMetricCard({ title, value, subtitle, accent = false }) {
  return (
    <Card className="panel-surface h-100" body style={{ padding: 18 }}>
      <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
        {title}
      </div>
      <div className="fw-semibold" style={{ fontSize: accent ? 34 : 26, lineHeight: 1.05, color: accent ? '#7dd3fc' : '#f8fafc' }}>
        {value}
      </div>
      {subtitle ? <div className="mt-2" style={{ fontSize: 13, color: '#8a94a6' }}>{subtitle}</div> : null}
    </Card>
  )
}

function ExpandableRow({ item, expanded, onToggle, header, details, badge }) {
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
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">{header}</div>
            <div className="text-light" style={{ color: '#dbe3ea' }}>{item.questionPreview}</div>
          </div>
          <i
            className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}
            aria-hidden="true"
            style={{ color: '#8a94a6', fontSize: 18, lineHeight: 1.2 }}
          />
        </div>
      </button>

      <Collapse in={expanded}>
        <div>
          <div className="px-3 px-md-4 pb-4 pt-0">
            <hr className="soft-divider my-0 mb-3" />
            {details}
            {badge ? <div className="mt-3">{badge}</div> : null}
          </div>
        </div>
      </Collapse>
    </div>
  )
}

function ResultsShell({ title, eyebrow, summaryCards, footerNote, children, onReset }) {
  const summaryClassName = summaryCards.length >= 5 ? 'row-cols-xl-5' : 'row-cols-xl-4'

  return (
    <div className="d-flex flex-column gap-4">
      <div className="hero-shell p-4 p-xl-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 gap-lg-4">
        <div>
          <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
            {eyebrow}
          </div>
          <h2 className="m-0 fw-semibold" style={{ fontSize: 34, color: '#f8fafc' }}>
            {title}
          </h2>
        </div>

        <Button variant="outline-secondary" onClick={onReset} style={{ minWidth: 168 }}>
          Return to Home
        </Button>
      </div>

      <Row className={`g-3 row-cols-1 row-cols-md-2 ${summaryClassName}`}>
        {summaryCards.map((card) => (
          <Col key={card.title}>
            <ResultsMetricCard {...card} />
          </Col>
        ))}
      </Row>

      {footerNote ? (
        <Card className="panel-surface" body style={{ padding: 18 }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div style={{ color: '#8a94a6' }}>{footerNote.left}</div>
            <div style={{ color: '#cbd5e1' }}>{footerNote.right}</div>
          </div>
        </Card>
      ) : null}

      {children}
    </div>
  )
}

export default function TestPage() {
  const { user } = useContext(AuthContext)
  const [sessionState, setSessionState] = useState('setup')
  const [mode, setMode] = useState(null)
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [questionCount, setQuestionCount] = useState(10)
  const [customGuidelines, setCustomGuidelines] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [micState, setMicState] = useState('idle')
  const [transcript, setTranscript] = useState([])
  const [sessionStartedAt, setSessionStartedAt] = useState(null)
  const [sessionCompletedAt, setSessionCompletedAt] = useState(null)
  const [quizResults, setQuizResults] = useState(null)
  const [vivaResults, setVivaResults] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  const [displayNow, setDisplayNow] = useState(() => Date.now())

  useEffect(() => {
    if (sessionState !== 'quiz' && sessionState !== 'viva') return undefined

    const intervalId = window.setInterval(() => {
      setDisplayNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [sessionState, sessionStartedAt])

  const subjectMap = useMemo(() => {
    return new Map(practiceSubjects.map((subject) => [subject.id, subject]))
  }, [])

  const setupPreviewQuestions = useMemo(() => {
    return buildGeneratedQuestions(selectedSubjects, questionCount)
  }, [questionCount, selectedSubjects])

  const activeQuestions = sessionState === 'setup' ? setupPreviewQuestions : questions
  const currentQuestion = activeQuestions[currentQuestionIndex] || null
  const elapsedSeconds = sessionStartedAt ? getElapsedSeconds(sessionStartedAt, sessionCompletedAt ?? displayNow) : 0
  const elapsedLabel = formatDuration(elapsedSeconds)

  const selectedSubjectNames = selectedSubjects.length
    ? selectedSubjects.map((subjectId) => subjectMap.get(subjectId)?.name).filter(Boolean)
    : practiceSubjects.map((subject) => subject.name)

  const initializeSession = async () => {
    try {
      const topic = selectedSubjectNames.length ? selectedSubjectNames.join(", ") : "General";
      const studentId = user?.student_id || user?.id || "unknown";
      
      const res = await fetch('http://localhost:8000/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          num_questions: questionCount,
          topic: topic
        })
      });
      const data = await res.json();
      
      let generatedQuestions = data.questions || [];
      if (!generatedQuestions.length) {
        generatedQuestions = buildGeneratedQuestions(selectedSubjects, questionCount);
      }
      
      setQuestions(generatedQuestions);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTranscript([]);
      setMicState('idle');
      setQuizResults(null);
      setVivaResults(null);
      setExpandedRows({});
      setSessionStartedAt(Date.now());
      setSessionCompletedAt(null);
      setSessionState(mode === 'quiz' ? 'quiz' : 'viva');
    } catch (e) {
      console.error("Failed to generate test questions", e);
      // Fallback
      const generatedQuestions = buildGeneratedQuestions(selectedSubjects, questionCount)
      setQuestions(generatedQuestions)
      setAnswers({})
      setCurrentQuestionIndex(0)
      setTranscript([])
      setMicState('idle')
      setQuizResults(null)
      setVivaResults(null)
      setExpandedRows({})
      setSessionStartedAt(Date.now())
      setSessionCompletedAt(null)
      setSessionState(mode === 'quiz' ? 'quiz' : 'viva')
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
    setVivaResults(null)
    setExpandedRows({})
  }

  const toggleSubject = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((value) => value !== subjectId) : [...prev, subjectId],
    )
  }

  const toggleExpandedRow = (rowId) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
  }

  const handleAnswerSelect = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmitQuiz = async () => {
    const completedAt = Date.now()
    const result = createQuizResults(questions, answers, sessionStartedAt, completedAt)
    setQuizResults(result)
    setSessionCompletedAt(completedAt)
    setSessionState('results')

    if (user && (user.student_id || user.id)) {
      const studentId = user.student_id || user.id;
      for (const item of result.breakdown) {
        try {
          await fetch('http://localhost:8000/mastery/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: studentId,
              subject: item.subjectName || "General",
              topic: item.category || "General",
              is_correct: item.isCorrect
            })
          });
        } catch (e) {
          console.error("Failed to update mastery", e);
        }
      }
    }
  }

  const completedExchangesCount = useMemo(() => {
    return transcript.filter((entry) => entry.studentText !== null).length
  }, [transcript])

  const handleMicClick = () => {
    if (!questions.length) return

    if (micState === 'idle') {
      // Click 1: idle -> speaking. New transcript entry created showing ONLY the question.
      setMicState('speaking')
      setTranscript((prev) => {
        const questionIndex = prev.length
        const question = questions[questionIndex % questions.length] || practiceQuestionBank[questionIndex % practiceQuestionBank.length]

        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            questionPreview: question.question,
            examinerText: question.question,
            studentText: null,
            subjectName: question.subjectName,
            category: question.category,
            sourceLabel: question.sourceLabel,
            sampleStudentResponse: question.sampleStudentResponse,
          },
        ]
      })
    } else if (micState === 'speaking') {
      // Click 2: speaking -> listening. Transcript stays as-is (question only, no answer added yet).
      setMicState('listening')
    } else if (micState === 'listening') {
      // Click 3: listening -> idle. NOW append student's answer to complete the exchange.
      setMicState('idle')
      setTranscript((prev) => {
        return prev.map((entry, index) => {
          if (index === prev.length - 1) {
            return {
              ...entry,
              studentText: entry.sampleStudentResponse,
            }
          }
          return entry
        })
      })
    }
  }

  const handleEndViva = () => {
    const completedAt = Date.now()
    const completedTranscript = transcript.filter((entry) => entry.studentText !== null)
    const result = createVivaResults(completedTranscript, sessionStartedAt, completedAt, questions.length)
    setVivaResults(result)
    setSessionCompletedAt(completedAt)
    setSessionState('results')
  }

  const modeCards = [
    {
      id: 'quiz',
      title: 'Quiz Mode',
      description: 'Answer objective questions with a reviewable score breakdown.',
      icon: 'bi-ui-checks-grid',
    },
    {
      id: 'viva',
      title: 'Viva Mode',
      description: 'Practice spoken reasoning with a transcript-driven review.',
      icon: 'bi-mic-fill',
    },
  ]

  const setupView = (
    <Row className="g-4 align-items-start">
      <Col xxl={8}>
        <Card className="hero-shell p-4 p-xl-5 h-100">
          <div className="mb-4">
            <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
              Session Setup
            </div>
            <h2 className="m-0 fw-semibold" style={{ fontSize: 32, color: '#f8fafc' }}>
              Choose your practice flow
            </h2>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="m-0" style={{ fontSize: 18, color: '#f8fafc' }}>
                Select Mode
              </h3>
              <span style={{ color: '#8a94a6' }}>Pick one to continue</span>
            </div>

            <Row className="g-3">
              {modeCards.map((card) => {
                const isActive = mode === card.id

                return (
                  <Col md={6} key={card.id}>
                    <Button
                      type="button"
                      className={`mode-card w-100 text-start p-4 ${isActive ? 'active' : ''}`}
                      onClick={() => setMode(card.id)}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div className="mode-icon">
                          <i className={`bi ${card.icon}`} aria-hidden="true" />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold mb-2" style={{ fontSize: 22, color: '#f8fafc' }}>
                            {card.title}
                          </div>
                          <div style={{ color: '#8a94a6', lineHeight: 1.5 }}>{card.description}</div>
                        </div>
                      </div>
                    </Button>
                  </Col>
                )
              })}
            </Row>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h3 className="m-0" style={{ fontSize: 18, color: '#f8fafc' }}>
                Subject Domains
              </h3>
              <span style={{ color: '#8a94a6' }}>{selectedSubjects.length ? `${selectedSubjects.length} selected` : 'All available by default'}</span>
            </div>

            <div className="d-flex flex-wrap gap-2">
              {practiceSubjects.map((subject) => {
                const isActive = selectedSubjects.includes(subject.id)

                return (
                  <Button
                    key={subject.id}
                    type="button"
                    size="sm"
                    className={`subject-chip ${isActive ? 'active' : ''}`}
                    onClick={() => toggleSubject(subject.id)}
                  >
                    {subject.name}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3 className="m-0" style={{ fontSize: 18, color: '#f8fafc' }}>
                Number of Questions
              </h3>
              <span style={{ color: '#8a94a6' }}>Range 5-100</span>
            </div>

            <div className="panel-surface p-3 p-md-4">
              <Form.Range
                min={5}
                max={100}
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
              />
              <div className="d-flex justify-content-between mt-2" style={{ color: '#8a94a6', fontSize: 13 }}>
                <span>5</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h3 className="m-0" style={{ fontSize: 18, color: '#f8fafc' }}>
                Custom Guidelines
              </h3>
              <span style={{ color: '#8a94a6' }}>Optional session notes</span>
            </div>

            <Form.Control
              as="textarea"
              rows={5}
              value={customGuidelines}
              onChange={(event) => setCustomGuidelines(event.target.value)}
              placeholder="Add any reminders, focus areas, or constraints for this session..."
              className="border-0"
              style={{
                borderRadius: 20,
                background: '#0d0d0d',
                color: '#e2e8f0',
                border: '1px solid #262626',
                boxShadow: 'none',
              }}
            />
          </div>
        </Card>
      </Col>

      <Col xxl={4}>
        <Card className="hero-shell p-4 h-100">
          <div className="mb-4">
            <div className="text-uppercase small mb-1" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
              Session Summary
            </div>
            <h3 className="m-0 fw-semibold" style={{ fontSize: 24, color: '#f8fafc' }}>
              Live preview
            </h3>
          </div>

          <Stack gap={3}>
            <Card className="panel-surface" body style={{ padding: 18 }}>
              <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
                Mode
              </div>
              <div className="fw-semibold" style={{ fontSize: 22, color: '#f8fafc' }}>
                {mode ? (mode === 'quiz' ? 'Quiz Mode' : 'Viva Mode') : 'Select a mode'}
              </div>
            </Card>

            <Card className="panel-surface" body style={{ padding: 18 }}>
              <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
                Subjects
              </div>
              <div className="d-flex flex-wrap gap-2">
                {selectedSubjectNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-pill px-3 py-2 fw-normal"
                    style={{
                      backgroundColor: '#121212',
                      border: '1px solid #262626',
                      color: '#e2e8f0',
                      fontSize: 13,
                      lineHeight: 1,
                      display: 'inline-block',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="mt-3" style={{ color: '#8a94a6', fontSize: 13 }}>
                {selectedSubjects.length ? 'Filtered to the selected domains.' : 'No filter selected, so all available domains will be used.'}
              </div>
            </Card>

            <Card className="panel-surface" body style={{ padding: 18 }}>
              <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
                Question Count
              </div>
              <div className="fw-semibold" style={{ fontSize: 22, color: '#f8fafc' }}>
                {questionCount}
              </div>
              <div className="mt-2" style={{ color: '#8a94a6', fontSize: 13 }}>
                {setupPreviewQuestions.length} mock questions currently available for this selection.
              </div>
            </Card>

            <Card className="panel-surface" body style={{ padding: 18 }}>
              <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
                Guidelines
              </div>
              <div style={{ color: customGuidelines.trim() ? '#e2e8f0' : '#8a94a6', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {customGuidelines.trim() || 'No custom guidelines added.'}
              </div>
            </Card>

            <Button
              type="button"
              size="lg"
              className="w-100"
              onClick={initializeSession}
              disabled={!mode}
              style={{ borderRadius: 18, minHeight: 56 }}
            >
              Initialize Session
            </Button>
          </Stack>
        </Card>
      </Col>
    </Row>
  )

  const quizView = currentQuestion ? (
    <div className="d-flex flex-column gap-4">
      <div className="hero-shell p-4 p-xl-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 gap-lg-4">
        <div>
          <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
            Quiz Mode
          </div>
          <h2 className="m-0 fw-semibold" style={{ fontSize: 34, color: '#f8fafc' }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
        </div>

        <div className="d-flex flex-column align-items-lg-end gap-2">
          <Badge className="summary-badge rounded-pill px-3 py-2">Timer {elapsedLabel}</Badge>
          <div style={{ color: '#8a94a6', fontSize: 13 }}>Objective practice with answer review</div>
        </div>
      </div>

      <Card className="panel-surface p-4 p-xl-5">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <Badge className="summary-badge rounded-pill px-3 py-2">Source: {currentQuestion.sourceLabel}</Badge>
          <Badge className="summary-badge rounded-pill px-3 py-2">{currentQuestion.category}</Badge>
        </div>

        <ProgressBar
          now={questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0}
          style={{ height: 10, backgroundColor: '#1E293B' }}
          className="mb-4"
        />

        <h3 className="mb-4" style={{ fontSize: 28, lineHeight: 1.3, color: '#f8fafc' }}>
          {currentQuestion.question}
        </h3>

        <div className="d-grid gap-3">
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.id] === option.id

            return (
              <Button
                key={option.id}
                type="button"
                className={`question-option ${selected ? 'active' : ''}`}
                variant="secondary"
                onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
              >
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      border: '1px solid #262626',
                      background: selected ? 'rgba(56, 189, 248, 0.16)' : '#121212',
                      color: selected ? '#7dd3fc' : '#8a94a6',
                      flex: '0 0 auto',
                    }}
                  >
                    {option.id.toUpperCase()}
                  </div>
                  <div className="flex-grow-1">{option.text}</div>
                </div>
              </Button>
            )
          })}
        </div>

        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mt-4 pt-4 border-top" style={{ borderColor: '#262626' }}>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            style={{ minWidth: 132, minHeight: 48 }}
          >
            Previous
          </Button>

          <div className="d-flex align-items-center gap-2" style={{ color: '#8a94a6' }}>
            <i className="bi bi-clock" aria-hidden="true" />
            <span>{elapsedLabel} elapsed</span>
          </div>

          <div className="d-flex gap-2">
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                style={{ minWidth: 132, minHeight: 48 }}
              >
                Next
              </Button>
            ) : null}

            {currentQuestionIndex === questions.length - 1 ? (
              <Button type="button" variant="primary" onClick={handleSubmitQuiz} style={{ minWidth: 132, minHeight: 48 }}>
                Submit
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  ) : null

  const vivaView = (
    <div className="d-flex flex-column gap-4">
      <div className="hero-shell p-4 p-xl-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 gap-lg-4">
        <div>
          <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
            Viva Mode
          </div>
          <h2 className="m-0 fw-semibold" style={{ fontSize: 34, color: '#f8fafc' }}>
            Live spoken practice
          </h2>
        </div>

        <div className="d-flex flex-column align-items-lg-end gap-2">
          <Badge className="summary-badge rounded-pill px-3 py-2">Timer {elapsedLabel}</Badge>
          <div style={{ color: '#8a94a6', fontSize: 13 }}>Turn-based mock viva with transcript review</div>
        </div>
      </div>

      <Row className="g-4 align-items-start">
        <Col xl={5}>
          <Card className="panel-surface p-4 p-xl-5 text-center">
            <div>
              <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
                Microphone
              </div>
              <h3 className="m-0 mb-3 fw-semibold" style={{ fontSize: 28, color: '#f8fafc' }}>
                {micState === 'idle'
                  ? (transcript.length ? 'Exchange Complete' : 'Ready to Begin')
                  : micState === 'speaking'
                    ? 'Examiner Speaking'
                    : 'Listening to Student'}
              </h3>
              <div style={{ color: '#8a94a6' }}>
                {micState === 'idle'
                  ? (transcript.length ? 'Exchange complete. Click mic to ask next question.' : 'Click the mic to start the viva conversation.')
                  : micState === 'speaking'
                    ? 'The examiner is asking the question.'
                    : 'System listening to student response. Click mic to finish answer.'}
              </div>
            </div>

            <div className="mic-wrap my-4">
              <Button
                type="button"
                className={`mic-button ${micState}`}
                onClick={handleMicClick}
                aria-label="Toggle viva microphone"
              >
                <i
                  className={`bi ${micState === 'speaking' ? 'bi-volume-up-fill' : micState === 'listening' ? 'bi-mic-fill' : 'bi-mic-fill'}`}
                  aria-hidden="true"
                  style={{ fontSize: micState === 'speaking' ? 32 : 30 }}
                />
              </Button>
            </div>

            <Stack gap={2}>
              <Badge className="summary-badge rounded-pill px-3 py-2 align-self-center" style={{ width: 'fit-content' }}>
                {micState === 'idle' ? 'IDLE' : micState === 'speaking' ? 'EXAMINER SPEAKING' : 'LISTENING TO STUDENT'}
              </Badge>
              <div style={{ color: '#8a94a6', fontSize: 13 }}>
                Cycle: Click 1 = Examiner asks -&gt; Click 2 = Student speaks -&gt; Click 3 = Answer attached.
              </div>
            </Stack>

            <Button type="button" variant="outline-secondary" className="w-100 mt-4" onClick={handleEndViva}>
              End Session
            </Button>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="panel-surface p-4 p-xl-5">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
              <div>
                <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
                  Transcript Panel
                </div>
                <h3 className="m-0 fw-semibold" style={{ fontSize: 28, color: '#f8fafc' }}>
                  Live review feed
                </h3>
              </div>
              <Badge className="summary-badge rounded-pill px-3 py-2">{completedExchangesCount} exchanges</Badge>
            </div>

            <div className="d-flex flex-column gap-3">
              {transcript.length ? (
                transcript.map((entry) => {
                  const expanded = Boolean(expandedRows[entry.id])
                  const isComplete = Boolean(entry.studentText)

                  return (
                    <div key={entry.id} className="review-row">
                      <button
                        type="button"
                        className="review-toggle w-100 border-0 bg-transparent text-start text-light p-3 p-md-4"
                        onClick={() => toggleExpandedRow(entry.id)}
                        style={{ outline: 'none' }}
                      >
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div className="flex-grow-1">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                              <Badge className="summary-badge rounded-pill px-3 py-2">{entry.subjectName}</Badge>
                              <Badge className="summary-badge rounded-pill px-3 py-2">{entry.category}</Badge>
                              {!isComplete && (
                                <Badge className="summary-badge rounded-pill px-3 py-2" style={{ borderColor: '#38bdf8', color: '#7dd3fc' }}>
                                  Examiner Asking
                                </Badge>
                              )}
                            </div>
                            <div className="fw-semibold mb-2" style={{ color: '#f8fafc' }}>
                              Examiner: {entry.examinerText}
                            </div>
                            {entry.studentText ? (
                              <div style={{ color: '#8a94a6' }}>Student: {entry.studentText}</div>
                            ) : (
                              <div style={{ color: '#38bdf8', fontStyle: 'italic', fontSize: 13 }}>
                                <i className="bi bi-soundwave me-1" aria-hidden="true" />
                                Listening for student response... (click mic to complete)
                              </div>
                            )}
                          </div>
                          <i
                            className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                            aria-hidden="true"
                            style={{ color: '#8a94a6', fontSize: 18, lineHeight: 1.2 }}
                          />
                        </div>
                      </button>

                      <Collapse in={expanded}>
                        <div>
                          <div className="px-3 px-md-4 pb-4 pt-0">
                            <hr className="soft-divider my-0 mb-3" />
                            <div style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                              <div className="mb-2">
                                <span style={{ color: '#8a94a6' }}>Source:</span> {entry.sourceLabel}
                              </div>
                              <div className="mb-2">
                                <span style={{ color: '#8a94a6' }}>Examiner prompt:</span> {entry.examinerText}
                              </div>
                              <div>
                                <span style={{ color: '#8a94a6' }}>Student response:</span> {entry.studentText || 'Awaiting student response...'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  )
                })
              ) : (
                <div className="panel-surface p-4 text-center" style={{ color: '#8a94a6' }}>
                  Click the microphone to start the viva conversation.
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )

  const resultsView = sessionState === 'results' && mode === 'quiz' && quizResults ? (
    <ResultsShell
      title="Quiz Results"
      eyebrow="Practice Complete"
      onReset={resetToSetup}
      summaryCards={[
        {
          title: 'Accuracy',
          value: `${quizResults.accuracy}%`,
          subtitle: 'Score across all submitted questions',
          accent: true,
        },
        {
          title: 'Correct',
          value: quizResults.correctCount,
          subtitle: 'Questions matched with the key',
        },
        {
          title: 'Incorrect',
          value: quizResults.incorrectCount,
          subtitle: 'Questions needing another pass',
        },
        {
          title: 'Time Elapsed',
          value: formatDuration(quizResults.timeElapsedSeconds),
          subtitle: 'Total active quiz time',
        },
        {
          title: 'Items Reviewed',
          value: quizResults.reviewedCount,
          subtitle: 'Question set included in this run',
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
            <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
              Breakdown
            </div>
            <h3 className="m-0 fw-semibold" style={{ fontSize: 28, color: '#f8fafc' }}>
              Question review
            </h3>
          </div>
          <Badge className="summary-badge rounded-pill px-3 py-2">Quiz Mode</Badge>
        </div>

        <div className="d-flex flex-column gap-3">
          {quizResults.breakdown.map((item) => {
            const expanded = Boolean(expandedRows[item.id])

            return (
              <ExpandableRow
                key={item.id}
                item={{ ...item, questionPreview: item.question }}
                expanded={expanded}
                onToggle={() => toggleExpandedRow(item.id)}
                header={
                  <>
                    <Badge className="summary-badge rounded-pill px-3 py-2">{item.subjectName}</Badge>
                    <Badge className="summary-badge rounded-pill px-3 py-2">{item.category}</Badge>
                    <Badge bg={item.isCorrect ? 'success' : 'danger'} className="rounded-pill px-3 py-2">
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </>
                }
                details={
                  <div style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                    <div className="mb-2">
                      <span style={{ color: '#8a94a6' }}>Source:</span> {item.sourceLabel}
                    </div>
                    <div className="mb-2">
                      <span style={{ color: '#8a94a6' }}>Selected answer:</span> {item.selectedOptionText}
                    </div>
                    <div>
                      <span style={{ color: '#8a94a6' }}>Correct answer:</span> {item.correctOptionText}
                    </div>
                  </div>
                }
                badge={null}
              />
            )
          })}
        </div>
      </Card>
    </ResultsShell>
  ) : sessionState === 'results' && mode === 'viva' && vivaResults ? (
    <ResultsShell
      title="Viva Results"
      eyebrow="Practice Complete"
      onReset={resetToSetup}
      summaryCards={[
        {
          title: 'Overall Performance',
          value: vivaResults.performanceLabel,
          subtitle: 'Qualitative viva assessment',
          accent: true,
        },
        {
          title: 'Strengths',
          value: vivaResults.strengths.length,
          subtitle: 'Areas showing solid articulation',
        },
        {
          title: 'Areas To Improve',
          value: vivaResults.areasToImprove.length,
          subtitle: 'Focus points for the next session',
        },
        {
          title: 'Time Elapsed',
          value: formatDuration(vivaResults.timeElapsedSeconds),
          subtitle: 'Total active viva time',
        },
      ]}
      footerNote={{
        left: 'Transcript entries expand to show the full examiner prompt and student response.',
        right: `${vivaResults.reviewedCount} exchanges reviewed`,
      }}
    >
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="panel-surface h-100" body style={{ padding: 18 }}>
            <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
              Strengths
            </div>
            <ul className="m-0 ps-3" style={{ color: '#e2e8f0', lineHeight: 1.7 }}>
              {vivaResults.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="panel-surface h-100" body style={{ padding: 18 }}>
            <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.14em', color: '#8a94a6' }}>
              Areas To Improve
            </div>
            <ul className="m-0 ps-3" style={{ color: '#e2e8f0', lineHeight: 1.7 }}>
              {vivaResults.areasToImprove.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>

      <Card className="panel-surface p-4 p-xl-5">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
              Transcript Review
            </div>
            <h3 className="m-0 fw-semibold" style={{ fontSize: 28, color: '#f8fafc' }}>
              Examiner and student exchanges
            </h3>
          </div>
          <Badge className="summary-badge rounded-pill px-3 py-2">Viva Mode</Badge>
        </div>

        <div className="d-flex flex-column gap-3">
          {vivaResults.transcript.length ? (
            vivaResults.transcript.map((entry) => {
              const expanded = Boolean(expandedRows[entry.id])

              return (
                <div key={entry.id} className="review-row">
                  <button
                    type="button"
                    className="review-toggle w-100 border-0 bg-transparent text-start text-light p-3 p-md-4"
                    onClick={() => toggleExpandedRow(entry.id)}
                    style={{ outline: 'none' }}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                          <Badge className="summary-badge rounded-pill px-3 py-2">{entry.subjectName}</Badge>
                          <Badge className="summary-badge rounded-pill px-3 py-2">{entry.category}</Badge>
                        </div>
                        <div className="fw-semibold mb-2" style={{ color: '#f8fafc' }}>
                          Examiner: {entry.examinerText}
                        </div>
                        <div style={{ color: '#8a94a6' }}>Student: {entry.studentText}</div>
                      </div>
                      <i
                        className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                        aria-hidden="true"
                        style={{ color: '#8a94a6', fontSize: 18, lineHeight: 1.2 }}
                      />
                    </div>
                  </button>

                  <Collapse in={expanded}>
                    <div>
                      <div className="px-3 px-md-4 pb-4 pt-0">
                        <hr className="soft-divider my-0 mb-3" />
                        <div style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
                          <div className="mb-2">
                            <span style={{ color: '#8a94a6' }}>Source:</span> {entry.sourceLabel}
                          </div>
                          <div className="mb-2">
                            <span style={{ color: '#8a94a6' }}>Examiner prompt:</span> {entry.examinerText}
                          </div>
                          <div>
                            <span style={{ color: '#8a94a6' }}>Student response:</span> {entry.studentText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Collapse>
                </div>
              )
            })
          ) : (
            <div className="panel-surface p-4 text-center" style={{ color: '#8a94a6' }}>
              No transcript exchanges were recorded.
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
          <div className="hero-shell p-4 p-xl-5 mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 gap-lg-4">
            <div>
              <div className="text-uppercase small mb-2" style={{ letterSpacing: '0.16em', color: '#8a94a6' }}>
                Digital Twin Practice
              </div>
              <h1 className="m-0 fw-semibold" style={{ fontSize: 34, color: '#f8fafc' }}>
                Practice Flow
              </h1>
            </div>
          </div>
        ) : null}

        {sessionState === 'setup' ? setupView : null}
        {sessionState === 'quiz' ? quizView : null}
        {sessionState === 'viva' ? vivaView : null}
        {resultsView}
      </div>
    </div>
  )
}