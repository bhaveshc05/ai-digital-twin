import React, { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Sample data — swap this for your real student/skill records       */
/* ------------------------------------------------------------------ */

const STUDENTS = [
  {
    id: "amara",
    name: "Amara Osei",
    grade: "Grade 7",
    skills: [
      { id: "fractions", subject: "Mathematics", name: "Fractions & Ratios", mastery: 92, history: [40, 52, 61, 70, 84, 92], lastPracticed: "2 days ago", nextMilestone: "Mixed-number division" },
      { id: "linear-eq", subject: "Mathematics", name: "Linear Equations", mastery: 68, history: [10, 22, 35, 48, 58, 68], lastPracticed: "Yesterday", nextMilestone: "Solving with two variables" },
      { id: "geometry", subject: "Mathematics", name: "Geometry Basics", mastery: 41, history: [5, 12, 20, 28, 35, 41], lastPracticed: "5 days ago", nextMilestone: "Angle relationships" },
      { id: "comprehension", subject: "Reading & Language", name: "Reading Comprehension", mastery: 78, history: [30, 42, 55, 63, 71, 78], lastPracticed: "Today", nextMilestone: "Inference from subtext" },
      { id: "vocabulary", subject: "Reading & Language", name: "Vocabulary Building", mastery: 55, history: [15, 24, 33, 41, 48, 55], lastPracticed: "3 days ago", nextMilestone: "Latin root families" },
      { id: "grammar", subject: "Reading & Language", name: "Grammar & Syntax", mastery: 30, history: [4, 9, 15, 20, 25, 30], lastPracticed: "1 week ago", nextMilestone: "Clause structure" },
      { id: "cells", subject: "Science", name: "Cell Biology", mastery: 87, history: [35, 48, 60, 72, 80, 87], lastPracticed: "Today", nextMilestone: "Organelle function map" },
      { id: "ecosystems", subject: "Science", name: "Ecosystems", mastery: 63, history: [12, 20, 33, 44, 55, 63], lastPracticed: "4 days ago", nextMilestone: "Energy pyramid" },
    ],
  },
  {
    id: "diego",
    name: "Diego Ramírez",
    grade: "Grade 7",
    skills: [
      { id: "fractions", subject: "Mathematics", name: "Fractions & Ratios", mastery: 54, history: [10, 18, 28, 38, 46, 54], lastPracticed: "Today", nextMilestone: "Ratio word problems" },
      { id: "linear-eq", subject: "Mathematics", name: "Linear Equations", mastery: 96, history: [50, 62, 74, 85, 91, 96], lastPracticed: "Yesterday", nextMilestone: "Systems of equations" },
      { id: "geometry", subject: "Mathematics", name: "Geometry Basics", mastery: 72, history: [20, 34, 47, 58, 66, 72], lastPracticed: "2 days ago", nextMilestone: "Area of composite shapes" },
      { id: "comprehension", subject: "Reading & Language", name: "Reading Comprehension", mastery: 44, history: [8, 15, 24, 32, 38, 44], lastPracticed: "6 days ago", nextMilestone: "Main idea vs. detail" },
      { id: "vocabulary", subject: "Reading & Language", name: "Vocabulary Building", mastery: 61, history: [18, 27, 36, 46, 54, 61], lastPracticed: "Today", nextMilestone: "Context-clue strategies" },
      { id: "grammar", subject: "Reading & Language", name: "Grammar & Syntax", mastery: 20, history: [2, 5, 9, 13, 17, 20], lastPracticed: "2 weeks ago", nextMilestone: "Subject-verb agreement" },
      { id: "cells", subject: "Science", name: "Cell Biology", mastery: 33, history: [3, 8, 15, 22, 28, 33], lastPracticed: "5 days ago", nextMilestone: "Mitosis stages" },
      { id: "ecosystems", subject: "Science", name: "Ecosystems", mastery: 80, history: [25, 40, 54, 65, 74, 80], lastPracticed: "Yesterday", nextMilestone: "Nutrient cycling" },
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    grade: "Grade 7",
    skills: [
      { id: "fractions", subject: "Mathematics", name: "Fractions & Ratios", mastery: 100, history: [55, 68, 79, 88, 95, 100], lastPracticed: "Today", nextMilestone: "Enrichment: rational exponents" },
      { id: "linear-eq", subject: "Mathematics", name: "Linear Equations", mastery: 84, history: [30, 45, 58, 68, 77, 84], lastPracticed: "Today", nextMilestone: "Graphing slope-intercept" },
      { id: "geometry", subject: "Mathematics", name: "Geometry Basics", mastery: 58, history: [12, 22, 33, 43, 51, 58], lastPracticed: "3 days ago", nextMilestone: "Triangle congruence" },
      { id: "comprehension", subject: "Reading & Language", name: "Reading Comprehension", mastery: 91, history: [40, 55, 68, 78, 86, 91], lastPracticed: "Yesterday", nextMilestone: "Author's-purpose analysis" },
      { id: "vocabulary", subject: "Reading & Language", name: "Vocabulary Building", mastery: 73, history: [25, 37, 49, 59, 67, 73], lastPracticed: "Today", nextMilestone: "Figurative language" },
      { id: "grammar", subject: "Reading & Language", name: "Grammar & Syntax", mastery: 48, history: [8, 16, 26, 35, 42, 48], lastPracticed: "2 days ago", nextMilestone: "Punctuation in dialogue" },
      { id: "cells", subject: "Science", name: "Cell Biology", mastery: 66, history: [15, 26, 38, 49, 58, 66], lastPracticed: "4 days ago", nextMilestone: "Cell transport mechanisms" },
      { id: "ecosystems", subject: "Science", name: "Ecosystems", mastery: 39, history: [5, 11, 19, 27, 33, 39], lastPracticed: "1 week ago", nextMilestone: "Biome comparison" },
    ],
  },
];

const STAGES = ["Sprouting", "Rooting", "Budding", "Flourishing"];
const RING_COLORS = ["#6E8F6A", "#7FA37D", "#C9A24B", "#E0AE43"];
const RING_RADII = [20, 32, 44, 56];
const TRACK_COLOR = "rgba(239, 233, 218, 0.14)";

function stageIndexOf(mastery) {
  return Math.min(3, Math.floor(mastery / 25));
}
function stageNameOf(mastery) {
  if (mastery >= 100) return "Flourishing";
  return STAGES[stageIndexOf(mastery)];
}

/* ------------------------------------------------------------------ */
/*  Ring gauge — the signature "growth ring" mastery visualization    */
/* ------------------------------------------------------------------ */

function GrowthRing({ mastery, size = 132, active = false }) {
  const c = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`ring-svg${active ? " ring-svg--active" : ""}`}
      aria-hidden="true"
    >
      {RING_RADII.map((r, i) => {
        const circumference = 2 * Math.PI * r;
        const stageStart = i * 25;
        const stageEnd = stageStart + 25;
        let dash = 0;
        let full = false;
        if (mastery >= stageEnd) {
          full = true;
        } else if (mastery > stageStart) {
          dash = ((mastery - stageStart) / 25) * circumference;
        }
        return (
          <g key={i} transform={`rotate(-90 ${c} ${c})`}>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={TRACK_COLOR}
              strokeWidth={4}
            />
            {(full || dash > 0) && (
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={RING_COLORS[i]}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={full ? `${circumference} ${circumference}` : `${dash} ${circumference}`}
                className="ring-arc"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ values, width = 120, height = 34, color = "#D9A441" }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = (values.length - 1) * step;
  const lastY = height - ((values[values.length - 1] - min) / range) * (height - 6) - 3;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="spark-svg">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Skill card                                                        */
/* ------------------------------------------------------------------ */

function SkillCard({ skill, selected, onSelect }) {
  return (
    <button
      className={`skill-card${selected ? " skill-card--selected" : ""}`}
      onClick={() => onSelect(skill.id)}
      aria-pressed={selected}
    >
      <GrowthRing mastery={skill.mastery} active={selected} />
      <div className="skill-card__ring-label">
        <span className="skill-card__pct">{skill.mastery}</span>
        <span className="skill-card__pct-sign">%</span>
      </div>
      <div className="skill-card__meta">
        <h3 className="skill-card__name">{skill.name}</h3>
        <span className={`skill-card__stage skill-card__stage--${stageIndexOf(skill.mastery)}`}>
          {stageNameOf(skill.mastery)}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                    */
/* ------------------------------------------------------------------ */

export default function MasteryProgressDashboard() {
  const [studentId, setStudentId] = useState(STUDENTS[0].id);
  const [selectedSkillId, setSelectedSkillId] = useState(null);

  const student = STUDENTS.find((s) => s.id === studentId);

  const bySubject = useMemo(() => {
    const map = new Map();
    student.skills.forEach((sk) => {
      if (!map.has(sk.subject)) map.set(sk.subject, []);
      map.get(sk.subject).push(sk);
    });
    return Array.from(map.entries());
  }, [student]);

  const overall = useMemo(() => {
    const total = student.skills.reduce((sum, s) => sum + s.mastery, 0);
    return Math.round(total / student.skills.length);
  }, [student]);

  const stageCounts = useMemo(() => {
    const counts = [0, 0, 0, 0];
    student.skills.forEach((s) => counts[stageIndexOf(s.mastery)]++);
    return counts;
  }, [student]);

  const selectedSkill = student.skills.find((s) => s.id === selectedSkillId) || null;

  return (
    <div className="mpd-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .mpd-root {
          --bg: #16241D;
          --panel: #1E3025;
          --panel-raised: #24392C;
          --line: #34473A;
          --bone: #EFE9DA;
          --muted: #9FB0A0;
          --gold: #E0AE43;
          --sage: #7FA37D;
          --rust: #C97B5A;
          font-family: 'Inter', system-ui, sans-serif;
          background: radial-gradient(120% 140% at 15% -10%, #1C3226 0%, var(--bg) 55%);
          color: var(--bone);
          min-height: 100%;
          padding: 40px clamp(16px, 5vw, 56px) 64px;
          box-sizing: border-box;
        }
        .mpd-root * { box-sizing: border-box; }
        .mpd-root button { font-family: inherit; cursor: pointer; }
        .mpd-root :focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 3px;
        }

        /* ---- header ---- */
        .mpd-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 24px;
        }
        .mpd-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 8px;
        }
        .mpd-title {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: clamp(26px, 3.4vw, 38px);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .mpd-title span { font-style: italic; color: var(--gold); }
        .mpd-sub { color: var(--muted); font-size: 14px; margin-top: 6px; }

        .student-switcher {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .student-pill {
          background: var(--panel);
          border: 1px solid var(--line);
          color: var(--muted);
          padding: 9px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .student-pill:hover { border-color: var(--sage); color: var(--bone); }
        .student-pill--active {
          background: var(--gold);
          border-color: var(--gold);
          color: #1B2A22;
          font-weight: 600;
        }

        /* ---- hero ---- */
        .mpd-hero {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 40px;
          align-items: center;
          background: linear-gradient(135deg, var(--panel) 0%, var(--panel-raised) 100%);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 28px clamp(20px, 4vw, 40px);
          margin-bottom: 36px;
        }
        .mpd-hero-num {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(56px, 9vw, 88px);
          line-height: 1;
          color: var(--gold);
          display: flex;
          align-items: flex-start;
        }
        .mpd-hero-num small {
          font-family: 'JetBrains Mono', monospace;
          font-style: normal;
          font-size: 22px;
          margin-top: 8px;
          color: var(--muted);
        }
        .mpd-hero-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 6px;
        }
        .stage-distribution {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .stage-row {
          display: grid;
          grid-template-columns: 96px 1fr 28px;
          align-items: center;
          gap: 12px;
        }
        .stage-row-label {
          font-size: 12.5px;
          color: var(--muted);
        }
        .stage-row-track {
          height: 7px;
          background: rgba(239,233,218,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .stage-row-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
        .stage-row-count { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--muted); text-align: right; }

        /* ---- detail panel ---- */
        .detail-panel {
          background: var(--panel);
          border: 1px solid var(--line);
          border-left: 3px solid var(--gold);
          border-radius: 14px;
          padding: 22px 26px;
          margin-bottom: 36px;
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          justify-content: space-between;
          align-items: center;
        }
        .detail-panel__title {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          margin: 0 0 4px;
        }
        .detail-panel__row { display: flex; gap: 28px; flex-wrap: wrap; }
        .detail-panel__stat { min-width: 130px; }
        .detail-panel__stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .detail-panel__stat-value { font-size: 14.5px; color: var(--bone); }
        .detail-panel__close {
          background: none;
          border: 1px solid var(--line);
          color: var(--muted);
          border-radius: 999px;
          width: 30px; height: 30px;
          font-size: 15px;
          line-height: 1;
        }
        .detail-panel__close:hover { color: var(--bone); border-color: var(--sage); }

        /* ---- subject sections ---- */
        .subject-section { margin-bottom: 34px; }
        .subject-heading {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 16px;
        }
        .subject-heading h2 {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 19px;
          margin: 0;
        }
        .subject-heading::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--line);
        }

        .skill-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
          gap: 14px;
        }

        .skill-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px 14px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          position: relative;
          transition: border-color 0.15s ease, transform 0.15s ease, background 0.15s ease;
        }
        .skill-card:hover { border-color: var(--sage); transform: translateY(-2px); }
        .skill-card--selected { border-color: var(--gold); background: var(--panel-raised); }

        .skill-card__ring-label {
          position: absolute;
          top: 42px;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          align-items: baseline;
          pointer-events: none;
        }
        .skill-card__pct {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 500;
          font-size: 22px;
          color: var(--bone);
        }
        .skill-card__pct-sign {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--muted);
          margin-left: 1px;
        }
        .skill-card__name {
          font-size: 13.5px;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
        }
        .skill-card__stage {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(239,233,218,0.08);
          color: var(--muted);
        }
        .skill-card__stage--2 { color: var(--gold); }
        .skill-card__stage--3 { color: var(--gold); background: rgba(224,174,67,0.14); }

        .ring-svg--active { filter: drop-shadow(0 0 6px rgba(224,174,67,0.35)); }
        .ring-arc { transition: stroke-dasharray 0.5s ease; }

        @media (max-width: 640px) {
          .mpd-hero { grid-template-columns: 1fr; text-align: left; }
          .detail-panel { flex-direction: column; align-items: flex-start; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skill-card, .ring-arc, .stage-row-fill { transition: none !important; }
        }
      `}</style>

      <header className="mpd-header">
        <div>
          <p className="mpd-eyebrow">Mastery Garden — {student.grade}</p>
          <h1 className="mpd-title">
            <span>{student.name.split(" ")[0]}</span>'s learning growth
          </h1>
          <p className="mpd-sub">Every skill grows outward, ring by ring, as mastery deepens.</p>
        </div>
        <div className="student-switcher" role="tablist" aria-label="Select student">
          {STUDENTS.map((s) => (
            <button
              key={s.id}
              className={`student-pill${s.id === studentId ? " student-pill--active" : ""}`}
              onClick={() => { setStudentId(s.id); setSelectedSkillId(null); }}
              role="tab"
              aria-selected={s.id === studentId}
            >
              {s.name}
            </button>
          ))}
        </div>
      </header>

      <section className="mpd-hero">
        <div>
          <div className="mpd-hero-num">{overall}<small>%</small></div>
          <div className="mpd-hero-label">Overall canopy growth</div>
        </div>
        <div className="stage-distribution">
          {STAGES.map((stage, i) => (
            <div className="stage-row" key={stage}>
              <span className="stage-row-label">{stage}</span>
              <span className="stage-row-track">
                <span
                  className="stage-row-fill"
                  style={{
                    width: `${(stageCounts[i] / student.skills.length) * 100}%`,
                    background: RING_COLORS[i],
                  }}
                />
              </span>
              <span className="stage-row-count">{stageCounts[i]}</span>
            </div>
          ))}
        </div>
      </section>

      {selectedSkill && (
        <section className="detail-panel">
          <div>
            <p className="detail-panel__title">{selectedSkill.name}</p>
            <span className="mpd-sub" style={{ marginTop: 0 }}>{selectedSkill.subject}</span>
          </div>
          <div className="detail-panel__row">
            <div className="detail-panel__stat">
              <div className="detail-panel__stat-label">Current stage</div>
              <div className="detail-panel__stat-value">{stageNameOf(selectedSkill.mastery)} · {selectedSkill.mastery}%</div>
            </div>
            <div className="detail-panel__stat">
              <div className="detail-panel__stat-label">Last practiced</div>
              <div className="detail-panel__stat-value">{selectedSkill.lastPracticed}</div>
            </div>
            <div className="detail-panel__stat">
              <div className="detail-panel__stat-label">Next milestone</div>
              <div className="detail-panel__stat-value">{selectedSkill.nextMilestone}</div>
            </div>
            <div className="detail-panel__stat">
              <div className="detail-panel__stat-label">6-session trend</div>
              <Sparkline values={selectedSkill.history} color={RING_COLORS[stageIndexOf(selectedSkill.mastery)]} />
            </div>
          </div>
          <button className="detail-panel__close" onClick={() => setSelectedSkillId(null)} aria-label="Close detail panel">×</button>
        </section>
      )}

      {bySubject.map(([subject, skills]) => (
        <div className="subject-section" key={subject}>
          <div className="subject-heading">
            <h2>{subject}</h2>
          </div>
          <div className="skill-grid">
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                selected={skill.id === selectedSkillId}
                onSelect={(id) => setSelectedSkillId(id === selectedSkillId ? null : id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
