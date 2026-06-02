// src/components/StarRating.jsx
//
// Two modes:
//   display mode  → shows filled/empty stars for a rating value (read-only)
//   input mode    → lets user click to select a rating (interactive)
//
// We build one component that handles both to avoid duplication

const StarRating = ({ rating = 0, onRate = null, size = '1.2rem' }) => {
  // onRate is a callback — if provided, stars are clickable (input mode)
  // if not provided, stars are read-only (display mode)
  const interactive = typeof onRate === 'function';

  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => interactive && onRate(star)}
          style={{
            fontSize:   size,
            cursor:     interactive ? 'pointer' : 'default',
            color:      star <= Math.round(rating) ? '#f59e0b' : '#d1d5db',
            // Slightly scale up on hover in interactive mode
            transition: 'transform 0.1s',
            userSelect: 'none', // prevent text selection on rapid clicks
          }}
          // Accessibility: make interactive stars keyboard-accessible
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={(e) => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              onRate(star);
            }
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;