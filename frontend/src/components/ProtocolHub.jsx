import { useState } from 'react';

const PROTOCOL_DEPARTMENTS = [
  {
    id: 'hiring',
    label: 'Hiring Process',
    icon: '🧑\u200d💼',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    accentStrong: 'rgba(37, 99, 235, 0.55)',
    border: 'rgba(37, 99, 235, 0.35)',
    heroGradient: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
    tags: ['Talent', 'Compliance'],
    preview: ['Requisition', 'Interviews', 'Offer'],
    sections: [
      {
        title: 'Plan',
        icon: '🗂️',
        items: [
          { icon: '📝', label: 'Requisition' },
          { icon: '📣', label: 'Job Post' },
          { icon: '🎯', label: 'Shortlist' },
        ],
      },
      {
        title: 'Select',
        icon: '🎯',
        items: [
          { icon: '🗣️', label: 'Screen' },
          { icon: '🤝', label: 'Interview' },
          { icon: '🧠', label: 'Assess' },
        ],
      },
      {
        title: 'Close',
        icon: '🤝',
        items: [
          { icon: '📄', label: 'Offer' },
          { icon: '🚀', label: 'Onboard Prep' },
          { icon: '💬', label: 'Feedback' },
        ],
      },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: '🛒',
    accent: '#1d4ed8',
    accentSoft: 'rgba(29, 78, 216, 0.12)',
    accentStrong: 'rgba(29, 78, 216, 0.5)',
    border: 'rgba(29, 78, 216, 0.32)',
    heroGradient: 'linear-gradient(135deg, #1d4ed8 0%, #312e81 100%)',
    tags: ['Spend Control', 'Traceable'],
    preview: ['Request', 'Approval', 'Vendors'],
    sections: [
      {
        title: 'Request',
        icon: '📥',
        items: [
          { icon: '🛠️', label: 'Equipment Form', action: 'procurement:create-equipment' },
          { icon: '💻', label: 'Software Form', action: 'procurement:create-software' },
          { icon: '📄', label: 'Submission Guide' },
        ],
      },
      {
        title: 'Evaluate',
        icon: '📊',
        items: [
          { icon: '🧾', label: 'Vendor Review' },
          { icon: '🛡️', label: 'Risk Check' },
          { icon: '📑', label: 'Compliance' },
        ],
      },
      {
        title: 'Fulfill',
        icon: '🚚',
        items: [
          { icon: '📄', label: 'PO Issued' },
          { icon: '📦', label: 'Delivery' },
          { icon: '💳', label: 'Payment' },
        ],
      },
    ],
  },
  {
    id: 'disciplinary',
    label: 'Disciplinary',
    icon: '⚖️',
    accent: '#4338ca',
    accentSoft: 'rgba(67, 56, 202, 0.14)',
    accentStrong: 'rgba(67, 56, 202, 0.55)',
    border: 'rgba(67, 56, 202, 0.32)',
    heroGradient: 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
    tags: ['Fair', 'Documented'],
    preview: ['Concerns', 'Investigation', 'Action'],
    sections: [
      {
        title: 'Report',
        icon: '🛎️',
        items: [
          { icon: '📥', label: 'Incident Intake' },
          { icon: '🧾', label: 'Initial Review' },
          { icon: '🧑\u200d⚖️', label: 'Support' },
        ],
      },
      {
        title: 'Investigate',
        icon: '🔍',
        items: [
          { icon: '🧠', label: 'Fact Find' },
          { icon: '🗣️', label: 'Interviews' },
          { icon: '📝', label: 'Summary' },
        ],
      },
      {
        title: 'Action',
        icon: '🛡️',
        items: [
          { icon: '⚖️', label: 'Decision' },
          { icon: '📣', label: 'Communication' },
          { icon: '🔄', label: 'Follow-up' },
        ],
      },
    ],
  },
];

const ProtocolHub = ({ onAction }) => {
  const [activeDepartmentId, setActiveDepartmentId] = useState('');

  const activeDepartment = PROTOCOL_DEPARTMENTS.find((dept) => dept.id === activeDepartmentId);

  const handleItemClick = (department, section, item) => {
    if (item?.action && typeof onAction === 'function') {
      onAction(item.action, { department, section, item });
    }
  };

  return (
    <div className="glass-panel relative flex min-h-[520px] flex-col gap-6 overflow-hidden px-6 py-6 sm:px-7">
      <div className="pointer-events-none chroma-grid" />
      <div
        className="orb-glow"
        style={{
          top: '-40%',
          left: '-18%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 65%)',
        }}
      />
      <div className="relative z-10 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
            Protocol Hub
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-[1.65rem]">Team protocols</h2>
          <p className="text-sm font-medium text-slate-600">Tap a deck to dive into ready-made flows.</p>
        </div>
        {activeDepartment && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/25 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_18px_35px_-28px_rgba(37,99,235,0.65)] transition hover:border-white/50 hover:bg-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            style={{ color: activeDepartment.accent }}
            onClick={() => setActiveDepartmentId('')}
          >
            ← All decks
          </button>
        )}
      </div>

      <div className="relative z-10 flex-1">
        {!activeDepartment ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 sm:gap-6">
            {PROTOCOL_DEPARTMENTS.map((department) => (
              <button
                key={department.id}
                type="button"
                className="group relative flex h-full flex-col items-start gap-4 overflow-hidden rounded-2xl border border-white/25 bg-white/30 p-5 text-left shadow-[0_28px_60px_-46px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_35px_80px_-46px_rgba(59,130,246,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => setActiveDepartmentId(department.id)}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-50 transition duration-500 group-hover:opacity-80"
                  style={{
                    background: `linear-gradient(145deg, ${department.accentSoft} 0%, rgba(255,255,255,0.1) 55%, transparent 90%)`,
                  }}
                />
                <span className="pointer-events-none chroma-grid opacity-0 transition duration-500 group-hover:opacity-45" aria-hidden="true" />
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-2xl shadow-inner shadow-white/60 ring-1 ring-white/70" aria-hidden="true">
                  {department.icon}
                </span>
                <div className="relative z-10 space-y-1">
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
            className="relative flex h-full flex-col gap-6"
            style={{
              ['--protocol-accent']: activeDepartment.accent,
              ['--protocol-accent-soft']: activeDepartment.accentSoft,
              ['--protocol-accent-strong']: activeDepartment.accentStrong,
              ['--protocol-border']: activeDepartment.border,
            }}
          >
            <div
              className="relative grid gap-6 overflow-hidden rounded-[28px] border border-white/30 p-6 text-white shadow-[0_45px_80px_-60px_rgba(15,23,42,0.75)] sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center"
              style={{
                backgroundImage: activeDepartment.heroGradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className="pointer-events-none chroma-grid opacity-20" aria-hidden="true" />
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_65%)] opacity-60" aria-hidden="true" />
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-3xl">
                {activeDepartment.icon}
              </div>
              <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
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

            <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/25 bg-white/35 shadow-[0_30px_60px_-48px_rgba(15,23,42,0.55)]">
              <span className="pointer-events-none chroma-grid opacity-20" aria-hidden="true" />
              <div
                className="relative z-10 grid gap-5 overflow-auto p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3"
                style={{ maxHeight: 'calc(70vh - 240px)' }}
              >
                {activeDepartment.sections.map((section) => (
                  <div
                    key={`${activeDepartment.id}-${section.title}`}
                    className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-white/30 bg-white/60 p-4 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)] transition hover:-translate-y-1"
                    style={{
                      borderColor: activeDepartment.border,
                      boxShadow: `0 28px 60px -50px ${activeDepartment.accentStrong}`,
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-50"
                      style={{
                        background: `linear-gradient(145deg, ${activeDepartment.accentSoft} 0%, rgba(255,255,255,0.2) 70%, transparent 95%)`,
                      }}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex items-center gap-3">
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
                    <div className="relative z-10 flex flex-wrap gap-2">
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
                          onClick={() => handleItemClick(activeDepartment, section, item)}
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
