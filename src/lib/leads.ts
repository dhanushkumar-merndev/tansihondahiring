import { sheets, SHEET_ID } from './google';

export async function getLeads() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'CRM!A2:G',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row, index) => ({
      rowIndex: index + 2,
      created_time: row[0] || '',
      position: row[1] || '',
      full_name: row[2] || '',
      phone: row[3] || '',
      email: row[4] || '',
      status: row[5] || 'Pending',
      feedback: row[6] || '',
    }));
  } catch (error) {
    console.error('Error fetching leads from library:', error);
    throw error;
  }
}
