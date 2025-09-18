import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatSidebar from './ChatSidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import { fetchChatMessages, fetchChatRoster, sendChatMessage } from '../../services/api.js';

const ChatPanel = ({ currentUser }) => {
  const [roster, setRoster] = useState({ users: [], groups: [] });
  const [activeTarget, setActiveTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const currentUsername = currentUser?.username || '';

  const buildTargetKey = (target) => {
    if (!target) {
      return '';
    }
    return target.type === 'dm' ? `dm:${target.username}` : `group:${target.id}`;
  };

  const activeKeyRef = useRef('');

  useEffect(() => {
    activeKeyRef.current = buildTargetKey(activeTarget);
  }, [activeTarget]);

  const loadRoster = useCallback(async () => {
    setIsLoadingRoster(true);
    try {
      const data = await fetchChatRoster();
      setRoster({
        users: Array.isArray(data.users) ? data.users : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
      });
    } catch (err) {
      setError(err.message || 'Unable to load chat roster');
    } finally {
      setIsLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const handleSelect = useCallback(
    (target) => {
      setError('');
      setMessages([]);
      if (target) {
        const participants =
          target.type === 'dm'
            ? [currentUsername, target.username].filter(Boolean)
            : [];
        setConversation({
          id: '',
          type: target.type,
          name: target.name || target.username || '',
          description: target.description,
          participants,
        });
      } else {
        setConversation(null);
      }
      setActiveTarget(target);
    },
    [currentUsername]
  );

  useEffect(() => {
    if (activeTarget) {
      return;
    }
    if (roster.groups.length > 0) {
      handleSelect({
        type: 'group',
        id: roster.groups[0].id,
        name: roster.groups[0].name,
        description: roster.groups[0].description,
      });
      return;
    }
    if (roster.users.length > 0) {
      handleSelect({ type: 'dm', username: roster.users[0].username });
    }
  }, [activeTarget, handleSelect, roster.groups, roster.users]);

  const loadMessages = useCallback(
    async (target, { silent = false } = {}) => {
      if (!target) {
        setMessages([]);
        setConversation(null);
        return false;
      }
      const targetKey = buildTargetKey(target);
      if (!silent) {
        setIsLoadingMessages(true);
        setError('');
      }
      try {
        const params = target.type === 'dm'
          ? { username: target.username }
          : { conversationId: target.id };
        const response = await fetchChatMessages(params);
        if (activeKeyRef.current !== targetKey) {
          return false;
        }
        setMessages(Array.isArray(response.messages) ? response.messages : []);
        setConversation({
          id: response.conversationId,
          type: response.type,
          name: response.name || target.name || target.username || '',
          description: response.description,
          participants: Array.isArray(response.participants) ? response.participants : [],
        });
        return true;
      } catch (err) {
        setError(err.message || 'Unable to load messages');
        return false;
      } finally {
        if (!silent) {
          setIsLoadingMessages(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!activeTarget) {
      return;
    }
    let cancelled = false;

    const fetchNow = async () => {
      const success = await loadMessages(activeTarget);
      if (!success && !cancelled) {
        setConversation(null);
      }
    };

    fetchNow();
    const interval = setInterval(() => {
      loadMessages(activeTarget, { silent: true });
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeTarget, loadMessages]);

  const handleSendMessage = useCallback(
    async (content) => {
      if (!activeTarget) {
        throw new Error('No conversation selected');
      }
      setError('');
      setIsSending(true);
      try {
        if (activeTarget.type === 'dm') {
          await sendChatMessage({ username: activeTarget.username, content });
        } else {
          await sendChatMessage({ conversationId: activeTarget.id, content });
        }
        const refreshed = await loadMessages(activeTarget, { silent: true });
        if (!refreshed) {
          throw new Error('Unable to refresh conversation');
        }
      } catch (err) {
        setError(err.message || 'Unable to send message');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [activeTarget, loadMessages]
  );

  const sidebarUsers = useMemo(() => roster.users, [roster.users]);
  const sidebarGroups = useMemo(() => roster.groups, [roster.groups]);

  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <h2>Team chat</h2>
        <p>Send direct messages or join the public lobby.</p>
      </div>
      <div className="panel-content chat-body">
        <ChatSidebar
          groups={sidebarGroups}
          users={sidebarUsers}
          activeTarget={activeTarget}
          onSelect={handleSelect}
          isLoading={isLoadingRoster}
        />
        <ChatWindow
          currentUser={currentUser}
          conversation={conversation}
          messages={messages}
          isLoading={isLoadingMessages}
          isSending={isSending}
          onSend={handleSendMessage}
          error={error}
          hasSelection={Boolean(activeTarget)}
          rosterLoading={isLoadingRoster}
        />
      </div>
    </div>
  );
};

export default ChatPanel;
