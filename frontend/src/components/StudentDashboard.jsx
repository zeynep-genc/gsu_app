import { useCallback, useMemo, useState, useEffect } from "react";
import { DEFAULT_MAP_URL, CLASS_LEVEL_OPTIONS } from "../constants.js";
import Modal from "./Modal.jsx";
import * as api from "../api.js";

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

function getGradeLabel(value) {
  const v = value === undefined || value === null ? null : Number(value);
  if (v === null || Number.isNaN(v)) {
    return "Seçiniz";
  }
  const opt = CLASS_LEVEL_OPTIONS.find((o) => Number(o.value) === v);
  if (opt) return opt.label;
  return `${v}. sınıf`;
}

const PARTICIPATION_STATUS_LABELS = {
  confirmed: "Onaylandı",
  waitlisted: "Beklemede",
};

function getParticipationStatusLabel(status) {
  return PARTICIPATION_STATUS_LABELS[status] || status;
}

export default function StudentDashboard({
  events,
  favorites,
  onToggleFavorite,
  onJoinEvent,
  loading,
  student,
  onUpdateStudent,
  recommendations = [],
  recommendationNotice = "",
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [customTags, setCustomTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  let suggestionTimer = null;
  useEffect(()=>{
    console.debug('Recommendations prop length:', (recommendations||[]).length);
  }, [recommendations]);
  useEffect(() => {
    setForm({
      username: student?.username || "",
      email: student?.email || "",
      university: student?.university || "",
      department: student?.department || "",
      grade: student?.grade || "",
      tagNames: (student?.interests || []).map((t) => (t.name ? t.name : t)).join(", "),
      password: "",
    });
    // initialize tag list
    const initialTags = (student?.interests || []).map((t) => (t.name ? t.name : t));
    // assume all existing interests are selected (we won't retroactively split suggested/custom)
    setTags(initialTags);
    setCustomTags([]);
  }, [student]);
 

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSaveProfile() {
    try {
      const payload = {
        username: form.username,
        university: form.university,
        department: form.department,
        grade: Number(form.grade),
      };
      if (form.password) payload.password = form.password;
      // prepare tag_names from suggested tags + custom tags
      payload.tag_names = [...tags, ...customTags].map((t) => (typeof t === "string" ? t.trim() : String(t).trim())).filter(Boolean);

      const updated = await api.updateStudent(student.id, payload);
      // updated is the student object or API wrapper; our backend returns {message, student}
      const newStudent = updated.student || updated;
      if (onUpdateStudent) onUpdateStudent(newStudent);
      setIsEditing(false);
    } catch (err) {
      console.error("Profil güncellenemedi:", err);
      alert("Profil güncellenemedi: " + (err.message || err));
    }
  }

  function addTag(raw) {
    const candidate = (raw || "").trim();
    if (!candidate) return;
    // must match one of the current suggestions to be added via main input
    const match = suggestions.find((s) => s.name && s.name.toLowerCase() === candidate.toLowerCase());
    if (!match) {
      alert("Bu etiket önerilerde bulunamadı. Lütfen özel etiket alanından ekleyin.");
      return;
    }
    const tag = match.name.trim().toLowerCase();
    if (tag.length > 30) {
      alert("Etiket çok uzun (maks 30 karakter).");
      return;
    }
    if (tags.includes(tag) || customTags.includes(tag)) {
      alert("Etiket zaten eklendi.");
      return;
    }
    if (tags.length + customTags.length >= 10) {
      alert("Maksimum 10 etiket ekleyebilirsiniz.");
      return;
    }
    setTags((t) => [...t, tag]);
    setTagInput("");
  }

  function addCustomTag(raw) {
    const tag = (raw || "").trim().toLowerCase();
    if (!tag) return;
    if (tag.length > 30) {
      alert("Etiket çok uzun (maks 30 karakter).");
      return;
    }
    if (tags.includes(tag) || customTags.includes(tag)) {
      alert("Etiket zaten eklendi.");
      return;
    }
    if (tags.length + customTags.length >= 10) {
      alert("Maksimum 10 etiket ekleyebilirsiniz.");
      return;
    }
    setCustomTags((c) => [...c, tag]);
    setCustomTag("");
  }

  function removeTag(index) {
    setTags((t) => t.filter((_, i) => i !== index));
  }

  function removeCustomTag(index) {
    setCustomTags((t) => t.filter((_, i) => i !== index));
  }

  function handleTagInputKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  useEffect(() => {
    // debounce fetching suggestions
    if (suggestionTimer) clearTimeout(suggestionTimer);
    if (!tagInput || tagInput.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestionTimer = setTimeout(async () => {
      try {
        const res = await api.getTags(tagInput);
        // res may be array of objects or strings
        const items = Array.isArray(res)
          ? res.map((r) => (typeof r === "string" ? { name: r } : { id: r.id, name: r.name }))
          : [];
        setSuggestions(items.slice(0, 10));
        setShowSuggestions(true);
      } catch (err) {
        console.warn("Tag suggestions failed", err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => {
      if (suggestionTimer) clearTimeout(suggestionTimer);
    };
  }, [tagInput]);

  const [activeTab, setActiveTab] = useState("events");
  const [selectedCategory, setSelectedCategory] = useState("Hepsi");
  const [selectedUniversity, setSelectedUniversity] = useState("Hepsi");
  const [selectedCity, setSelectedCity] = useState("Hepsi");
  // recommendation-specific filters (separate from main event filters)
  const [recCategory, setRecCategory] = useState("Hepsi");
  const [recUniversity, setRecUniversity] = useState("Hepsi");
  const [recCity, setRecCity] = useState("Hepsi");
  const [detailEvent, setDetailEvent] = useState(null);
  const [clubDetailsEvent, setClubDetailsEvent] = useState(null);
  const [joinResult, setJoinResult] = useState(null);
  const [mapEvent, setMapEvent] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [participationError, setParticipationError] = useState("");
  const loadParticipations = useCallback(async () => {
    if (!student?.id) {
      setParticipations([]);
      setParticipationError("");
      return;
    }
    try {
      const response = await api.getParticipations(student.id);
      setParticipations(response?.participations || []);
      setParticipationError("");
    } catch (err) {
      console.warn("Katılımlar alınamadı.", err);
      setParticipations([]);
      setParticipationError("Katıldığınız etkinlikler görünmüyor.");
    }
  }, [student?.id]);

  useEffect(() => {
    loadParticipations();
  }, [loadParticipations]);

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

  const filteredRecommendations = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return [];
    return recommendations.filter((event) => {
      if (recCategory !== "Hepsi" && event.category !== recCategory) return false;
      const university = event.university || event.club?.university;
      if (recUniversity !== "Hepsi" && university !== recUniversity) return false;
      const city = event.city || event.club?.city;
      if (recCity !== "Hepsi" && city !== recCity) return false;
      return true;
    });
  }, [recommendations, recCategory, recUniversity, recCity]);

  const recCategories = useMemo(() => {
    if (!recommendations) return ["Hepsi"];
    const list = Array.from(new Set(recommendations.map((e) => e.category))).filter(Boolean);
    return ["Hepsi", ...list];
  }, [recommendations]);

  const recUniversities = useMemo(() => {
    if (!recommendations) return ["Hepsi"];
    const list = Array.from(new Set(recommendations.map((e) => e.university || e.club?.university))).filter(Boolean);
    return ["Hepsi", ...list];
  }, [recommendations]);

  const recCities = useMemo(() => {
    if (!recommendations) return ["Hepsi"];
    const list = Array.from(new Set(recommendations.map((e) => e.city || e.club?.city))).filter(Boolean);
    return ["Hepsi", ...list];
  }, [recommendations]);

  const participationEntries = useMemo(() => {
    return participations
      .filter((participation) => participation?.event)
      .sort((a, b) => {
        const aTime = new Date(a.event?.date).getTime();
        const bTime = new Date(b.event?.date).getTime();
        return Number.isFinite(bTime) && Number.isFinite(aTime)
          ? bTime - aTime
          : 0;
      });
  }, [participations]);

  const participatedEvents = useMemo(
    () => participationEntries.map((entry) => entry.event),
    [participationEntries]
  );

  const pastParticipatedEvents = useMemo(() => {
    const now = Date.now();
    return participatedEvents.filter((event) => {
      const time = new Date(event?.date).getTime();
      return Number.isFinite(time) && time <= now;
    });
  }, [participatedEvents]);

  useEffect(()=>{
    console.debug('Filters:', {selectedCategory, selectedUniversity, selectedCity, filteredRecommendationsCount: filteredRecommendations.length});
  }, [selectedCategory, selectedUniversity, selectedCity, filteredRecommendations.length]);

  const recommended = (filteredRecommendations && filteredRecommendations.length > 0) ? filteredRecommendations.slice(0, 3) : [];
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
      await loadParticipations();
    } catch (error) {
      setJoinResult({
        title: "Katılım isteği gönderilemedi",
        message: error.message || "Lütfen daha sonra tekrar deneyiniz.",
      });
    }
  }

  const studentInfo = student || {};
  const gradeLabel = getGradeLabel(studentInfo.grade);

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
              {gradeLabel}
              {!["Seçiniz", "Hazırlık"].includes(gradeLabel) && ". sınıf"}
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
            {!isEditing ? (
              <>
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
                  <div>{getGradeLabel(studentInfo.grade)}</div>
                </div>
                <div>
                  <label>Şifre</label>
                  <div>********</div>
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <label>İlgi Alanları</label>
                  <div>
                    {(studentInfo.interests || []).length === 0
                      ? "Henüz ilgi alanı eklenmemiş."
                      : (studentInfo.interests || []).map((t) => (
                          <span key={t.id || t} className="tag-chip">
                            {t.name || t}
                          </span>
                        ))}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
                  <button className="btn" onClick={() => setIsEditing(true)}>
                    Profili Düzenle
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>Kullanıcı adı</label>
                  <input value={form.username || ""} onChange={(e) => updateField("username", e.target.value)} />
                </div>
                <div>
                  <label>E-posta</label>
                  <div>{studentInfo.email || "-"}</div>
                </div>
                <div>
                  <label>Üniversite</label>
                  <input value={form.university || ""} onChange={(e) => updateField("university", e.target.value)} />
                </div>
                <div>
                  <label>Bölüm</label>
                  <input value={form.department || ""} onChange={(e) => updateField("department", e.target.value)} />
                </div>
                <div>
                  <label>Sınıf</label>
                  <select value={form.grade ?? ""} onChange={(e) => updateField("grade", e.target.value)}>
                    <option value="">Seçiniz</option>
                    {CLASS_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Yeni Şifre (isteğe bağlı)</label>
                  <input type="password" value={form.password || ""} onChange={(e) => updateField("password", e.target.value)} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>İlgi Alanları</label>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Selected tags row */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minHeight: 42 }}>
                        {tags.map((t, i) => (
                          <span key={`${t}-${i}`} className="tag-chip">
                            {t}
                            <button
                              onClick={() => removeTag(i)}
                              style={{ marginLeft: 6, border: 'none', background: 'transparent', cursor: 'pointer' }}
                              aria-label={`remove-${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {customTags.map((t, i) => (
                          <span key={`custom-${t}-${i}`} className="tag-chip">
                            {t}
                            <button
                              onClick={() => removeCustomTag(i)}
                              style={{ marginLeft: 6, border: 'none', background: 'transparent', cursor: 'pointer' }}
                              aria-label={`remove-custom-${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                    {/* Recommendation input row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          placeholder="Yeni etiket ekle (sadece öneriler)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onFocus={() => setShowSuggestions(true)}
                          onKeyDown={handleTagInputKeyDown}
                          style={{ width: '100%', minWidth: 160 }}
                        />
                        <button className="btn small" onClick={() => addTag(tagInput)} style={{ position: 'absolute', right: 6, top: 6 }}>Ekle</button>
                        {showSuggestions && suggestions.length > 0 && (
                          <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)', zIndex: 9999, maxHeight: 220, overflowY: 'auto', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 4, borderRadius: 8 }}>
                            {suggestions.map((s, i) => (
                              <div key={s.id || `${s.name}-${i}`} style={{ padding: 8, cursor: 'pointer', borderRadius: 6 }} onMouseDown={(ev) => { ev.preventDefault(); addTag(s.name); setShowSuggestions(false); setTagInput(''); }} onMouseEnter={(e)=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                                {s.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* explanatory note above custom tag input */}
                    <div style={{ fontSize: 13, color: '#374151' }}>Eğer istediğiniz ilgi alanı listede yoksa, aşağıdan kendiniz ekleyebilirsiniz (isteğe bağlı).</div>

                    {/* Custom tag row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input placeholder="Özel etiket (isteğe bağlı)" value={customTag} onChange={(e) => setCustomTag(e.target.value)} style={{ minWidth: 160, flex: 1 }} />
                      <button className="btn small" onClick={() => addCustomTag(customTag)}>Özel ekle</button>
                    </div>

                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                      En fazla 10 etiket; her etiket 30 karakterden kısa olmalıdır.
                    </div>
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: 12, display: "flex", gap: 8 }}>
                  <button className="btn" onClick={handleSaveProfile}>Kaydet</button>
                  <button className="btn secondary" onClick={() => setIsEditing(false)}>İptal</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="dashboard-layout">
        <div className="left-stack">
          <div className="card participation-card">
            <div className="section-title">Katılım İsteklerim</div>
            <p className="helper-text" style={{ margin: "4px 0 12px" }}>
              Gönderilen katılım talepleri burada listelenir, yanında güncel durum görünür.
            </p>
            {participationEntries.length === 0 ? (
              <p className="empty">
                Henüz katılım isteği göndermediniz.
              </p>
            ) : (
              <div className="participation-list">
                {participationEntries.map((entry) => {
                  const event = entry.event || {};
                  const waitingLabel =
                    entry.status === "waitlisted" && getWaiting(event)
                      ? ` (${getWaiting(event)} kişi)`
                      : "";
                  return (
                    <div key={entry.id} className="participation-item">
                      <div>
                        <strong>{event.title}</strong>
                        <p className="event-meta" style={{ margin: "4px 0 2px" }}>
                          {event.date} · {event.category}
                        </p>
                        <p className="event-meta" style={{ margin: 0 }}>
                          {(event.university || event.club?.university) ?? "-"} ·{" "}
                          {(event.city || event.club?.city) ?? "-"}
                        </p>
                      </div>
                      <div className="participation-actions">
                        <button
                          className="btn small secondary"
                          onClick={() => setDetailEvent(event)}
                        >
                          Detay
                        </button>
                        <span
                          className={`status-pill status-${entry.status}`}
                          role="status"
                        >
                          {getParticipationStatusLabel(entry.status)}
                          {waitingLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {participationError && (
              <p className="helper-text" style={{ color: "#dc2626", marginTop: 8 }}>
                {participationError}
              </p>
            )}
          </div>
          <div className="card past-events-card">
            <div className="section-title">Geçmiş Katıldığım Etkinlikler</div>
            {pastParticipatedEvents.length === 0 ? (
              <p className="empty">Henüz katıldığınız etkinlik yok.</p>
            ) : (
              <div className="past-events-list">
                {pastParticipatedEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="past-event-item">
                    <div>
                      <strong>{event.title}</strong>
                      <p className="event-meta" style={{ margin: "4px 0 2px" }}>
                        {event.date} · {event.category}
                      </p>
                      <p className="event-meta" style={{ margin: 0 }}>
                        {(event.university || event.club?.university) ?? "-"} ·{" "}
                        {(event.city || event.club?.city) ?? "-"}
                      </p>
                    </div>
                    {getEventTags(event).length > 0 && (
                      <div className="tag-selected" style={{ marginTop: 6 }}>
                        {getEventTags(event).map((tag) => (
                          <span key={`${event.id}-${tag}`} className="tag-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {pastParticipatedEvents.length > 6 && (
                  <p className="helper-text">
                    +{pastParticipatedEvents.length - 6} diğer etkinlik
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
          <div className="right-stack">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div className="section-title">Önerilen Etkinlikler</div>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                    İlgi alanlarınıza uygun olarak listelenmiş bazı öne çıkan etkinlikler.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>Kategori:</span>
                  <select value={recCategory} onChange={(e) => setRecCategory(e.target.value)}>
                    {recCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12 }}>Üniversite:</span>
                  <select value={recUniversity} onChange={(e) => setRecUniversity(e.target.value)}>
                    {recUniversities.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12 }}>Şehir:</span>
                  <select value={recCity} onChange={(e) => setRecCity(e.target.value)}>
                    {recCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {loading ? (
                <p>Etkinlikler yükleniyor...</p>
              ) : recommended.length === 0 ? (
                <p className="empty">
                  {recommendationNotice ||
                    "İlgi alanı veya geçmiş katıldığın etkinlikler üzerinden öneri alınamıyor."}
                </p>
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
                          <div className="tag-selected">
                            {tags.map((tag) => (
                              <span key={`${event.id}-${tag}`} className="tag-chip">
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
                          <div className="tag-selected">
                            {tags.map((tag) => (
                              <span key={`${event.id}-${tag}`} className="tag-chip">
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
                          <div className="tag-selected">
                            {tags.map((tag) => (
                              <span key={`${event.id}-${tag}`} className="tag-chip">
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
          </div>
        </div>
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
