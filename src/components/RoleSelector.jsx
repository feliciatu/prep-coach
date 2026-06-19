import { t } from '../i18n';
import { IconUser, IconBriefcase, IconPenTool, IconUsers } from './Icons';

const ROLES = [
  { id: 'recruiter',        Icon: IconUser      },
  { id: 'hiringManager',    Icon: IconBriefcase },
  { id: 'designLead',       Icon: IconPenTool   },
  { id: 'crossFunctional',  Icon: IconUsers     },
];

export default function RoleSelector({ onSelect, uiLang }) {
  const strings = t[uiLang];

  return (
    <div className="role-selector">
      <div className="role-selector-header">
        <h2 className="role-selector-heading">{strings.roleSelectorHeading}</h2>
        <p className="role-selector-sub">{strings.roleSelectorSubheading}</p>
      </div>

      <div className="role-grid">
        {ROLES.map(({ id, Icon }) => {
          const role = strings.roles[id];
          return (
            <button key={id} className="role-card" onClick={() => onSelect(id)}>
              <Icon size={28} className="role-card-icon-svg" />
              <span className="role-card-label">{role.label}</span>
              {role.sublabel && (
                <span className="role-card-sublabel">{role.sublabel}</span>
              )}
              <span className="role-card-focus">{role.focus}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
