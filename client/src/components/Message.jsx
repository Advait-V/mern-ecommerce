// Displays success, error, warning, or info messages
// type: 'success' | 'error' | 'warning' | 'info'

const STYLES = {
  success: { bg: '#d1fae5', border: '#6ee7b7', color: '#065f46' },
  error:   { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b' },
  warning: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e' },
  info:    { bg: '#dbeafe', border: '#93c5fd', color: '#1e40af' },
};

const Message = ({ type = 'info', children }) => {
  const s = STYLES[type] || STYLES.info;
  return (
    <div style={{
      backgroundColor: s.bg,
      border:  `1px solid ${s.border}`,
      color:   s.color,
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      fontSize: '0.95rem',
    }}>
      {children}
    </div>
  );
};

export default Message;