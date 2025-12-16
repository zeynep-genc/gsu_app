import { useMemo, useState } from "react";
import { DEFAULT_MAP_URL } from "../constants.js";
import Modal from "./Modal.jsx";

function getClubName(event) {
  if (!event) return "-";
  if (event.club && event.club.name) return event.club.name;
  return event.club || "-";
}

function getClubDescription(event) {
  if (!event) return "";
  if (event.club && event.club.description) return event.club.description;
  return event.clubDescription || "";
}

function getEventTags(event) {
  if (!event || !event.tags) {
    return [];
  }
  return event.tags.map((tag) => (typeof tag === "string" ? tag : tag.name));
}

function getParticipants(event) {
  return (
    event.participants_count ??
    event.participants ??
    event.participantsCount ??
    0
  );
}

function getWaiting(event) {
  return (
    event.waiting_list_count ??
    event.waiting ??
    event.waitingListCount ??
    0
  );
}

function getMapUrl(event) {
  return event?.map_url || event?.mapUrl || DEFAULT_MAP_URL;
}

export default function StudentDashboard({
  events,
  favorites,
  onToggleFavorite,
  onJoinEvent,
  loading,
  student,
}) {
  const [activeTab, setActiveTab] = useState("events");
  const [selectedCategory, setSelectedCategory] = useState("Hepsi");
  const [selectedUniversity, setSelectedUniversity] = useState("Hepsi");
  const [selectedCity, setSelectedCity] = useState("Hepsi");
  const [detailEvent, setDetailEvent] = useState(null);
  const [clubDetailsEvent, setClubDetailsEvent] = useState(null);
  const [joinResult, setJoinResult] = useState(null);
  const [mapEvent, setMapEvent] = useState(null);

  const categories = useMemo(() => {
    const list = Array.from(new Set(events.map((event) => event.category)));
    return ["Hepsi", ...list];
  }, [events]);

  const universities = useMemo(() => {
    const list = Array.from(
      new Set(events.map((event) => event.university || event.club?.university))
    ).filter(Boolean);
    return ["Hepsi", ...list];
  }, [events]);

  const cities = useMemo(() => {
    const list = Array.from(
      new Set(events.map((event) => event.city || event.club?.city))
    ).filter(Boolean);
    return ["Hepsi", ...list];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (selectedCategory !== "Hepsi" && event.category !== selectedCategory) {
        return false;
      }
      const university = event.university || event.club?.university;
      if (selectedUniversity !== "Hepsi" && university !== selectedUniversity) {
        return false;
      }
      const city = event.city || event.club?.city;
      if (selectedCity !== "Hepsi" && city !== selectedCity) {
        return false;
      }
      return true;
    });
  }, [events, selectedCategory, selectedUniversity, selectedCity]);

  const recommended = filteredEvents.slice(0, 3);
  const favoriteEvents = events.filter((event) => favorites.includes(event.id));

  async function handleJoinClick(event) {
    if (!onJoinEvent) return;
    try {
      const response = await onJoinEvent(event.id);
      setJoinResult({
        title: response.title || "Katılım İsteği",
        message:
          response.message ||
          "Katılım isteğiniz alındı. Kulüp temsilcisi tarafından bilgilendirileceksiniz.",
      });
    } catch (error) {
      setJoinResult({
        title: "Katılım isteği gönderilemedi",
        message: error.message || "Lütfen daha sonra tekrar deneyiniz.",
      });
    }
  }

  const studentInfo = student || {};

  return (
    <main>
      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Hoş geldin, {studentInfo.username || "öğrenci"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {(studentInfo.university || "Üniversite")} ·{" "}
              {(studentInfo.department || "Bölüm")} ·{" "}
              {studentInfo.grade || "-"}
              . sınıf
            </div>
          </div>
          <div className="tab-buttons">
            <button
              className={activeTab === "events" ? "active" : undefined}
              onClick={() => setActiveTab("events")}
            >
              Etkinlikler
            </button>
            <button
              className={activeTab === "profile" ? "active" : undefined}
              onClick={() => setActiveTab("profile")}
            >
              Profilim
            </button>
          </div>
        </div>
      </div>

      {activeTab === "profile" ? (
        <div className="card">
          <div className="section-title">Kullanıcı Bilgileri</div>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Bu sayfada sisteme kayıtlı kullanıcı bilgilerini
            görüntüleyebilirsiniz.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 8,
            }}
          >
            <div>
              <label>Kullanıcı adı</label>
              <div>{studentInfo.username || "-"}</div>
            </div>
            <div>
              <label>E-posta</label>
              <div>{studentInfo.email || "-"}</div>
            </div>
            <div>
              <label>Üniversite</label>
              <div>{studentInfo.university || "-"}</div>
            </div>
            <div>
              <label>Bölüm</label>
              <div>{studentInfo.department || "-"}</div>
            </div>
            <div>
              <label>Sınıf</label>
              <div>{studentInfo.grade || "-"}. sınıf</div>
            </div>
            <div>
              <label>Şifre</label>
              <div>********</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="section-title">Önerilen Etkinlikler</div>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              İlgi alanlarınıza uygun olarak listelenmiş bazı öne çıkan
              etkinlikler.
            </p>
            {loading ? (
              <p>Etkinlikler yükleniyor...</p>
            ) : (
              <div className="grid cols-3">
                {recommended.map((event) => {
                  const tags = getEventTags(event);
                  return (
                    <div key={event.id} className="event-card">
                      <div className="favorite-heart">
                        <button
                          className="icon-btn"
                          title="Favorilere ekle/çıkar"
                          onClick={() => onToggleFavorite(event.id)}
                        >
                          {favorites.includes(event.id) ? "❤️" : "🤍"}
                        </button>
                      </div>
                      <div>
                        <h3>{event.title}</h3>
                        <div className="event-meta">
                          {(event.university || event.club?.university) ?? "-"} ·{" "}
                          {(event.city || event.club?.city) ?? "-"}
                        </div>
                        <div className="event-meta">
                          {getClubName(event)} · {event.date} · {event.category}
                        </div>
                        <div>
                          {tags.map((tag) => (
                            <span key={`${event.id}-${tag}`} className="pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="event-footer">
                        <button
                          className="btn small secondary"
                          onClick={() => setMapEvent(event)}
                        >
                          Haritada gör
                        </button>
                        <button
                          className="btn small secondary"
                          onClick={() => setDetailEvent(event)}
                        >
                          Detay
                        </button>
                        <button
                          className="btn small"
                          onClick={() => handleJoinClick(event)}
                        >
                          Katılım isteği gönder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                gap: 12,
              }}
            >
              <div className="section-title">Tüm Etkinlikler</div>
              <div className="filter-row">
                <span style={{ fontSize: 12 }}>Kategori:</span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 12 }}>Üniversite:</span>
                <select
                  value={selectedUniversity}
                  onChange={(event) =>
                    setSelectedUniversity(event.target.value)
                  }
                >
                  {universities.map((university) => (
                    <option key={university} value={university}>
                      {university}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 12 }}>Şehir:</span>
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p>Etkinlikler yükleniyor...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="empty">
                Seçilen filtrelere uygun etkinlik bulunamadı.
              </p>
            ) : (
              <div className="grid cols-3">
                {filteredEvents.map((event) => {
                  const tags = getEventTags(event);
                  return (
                    <div key={event.id} className="event-card">
                      <div className="favorite-heart">
                        <button
                          className="icon-btn"
                          title="Favorilere ekle/çıkar"
                          onClick={() => onToggleFavorite(event.id)}
                        >
                          {favorites.includes(event.id) ? "❤️" : "🤍"}
                        </button>
                      </div>
                      <div>
                        <h3>{event.title}</h3>
                        <div className="event-meta">
                          {(event.university || event.club?.university) ?? "-"} ·{" "}
                          {(event.city || event.club?.city) ?? "-"}
                        </div>
                        <div className="event-meta">
                          {getClubName(event)} · {event.date} · {event.category}
                        </div>
                        <div>
                          {tags.map((tag) => (
                            <span key={`${event.id}-${tag}`} className="pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="event-footer">
                        <button
                          className="btn small secondary"
                          onClick={() => setMapEvent(event)}
                        >
                          Haritada gör
                        </button>
                        <button
                          className="btn small secondary"
                          onClick={() => setDetailEvent(event)}
                        >
                          Detay
                        </button>
                        <button
                          className="btn small"
                          onClick={() => handleJoinClick(event)}
                        >
                          Katılım isteği gönder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">Favori Etkinliklerim</div>
            {favoriteEvents.length === 0 ? (
              <p className="empty">
                Henüz favorilere eklediğiniz bir etkinlik yok. Kalp ikonuna
                tıklayarak favori ekleyebilirsiniz.
              </p>
            ) : (
              <div className="grid cols-3">
                {favoriteEvents.map((event) => {
                  const tags = getEventTags(event);
                  return (
                    <div key={event.id} className="event-card">
                      <div className="favorite-heart">
                        <button
                          className="icon-btn"
                          title="Favorilerden çıkar"
                          onClick={() => onToggleFavorite(event.id)}
                        >
                          ❤️
                        </button>
                      </div>
                      <div>
                        <h3>{event.title}</h3>
                        <div className="event-meta">
                          {(event.university || event.club?.university) ?? "-"} ·{" "}
                          {(event.city || event.club?.city) ?? "-"}
                        </div>
                        <div className="event-meta">
                          {getClubName(event)} · {event.date} · {event.category}
                        </div>
                        <div>
                          {tags.map((tag) => (
                            <span key={`${event.id}-${tag}`} className="pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="event-footer">
                        <button
                          className="btn small secondary"
                          onClick={() => setMapEvent(event)}
                        >
                          Haritada gör
                        </button>
                        <button
                          className="btn small secondary"
                          onClick={() => setDetailEvent(event)}
                        >
                          Detay
                        </button>
                        <button
                          className="btn small"
                          onClick={() => handleJoinClick(event)}
                        >
                          Katılım isteği gönder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {detailEvent && (
        <Modal title="Etkinlik Detayı" onClose={() => setDetailEvent(null)}>
          <p>
            <strong>{detailEvent.title}</strong>
          </p>
          <p>
            Kulüp: <strong>{getClubName(detailEvent)}</strong>
          </p>
          <p>
            Üniversite:{" "}
            <strong>
              {(detailEvent.university || detailEvent.club?.university) ?? "-"}
            </strong>
          </p>
          <p>
            Şehir:{" "}
            <strong>{(detailEvent.city || detailEvent.club?.city) ?? "-"}</strong>
          </p>
          <p>
            Tarih: <strong>{detailEvent.date}</strong>
          </p>
          <p>
            Kategori: <strong>{detailEvent.category}</strong>
          </p>
          <p>
            Etiketler:{" "}
            {getEventTags(detailEvent).length > 0
              ? getEventTags(detailEvent).join(", ")
              : "-"}
          </p>
          {(() => {
            const capacity = detailEvent.capacity || 0;
            const participants = getParticipants(detailEvent);
            const waiting = getWaiting(detailEvent);
            const remaining = Math.max(capacity - participants, 0);
            const percent =
              capacity > 0
                ? Math.min(100, Math.round((participants / capacity) * 100))
                : 0;
            const isFull = capacity > 0 && participants >= capacity;
            return (
              <>
                <hr style={{ margin: "8px 0", opacity: 0.3 }} />
                <p className="capacity-summary">
                  Toplam kontenjan: <strong>{capacity}</strong> kişi
                </p>
                <p className="capacity-summary">
                  Katılan: <strong>{participants}</strong> kişi
                </p>
                <p className="capacity-summary">
                  Boş kontenjan: <strong>{remaining}</strong> kişi
                </p>
                <p className="capacity-summary">
                  Bekleme listesi: <strong>{waiting}</strong> kişi
                </p>
                <div className="capacity-bar">
                  <div
                    className={"capacity-fill" + (isFull ? " full" : "")}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="capacity-legend">
                  Doluluk oranı: <strong>{percent}%</strong>{" "}
                  {isFull && " (KONTENJAN DOLU)"}
                </div>
              </>
            );
          })()}
          <p style={{ marginTop: 8 }}>
            Bu alan, etkinliğe ait açıklama ve ek bilgilerin görüntüleneceği
            bölümü temsil eder.
          </p>
          <div style={{ marginTop: 10 }}>
            <button
              className="btn small secondary"
              onClick={() => {
                setClubDetailsEvent(detailEvent);
                setDetailEvent(null);
              }}
            >
              Kulüp detayını görüntüle
            </button>
          </div>
        </Modal>
      )}

      {clubDetailsEvent && (
        <Modal title="Kulüp Detayı" onClose={() => setClubDetailsEvent(null)}>
          <p>
            Kulüp Adı: <strong>{getClubName(clubDetailsEvent)}</strong>
          </p>
          <p>
            Üniversite:{" "}
            <strong>
              {(clubDetailsEvent.university ||
                clubDetailsEvent.club?.university) ??
                "-"}
            </strong>
          </p>
          <p>
            Şehir:{" "}
            <strong>
              {(clubDetailsEvent.city || clubDetailsEvent.club?.city) ?? "-"}
            </strong>
          </p>
          <p style={{ marginTop: 8 }}>
            Kulüp Açıklaması:
            <br />
            <span style={{ fontSize: 13 }}>
              {getClubDescription(clubDetailsEvent) ||
                "Kulüp açıklaması henüz eklenmemiştir."}
            </span>
          </p>
        </Modal>
      )}

      {joinResult && (
        <Modal title={joinResult.title} onClose={() => setJoinResult(null)}>
          <p>{joinResult.message}</p>
        </Modal>
      )}

      {mapEvent && (
        <Modal title="Etkinlik Konumu" onClose={() => setMapEvent(null)}>
          <p>
            <strong>{mapEvent.title}</strong> için harita görünümü.
          </p>
          <div className="map-frame">
            <iframe src={getMapUrl(mapEvent)} loading="lazy"></iframe>
          </div>
          <p className="map-caption">
            Harita bağlantısı, etkinliği oluşturan kulüp temsilcisi tarafından
            eklenmektedir.
          </p>
        </Modal>
      )}
    </main>
  );
}
