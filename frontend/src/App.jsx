import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx";
import ClubDashboard from "./components/ClubDashboard.jsx";
import AuthPage from "./components/auth/AuthPage.jsx";
import * as api from "./api.js";
import { FALLBACK_CLUB, FALLBACK_STUDENT } from "./constants.js";
import { MOCK_EVENTS } from "./mockData.js";

const SESSION_KEY = "uniconnect_session";

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {}
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}


export default function App() {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationNotice, setRecommendationNotice] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [view, setView] = useState(() => readSession()?.view || "auth");
  const [student, setStudent] = useState(() => readSession()?.student || null);
  const [club, setClub] = useState(() => readSession()?.club || null);
  const [authMessage, setAuthMessage] = useState("");



  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (student?.id) {
      loadFavorites(student.id);
    } else {
      setFavorites([]);
    }
  }, [student?.id]);

  useEffect(() => {
    async function loadRecs() {
      if (!student?.id) {
        setRecommendations([]);
        setRecommendationNotice("");
        return;
      }
      try {
        const res = await api.getRecommendations(student.id);
        setRecommendations(res?.recommendations || []);
        setRecommendationNotice(res?.message || "");
      } catch (e) {
        console.warn("Failed to load recommendations", e);
        setRecommendations([]);
        setRecommendationNotice("");
      }
    }
    loadRecs();
  }, [student]);
  useEffect(() => {
    saveSession({ view, student, club });
  }, [view, student, club]);


  async function loadEvents() {
    setLoadingEvents(true);
    try {
      const apiEvents = await api.getEvents();
      setEvents(apiEvents);
      setGlobalError("");
    } catch (error) {
      setEvents(MOCK_EVENTS);
      setGlobalError(
        "API erişilemedi. Demo verileri ile çalışma moduna geçildi."
      );
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadFavorites(studentId) {
    if (!studentId) {
      setFavorites([]);
      return;
    }
    try {
      const ids = await api.getFavorites(studentId);
      setFavorites(ids);
    } catch (error) {
      console.warn("Favoriler alınamadı.", error);
      setFavorites([]);
    }
  }

  //auth

  async function handleStudentLogin(credentials) {
    setIsAuthenticating(true);
    try {
      const response = await api.studentLogin(credentials);
      // persist tokens
      try {
        if (response.access) localStorage.setItem("accessToken", response.access);
        if (response.refresh) localStorage.setItem("refreshToken", response.refresh);
      } catch (e) {}

      setStudent(response.student);
      setView("student");
      await loadFavorites(response.student.id);
      // fetch recommendations
      try {
        const rec = await api.getRecommendations(response.student.id);
        console.log("Recommendations:", rec.recommendations);
      } catch (e) {
        console.warn("Recommendations unavailable", e);
      }
    } catch (error) {
      setStudent(null);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleClubLogin(credentials) {
    setIsAuthenticating(true);
    try {
      const response = await api.clubLogin(credentials);
      try {
        if (response.access) localStorage.setItem("accessToken", response.access);
        if (response.refresh) localStorage.setItem("refreshToken", response.refresh);
      } catch (e) {}

      setClub(response.club);
      setView("club");
    } catch (error) {
      setClub(null);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleStudentRegister(data) {
    await api.studentRegister(data);
    setAuthMessage("Kayıt başarılı! Giriş yaparak devam edebilirsiniz.");
  }

  async function handleClubRegister(data) {
    await api.clubRegister(data);
  }

  function handleLogout() {
    setView("auth");
    setFavorites([]);
    setStudent(null);
    setClub(null);
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch (e) {}
    clearSession();
  }


  async function toggleFavorite(id) {
    const isFavorite = favorites.includes(id);

    if (!student?.id) {
      setFavorites((prev) =>
        isFavorite ? prev.filter((x) => x !== id) : [...prev, id]
      );
      return;
    }

    try {
      if (isFavorite) {
        await api.removeFavorite(student.id, id);
        setFavorites((prev) => prev.filter((x) => x !== id));
      } else {
        await api.addFavorite(student.id, id);
        setFavorites((prev) => [...prev, id]);
      }
    } catch (error) {
      console.error("Favori güncellenemedi:", error);
    }
  }

  //events

  async function handleCreateEvent(payload) {
    if (!club?.id && !payload.club_id) {
      throw new Error("Kulüp bilgisi bulunamadı.");
    }
    const requestPayload = {
      ...payload,
      club_id: payload.club_id || club.id,
    };
    const created = await api.createEvent(requestPayload);
    setEvents((prev) => [...prev, created]);
    return created;
  }

  async function handleJoinEvent(eventId) {
    if (!student?.id) {
      throw new Error("Öğrenci bilgileri bulunamadı.");
    }
    const response = await api.joinEvent(eventId, {
      student_id: student.id,
    });

    const updatedEvent = response.event;
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
    );

    const isWaitListed = response.status === "waitlisted";
    return {
      title: isWaitListed ? "Bekleme Listesine Alındınız" : "Katılım İsteği",
      message: response.message,
    };
  }

  const studentData = student || FALLBACK_STUDENT;
  const clubData = club || FALLBACK_CLUB;

  //render

  return (
    <div className="app-shell">
      <Header view={view} onLogout={handleLogout} />

      {globalError && (
        <div className="card" style={{ margin: 16 }}>
          <strong>Uyarı:</strong> {globalError}
        </div>
      )}

      {view === "auth" && (
        <AuthPage
          onStudentLogin={handleStudentLogin}
          onClubLogin={handleClubLogin}
          onStudentRegister={handleStudentRegister}
          onClubRegister={handleClubRegister}
          disabled={isAuthenticating}
          view={view}
          notification={authMessage}
        />
      )}

      {view === "student" && (
        <StudentDashboard
          events={events}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onJoinEvent={handleJoinEvent}
          loading={loadingEvents}
          student={studentData}
          recommendations={recommendations}
          recommendationNotice={recommendationNotice}
          onUpdateStudent={setStudent}
        />
      )}

      {view === "club" && (
        <ClubDashboard
          events={events}
          onCreateEvent={handleCreateEvent}
          club={clubData}
          onUpdateClub={setClub}
        />
      )}

      <footer>
        UniConnect – Üniversite Kulüp ve Etkinlik Yönetim Platformu
      </footer>
    </div>
  );
}
