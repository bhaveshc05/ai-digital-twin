import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CheckCircle2, TrendingUp, AlertCircle, BookOpen } from "lucide-react";

// ---- Mock data (swap with real student data) ----
const STUDENT = { name: "Aarav Mehta", grade: "Grade 6 · Section B", term: "Term 1, 2026" };

const OVERALL = {
  testsDone: 12,
  testsTaken: 12,
  average: 82,
  percentage: 84,
  gradeLabel: "A-",
};

const SUBJECTS = [
  { name: "Mathematics", score: 88, color: "#1b9748" },
  { name: "Science", score: 79, color: "#b48b2a" },
  { name: "English", score: 91, color: "#d6514f" },
  { name: "Social Studies", score: 75, color: "#2876bf" },
  { name: "Marathi", score: 85, color: "#a644c9" },
];

const WEEKLY = [
  { week: "Week 1", student: 65, classAvg: 70 },
  { week: "Week 2", student: 74, classAvg: 71 },
  { week: "Week 3", student: 82, classAvg: 73 },
  { week: "Week 4", student: 88, classAvg: 75 },
];

const TEST_SCORES = [
  { test: "Unit Test 3", subject: "Mathematics", date: "14 Jul", score: "45/50", grade: "A", color: "#2e9d57" },
  { test: "Unit Test 3", subject: "Science", date: "16 Jul", score: "38/50", grade: "B+", color: "#bc912d" },
  { test: "Unit Test 3", subject: "English", date: "18 Jul", score: "46/50", grade: "A", color: "#bf4947" },
  { test: "Unit Test 3", subject: "Social Studies", date: "20 Jul", score: "36/50", grade: "B", color: "#5697d3" },
  { test: "Unit Test 3", subject: "Marathi", date: "22 Jul", score: "42/50", grade: "A-", color: "#b577cc" },
];

const HIGHLIGHT_NOTE =
  "Aarav is showing steady improvement in Science and consistently strong scores in English this term. A little more daily practice in Social Studies would round things out nicely.";

const AI_SUMMARY =
  "Trending upward — up 23 points since Week 1. English is the strongest subject (91%); Social Studies is the one to focus revision on. At this pace, Aarav is on track to close the term above 85%.";

export default function ParentsOverview() {
  const [hoveredSubject, setHoveredSubject] = useState(null);

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
            radial-gradient(circle at 1px 1px, rgba(241,245,249,0.05) 1px, transparent 0);
          background-size: 22px 22px;
          color: var(--ink);
          padding: 32px 20px 60px;
          min-height: 100%;
          box-sizing: border-box;
        }
        .po-root * { box-sizing: border-box; }

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
        .po-meta strong { color: var(--ink); font-weight: 600; }

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
        .po-card h3 svg { flex-shrink: 0; opacity: 0.7; }

        .card-overall { grid-area: overall; }
        .card-note { grid-area: note; background: #2A2410; border-color: #4A3E1E; }
        .card-chart { grid-area: chart; }
        .card-subjects { grid-area: subjects; }
        .card-summary { grid-area: summary; background: #16281C; border-color: #2A4433; }
        .card-scores { grid-area: scores; }

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
        .stat-row:first-of-type { border-top: none; }
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
          cursor: default;
        }
        .subject-row:last-child { margin-bottom: 0; }
        .subject-top {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
        }
        .subject-name { font-weight: 600; color: var(--ink); }
        .subject-score { font-family: 'IBM Plex Mono', monospace; color: var(--ink-soft); }
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
        .subject-row:hover .subject-fill { filter: brightness(1.15); }

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
        .scores-table tr:last-child td { border-bottom: none; }
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
      `}</style>

      <div className="po-header">
        <div>
          <p className="po-eyebrow">Parents Overview</p>
          <h1 className="po-title">{STUDENT.name}'s Progress</h1>
          <div className="po-meta">
            <strong>{STUDENT.grade}</strong> · {STUDENT.term}
          </div>
        </div>
        <div className="stamp">
          <div className="stamp-inner">
            <div className="stamp-grade">{OVERALL.gradeLabel}</div>
            <div className="stamp-label">Overall</div>
          </div>
        </div>
      </div>

      <div className="po-grid">
        {/* Overall tests */}
        <div className="po-card card-overall">
          <h3><CheckCircle2 size={18} /> Overall tests</h3>
          <div className="donut-wrap">
            <Donut subjects={SUBJECTS} />
          </div>
          <div className="stat-row">
            <span className="stat-label">Tests done</span>
            <span className="stat-value">{OVERALL.testsDone}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Tests taken</span>
            <span className="stat-value">{OVERALL.testsTaken}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Average marks</span>
            <span className="stat-value">{OVERALL.average}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Percentage</span>
            <span className="stat-value">{OVERALL.percentage}%</span>
          </div>
        </div>

        {/* Teacher's note */}
        <div className="po-card card-note">
          <h3><BookOpen size={18} /> This week's note</h3>
          <p className="note-quote">"{HIGHLIGHT_NOTE}"</p>
          <div className="note-sign">— Class Teacher</div>
        </div>

        {/* Weekly progress chart */}
        <div className="po-card card-chart">
          <h3><TrendingUp size={18} /> Weekly progress</h3>
          <div className="legend-row">
            <span><span className="legend-dot" style={{ background: "#3fb25a" }} />Aarav</span>
            <span><span className="legend-dot" style={{ background: "#48607F" }} />Class average</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={WEEKLY} barGap={4}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={{ stroke: "#2E3E5C" }}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: "rgba(74,222,128,0.08)" }}
                contentStyle={{
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #2E3E5C",
                  background: "#1A2740",
                  color: "#F1F5F9",
                }}
              />
              <Bar dataKey="classAvg" fill="#cdc71e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="student" fill="#09621b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject performance */}
        <div className="po-card card-subjects">
          <h3>Subject performance</h3>
          {SUBJECTS.map((s) => (
            <div
              key={s.name}
              className="subject-row"
              onMouseEnter={() => setHoveredSubject(s.name)}
              onMouseLeave={() => setHoveredSubject(null)}
            >
              <div className="subject-top">
                <span className="subject-name">{s.name}</span>
                <span className="subject-score">{s.score}%</span>
              </div>
              <div className="subject-track">
                <div
                  className="subject-fill"
                  style={{ width: `${s.score}%`, background: s.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI summary */}
        <div className="po-card card-summary">
          <div className="summary-tag"><AlertCircle size={13} /> AI Summary</div>
          <p className="summary-text">{AI_SUMMARY}</p>
        </div>

        {/* Test score card */}
        <div className="po-card card-scores">
          <h3>Test score card</h3>
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
              {TEST_SCORES.map((t, i) => (
                <tr key={i}>
                  <td>{t.test}</td>
                  <td>
                    <span className="subject-chip">
                      <span className="chip-dot" style={{ background: t.color }} />
                      {t.subject}
                    </span>
                  </td>
                  <td>{t.date}</td>
                  <td style={{ fontFamily: "IBM Plex Mono, monospace" }}>{t.score}</td>
                  <td>
                    <span className="grade-pill" style={{ background: t.color }}>
                      {t.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Donut({ subjects }) {
  const size = 150;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = subjects.reduce((acc, s) => acc + s.score, 0);

  let offset = 0;
  const segments = subjects.map((s) => {
    const fraction = s.score / total;
    const dash = fraction * circumference;
    const seg = { ...s, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
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
        84%
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
