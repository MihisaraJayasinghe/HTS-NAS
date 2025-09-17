const Breadcrumbs = ({ breadcrumbs, onNavigate }) => {
  const items = [{ name: 'Home', path: '' }, ...(breadcrumbs || [])];

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((crumb, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={crumb.path || 'root'} className="breadcrumb-item">
            {isLast ? (
              <span className="breadcrumb-current">{crumb.name || 'Home'}</span>
            ) : (
              <button type="button" className="link" onClick={() => onNavigate(crumb.path)}>
                {crumb.name || 'Home'}
              </button>
            )}
            {!isLast && <span className="breadcrumb-separator">/</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
