import { useState } from 'react';
import { t } from '../i18n';
import { IconBuilding, IconRocket, IconTrendingUp } from './Icons';

const COMPANY_TYPES = [
  { id: 'large',      Icon: IconBuilding    },
  { id: 'startupAB',  Icon: IconRocket      },
  { id: 'startupCD',  Icon: IconTrendingUp  },
];

const INDUSTRIES = ['tech', 'fintech', 'consumer', 'healthcare', 'enterprise', 'other'];

export default function CompanySelector({ onSelect, uiLang }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const strings = t[uiLang];
  const c = strings.companySelector;

  const canContinue = selectedType && selectedIndustry;

  return (
    <div className="role-selector">
      <div className="role-selector-header">
        <h2 className="role-selector-heading">{c.heading}</h2>
        <p className="role-selector-sub">{c.subheading}</p>
      </div>

      <div className="company-section">
        <p className="company-section-label">{c.typeLabel}</p>
        <div className="company-type-grid">
          {COMPANY_TYPES.map(({ id, Icon }) => {
            const item = c.types[id];
            return (
              <button
                key={id}
                className={`company-card ${selectedType === id ? 'selected' : ''}`}
                onClick={() => setSelectedType(id)}
              >
                <Icon size={24} className="company-card-icon-svg" />
                <span className="company-card-label">{item.label}</span>
                <span className="company-card-tag">{item.tag}</span>
                <span className="company-card-focus">{item.focus}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="company-section">
        <p className="company-section-label">{c.industryLabel}</p>
        <div className="industry-grid">
          {INDUSTRIES.map((id) => {
            const item = c.industries[id];
            return (
              <button
                key={id}
                className={`industry-chip ${selectedIndustry === id ? 'selected' : ''}`}
                onClick={() => setSelectedIndustry(id)}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="company-continue-row">
        <button
          className="company-continue-btn"
          disabled={!canContinue}
          onClick={() => onSelect({ companyType: selectedType, industry: selectedIndustry, companyName: null })}
        >
          {c.continue} →
        </button>
      </div>
    </div>
  );
}
