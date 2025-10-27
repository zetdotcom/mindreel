export const mockEntry = {
  id: 1,
  content: 'Praca nad logowaniem',
  timestamp: new Date('2025-10-27T10:00:00Z'),
}

export const mockEntries = [
  {
    id: 1,
    content: 'Praca nad logowaniem',
    timestamp: new Date('2025-10-27T10:00:00Z'),
  },
  {
    id: 2,
    content: 'Praca nad logowaniem',
    timestamp: new Date('2025-10-27T10:30:00Z'),
  },
  {
    id: 3,
    content: 'Code review',
    timestamp: new Date('2025-10-27T11:00:00Z'),
  },
]

export const mockWeeklySummary = {
  weekKey: '2025-W43',
  content: '- Implementacja systemu logowania\n- Code review dla zespołu\n- Testy jednostkowe',
  iso_year: 2025,
  week_of_year: 43,
}

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2025-10-27T00:00:00Z',
}

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
  user: mockUser,
}
