/**
 * iCal Export Utility
 * Generate .ics files for calendar applications (Google Calendar, Outlook, Apple Calendar)
 */

/**
 * Generate iCal content for an event
 * @param {Object} event - Event object with title, date, description, location
 * @returns {string} - iCal formatted string
 */
export function generateICalFile(event) {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + (event.duration || 60) * 60000);

  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text) => {
    if (!text) return '';
    return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  };

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event._id}@campusconnect.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description || '')}`,
    `LOCATION:${escapeText(event.location || '')}`,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icalContent;
}

/**
 * Download an iCal file for an event
 * @param {Object} event - Event object
 */
export function downloadICalFile(event) {
  const icalContent = generateICalFile(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate iCal for recurring events
 * @param {Object} event - Event object
 * @param {Object} recurrence - Recurrence pattern
 * @returns {string} - iCal formatted string with RRULE
 */
export function generateRecurringICalFile(event, recurrence) {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + (event.duration || 60) * 60000);

  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text) => {
    if (!text) return '';
    return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  };

  // Generate RRULE from recurrence object
  let rrule = 'RRULE:FREQ=';
  switch (recurrence.type) {
    case 'daily':
      rrule += 'DAILY';
      break;
    case 'weekly':
      rrule += 'WEEKLY';
      if (recurrence.daysOfWeek?.length > 0) {
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const selectedDays = recurrence.daysOfWeek.map(d => days[d]).join(',');
        rrule += `;BYDAY=${selectedDays}`;
      }
      break;
    case 'monthly':
      rrule += 'MONTHLY';
      if (recurrence.dayOfMonth) {
        rrule += `;BYMONTHDAY=${recurrence.dayOfMonth}`;
      }
      break;
    case 'yearly':
      rrule += 'YEARLY';
      break;
  }

  if (recurrence.interval && recurrence.interval > 1) {
    rrule += `;INTERVAL=${recurrence.interval}`;
  }

  if (recurrence.endDate) {
    const endDate = new Date(recurrence.endDate);
    rrule += `;UNTIL=${formatDate(endDate)}`;
  } else if (recurrence.endAfterOccurrences) {
    rrule += `;COUNT=${recurrence.endAfterOccurrences}`;
  }

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event._id}@campusconnect.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description || '')}`,
    `LOCATION:${escapeText(event.location || '')}`,
    rrule,
    `STATUS:CONFIRMED`,
    `SEQUENCE:0`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icalContent;
}

/**
 * Example usage:
 * 
 * import { downloadICalFile, generateRecurringICalFile } from './utils/ical-export';
 * 
 * // Simple event
 * <button onClick={() => downloadICalFile(event)}>
 *   Export to Calendar
 * </button>
 * 
 * // Recurring event
 * const icalContent = generateRecurringICalFile(event, {
 *   type: 'weekly',
 *   interval: 1,
 *   daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
 *   endAfterOccurrences: 10
 * });
 */
