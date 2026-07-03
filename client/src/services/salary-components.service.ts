import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api';

export const getSalaryComponents = async () => {
  const res = await api.get('/salary-components');
  return res.data;
};

export const createSalaryComponent = async (data: any) => {
  const res = await api.post('/salary-components', data);
  return res.data;
};

export const updateSalaryComponent = async (id: string, data: any) => {
  const res = await api.put(`/salary-components/${id}`, data);
  return res.data;
};

export const deleteSalaryComponent = async (id: string) => {
  const res = await api.delete(`/salary-components/${id}`);
  return res.data;
};

export const duplicateSalaryComponent = async (id: string) => {
  const res = await api.post(`/salary-components/${id}/duplicate`);
  return res.data;
};
