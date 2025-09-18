import { useEffect, useMemo, useRef, useState } from 'react';

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatWindow = ({
  currentUser,
  conversation,
  messages,
  isLoading,
  isSending,
  onSend,
  error,
  hasSelection,
  rosterLoading,
}) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const currentUsername = currentUser?.username;

  const conversationTitle = useMemo(() => {
    if (!conversation) {
      return 'Select a conversation';
    }
    if (conversation.name) {
      return conversation.name;
    }
    if (conversation.type === 'dm' && Array.isArray(conversation.participants)) {
      const other = conversation.participants.find((name) => name !== currentUsername);
      return other || 'Direct message';
    }
    return 'Conversation';
  }, [conversation, currentUsername]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading, conversation?.id]);

  useEffect(() => {
    setDraft('');
  }, [conversation?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) {
      return;
    }
    try {
      await onSend?.(trimmed);
      setDraft('');
    } catch (err) {
      // Keep the draft so the user can retry.
    }
  };

  const showComposer = Boolean(hasSelection && !rosterLoading);

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div>
          <h3>{conversationTitle}</h3>
          {conversation?.type === 'group' && conversation?.description && (
            <p className="chat-window-subtitle">{conversation.description}</p>
          )}
          {conversation?.type === 'dm' && conversation?.participants && (
            <p className="chat-window-subtitle">Private conversation</p>
          )}
        </div>
      </div>

      <div className="chat-message-board" ref={listRef}>
        {isLoading && <div className="chat-loading">Loading messages…</div>}
        {!isLoading && messages.length === 0 && hasSelection && (
          <div className="chat-empty-state">Start the conversation with your first message.</div>
        )}
        {!isLoading && !hasSelection && !rosterLoading && (
          <div className="chat-empty-state">Choose a conversation to start chatting.</div>
        )}
        {!isLoading && !hasSelection && rosterLoading && (
          <div className="chat-empty-state">Preparing your chat roster…</div>
        )}
        {!isLoading &&
          messages.map((message) => {
            const isOwnMessage = message.sender === currentUsername;
            return (
              <div
                key={message.id}
                className={`chat-message ${isOwnMessage ? 'outgoing' : 'incoming'}`}
              >
                <div className="chat-meta">
                  <span className="chat-meta-sender">{isOwnMessage ? 'You' : message.sender}</span>
                  {message.timestamp && (
                    <span className="chat-meta-time">{formatTimestamp(message.timestamp)}</span>
                  )}
                </div>
                <div className="chat-bubble">{message.content}</div>
              </div>
            );
          })}
      </div>

      {error && <div className="chat-error" role="alert">{error}</div>}

      {showComposer && (
        <form className="chat-composer" onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={conversation ? 'Type your message…' : 'Select a conversation to chat'}
            disabled={!conversation || isSending}
            rows={2}
          />
          <button type="submit" className="button chat-send-button" disabled={!draft.trim() || isSending}>
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}

      {!showComposer && !rosterLoading && (
        <div className="chat-composer-placeholder">Invite teammates to start a conversation.</div>
      )}
    </div>
  );
};

export default ChatWindow;
