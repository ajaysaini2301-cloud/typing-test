const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
  let res;

  try {
    const token = localStorage.getItem("access_token");

    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Server se connect nahi ho paya. Flask chal raha hai?");
  }

  let data = null;

  try {
    data = await res.json();
  } catch {
    // Response JSON nahi tha
  }

  if (!res.ok) {
    throw new Error(
      (data && data.error) || `Request fail hui (${res.status})`
    );
  }

  return data;
}

export const api = {
  // Authentication
  register: (user) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(user),
    }),

  login: async (credentials) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    localStorage.setItem("access_token", data.access_token);
    return data;
  },

  getCurrentUser: () => request("/auth/me"),

  logout: () => {
    localStorage.removeItem("access_token");
  },

  // Existing typing-test APIs
  getPassage: (category = "random") =>
    request(`/passage?category=${encodeURIComponent(category)}`),

  getResults: () => request("/results"),

  getStats: () => request("/stats"),

  saveResult: (result) =>
    request("/results", {
      method: "POST",
      body: JSON.stringify(result),
    }),

  // Existing learning APIs
  getLearningDashboard: () => request("/learning/dashboard"),

  getDailyGoal: () => request("/learning/daily-goal"),

  getLesson: (id) =>
    request(`/learning/lessons/${encodeURIComponent(id)}`),

  submitAttempt: (id, body) =>
    request(`/learning/lessons/${encodeURIComponent(id)}/attempts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};