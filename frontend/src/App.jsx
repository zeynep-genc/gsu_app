import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import StudentDashboard from "./components/StudentDashboard.jsx";
import ClubDashboard from "./components/ClubDashboard.jsx";
import * as api from "./api.js";
import { FALLBACK_CLUB, FALLBACK_STUDENT } from "./constants.js";
import { MOCK_EVENTS } from "./mockData.js";

export default function App() {
  const [view, setView] = useState("login");
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [student, setStudent] = useState(null);
  const [club, setClub] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  async function handleStudentLogin(credentials) {
    setIsAuthenticating(true);
    try {
      const response = await api.studentLogin(credentials);
      setStudent(response.student);
      setView("student");
      await loadFavorites(response.student.id);
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
      setClub(response.club);
      setView("club");
    } catch (error) {
      setClub(null);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  function handleLogout() {
    setView("login");
    setFavorites([]);
    setStudent(null);
    setClub(null);
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
      console.warn("Favoriler alınamadı, local duruma geçiliyor.", error);
      setFavorites([]);
    }
  }

  async function toggleFavorite(id) {
    const isFavorite = favorites.includes(id);
    if (!student?.id) {
      setFavorites((previous) =>
        isFavorite
          ? previous.filter((item) => item !== id)
          : [...previous, id]
      );
      return;
    }

    try {
      if (isFavorite) {
        await api.removeFavorite(student.id, id);
        setFavorites((previous) => previous.filter((item) => item !== id));
      } else {
        await api.addFavorite(student.id, id);
        setFavorites((previous) => [...previous, id]);
      }
    } catch (error) {
      console.error("Favori güncellenemedi:", error);
    }
  }

  async function handleCreateEvent(payload) {
    if (!club?.id && !payload.club_id) {
      throw new Error("Kulüp bilgisi bulunamadı.");
    }
    const requestPayload = {
      ...payload,
      club_id: payload.club_id || club.id,
    };
    const created = await api.createEvent(requestPayload);
    setEvents((previous) => [...previous, created]);
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
    setEvents((previous) =>
      previous.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
    const isWaitListed = response.status === "waitlisted";
    return {
      title: isWaitListed ? "Bekleme Listesine Alındınız" : "Katılım İsteği",
      message: response.message,
    };
  }

  async function handleStudentRegister(data) {
    await api.studentRegister(data);
  }

  async function handleClubRegister(data) {
    await api.clubRegister(data);
  }

  const studentData = student || FALLBACK_STUDENT;
  const clubData = club || FALLBACK_CLUB;

  return (
    <div className="app-shell">
      <Header view={view} onLogout={handleLogout} />
      {globalError && (
        <div className="card" style={{ margin: 16 }}>
          <strong>Uyarı:</strong> {globalError}
        </div>
      )}
      {view === "login" && (
        <LoginScreen
          onStudentSubmit={handleStudentLogin}
          onClubSubmit={handleClubLogin}
          onStudentRegister={handleStudentRegister}
          onClubRegister={handleClubRegister}
          disabled={isAuthenticating}
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
        />
      )}
      {view === "club" && (
        <ClubDashboard
          events={events}
          onCreateEvent={handleCreateEvent}
          club={clubData}
        />
      )}
      <footer>UniConnect – Üniversite Kulüp ve Etkinlik Yönetim Platformu</footer>
    </div>
  );
}
