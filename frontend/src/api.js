const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = "İstek başarısız oldu.";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.detail || JSON.stringify(errorBody);
    } catch (error) {
      // ignore
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function getEvents() {
  const data = await request("/events/");
  return Array.isArray(data) ? data : data.results || [];
}

export async function createEvent(payload) {
  return request("/events/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function joinEvent(eventId, payload) {
  return request(`/events/${eventId}/join/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function studentLogin(payload) {
  return request("/auth/student-login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clubLogin(payload) {
  return request("/auth/club-login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function studentRegister(payload) {
  return request("/auth/student-register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clubRegister(payload) {
  return request("/auth/club-register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFavorites(studentId) {
  const data = await request(`/favorites/?student_id=${studentId}`);
  return data.event_ids || [];
}

export async function addFavorite(studentId, eventId) {
  return request("/favorites/", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, event_id: eventId }),
  });
}

export async function removeFavorite(studentId, eventId) {
  return request("/favorites/", {
    method: "DELETE",
    body: JSON.stringify({ student_id: studentId, event_id: eventId }),
  });
}
