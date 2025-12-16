import { useEffect, useMemo, useState } from "react";
import { DEFAULT_MAP_URL, FALLBACK_CLUB } from "../constants.js";
import Modal from "./Modal.jsx";

function normalizeClub(club) {
  if (!club) {
    return { ...FALLBACK_CLUB };
  }
  return {
    id: club.id,
    name: club.name,
    university: club.university,
    city: club.city,
    description: club.description,
  };
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

export default function ClubDashboard({ events, onCreateEvent, club }) {
  const [activeTab, setActiveTab] = useState("events");
  const [clubProfile, setClubProfile] = useState(normalizeClub(club));
  const [form, setForm] = useState({
    title: "",
    date: "",
    category: "",
    mapUrl: "",
    tags: "",
    capacity: 50,
  });
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [statsEvent, setStatsEvent] = useState(null);

  useEffect(() => {
    setClubProfile(normalizeClub(club));
  }, [club]);

  const clubEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.club && event.club.id) {
        return event.club.id === clubProfile.id;
      }
      return (
        getClubName(event) === clubProfile.name &&
        (event.university || event.club?.university) === clubProfile.university
      );
    });
  }, [events, clubProfile]);

  function getClubName(event) {
    if (event.club && event.club.name) return event.club.name;
    return event.club || "-";
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setInfo("");
    setError("");
    if (!form.title || !form.date || !form.category) {
      setError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }
    const capacityNumber = Number(form.capacity) || 0;
    try {
      const payload = {
        title: form.title,
        date: form.date,
        category: form.category,
        city: clubProfile.city,
        university: clubProfile.university,
        capacity: capacityNumber > 0 ? capacityNumber : 50,
        map_url: form.mapUrl || DEFAULT_MAP_URL,
        club_id: clubProfile.id,
        tag_names: form.tags
          ? form.tags.split(",").map((tag) => tag.trim())
          : [],
      };
      await onCreateEvent?.(payload);
      setInfo("Etkinlik eklendi.");
      setForm({
        title: "",
        date: "",
        category: "",
        mapUrl: "",
        tags: "",
        capacity: 50,
      });
    } catch (submitError) {
      setError(
        submitError.message ||
          "Etkinlik kaydedilirken bir sorun meydana geldi."
      );
    }
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setClubProfile((previous) => ({ ...previous, [name]: value }));
  }

  if (!clubProfile?.id) {
    return (
      <main>
        <div className="card">
          <h2>Kulüp bilgilerine ulaşılamadı.</h2>
          <p>
            Lütfen kulüp temsilcisi hesabınızla giriş yapın ya da demo verilerini
            yükleyin.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="sidebar-layout">
        <div className="sidebar">
          <h3>Kulüp Paneli</h3>
          <button
            className={activeTab === "events" ? "active" : ""}
            onClick={() => setActiveTab("events")}
          >
            Etkinliklerim
          </button>
          <button
            className={activeTab === "new" ? "active" : ""}
            onClick={() => setActiveTab("new")}
          >
            Yeni Etkinlik Oluştur
          </button>
          <button
            className={activeTab === "info" ? "active" : ""}
            onClick={() => setActiveTab("info")}
          >
            Kulüp Bilgileri
          </button>
        </div>

        <div>
          {activeTab === "events" && (
            <div className="card">
              <div className="section-title">
                Kulüp Etkinlikleri (Kendi Kulübünüz)
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                Bu panel, yalnızca{" "}
                <strong>
                  {clubProfile.university} – {clubProfile.name}
                </strong>{" "}
                adına kayıtlı etkinlikleri gösterir.
              </p>
              {clubEvents.length === 0 ? (
                <p className="empty">
                  Henüz bu kulübe ait etkinlik bulunmuyor. "Yeni Etkinlik
                  Oluştur" sekmesinden etkinlik ekleyebilirsiniz.
                </p>
              ) : (
                <div className="grid cols-2">
                  {clubEvents.map((event) => {
                    const tags = getEventTags(event);
                    return (
                      <div key={event.id} className="event-card">
                        <h3>{event.title}</h3>
                        <div className="event-meta">
                          {event.university || event.club?.university} ·{" "}
                          {event.city || event.club?.city}
                        </div>
                        <div className="event-meta">
                          {event.date} · {event.category}
                        </div>
                        <div>
                          {tags.map((tag) => (
                            <span key={`${event.id}-${tag}`} className="pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                        >
                          Kapasite: {getParticipants(event)}/{event.capacity}{" "}
                          katılımcı
                        </div>
                        <div className="event-footer">
                          <button
                            className="btn small secondary"
                            onClick={() => setStatsEvent(event)}
                          >
                            Katılımcıları görüntüle
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "new" && (
            <div className="card">
              <div className="section-title">Yeni Etkinlik Oluştur</div>
              <p className="info-pill">
                Etkinlikler{" "}
                <strong>
                  {clubProfile.university} – {clubProfile.name}
                </strong>{" "}
                adına oluşturulacaktır.
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginBottom: 12,
                }}
              >
                Etkinlik oluşturulurken kulüp adı, üniversite ve şehir bilgisi
                otomatik olarak kulüp profilinizden alınır. Formda yalnızca
                etkinliğe özel bilgiler girilir.
              </p>
              <form onSubmit={handleSubmit}>
                <label>Etkinlik Adı *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Örn: Veri Bilimi 101"
                />

                <label>Tarih *</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />

                <label>Kategori *</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Teknoloji / Kariyer / Sosyal ..."
                />

                <label>
                  Harita Bağlantısı / Embed Adresi{" "}
                  <span style={{ fontSize: 11, color: "#6b7280" }}>
                    (OpenStreetMap / Google Maps embed veya bağlantı)
                  </span>
                </label>
                <input
                  name="mapUrl"
                  value={form.mapUrl}
                  onChange={handleChange}
                  placeholder="Örn: https://www.openstreetmap.org/export/embed.html?..."
                />

                <label>Kapasite (kişi)</label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Örn: 50"
                />

                <label>Etiketler (virgülle ayırın)</label>
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="yapay zeka, veri bilimi"
                />

                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 4,
                    marginBottom: 8,
                  }}
                >
                  Bu etkinlik{" "}
                  <strong>
                    {clubProfile.university} – {clubProfile.name},{" "}
                    {clubProfile.city}
                  </strong>{" "}
                  adına kaydedilecektir.
                </p>

                <button className="btn" type="submit">
                  Etkinlik ekle
                </button>
                {info && (
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 8,
                      color: "#16a34a",
                    }}
                  >
                    {info}
                  </p>
                )}
                {error && (
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 8,
                      color: "#dc2626",
                    }}
                  >
                    {error}
                  </p>
                )}
              </form>
            </div>
          )}

          {activeTab === "info" && (
            <div className="card">
              <div className="section-title">Kulüp Bilgileri</div>
              <p
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginBottom: 12,
                }}
              >
                Bu bölüm, kulüp temsilcisinin kulüp profili bilgilerini girdiği
                alandır. Öğrenci tarafında "Kulüp Detayı" ekranında bu bilgiler
                gösterilir.
              </p>
              <label>Kulüp Adı</label>
              <input
                name="name"
                value={clubProfile.name}
                onChange={handleProfileChange}
                placeholder="Örn: Endüstri Mühendisliği Kulübü"
              />

              <label>Üniversite</label>
              <input
                name="university"
                value={clubProfile.university}
                onChange={handleProfileChange}
                placeholder="Örn: Galatasaray Üniversitesi"
              />

              <label>Şehir</label>
              <input
                name="city"
                value={clubProfile.city}
                onChange={handleProfileChange}
                placeholder="Örn: İstanbul"
              />

              <label>Kulüp Açıklaması</label>
              <textarea
                name="description"
                value={clubProfile.description || ""}
                onChange={handleProfileChange}
                placeholder="Kulübünüzün amacı, düzenlediği etkinlikler vb."
              ></textarea>

              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 4,
                }}
              >
                Bu bilgiler, oluşturduğunuz etkinliklerde öğrenci tarafında
                "Kulüp Detayı" ekranında gösterilecektir.
              </p>
            </div>
          )}
        </div>
      </div>

      {statsEvent && (
        <Modal
          title="Etkinlik Katılımcı ve Bilgi Özeti"
          onClose={() => setStatsEvent(null)}
        >
          {(() => {
            const capacity = statsEvent.capacity || 0;
            const participants = getParticipants(statsEvent);
            const waiting = getWaiting(statsEvent);
            const remaining = Math.max(capacity - participants, 0);
            const percent =
              capacity > 0
                ? Math.min(100, Math.round((participants / capacity) * 100))
                : 0;
            const isFull = capacity > 0 && participants >= capacity;
            return (
              <>
                <p>
                  <strong>{statsEvent.title}</strong>
                </p>
                <p className="capacity-summary">
                  Kulüp: <strong>{getClubName(statsEvent)}</strong>
                </p>
                <p className="capacity-summary">
                  Üniversite:{" "}
                  <strong>
                    {(statsEvent.university || statsEvent.club?.university) ??
                      "-"}
                  </strong>
                </p>
                <p className="capacity-summary">
                  Şehir:{" "}
                  <strong>
                    {(statsEvent.city || statsEvent.club?.city) ?? "-"}
                  </strong>
                </p>
                <p className="capacity-summary">
                  Tarih: <strong>{statsEvent.date}</strong>
                </p>
                <p className="capacity-summary">
                  Kategori: <strong>{statsEvent.category}</strong>
                </p>
                <p className="capacity-summary">
                  Etiketler:{" "}
                  {getEventTags(statsEvent).length > 0
                    ? getEventTags(statsEvent).join(", ")
                    : "-"}
                </p>

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

                <div className="map-frame" style={{ marginTop: 12 }}>
                  <iframe
                    src={statsEvent.map_url || statsEvent.mapUrl || DEFAULT_MAP_URL}
                    loading="lazy"
                  ></iframe>
                </div>
                <p className="map-caption">
                  Harita, etkinlik oluşturulurken eklenen harita bağlantısına
                  göre görüntülenmektedir.
                </p>
              </>
            );
          })()}
        </Modal>
      )}
    </main>
  );
}
