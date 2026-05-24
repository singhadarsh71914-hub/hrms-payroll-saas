import api from './api';

export const holidayService = {
  getHolidays: async (year: number) => {
    const response = await api.get('/holidays', { params: { year } });
    return response.data;
  },

  addHoliday: async (data: { name: string; date: string; type: string }) => {
    const response = await api.post('/holidays', data);
    return response.data;
  },

  deleteHoliday: async (id: string) => {
    await api.delete(`/holidays/${id}`);
  },

  seedHolidays: async (year: number) => {
    const response = await api.post('/holidays/seed', { year });
    return response.data;
  }
};
