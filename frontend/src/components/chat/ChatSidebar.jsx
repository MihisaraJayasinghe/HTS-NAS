const ChatSidebar = ({ groups = [], users = [], activeTarget, onSelect, isLoading }) => {
  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const hasUsers = Array.isArray(users) && users.length > 0;

  const buildClassName = (base, isActive) => {
    return isActive ? `${base} is-active` : base;
  };

  return (
    <aside className="chat-sidebar">
      <section className="chat-sidebar-section">
        <p className="chat-sidebar-title">Groups</p>
        {!hasGroups && !isLoading && <p className="chat-sidebar-empty">No groups available.</p>}
        {isLoading && <p className="chat-sidebar-empty">Loading…</p>}
        {hasGroups && (
          <ul className="chat-sidebar-list">
            {groups.map((group) => {
              const isActive = activeTarget?.type === 'group' && activeTarget?.id === group.id;
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    className={buildClassName('chat-option', isActive)}
                    onClick={() =>
                      onSelect?.({
                        type: 'group',
                        id: group.id,
                        name: group.name,
                        description: group.description,
                      })
                    }
                    title={group.description}
                  >
                    <span className="chat-option-title">{group.name}</span>
                    {group.description && <span className="chat-option-subtitle">{group.description}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="chat-sidebar-section">
        <p className="chat-sidebar-title">Direct messages</p>
        {!hasUsers && !isLoading && <p className="chat-sidebar-empty">No teammates yet.</p>}
        {hasUsers && (
          <ul className="chat-sidebar-list">
            {users.map((user) => {
              const isActive = activeTarget?.type === 'dm' && activeTarget?.username === user.username;
              return (
                <li key={user.username}>
                  <button
                    type="button"
                    className={buildClassName('chat-option', isActive)}
                    onClick={() => onSelect?.({ type: 'dm', username: user.username })}
                  >
                    <span className="chat-option-title">{user.username}</span>
                    <span className="chat-option-subtitle">{user.role === 'admin' ? 'Admin' : 'User'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
};

export default ChatSidebar;
