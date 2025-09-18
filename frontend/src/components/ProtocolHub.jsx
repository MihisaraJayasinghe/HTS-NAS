import { useState } from 'react';

const PROTOCOL_DEPARTMENTS = [
  {
    id: 'people',
    label: 'People Ops',
    icon: '👥',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    accentStrong: 'rgba(37, 99, 235, 0.55)',
    border: 'rgba(37, 99, 235, 0.35)',
    heroGradient: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
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
    accent: '#0284c7',
    accentSoft: 'rgba(2, 132, 199, 0.14)',
    accentStrong: 'rgba(2, 132, 199, 0.55)',
    border: 'rgba(2, 132, 199, 0.35)',
    heroGradient: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
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
    accent: '#1d4ed8',
    accentSoft: 'rgba(29, 78, 216, 0.12)',
    accentStrong: 'rgba(29, 78, 216, 0.5)',
    border: 'rgba(29, 78, 216, 0.32)',
    heroGradient: 'linear-gradient(135deg, #1d4ed8 0%, #312e81 100%)',
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
    accent: '#0369a1',
    accentSoft: 'rgba(3, 105, 161, 0.14)',
    accentStrong: 'rgba(3, 105, 161, 0.5)',
    border: 'rgba(3, 105, 161, 0.32)',
    heroGradient: 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)',
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
    accent: '#4338ca',
    accentSoft: 'rgba(67, 56, 202, 0.14)',
    accentStrong: 'rgba(67, 56, 202, 0.55)',
    border: 'rgba(67, 56, 202, 0.32)',
    heroGradient: 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
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
    accent: '#0f766e',
    accentSoft: 'rgba(15, 118, 110, 0.16)',
    accentStrong: 'rgba(15, 118, 110, 0.5)',
    border: 'rgba(15, 118, 110, 0.3)',
    heroGradient: 'linear-gradient(135deg, #0f766e 0%, #0f172a 100%)',
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
    accent: '#1e40af',
    accentSoft: 'rgba(30, 64, 175, 0.14)',
    accentStrong: 'rgba(30, 64, 175, 0.5)',
    border: 'rgba(30, 64, 175, 0.32)',
    heroGradient: 'linear-gradient(135deg, #1e40af 0%, #0b1340 100%)',
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
    accent: '#312e81',
    accentSoft: 'rgba(49, 46, 129, 0.16)',
    accentStrong: 'rgba(49, 46, 129, 0.55)',
    border: 'rgba(49, 46, 129, 0.3)',
    heroGradient: 'linear-gradient(135deg, #312e81 0%, #111827 100%)',
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

const ProtocolHub = () => {
  const [activeDepartmentId, setActiveDepartmentId] = useState('');

  const activeDepartment = PROTOCOL_DEPARTMENTS.find((dept) => dept.id === activeDepartmentId);

  return (
    <div className="relative flex min-h-[520px] flex-col gap-6 rounded-3xl border border-white/45 bg-white/92 px-6 py-6 shadow-2xl shadow-blue-500/15 backdrop-blur-xl sm:px-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-[1.65rem]">Team protocols</h2>
          <p className="text-sm font-medium text-slate-500">Tap a deck to dive into ready-made flows.</p>
        </div>
        {activeDepartment && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
            style={{ color: activeDepartment.accent }}
            onClick={() => setActiveDepartmentId('')}
          >
            ← All decks
          </button>
        )}
      </div>

      <div className="flex-1">
        {!activeDepartment ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 sm:gap-6">
            {PROTOCOL_DEPARTMENTS.map((department) => (
              <button
                key={department.id}
                type="button"
                className="group flex h-full flex-col items-start gap-4 rounded-2xl border border-transparent bg-white/95 p-5 text-left shadow-lg shadow-blue-500/5 transition hover:-translate-y-1 hover:border-blue-300/60 hover:shadow-xl hover:shadow-blue-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                style={{
                  background: `linear-gradient(155deg, rgba(255, 255, 255, 0.96) 0%, ${department.accentSoft} 120%)`,
                }}
                onClick={() => setActiveDepartmentId(department.id)}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/65 text-2xl shadow-sm" aria-hidden="true">
                  {department.icon}
                </span>
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-slate-900">{department.label}</div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500" style={{ color: department.accent }}>
                    View deck →
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="flex h-full flex-col gap-6"
            style={{
              ['--protocol-accent']: activeDepartment.accent,
              ['--protocol-accent-soft']: activeDepartment.accentSoft,
              ['--protocol-accent-strong']: activeDepartment.accentStrong,
              ['--protocol-border']: activeDepartment.border,
            }}
          >
            <div
              className="grid gap-6 rounded-[28px] border border-white/35 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_60%)] p-6 text-white shadow-[0_45px_80px_-60px_rgba(15,23,42,0.75)] sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center"
              style={{
                backgroundImage: activeDepartment.heroGradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-3xl">
                {activeDepartment.icon}
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                <h3 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
                  {activeDepartment.label}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeDepartment.tags.map((tag) => (
                    <span
                      key={`${activeDepartment.id}-hero-${tag}`}
                      className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeDepartment.preview.map((item) => (
                    <span
                      key={`${activeDepartment.id}-quick-${item}`}
                      className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white/90"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-inner shadow-blue-500/5">
              <div
                className="grid gap-5 overflow-auto p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3"
                style={{ maxHeight: 'calc(70vh - 240px)' }}
              >
                {activeDepartment.sections.map((section) => (
                  <div
                    key={`${activeDepartment.id}-${section.title}`}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-white/60 bg-white p-4 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)] transition hover:-translate-y-1"
                    style={{
                      borderColor: activeDepartment.border,
                      boxShadow: `0 28px 60px -50px ${activeDepartment.accentStrong}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-lg shadow-inner"
                        style={{
                          color: activeDepartment.accent,
                          boxShadow: 'inset 0 0 0 1px rgba(37, 99, 235, 0.2)',
                        }}
                        aria-hidden="true"
                      >
                        {section.icon}
                      </span>
                      <span className="text-base font-semibold text-slate-900">{section.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {section.items.map((item) => (
                        <button
                          key={`${section.title}-${item.label}`}
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5"
                          style={{
                            color: activeDepartment.accent,
                            borderColor: activeDepartment.border,
                            backgroundColor: 'rgba(255,255,255,0.96)',
                          }}
                        >
                          <span className="text-sm" aria-hidden="true">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtocolHub;
