import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

const SKILL_LABELS = {
  contentDepth:  'Content Depth',
  structure:     'Structure',
  storytelling:  'Storytelling',
  conciseness:   'Conciseness',
  confidence:    'Confidence',
};

export default function SkillsRadar({ skills }) {
  if (!skills) return null;

  const data = Object.entries(SKILL_LABELS).map(([key, label]) => ({
    skill: label,
    score: skills[key] ?? 1,
    fullMark: 5,
  }));

  return (
    <div className="skills-radar-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e0d9d0" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 12, fill: '#7c7268', fontWeight: 500 }}
          />
          <Radar
            name="You"
            dataKey="score"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--accent)' }}
          />
          <Tooltip
            formatter={(v) => [`${v} / 5`, 'Score']}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e0d9d0',
              borderRadius: 8,
              fontSize: 13,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="skills-score-row">
        {data.map(({ skill, score }) => (
          <div key={skill} className="skills-score-item">
            <span className="skills-score-label">{skill}</span>
            <span className="skills-score-val" style={{ color: scoreColor(score) }}>
              {score}/5
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 4.5) return '#22c55e';
  if (score >= 3)   return 'var(--accent)';
  if (score >= 2)   return '#f59e0b';
  return '#ef4444';
}
