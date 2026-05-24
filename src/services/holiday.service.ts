import prisma from '../lib/prisma.ts';
import { HolidayType } from '@prisma/client';

export class HolidayService {
  static async addHoliday(data: {
    companyId: string;
    name: string;
    date: string;
    type: HolidayType;
  }) {
    const holidayDate = new Date(data.date);
    holidayDate.setHours(0, 0, 0, 0);

    return prisma.holiday.upsert({
      where: {
        company_id_date: {
          company_id: data.companyId,
          date: holidayDate,
        },
      },
      update: {
        name: data.name,
        type: data.type,
      },
      create: {
        company_id: data.companyId,
        name: data.name,
        date: holidayDate,
        type: data.type,
      },
    });
  }

  static async getHolidays(companyId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    return prisma.holiday.findMany({
      where: {
        company_id: companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  static async deleteHoliday(id: string, companyId: string) {
    return prisma.holiday.delete({
      where: { id, company_id: companyId },
    });
  }

  static async seedNationalHolidays(companyId: string, year: number) {
    const holidays = [
      { name: 'Republic Day', date: `${year}-01-26`, type: 'NATIONAL' },
      { name: 'Maha Shivaratri', date: `${year}-02-15`, type: 'NATIONAL' },
      { name: 'Holi', date: `${year}-03-04`, type: 'NATIONAL' },
      { name: 'Eid al-Fitr', date: `${year}-03-20`, type: 'NATIONAL' },
      { name: 'Mahavir Jayanti', date: `${year}-04-01`, type: 'NATIONAL' },
      { name: 'Good Friday', date: `${year}-04-03`, type: 'NATIONAL' },
      { name: 'Ambedkar Jayanti', date: `${year}-04-14`, type: 'NATIONAL' },
      { name: 'Buddha Purnima', date: `${year}-05-01`, type: 'NATIONAL' },
      { name: 'Eid al-Adha', date: `${year}-05-27`, type: 'NATIONAL' },
      { name: 'Muharram', date: `${year}-06-26`, type: 'NATIONAL' },
      { name: 'Independence Day', date: `${year}-08-15`, type: 'NATIONAL' },
      { name: 'Janmashtami', date: `${year}-08-28`, type: 'NATIONAL' },
      { name: 'Milad-un-Nabi', date: `${year}-09-15`, type: 'NATIONAL' },
      { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'NATIONAL' },
      { name: 'Dussehra', date: `${year}-10-12`, type: 'NATIONAL' },
      { name: 'Diwali', date: `${year}-10-29`, type: 'NATIONAL' },
      { name: 'Guru Nanak Jayanti', date: `${year}-11-15`, type: 'NATIONAL' },
      { name: 'Christmas', date: `${year}-12-25`, type: 'NATIONAL' },
    ];

    const results = [];
    for (const h of holidays) {
      results.push(await this.addHoliday({
        companyId,
        name: h.name,
        date: h.date,
        type: h.type as HolidayType
      }));
    }
    return results;
  }
}
