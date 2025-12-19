const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Safe JSON parse helper
 */
async function readBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  // Fallback to text (e.g., HTML error pages, plain text errors)
  try {
    return await response.text();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  // Set JSON content-type by default if not provided
  if (!headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  // attach access token if available
  try {
    const access = localStorage.getItem("accessToken");
    if (access && !headers["Authorization"] && !headers["authorization"]) {
      headers["Authorization"] = `Bearer ${access}`;
    }
  } catch (e) {
    // ignore storage errors
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "İstek başarısız oldu.";
    const errorBody = await readBody(response);

    if (errorBody) {
      if (typeof errorBody === "string") {
        errorMessage = errorBody;
      } else if (typeof errorBody === "object") {
        errorMessage = errorBody.detail || JSON.stringify(errorBody);
      }
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  if (response.status === 204) return null;

  const data = await readBody(response);
  return data;
}

/* -------------------- RECOMMENDATIONS -------------------- */

export async function getRecommendations(studentId) {
  return request(`/recommendations/?student_id=${encodeURIComponent(studentId)}`);
}

/* -------------------- EVENTS -------------------- */

export async function getEvents() {
  const data = await request("/events/");
  return Array.isArray(data) ? data : data?.results || [];
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

/* -------------------- FAVORITES -------------------- */

export async function getFavorites(studentId) {
  const data = await request(`/favorites/?student_id=${encodeURIComponent(studentId)}`);
  return data?.event_ids || [];
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

/* -------------------- META (Combobox data) --------------------
   Not: Bu endpointleri backend'de oluşturman gerekir.
*/

export async function getUniversities() {
  return request("/meta/universities/");
}

export async function getDepartments(universityId) {
  return request(`/meta/departments/?university_id=${encodeURIComponent(universityId)}`);
}

export async function getTags() {
  // optional query parameter
  const q = arguments[0] || "";
  const path = q ? `/meta/tags/?q=${encodeURIComponent(q)}` : "/meta/tags/";
  return request(path);
}

export async function getClassLevels() {
  return request("/meta/class-levels/");
}

/* -------------------- STUDENT PROFILE UPDATE --------------------
   Not: Backend'de /students/:id/ PATCH endpointi gerekir.
*/

export async function updateStudent(studentId, payload) {
  return request(`/students/${encodeURIComponent(studentId)}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
