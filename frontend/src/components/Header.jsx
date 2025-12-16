export default function Header({ view, onLogout }) {
  return (
    <header>
      <div>
        <h1>UniConnect</h1>
        <span className="subtitle">
          Türkiye üniversite kulüp ve etkinlik yönetim platformu
        </span>
      </div>
      <div className="right">
        {view === "login" ? (
          <span style={{ fontSize: 12 }}>Giriş yapılmadı</span>
        ) : (
          <>
            <span style={{ fontSize: 12 }}>
              Oturum:{" "}
              <strong>{view === "student" ? "Öğrenci" : "Kulüp Temsilcisi"}</strong>
            </span>
            <button onClick={onLogout}>Çıkış</button>
          </>
        )}
      </div>
    </header>
  );
}
