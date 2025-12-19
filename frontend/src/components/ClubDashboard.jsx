import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MAP_URL, FALLBACK_CLUB } from "../constants.js";
import Modal from "./Modal.jsx";
import * as api from "../api.js";

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
    email: club.email,
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

export default function ClubDashboard({
  events,
  onCreateEvent,
  club,
  onUpdateClub,
}) {
  const [activeTab, setActiveTab] = useState("events");
  const [clubProfile, setClubProfile] = useState(() => normalizeClub(club));
  const [form, setForm] = useState(() => ({
    title: "",
    date: "",
    category: "",
    address: "",
    city: club?.city || FALLBACK_CLUB.city,
    capacity: 50,
  }));
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [tagHelper, setTagHelper] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [statsEvent, setStatsEvent] = useState(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const tagTimer = useRef(null);

  useEffect(() => {
    const normalized = normalizeClub(club);
    setClubProfile(normalized);
    setForm((previous) => ({
      ...previous,
      city: normalized.city || previous.city,
    }));
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

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    events.forEach((event) => {
      if (event.category) {
        categories.add(event.category);
      }
    });
    return Array.from(categories).slice(0, 8);
  }, [events]);

  const filteredTagSuggestions = useMemo(() => {
    return tagSuggestions.filter((suggestion) => {
      const name = parseSuggestion(suggestion).toLowerCase();
      return !selectedTags.some(
        (existing) => existing.toLowerCase() === name
      );
    });
  }, [tagSuggestions, selectedTags]);

  function getClubName(event) {
    if (event.club && event.club.name) return event.club.name;
    return event.club || "-";
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleSelectCategory(value) {
    setForm((previous) => ({ ...previous, category: value }));
  }

  function addTag(name) {
    const normalized = (name || "").trim();
    if (!normalized) return;
    const alreadySelected = selectedTags.some(
      (existing) => existing.toLowerCase() === normalized.toLowerCase()
    );
    if (alreadySelected) {
      setTagHelper("Bu etiket zaten eklendi.");
      return;
    }
    setSelectedTags((previous) => [...previous, normalized]);
    setTagHelper("");
  }

  function parseSuggestion(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.name || "";
  }

  function attemptTagAdd() {
    const query = (tagInput || "").trim().toLowerCase();
    if (!query) {
      setTagHelper("Etiket arayın veya önerilerden seçin.");
      return;
    }
    const match =
      tagSuggestions.find(
        (item) => parseSuggestion(item).toLowerCase() === query
      ) ||
      tagSuggestions.find((item) =>
        parseSuggestion(item).toLowerCase().includes(query)
      );
    if (!match) {
      setTagHelper("Lütfen önerilen bir etiketi seçin.");
      return;
    }
    addTag(parseSuggestion(match));
    setTagInput("");
  }

  function handleTagInputKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      attemptTagAdd();
    }
  }

  function handleTagSuggestionClick(item) {
    addTag(parseSuggestion(item));
    setTagInput("");
  }

  function removeTag(tag) {
    setSelectedTags((previous) =>
      previous.filter((existing) => existing !== tag)
    );
  }

  useEffect(() => {
    if (tagTimer.current) {
      clearTimeout(tagTimer.current);
    }
    const query = (tagInput || "").trim();
    if (!query) {
      setTagSuggestions([]);
      return;
    }

    tagTimer.current = window.setTimeout(async () => {
      try {
        const res = await api.getTags(query);
        const formatted = Array.isArray(res)
          ? res
              .map((item) => ({ name: parseSuggestion(item) }))
              .filter((item) => item.name)
          : [];
        setTagSuggestions(formatted.slice(0, 8));
      } catch (err) {
        console.warn("Tag suggestions failed", err);
        setTagSuggestions([]);
      }
    }, 250);

    return () => {
      if (tagTimer.current) {
        clearTimeout(tagTimer.current);
        tagTimer.current = null;
      }
    };
  }, [tagInput]);

  async function handleSubmit(event) {
    event.preventDefault();
    setInfo("");
    setError("");
    const title = (form.title || "").trim();
    const category = (form.category || "").trim();
    const city = (form.city || "").trim();

    if (!title || !form.date || !category) {
      setError("Lütfen zorunlu alanları doldurunuz.");
      return;
    }
    if (!city) {
      setError("Etkinliğin yapılacağı şehir zorunludur.");
      return;
    }
    const capacityNumber = Number(form.capacity) || 0;
    const hasAddress = (form.address || "").trim();
    const mapUrl = hasAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          hasAddress
        )}`
      : DEFAULT_MAP_URL;
    try {
      const payload = {
        title,
        date: form.date,
        category,
        city,
        university: clubProfile.university,
        capacity: capacityNumber > 0 ? capacityNumber : 50,
        map_url: mapUrl,
        club_id: clubProfile.id,
        tag_names: selectedTags,
      };
      await onCreateEvent?.(payload);
      setInfo("Etkinlik eklendi.");
      setForm((previous) => ({
        ...previous,
        title: "",
        date: "",
        category: "",
        address: "",
        capacity: 50,
        city: clubProfile.city,
      }));
      setSelectedTags([]);
      setTagInput("");
      setTagSuggestions([]);
      setTagHelper("");
    } catch (submitError) {
      setError(
        submitError.message ||
          "Etkinlik kaydedilirken bir sorun meydana geldi."
      );
    }
  }

  function openMapPreview() {
    const query =
      (form.address || "").trim() ||
      `${form.city || clubProfile.city} ${form.title || clubProfile.name || "kulüp etkinliği"}`.trim();
    const url = query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          query
        )}`
      : DEFAULT_MAP_URL;
    window.open(url, "event-location", "width=900,height=600");
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setClubProfile((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSaveProfile() {
    setProfileMessage("");
    setProfileError(false);
    setIsSavingProfile(true);
    try {
      const payload = {
        name: clubProfile.name,
        university: clubProfile.university,
        city: clubProfile.city,
        description: clubProfile.description,
        email: clubProfile.email,
      };
      const response = await api.updateClub(clubProfile.id, payload);
      const updatedClub = response?.club || response;
      const normalized = normalizeClub(updatedClub);
      setClubProfile(normalized);
      setProfileMessage("Kulüp bilgileri kaydedildi.");
      setProfileError(false);
      onUpdateClub?.(updatedClub);
    } catch (err) {
      setProfileMessage(err.message || "Güncelleme başarısız.");
      setProfileError(true);
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleResetProfile() {
    const normalized = normalizeClub(club);
    setClubProfile(normalized);
    setProfileMessage("");
    setProfileError(false);
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
                        <div className="tag-selected">
                          {tags.map((tag) => (
                            <span key={`${event.id}-${tag}`} className="tag-chip">
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
                <div className="category-suggestion-bar">
                  {categoryOptions.length === 0 ? (
                    <span className="helper-text">
                      Henüz önerilen kategori yok.
                    </span>
                  ) : (
                    categoryOptions.map((option) => (
                      <button
                        type="button"
                        key={option}
                        className={`category-chip ${
                          form.category === option ? "active" : ""
                        }`}
                        onClick={() => handleSelectCategory(option)}
                      >
                        {option}
                      </button>
                    ))
                  )}
                </div>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Teknoloji / Kariyer / Sosyal ..."
                />

                <label>Şehir *</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Örn: İstanbul"
                />

                <label>Adres</label>
                <div className="address-input-row">
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Örn: Galatasaray Üniversitesi, Beyoğlu"
                  />
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={openMapPreview}
                  >
                    Haritada gör
                  </button>
                </div>

                <label>Kapasite (kişi)</label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Örn: 50"
                />

                <label>Etiketler (opsiyonel)</label>
                <div className="tag-input-wrapper">
                  <input
                    name="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Etiket ara veya önerilerden seç"
                  />
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={attemptTagAdd}
                  >
                    Ekle
                  </button>
                </div>
                {tagHelper && <p className="helper-text">{tagHelper}</p>}
                {filteredTagSuggestions.length > 0 && (
                  <div className="tag-suggestions">
                    {filteredTagSuggestions.map((suggestion, index) => (
                      <button
                        type="button"
                        key={`${suggestion.name}-${index}`}
                        className="tag-suggestion"
                        onClick={() => handleTagSuggestionClick(suggestion)}
                      >
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                )}
                {selectedTags.length > 0 && (
                  <div className="tag-selected">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 8,
                    marginBottom: 8,
                  }}
                >
                  Bu etkinlik{" "}
                  <strong>
                    {clubProfile.university} – {clubProfile.name},{" "}
                    {form.city || clubProfile.city}
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

              <label>Sorumlu Hoca E-posta</label>
              <input
                name="email"
                type="email"
                value={clubProfile.email || ""}
                onChange={handleProfileChange}
                placeholder="Örn: hoca@gsu.edu.tr"
              />

              <label>Kulüp Açıklaması</label>
              <textarea
                name="description"
                value={clubProfile.description || ""}
                onChange={handleProfileChange}
                placeholder="Kulübünüzün amacı, düzenlediği etkinlikler vb."
              ></textarea>

              <div className="profile-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={handleResetProfile}
                  disabled={isSavingProfile}
                >
                  Sıfırla
                </button>
              </div>
              {profileMessage && (
                <p
                  style={{
                    fontSize: 12,
                    color: profileError ? "#dc2626" : "#16a34a",
                    marginTop: 4,
                  }}
                >
                  {profileMessage}
                </p>
              )}

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
