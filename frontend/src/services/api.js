const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error('Server se connect nahi ho paya. Flask chal raha hai?')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // response JSON nahi tha
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request fail hui (${res.status})`)
  }
  return data
}

export const api = {
  getPassage: (category = 'random') => request(`/passage?category=${category}`),
  getResults: () => request('/results'),
  getStats: () => request('/stats'),
  saveResult: (result) =>
    request('/results', { method: 'POST', body: JSON.stringify(result) }),
  getLearningDashboard: () => request('/learning/dashboard'),
  getDailyGoal: () => request('/learning/daily-goal'),
  getLesson: (id) => request(`/learning/lessons/${id}`),
  submitAttempt: (id, body) =>
    request(`/learning/lessons/${id}/attempts`, { method: 'POST', body: JSON.stringify(body) }),
}