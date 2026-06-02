// A simple loading spinner shown while API calls are in flight

const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: '20px', md: '40px', lg: '60px' };
  const dim = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{
        width:  dim, height: dim,
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Spinner;