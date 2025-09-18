import { useState } from 'react';

const PALETTE = {
  azure: {
    accent: '#00A6C6',
    accentSoft: 'rgba(0, 166, 198, 0.16)',
    accentStrong: 'rgba(0, 166, 198, 0.55)',
    border: 'rgba(0, 166, 198, 0.3)',
  },
  cyan: {
    accent: '#08F7F7',
    accentSoft: 'rgba(8, 247, 247, 0.18)',
    accentStrong: 'rgba(8, 247, 247, 0.5)',
    border: 'rgba(8, 247, 247, 0.32)',
  },
  navy: {
    accent: '#010B54',
    accentSoft: 'rgba(1, 11, 84, 0.15)',
    accentStrong: 'rgba(1, 11, 84, 0.48)',
    border: 'rgba(1, 11, 84, 0.35)',
  },
};

const PROTOCOL_DEPARTMENTS = [
  {
    id: 'people',
    label: 'People Ops',
    icon: '👥',
    ...PALETTE.azure,
    heroGradient: 'linear-gradient(135deg, rgba(1, 11, 84, 0.9) 0%, rgba(0, 166, 198, 0.9) 95%)',
    tags: ['Self-serve', '24h SLA'],
    preview: ['Leave', 'Shifts', 'Kudos'],
    sections: [
      {
        title: 'Requests',
        icon: '📝',
        items: [
          { icon: '📝', label: 'Leave' },
          { icon: '🕒', label: 'Shifts' },
          { icon: '🎁', label: 'Perks' },
        ],
      },
      {
        title: 'Routines',
        icon: '📋',
        items: [
          { icon: '🚀', label: 'Onboard' },
          { icon: '🔄', label: 'Offboard' },
          { icon: '🌱', label: 'Growth' },
        ],
      },
      {
        title: 'Escalate',
        icon: '⚡',
        items: [
          { icon: '🛡️', label: 'Conduct' },
          { icon: '🤝', label: 'Disputes' },
          { icon: '💰', label: 'Payroll' },
        ],
      },
    ],
  },
  {
    id: 'it',
    label: 'IT Desk',
    icon: '💻',
    ...PALETTE.cyan,
    heroGradient: 'linear-gradient(135deg, rgba(1, 11, 84, 0.95) 0%, rgba(8, 247, 247, 0.9) 100%)',
    tags: ['Always on', 'Secure'],
    preview: ['Access', 'Device', 'VPN'],
    sections: [
      {
        title: 'Requests',
        icon: '📥',
        items: [
          { icon: '🔑', label: 'Access' },
          { icon: '💼', label: 'Device' },
          { icon: '🛰️', label: 'VPN' },
        ],
      },
      {
        title: 'Routines',
        icon: '🛠️',
        items: [
          { icon: '⚙️', label: 'Deploy' },
          { icon: '🛡️', label: 'Patch' },
          { icon: '💾', label: 'Backup' },
        ],
      },
      {
        title: 'Escalate',
        icon: '🚨',
        items: [
          { icon: '🔥', label: 'Incident' },
          { icon: '📡', label: 'Outage' },
          { icon: '🕵️‍♂️', label: 'Security' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance Desk',
    icon: '💳',
    ...PALETTE.navy,
    heroGradient: 'linear-gradient(135deg, rgba(1, 11, 84, 0.92) 0%, rgba(0, 166, 198, 0.75) 100%)',
    tags: ['Transparent', 'Tracked'],
    preview: ['Expense', 'Purchase', 'Budget'],
    sections: [
      {
        title: 'Requests',
        icon: '🧾',
        items: [
          { icon: '🧾', label: 'Expense' },
          { icon: '🛒', label: 'Purchase' },
          { icon: '💵', label: 'Advance' },
        ],
      },
      {
        title: 'Routines',
        icon: '🪙',
        items: [
          { icon: '🗓️', label: 'Payroll' },
          { icon: '📨', label: 'Invoice' },
          { icon: '📈', label: 'Budget' },
        ],
      },
      {
        title: 'Escalate',
        icon: '🧭',
        items: [
          { icon: '✅', label: 'Approvals' },
          { icon: '📊', label: 'Limits' },
          { icon: '🔍', label: 'Audit' },
        ],
      },
    ],
  },
  {
    id: 'facilities',
    label: 'Facilities',
    icon: '🏢',
    ...PALETTE.azure,
    heroGradient: 'linear-gradient(135deg, rgba(0, 166, 198, 0.9) 0%, rgba(8, 247, 247, 0.65) 100%)',
    tags: ['Comfort', 'Ready'],
    preview: ['Seating', 'Repair', 'Transport'],
    sections: [
      {
        title: 'Requests',
        icon: '📬',
        items: [
          { icon: '🪑', label: 'Seating' },
          { icon: '🛠️', label: 'Repair' },
          { icon: '🚌', label: 'Transport' },
        ],
      },
      {
        title: 'Routines',
        icon: '🧹',
        items: [
          { icon: '☕', label: 'Pantry' },
          { icon: '🧴', label: 'Sanitize' },
          { icon: '📦', label: 'Inventory' },
        ],
      },
      {
        title: 'Escalate',
        icon: '🚧',
        items: [
          { icon: '⚠️', label: 'Safety' },
          { icon: '🔌', label: 'Power' },
          { icon: '🤝', label: 'Vendor' },
        ],
      },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Training',
    icon: '🎧',
    ...PALETTE.navy,
    heroGradient: 'linear-gradient(135deg, rgba(1, 11, 84, 0.9) 0%, rgba(0, 166, 198, 0.8) 100%)',
    tags: ['Consistent', 'Elevate'],
    preview: ['QA', 'Coaching', 'Refresh'],
    sections: [
      {
        title: 'Requests',
        icon: '🎯',
        items: [
          { icon: '🧪', label: 'QA' },
          { icon: '🤝', label: 'Calibrate' },
          { icon: '📜', label: 'Certify' },
        ],
      },
      {
        title: 'Routines',
        icon: '📚',
        items: [
          { icon: '📖', label: 'Playbook' },
          { icon: '🎓', label: 'Coaching' },
          { icon: '🔄', label: 'Refresh' },
        ],
      },
      {
        title: 'Escalate',
        icon: '📈',
        items: [
          { icon: '📉', label: 'Variance' },
          { icon: '🗣️', label: 'Feedback' },
          { icon: '⚙️', label: 'Rework' },
        ],
      },
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce',
    icon: '📅',
    ...PALETTE.azure,
    heroGradient: 'linear-gradient(135deg, rgba(0, 166, 198, 0.85) 0%, rgba(1, 11, 84, 0.9) 100%)',
    tags: ['Balanced', 'Realtime'],
    preview: ['Roster', 'Forecast', 'Alerts'],
    sections: [
      {
        title: 'Requests',
        icon: '🗂️',
        items: [
          { icon: '📅', label: 'Roster' },
          { icon: '🕓', label: 'Overtime' },
          { icon: '🛎️', label: 'Swap' },
        ],
      },
      {
        title: 'Routines',
        icon: '📊',
        items: [
          { icon: '📈', label: 'Forecast' },
          { icon: '📉', label: 'Capacity' },
          { icon: '🧠', label: 'Analytics' },
        ],
      },
      {
        title: 'Escalate',
        icon: '⏱️',
        items: [
          { icon: '📣', label: 'Underfill' },
          { icon: '🚦', label: 'Overfill' },
          { icon: '🔔', label: 'Alerts' },
        ],
      },
    ],
  },
  {
    id: 'clients',
    label: 'Client Success',
    icon: '🤝',
    ...PALETTE.cyan,
    heroGradient: 'linear-gradient(135deg, rgba(0, 166, 198, 0.85) 0%, rgba(8, 247, 247, 0.75) 100%)',
    tags: ['Voice', 'Trusted'],
    preview: ['Kickoff', 'SLA', 'Updates'],
    sections: [
      {
        title: 'Requests',
        icon: '📨',
        items: [
          { icon: '🚀', label: 'Kickoff' },
          { icon: '⏱️', label: 'SLA' },
          { icon: '📰', label: 'Updates' },
        ],
      },
      {
        title: 'Routines',
        icon: '📣',
        items: [
          { icon: '📊', label: 'Insights' },
          { icon: '🧭', label: 'Cadence' },
          { icon: '💬', label: 'VOC' },
        ],
      },
      {
        title: 'Escalate',
        icon: '🛎️',
        items: [
          { icon: '⚠️', label: 'Risk' },
          { icon: '📈', label: 'Escalate' },
          { icon: '🛡️', label: 'Recovery' },
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security & Compliance',
    icon: '🛡️',
    ...PALETTE.navy,
    heroGradient: 'linear-gradient(135deg, rgba(1, 11, 84, 0.95) 0%, rgba(0, 166, 198, 0.65) 100%)',
    tags: ['Audit ready', 'Trust'],
    preview: ['Policy', 'Access', 'Incident'],
    sections: [
      {
        title: 'Requests',
        icon: '📜',
        items: [
          { icon: '📜', label: 'Policy' },
          { icon: '🔐', label: 'Access' },
          { icon: '🗄️', label: 'Retention' },
        ],
      },
      {
        title: 'Routines',
        icon: '🛠️',
        items: [
          { icon: '🧭', label: 'Checks' },
          { icon: '🧠', label: 'Awareness' },
          { icon: '🛰️', label: 'Monitoring' },
        ],
      },
      {
        title: 'Escalate',
        icon: '🚨',
        items: [
          { icon: '🛑', label: 'Incident' },
          { icon: '📞', label: 'Hotline' },
          { icon: '⚖️', label: 'Legal' },
        ],
      },
    ],
  },
];

const buildProtocolStyleVars = (context = {}) => {
  const vars = {};

  if (context.accent) {
    vars['--protocol-accent'] = context.accent;
  }

  if (context.accentSoft) {
    vars['--protocol-accent-soft'] = context.accentSoft;
  }

  if (context.accentStrong) {
    vars['--protocol-accent-strong'] = context.accentStrong;
  }

  if (context.border) {
    vars['--protocol-border'] = context.border;
  }

  if (context.heroGradient) {
    vars['--protocol-hero-gradient'] = context.heroGradient;
  }

  return vars;
};

const ProtocolHub = ({ hasStorageAccess = false, onLaunchStorage }) => {
  const [activeDepartmentId, setActiveDepartmentId] = useState('');

  const activeDepartment = PROTOCOL_DEPARTMENTS.find((dept) => dept.id === activeDepartmentId);

  const handleLaunchStorage = () => {
    if (!activeDepartment || typeof onLaunchStorage !== 'function') {
      return;
    }
    onLaunchStorage(activeDepartment.id, activeDepartment);
  };

  return (
    <div className="panel protocols-panel">
      <div className="panel-header">
        <div className="panel-header-icon" aria-hidden="true">
          🧭
        </div>
        <div className="panel-header-copy">
          <h2>Team protocols</h2>
          <p>Pick a desk to open flows.</p>
        </div>
      </div>
      {!activeDepartment && (
        <div className="protocols-grid">
          {PROTOCOL_DEPARTMENTS.map((department) => (
            <button
              key={department.id}
              type="button"
              className="protocol-card"
              style={buildProtocolStyleVars(department)}
              onClick={() => setActiveDepartmentId(department.id)}
            >
              <span className="protocol-card-icon" aria-hidden="true">
                {department.icon}
              </span>
              <span className="protocol-card-label">{department.label}</span>
              <div className="protocol-card-preview">
                {department.preview.map((item) => (
                  <span key={item} className="protocol-chip">
                    {item}
                  </span>
                ))}
              </div>
              <div className="protocol-card-tags">
                {department.tags.map((tag) => (
                  <span key={`${department.id}-${tag}`} className="protocol-card-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
      {activeDepartment && (
        <div
          className="protocol-detail"
          style={buildProtocolStyleVars(activeDepartment)}
        >
          <div className="protocol-detail-hero">
            <div className="protocol-hero-icon" aria-hidden="true">
              {activeDepartment.icon}
            </div>
            <div className="protocol-hero-copy">
              <span className="protocol-hero-label">{activeDepartment.label}</span>
              <div className="protocol-hero-tags">
                {activeDepartment.tags.map((tag) => (
                  <span key={`${activeDepartment.id}-hero-${tag}`} className="protocol-hero-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="protocol-hero-quick">
                {activeDepartment.preview.map((item) => (
                  <span key={`${activeDepartment.id}-quick-${item}`} className="protocol-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="protocol-back"
              onClick={() => setActiveDepartmentId('')}
            >
              ← All decks
            </button>
          </div>
          <div className="protocol-sections">
            {activeDepartment.sections.map((section) => (
              <div key={`${activeDepartment.id}-${section.title}`} className="protocol-section">
                <div className="protocol-section-heading">
                  <span className="protocol-section-icon" aria-hidden="true">
                    {section.icon}
                  </span>
                  <span className="protocol-section-title">{section.title}</span>
                </div>
                <div className="protocol-items">
                  {section.items.map((item) => (
                    <button key={`${section.title}-${item.label}`} type="button" className="protocol-item">
                      <span className="protocol-item-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="protocol-item-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="protocol-detail-actions">
            <p>
              {hasStorageAccess
                ? 'Downloads open in the NAS workspace on the left.'
                : 'Ask your admin to connect a storage deck for downloads.'}
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={handleLaunchStorage}
              disabled={!hasStorageAccess}
            >
              {hasStorageAccess ? 'Open storage deck' : 'Request storage access'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocolHub;
