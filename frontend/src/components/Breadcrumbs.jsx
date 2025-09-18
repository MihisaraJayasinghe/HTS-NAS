const Breadcrumbs = ({ breadcrumbs, onNavigate }) => {
  const items = [{ name: 'Home', path: '' }, ...(breadcrumbs || [])];

  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm"
      aria-label="Breadcrumb"
    >
      {items.map((crumb, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={crumb.path || 'root'} className="flex items-center gap-2">
            {isLast ? (
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-blue-600">
                {crumb.name || 'Home'}
              </span>
            ) : (
              <button
                type="button"
                className="rounded-full bg-white/80 px-3 py-1 text-slate-600 shadow-sm shadow-slate-900/5 transition hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                onClick={() => onNavigate(crumb.path)}
              >
                {crumb.name || 'Home'}
              </button>
            )}
            {!isLast && <span className="text-slate-300">/</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
