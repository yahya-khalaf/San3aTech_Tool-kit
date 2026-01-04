import Papa from 'https://cdn.skypack.dev/papaparse';

const VACATIONS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQv7sjY_gVLhrhyT4SfM-TgNaXlFKFCVy8x_eNKpbJtTTkXD6YqjUAO2rXTx6MA1GsA_Q_KTT6ZyZW7/pub?gid=1665450693&single=true&output=csv';
const SCHEDULER_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQv7sjY_gVLhrhyT4SfM-TgNaXlFKFCVy8x_eNKpbJtTTkXD6YqjUAO2rXTx6MA1GsA_Q_KTT6ZyZW7/pub?gid=688123287&single=true&output=csv';

const DAYS_MAP = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};

class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.vacations = [];
        this.events = [];
        this.courses = new Set();
        this.rooms = new Set();
        this.courseColors = {};
        this.filters = {
            courses: {},
            rooms: {}
        };

        this.palette = [
            '#1a73e8', '#d93025', '#188038', '#f9ab00', '#8e24aa',
            '#00acc1', '#ff7043', '#9e9d24', '#5c6bc0', '#ec407a'
        ];

        this.elements = {
            grid: document.getElementById('calendar-grid'),
            currentMonth: document.getElementById('current-month'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            todayBtn: document.getElementById('today-btn'),
            courseList: document.getElementById('course-list'),
            roomList: document.getElementById('room-list'),
            loading: document.getElementById('loading-overlay')
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.fetchData();
        this.render();
    }

    setupEventListeners() {
        this.elements.prevBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        this.elements.nextBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        this.elements.todayBtn.addEventListener('click', () => {
            this.currentDate = new Date();
            this.render();
        });
    }

    async fetchData() {
        this.elements.loading.classList.add('show');
        try {
            const [vacationsRes, schedulerRes] = await Promise.all([
                this.fetchCSV(VACATIONS_CSV_URL),
                this.fetchCSV(SCHEDULER_CSV_URL)
            ]);

            this.processVacations(vacationsRes.data);
            this.processScheduler(schedulerRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            this.elements.loading.classList.remove('show');
        }
    }

    fetchCSV(url) {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                transformHeader: (header) => header.trim().replace(/:$/, ''),
                complete: resolve,
                error: reject
            });
        });
    }

    processVacations(data) {
        console.log('Processing Vacations Raw:', data[0]);
        this.vacations = data.map(v => {
            const name = this.getVal(v, 'Vacation');
            const start = this.getVal(v, 'Start');
            const end = this.getVal(v, 'End');
            return { name, start: new Date(start), end: new Date(end) };
        }).filter(v => !isNaN(v.start));
        console.log('Processed Vacations:', this.vacations);
    }

    getVal(row, key) {
        const mappings = {
            'vacation': ['vacation', 'event', 'holiday'],
            'start': ['start', 'start date', 'starting date', 'from'],
            'end': ['end', 'end date', 'to'],
            'course name': ['course name', 'track name', 'name', 'course'],
            'start date': ['start date', 'starting date', 'date'],
            'sessions': ['sessions', 'number of sessions', 'total sessions', 'count'],
            'days': ['days', 'schedule', 'occurrence', 'sessions days', 'tot days of the week'],
            'time (24h)': ['time (24h)', 'starting time @24h', 'time', 'hour'],
            'room': ['room', 'room number', 'location']
        };

        const searchKeys = mappings[key.toLowerCase()] || [key.toLowerCase()];

        const k = Object.keys(row).find(rowKey => {
            const cleanKey = rowKey.trim().toLowerCase().replace(/:$/, '');
            return searchKeys.includes(cleanKey);
        });

        return k ? row[k] : null;
    }

    isVacation(date) {
        return this.vacations.some(v => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const start = new Date(v.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(v.end);
            end.setHours(0, 0, 0, 0);
            return d >= start && d <= end;
        });
    }

    processScheduler(data) {
        console.log('Processing Scheduler Raw:', data[0]);
        this.events = [];
        data.forEach(row => {
            const courseName = this.getVal(row, 'Course name');
            const startDateStr = this.getVal(row, 'Start Date');
            const sessionsStr = this.getVal(row, 'Sessions');
            const daysStr = this.getVal(row, 'Days');
            const time = this.getVal(row, 'Time (24H)');
            const room = this.getVal(row, 'Room');

            if (!courseName || !startDateStr) {
                console.warn('Skipping row due to missing courseName or startDate:', row);
                return;
            }

            // Assign color if new course
            if (!this.courseColors[courseName]) {
                this.courseColors[courseName] = this.palette[Object.keys(this.courseColors).length % this.palette.length];
                this.filters.courses[courseName] = true;
            }

            if (room && this.filters.rooms[room] === undefined) {
                this.filters.rooms[room] = true;
            }

            const sessions = parseInt(sessionsStr) || 0;
            this.courses.add(courseName);
            if (room) this.rooms.add(room);

            const allowedDays = (daysStr || '').split(',').map(d => DAYS_MAP[d.trim()]);
            let currentSessionDate = new Date(startDateStr);
            let sessionsCount = 0;

            console.log(`Generating events for ${courseName}, Start: ${startDateStr}, Sessions: ${sessions}`);

            // Safety counter to prevent infinite loop
            let iterations = 0;
            while (sessionsCount < sessions && iterations < 365) {
                iterations++;
                const dayOfWeek = currentSessionDate.getDay();

                if (allowedDays.includes(dayOfWeek)) {
                    if (!this.isVacation(currentSessionDate)) {
                        this.events.push({
                            title: courseName,
                            date: new Date(currentSessionDate),
                            time: time,
                            room: room,
                            type: 'course',
                            color: this.courseColors[courseName]
                        });
                        sessionsCount++;
                    } else {
                        console.log(`Shifting session for ${courseName} from ${currentSessionDate.toDateString()} due to vacation.`);
                    }
                }
                currentSessionDate.setDate(currentSessionDate.getDate() + 1);
            }
        });

        // Also add vacations as standalone events
        this.vacations.forEach(v => {
            let d = new Date(v.start);
            while (d <= v.end) {
                this.events.push({
                    title: v.name,
                    date: new Date(d),
                    type: 'vacation'
                });
                d.setDate(d.getDate() + 1);
            }
        });

        this.renderSidebar();
    }

    renderSidebar() {
        this.elements.courseList.innerHTML = Array.from(this.courses).sort().map(c => `
      <div class="course-item">
        <input type="checkbox" id="course-${c.replace(/\s+/g, '-')}" ${this.filters.courses[c] ? 'checked' : ''}>
        <div class="course-color" style="background: ${this.courseColors[c]}"></div>
        <label for="course-${c.replace(/\s+/g, '-')}">${c}</label>
      </div>
    `).join('');

        this.elements.roomList.innerHTML = Array.from(this.rooms).sort().map(r => `
      <div class="course-item">
        <input type="checkbox" id="room-${r.replace(/\s+/g, '-')}" ${this.filters.rooms[r] ? 'checked' : ''}>
        <div class="course-color" style="background: var(--text-light)"></div>
        <label for="room-${r.replace(/\s+/g, '-')}">${r}</label>
      </div>
    `).join('');

        // Add event listeners to checkboxes
        const checkboxes = document.querySelectorAll('.course-item input');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const type = e.target.id.startsWith('course-') ? 'courses' : 'rooms';
                const label = e.target.nextElementSibling.nextElementSibling.textContent;
                this.filters[type][label] = e.target.checked;
                this.render();
            });
        });
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.elements.currentMonth.textContent = new Intl.DateTimeFormat('en-US', {
            month: 'long',
            year: 'numeric'
        }).format(this.currentDate);

        this.elements.grid.innerHTML = '';

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            this.elements.grid.appendChild(header);
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Fill days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            this.addDayCell(year, month - 1, prevMonthLastDay - i, true);
        }

        // Fill current month days
        for (let i = 1; i <= totalDays; i++) {
            this.addDayCell(year, month, i, false);
        }

        // Fill days from next month to complete the grid (usually 42 cells)
        const remaining = 42 - (startOffset + totalDays);
        for (let i = 1; i <= remaining; i++) {
            this.addDayCell(year, month + 1, i, true);
        }
    }

    addDayCell(year, month, day, isOtherMonth) {
        const date = new Date(year, month, day);
        const cell = document.createElement('div');
        cell.className = 'day-cell' + (isOtherMonth ? ' day-other-month' : '');

        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            cell.classList.add('day-today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        const dayEvents = this.events.filter(e => {
            if (e.date.toDateString() !== date.toDateString()) return false;
            if (e.type === 'course') {
                if (!this.filters.courses[e.title]) return false;
                if (e.room && !this.filters.rooms[e.room]) return false;
            }
            return true;
        });

        dayEvents.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        dayEvents.forEach(e => {
            const eventEl = document.createElement('div');
            eventEl.className = 'event ' + e.type;

            if (e.type === 'course') {
                eventEl.style.backgroundColor = e.color || 'var(--event-blue)';
                if (e.title.includes('TOT')) eventEl.classList.add('tot');
            }

            eventEl.textContent = `${e.time ? e.time + ' ' : ''}${e.title}`;
            eventEl.title = `${e.title}\nRoom: ${e.room || 'N/A'}\nTime: ${e.time || 'N/A'}`;
            cell.appendChild(eventEl);
        });

        this.elements.grid.appendChild(cell);
    }
}

new CalendarApp();
