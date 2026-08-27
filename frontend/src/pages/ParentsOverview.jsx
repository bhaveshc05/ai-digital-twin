import React, { useState, useEffect, useContext } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://localhost:8000";

// ---- Static / fallback data ----

const HIGHLIGHT_NOTE =
  "Aarav is showing steady improvement in Science and consistently strong scores in English this term. A little more daily practice in Social Studies would round things out nicely.";

const AI_SUMMARY =
  "Trending upward — up 23 points since Week 1. English is the strongest subject (91%); Social Studies is the one to focus revision on. At this pace, Aarav is on track to close the term above 85%.";

const WEEKLY = [
  { week: "Week 1", student: 65, classAvg: 70 },
  { week: "Week 2", student: 74, classAvg: 71 },
  { week: "Week 3", student: 82, classAvg: 73 },
  { week: "Week 4", student: 88, classAvg: 75 },
];

const COLORS = [
  "#1b9748",
  "#b48b2a",
  "#d6514f",
  "#2876bf",
  "#a644c9",
];

function getSubjectColor(subject) {
  let hash = 0;

  for (let i = 0; i < subject.length; i++) {
    hash =
      subject.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ParentsOverview() {
  const { user } = useContext(AuthContext);

  const [student, setStudent] = useState({
    name: user?.full_name || "Student",
    grade: user?.grade || "Grade N/A",
    term: "Term 1, 2026",
  });

  const [overall, setOverall] = useState({
    testsDone: 0,
    testsTaken: 0,
    average: 0,
    percentage: 0,
    gradeLabel: "N/A",
  });

  const [subjects, setSubjects] = useState([]);
  const [testScores, setTestScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.student_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const studentId = user.student_id;

        const [masteryRes, testsRes] =
          await Promise.all([
            fetch(
              `${API_URL}/api/v1/mastery/${studentId}`
            ),
            fetch(
              `${API_URL}/api/v1/tests/${studentId}`
            ),
          ]);

        if (!masteryRes.ok) {
          throw new Error(
            `Failed to fetch mastery data: ${masteryRes.status}`
          );
        }

        if (!testsRes.ok) {
          throw new Error(
            `Failed to fetch test data: ${testsRes.status}`
          );
        }

        const masteryData =
          await masteryRes.json();

        const testsData =
          await testsRes.json();

        const masteryList = Array.isArray(
          masteryData
        )
          ? masteryData
          : masteryData?.mastery || [];

        const testsList = Array.isArray(
          testsData
        )
          ? testsData
          : testsData?.tests || [];

        // -------------------------------
        // Student information
        // -------------------------------

        setStudent({
          name:
            user?.full_name ||
            user?.name ||
            "Student",
          grade:
            user?.grade ||
            "Grade N/A",
          term: "Term 1, 2026",
        });

        // -------------------------------
        // Process mastery by subject
        // -------------------------------

        const subjectMap = {};

        masteryList.forEach((item) => {
          const subject =
            item.subject || "General";

          let score = 0;

          if (
            item.mastery_percentage !==
            undefined
          ) {
            score = Number(
              item.mastery_percentage
            );
          } else if (
            item.percentage !== undefined
          ) {
            score = Number(item.percentage);
          } else if (
            item.mastery_score !== undefined
          ) {
            score =
              Number(item.mastery_score) * 100;
          } else if (
            item.score !== undefined
          ) {
            score =
              Number(item.score) * 100;
          } else if (
            item.correct_answers !==
              undefined &&
            item.total_questions
          ) {
            score =
              (Number(item.correct_answers) /
                Number(item.total_questions)) *
              100;
          }

          if (!subjectMap[subject]) {
            subjectMap[subject] = {
              total: 0,
              count: 0,
            };
          }

          subjectMap[subject].total += score;
          subjectMap[subject].count += 1;
        });

        const newSubjects = Object.keys(
          subjectMap
        ).map((subject) => ({
          name: subject,
          score: Math.round(
            subjectMap[subject].total /
              subjectMap[subject].count
          ),
          color: getSubjectColor(subject),
        }));

        setSubjects(newSubjects);

        // -------------------------------
        // Process tests
        // -------------------------------

        const newTestScores =
          testsList.map((test) => ({
            test:
              test.title ||
              "Untitled Test",
            subject:
              test.subject ||
              "General",
            date:
              test.created_at ||
              test.date ||
              "N/A",
            score:
              test.score !== undefined
                ? test.score
                : "N/A",
            grade:
              test.grade ||
              "N/A",
            color: getSubjectColor(
              test.subject || "General"
            ),
          }));

        setTestScores(newTestScores);

        // -------------------------------
        // Overall score
        // -------------------------------

        const numTests =
          newTestScores.length;

        const avgScore =
          newSubjects.length > 0
            ? Math.round(
                newSubjects.reduce(
                  (sum, subject) =>
                    sum + subject.score,
                  0
                ) / newSubjects.length
              )
            : 0;

        let grade = "N/A";

        if (avgScore >= 90) {
          grade = "A";
        } else if (avgScore >= 80) {
          grade = "B";
        } else if (avgScore >= 70) {
          grade = "C";
        } else if (avgScore >= 60) {
          grade = "D";
        } else if (avgScore > 0) {
          grade = "F";
        }

        setOverall({
          testsDone: numTests,
          testsTaken: numTests,
          average: avgScore,
          percentage: avgScore,
          gradeLabel: grade,
        });
      } catch (err) {
        console.error(
          "Failed to load parent dashboard data:",
          err
        );

        setError(
          "Unable to load student performance data."
        );

        setSubjects([]);
        setTestScores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div
        className="po-root d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center">
          <div className="spinner-border mb-3" />
          <div>Loading parent dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="po-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        .po-root {
          --ink: #dee6ef;
          --ink-soft: #b9c2d0;
          --paper: #0F172A;
          --card: #1A2740;
          --card-border: #2E3E5C;
          --forest: #52b567;
          --marigold: #9ec63e;
          --rose: #F0918F;
          --steel: #7DB4E6;
          --plum: #C8A2D6;

          font-family: 'Work Sans', sans-serif;
          background: var(--paper);
          background-image:
            radial-gradient(
              circle at 1px 1px,
              rgba(241,245,249,0.05) 1px,
              transparent 0
            );
          background-size: 22px 22px;
          color: var(--ink);
          padding: 32px 20px 60px;
          min-height: 100%;
          box-sizing: border-box;
        }

        .po-root * {
          box-sizing: border-box;
        }

        .po-header {
          max-width: 1180px;
          margin: 0 auto 28px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .po-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin: 0 0 6px;
        }

        .po-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 40px;
          line-height: 1.05;
          margin: 0 0 8px;
          color: var(--ink);
        }

        .po-meta {
          font-size: 15px;
          color: var(--ink-soft);
        }

        .po-meta strong {
          color: var(--ink);
          font-weight: 600;
        }

        .stamp {
          width: 118px;
          height: 118px;
          border-radius: 50%;
          border: 3px dashed var(--forest);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transform: rotate(-8deg);
          position: relative;
          background: rgba(101, 197, 140, 0.08);
        }

        .stamp::before {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 1px solid var(--forest);
          opacity: 0.5;
        }

        .stamp-inner {
          text-align: center;
          color: var(--forest);
        }

        .stamp-grade {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 30px;
          line-height: 1;
        }

        .stamp-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .po-grid {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 300px 1fr 1fr;
          grid-template-areas:
            "overall note chart"
            "overall subjects summary"
            "scores scores scores";
          gap: 18px;
        }

        @media (max-width: 900px) {
          .po-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "overall"
              "note"
              "chart"
              "subjects"
              "summary"
              "scores";
          }
        }

        .po-card {
          background: var(--card);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }

        .po-card h3 {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 18px;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
        }

        .po-card h3 svg {
          flex-shrink: 0;
          opacity: 0.7;
        }

        .card-overall {
          grid-area: overall;
        }

        .card-note {
          grid-area: note;
          background: #2A2410;
          border-color: #4A3E1E;
        }

        .card-chart {
          grid-area: chart;
        }

        .card-subjects {
          grid-area: subjects;
        }

        .card-summary {
          grid-area: summary;
          background: #16281C;
          border-color: #2A4433;
        }

        .card-scores {
          grid-area: scores;
        }

        .donut-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 10px 0;
          border-top: 1px solid var(--card-border);
          font-family: 'IBM Plex Mono', monospace;
        }

        .stat-row:first-of-type {
          border-top: none;
        }

        .stat-label {
          font-family: 'Work Sans', sans-serif;
          font-size: 13px;
          color: var(--ink-soft);
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--ink);
        }

        .note-quote {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 16px;
          line-height: 1.55;
          color: #F3E3B8;
          margin: 0;
        }

        .note-sign {
          margin-top: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #D9BE72;
        }

        .legend-row {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--ink-soft);
          margin-bottom: 6px;
        }

        .legend-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 5px;
        }

        .subject-row {
          margin-bottom: 14px;
        }

        .subject-row:last-child {
          margin-bottom: 0;
        }

        .subject-top {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .subject-name {
          font-weight: 600;
          color: var(--ink);
        }

        .subject-score {
          font-family: 'IBM Plex Mono', monospace;
          color: var(--ink-soft);
        }

        .subject-track {
          height: 8px;
          border-radius: 6px;
          background: #0F172A;
          overflow: hidden;
        }

        .subject-fill {
          height: 100%;
          border-radius: 6px;
          transition: filter 0.15s ease;
        }

        .subject-row:hover .subject-fill {
          filter: brightness(1.15);
        }

        .summary-text {
          font-size: 14.5px;
          line-height: 1.6;
          color: #c8deca;
          margin: 0;
        }

        .summary-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: var(--forest);
          color: #0F172A;
          padding: 5px 10px;
          border-radius: 20px;
          margin-bottom: 14px;
          font-weight: 600;
        }

        table.scores-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .scores-table th {
          text-align: left;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-soft);
          padding: 0 10px 10px;
          border-bottom: 1px solid var(--card-border);
          font-weight: 500;
        }

        .scores-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #24324A;
          color: var(--ink);
        }

        .scores-table tr:last-child td {
          border-bottom: none;
        }

        .subject-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .grade-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 12px;
          padding: 3px 9px;
          border-radius: 20px;
          background: var(--forest);
          color: #0F172A;
        }

        .po-error {
          max-width: 1180px;
          margin: 0 auto 18px;
          padding: 14px 18px;
          border-radius: 10px;
          background: #3a1818;
          border: 1px solid #6b2929;
          color: #fca5a5;
        }
      `}</style>

      <div className="po-header">
        <div>
          <p className="po-eyebrow">
            Parents Overview
          </p>

          <h1 className="po-title">
            {student.name}'s Progress
          </h1>

          <div className="po-meta">
            <strong>{student.grade}</strong>
            {" · "}
            {student.term}
          </div>
        </div>

        <div className="stamp">
          <div className="stamp-inner">
            <div className="stamp-grade">
              {overall.gradeLabel}
            </div>

            <div className="stamp-label">
              Overall
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="po-error">
          {error}
        </div>
      )}

      <div className="po-grid">
        {/* ================= OVERALL TESTS ================= */}

        <div className="po-card card-overall">
          <h3>
            <CheckCircle2 size={18} />
            Overall tests
          </h3>

          <div className="donut-wrap">
            <Donut
              subjects={subjects}
              percentage={overall.percentage}
            />
          </div>

          <div className="stat-row">
            <span className="stat-label">
              Tests done
            </span>

            <span className="stat-value">
              {overall.testsDone}
            </span>
          </div>

          <div className="stat-row">
            <span className="stat-label">
              Tests taken
            </span>

            <span className="stat-value">
              {overall.testsTaken}
            </span>
          </div>

          <div className="stat-row">
            <span className="stat-label">
              Average marks
            </span>

            <span className="stat-value">
              {overall.average}
            </span>
          </div>

          <div className="stat-row">
            <span className="stat-label">
              Percentage
            </span>

            <span className="stat-value">
              {overall.percentage}%
            </span>
          </div>
        </div>

        {/* ================= TEACHER NOTE ================= */}

        <div className="po-card card-note">
          <h3>
            <BookOpen size={18} />
            This week's note
          </h3>

          <p className="note-quote">
            "{HIGHLIGHT_NOTE}"
          </p>

          <div className="note-sign">
            — Class Teacher
          </div>
        </div>

        {/* ================= WEEKLY PROGRESS ================= */}

        <div className="po-card card-chart">
          <h3>
            <TrendingUp size={18} />
            Weekly progress
          </h3>

          <div className="legend-row">
            <span>
              <span
                className="legend-dot"
                style={{
                  background: "#3fb25a",
                }}
              />
              Aarav
            </span>

            <span>
              <span
                className="legend-dot"
                style={{
                  background: "#48607F",
                }}
              />
              Class average
            </span>
          </div>

          <ResponsiveContainer
            width="100%"
            height={190}
          >
            <BarChart
              data={WEEKLY}
              barGap={4}
            >
              <XAxis
                dataKey="week"
                tick={{
                  fontSize: 11,
                  fill: "#94A3B8",
                }}
                axisLine={{
                  stroke: "#2E3E5C",
                }}
                tickLine={false}
              />

              <YAxis
                hide
                domain={[0, 100]}
              />

              <Tooltip
                cursor={{
                  fill: "rgba(74,222,128,0.08)",
                }}
                contentStyle={{
                  fontFamily:
                    "Work Sans, sans-serif",
                  fontSize: 12,
                  borderRadius: 8,
                  border:
                    "1px solid #2E3E5C",
                  background: "#1A2740",
                  color: "#F1F5F9",
                }}
              />

              <Bar
                dataKey="classAvg"
                fill="#cdc71e"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="student"
                fill="#09621b"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ================= SUBJECT PERFORMANCE ================= */}

        <div className="po-card card-subjects">
          <h3>
            Subject performance
          </h3>

          {subjects.length === 0 ? (
            <div
              style={{
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              No mastery data available yet.
            </div>
          ) : (
            subjects.map((subject) => (
              <div
                key={subject.name}
                className="subject-row"
              >
                <div className="subject-top">
                  <span className="subject-name">
                    {subject.name}
                  </span>

                  <span className="subject-score">
                    {subject.score}%
                  </span>
                </div>

                <div className="subject-track">
                  <div
                    className="subject-fill"
                    style={{
                      width: `${subject.score}%`,
                      background:
                        subject.color,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ================= AI SUMMARY ================= */}

        <div className="po-card card-summary">
          <div className="summary-tag">
            <AlertCircle size={13} />
            AI Summary
          </div>

          <p className="summary-text">
            {AI_SUMMARY}
          </p>
        </div>

        {/* ================= TEST SCORE CARD ================= */}

        <div className="po-card card-scores">
          <h3>
            Test score card
          </h3>

          {testScores.length === 0 ? (
            <div
              style={{
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              No tests completed yet.
            </div>
          ) : (
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Grade</th>
                </tr>
              </thead>

              <tbody>
                {testScores.map(
                  (test, index) => (
                    <tr key={index}>
                      <td>
                        {test.test}
                      </td>

                      <td>
                        <span className="subject-chip">
                          <span
                            className="chip-dot"
                            style={{
                              background:
                                test.color,
                            }}
                          />

                          {test.subject}
                        </span>
                      </td>

                      <td>
                        {test.date !==
                        "N/A"
                          ? new Date(
                              test.date
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td
                        style={{
                          fontFamily:
                            "IBM Plex Mono, monospace",
                        }}
                      >
                        {test.score}
                      </td>

                      <td>
                        <span
                          className="grade-pill"
                          style={{
                            background:
                              test.color,
                          }}
                        >
                          {test.grade}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Donut({
  subjects,
  percentage,
}) {
  const size = 150;
  const strokeWidth = 20;
  const radius =
    (size - strokeWidth) / 2;

  const circumference =
    2 * Math.PI * radius;

  if (!subjects.length) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />

        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          fontFamily="Fraunces, serif"
          fontWeight="700"
          fontSize="26"
          fill="#F1F5F9"
        >
          {percentage}%
        </text>

        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize="10"
          letterSpacing="0.05em"
          fill="#94A3B8"
        >
          AVG SCORE
        </text>
      </svg>
    );
  }

  const total = subjects.reduce(
    (sum, subject) =>
      sum + subject.score,
    0
  );

  let offset = 0;

  const segments = subjects.map(
    (subject) => {
      const fraction =
        total > 0
          ? subject.score / total
          : 0;

      const dash =
        fraction * circumference;

      const segment = {
        ...subject,
        dash,
        offset,
      };

      offset += dash;

      return segment;
    }
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <g
        transform={`rotate(-90 ${size / 2} ${
          size / 2
        })`}
      >
        {segments.map(
          (subject, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={subject.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${subject.dash} ${
                circumference -
                subject.dash
              }`}
              strokeDashoffset={
                -subject.offset
              }
            />
          )
        )}
      </g>

      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontFamily="Fraunces, serif"
        fontWeight="700"
        fontSize="26"
        fill="#F1F5F9"
      >
        {percentage}%
      </text>

      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="10"
        letterSpacing="0.05em"
        fill="#94A3B8"
      >
        AVG SCORE
      </text>
    </svg>
  );
}