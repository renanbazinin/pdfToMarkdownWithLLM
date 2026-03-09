export default function TopBar({ title, badge, scrollPercent }) {
  return (
    <div className="topbar">
      <h2>{title || 'בחר הרצאה מהתפריט'}</h2>
      <div className="topbar-right">
        {badge && <span className="badge">{badge}</span>}
        {scrollPercent != null && (
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${scrollPercent}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
