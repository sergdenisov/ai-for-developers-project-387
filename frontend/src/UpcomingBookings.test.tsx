import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, test } from 'vitest';

import type { ListUpcomingResponse } from './api/generated/index.ts';
import { renderApp } from './test/render-app.tsx';
import { server } from './test/server.ts';

const upcomingBookings: ListUpcomingResponse = [
  {
    id: '6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b',
    eventType: { id: 'intro-call', name: 'Знакомство' },
    startsAt: '2026-11-02T10:00:00+03:00',
    endsAt: '2026-11-02T10:30:00+03:00',
    guest: { name: 'Анна Петрова', email: 'anna@example.com' },
    note: 'Хочу обсудить договор',
    createdAt: '2026-10-30T18:45:12+03:00',
  },
  {
    id: '0a9b8c7d-6e5f-4a3b-9c1d-2e3f4a5b6c7d',
    eventType: { id: 'consultation', name: 'Консультация' },
    // The same kind of moment with another offset: still 14:00 in Moscow.
    startsAt: '2026-11-03T11:00:00Z',
    endsAt: '2026-11-03T12:30:00Z',
    guest: { name: 'Иван Сидоров', email: 'Ivan.Sidorov@Example.com' },
    createdAt: '2026-11-01T09:05:00+03:00',
  },
];

function respondWith(bookings: ListUpcomingResponse) {
  server.use(http.get('*/api/bookings', () => HttpResponse.json(bookings)));
}

beforeEach(() => {
  server.use(http.get('*/api/event-types', () => HttpResponse.json([])));
});

/** The table of Upcoming Bookings, found by its heading. `mise run check` runs this suite under heavy load. */
function findTable() {
  return screen.findByRole('table', { name: 'Предстоящие записи' }, { timeout: 5000 });
}

/** The text of every cell, row by row; the first row holds the column headers. */
function cellsOf(table: HTMLElement) {
  return within(table)
    .getAllByRole('row')
    .map((row) =>
      [...within(row).queryAllByRole('columnheader'), ...within(row).queryAllByRole('cell')].map(
        (cell) => cell.textContent,
      ),
    );
}

test('shows each Upcoming Booking as a row in the Owner Time Zone, in the order the server gives', async () => {
  respondWith(upcomingBookings);
  renderApp('/admin');

  expect(cellsOf(await findTable())).toEqual([
    ['Дата и время, МСК', 'Тип события', 'Гость', 'О чём звонок', 'Email', 'Создана, МСК'],
    [
      '2 нояб., 10:00–10:30',
      'Знакомство',
      'Анна Петрова',
      'Хочу обсудить договор',
      'anna@example.com',
      '30 окт., 18:45',
    ],
    [
      '3 нояб., 14:00–15:30',
      'Консультация',
      'Иван Сидоров',
      '—',
      'Ivan.Sidorov@Example.com',
      '1 нояб., 09:05',
    ],
  ]);
});

test('keeps the line breaks of a note and wraps it inside its column', async () => {
  const note = 'Первая строка\nВторая строка';
  respondWith([{ ...upcomingBookings[0], note }]);
  renderApp('/admin');

  const table = await findTable();
  const cell = within(table).getByRole('cell', { name: /Первая строка/ });
  expect(cell.textContent).toBe(note);
  expect(getComputedStyle(cell).whiteSpace).toBe('pre-wrap');
});

test('renders an HTML-like note as plain text', async () => {
  const note = '<b>важное</b> и <script>alert("x")</script>';
  respondWith([{ ...upcomingBookings[0], note }]);
  renderApp('/admin');

  const table = await findTable();
  const cell = within(table).getByRole('cell', { name: note });
  expect(cell.textContent).toBe(note);
  expect(cell.querySelector('b')).toBeNull();
  expect(cell.querySelector('script')).toBeNull();
});

test('says there are no Upcoming Bookings instead of an empty table', async () => {
  respondWith([]);
  renderApp('/admin');

  expect(
    await screen.findByText('Предстоящих записей нет', undefined, { timeout: 5000 }),
  ).toBeDefined();
  expect(screen.queryByRole('table')).toBeNull();
});

test('asks for the list again when the tab regains focus', async () => {
  respondWith([]);
  renderApp('/admin');
  await screen.findByText('Предстоящих записей нет');

  respondWith(upcomingBookings.slice(0, 1));
  // The browser fires `visibilitychange` at the document when the tab is shown again; it bubbles to the window.
  document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));

  const table = await findTable();
  expect(within(table).getByRole('cell', { name: 'Анна Петрова' })).toBeDefined();
});
