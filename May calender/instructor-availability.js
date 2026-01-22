import Papa from 'https://cdn.skypack.dev/papaparse';

const AVAILABILITY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR-wmb6lVK0zBPMRJq9Eb2doZSRjIFDGlJiZ7KLHp3PubzShjuWTxCrLUOr8C4DuzLdIqLJBjiRzfCY/pub?gid=2136480140&single=true&output=csv';

const TIME_SLOTS = [
    "9:00 AM - 10:00AM", "10:00 AM - 11:00AM", "11:00 AM - 12:00PM",
    "12:00 PM - 1:00PM", "1:00 PM - 2:00PM", "2:00 PM - 3:00PM",
    "3:00 PM - 4:00PM", "4:00 PM - 5:00PM", "5:00 PM - 6:00PM",
    "6:00 PM - 7:00PM", "7:00 PM - 8:00PM", "8:00 PM - 9:00PM",
    "9:00 PM - 10:00PM"
];

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PALETTE = [
    '#DC2626', '#2563EB', '#059669', '#D97706', '#7C3AED',
    '#DB2777', '#0891B2', '#4F46E5', '#EA580C', '#65A30D'
];

export class InstructorAvailability {
    constructor() {
        this.instructors = [];
        this.instructorColors = {};
        this.filters = {
            instructors: {},
            mode: 'online' // 'online' or 'offline'
        };
        this.elements = {
            grid: document.getElementById('calendar-grid'),
            instructorList: document.getElementById('instructor-list'),
            modeOnlineBtn: document.getElementById('mode-online'),
            modeOfflineBtn: document.getElementById('mode-offline'),
            loading: document.getElementById('loading-overlay')
        };
    }

    async init() {
        this.setupEventListeners();
        await this.fetchData();
    }

    setupEventListeners() {
        this.elements.modeOnlineBtn.addEventListener('click', () => {
            this.setMode('online');
        });
        this.elements.modeOfflineBtn.addEventListener('click', () => {
            this.setMode('offline');
        });
    }

    setMode(mode) {
        this.filters.mode = mode;
        this.elements.modeOnlineBtn.classList.toggle('active', mode === 'online');
        this.elements.modeOfflineBtn.classList.toggle('active', mode === 'offline');
        this.render();
    }

    async fetchData() {
        this.elements.loading.classList.add('show');
        try {
            const response = await new Promise((resolve, reject) => {
                Papa.parse(AVAILABILITY_CSV_URL, {
                    download: true,
                    header: true,
                    complete: resolve,
                    error: reject
                });
            });

            this.processData(response.data);
            this.renderSidebar();
        } catch (error) {
            console.error('Error fetching instructor data:', error);
        } finally {
            this.elements.loading.classList.remove('show');
        }
    }

    processData(data) {
        this.instructors = data.map(row => {
            const name = row['Full name'] || row['Full Name'];
            if (!name) return null;

            const availability = { online: {}, offline: {} };

            TIME_SLOTS.forEach(slot => {
                const onlineKey = `Please select all time slots during which you are available to deliver online sessions. [${slot}]`;
                const offlineKey = `Please select all time slots during which you are available to deliver offline sessions. [${slot}]`;

                availability.online[slot] = this.parseDays(row[onlineKey]);
                availability.offline[slot] = this.parseDays(row[offlineKey]);
            });

            if (this.filters.instructors[name] === undefined) {
                this.filters.instructors[name] = true;
            }

            // Assign color
            if (!this.instructorColors[name]) {
                const colorIndex = Object.keys(this.instructorColors).length % PALETTE.length;
                this.instructorColors[name] = PALETTE[colorIndex];
            }

            return { name, availability };
        }).filter(Boolean);
    }

    parseDays(daysStr) {
        if (!daysStr) return [];
        return daysStr.split(',').map(d => d.trim());
    }

    renderSidebar() {
        this.elements.instructorList.innerHTML = this.instructors.map(ins => `
            <div class="instructor-item">
                <input type="checkbox" id="ins-${ins.name.replace(/\s+/g, '-')}" ${this.filters.instructors[ins.name] ? 'checked' : ''}>
                <div class="instructor-avatar" style="background: ${this.instructorColors[ins.name]}">${ins.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
                <label for="ins-${ins.name.replace(/\s+/g, '-')}">${ins.name}</label>
            </div>
        `).join('');

        this.elements.instructorList.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const name = e.target.nextElementSibling.nextElementSibling.textContent;
                this.filters.instructors[name] = e.target.checked;
                this.render();
            });
        });
    }

    render() {
        this.elements.grid.innerHTML = '';
        this.elements.grid.className = 'calendar-grid week-view';

        // Headers
        const timeHeader = document.createElement('div');
        timeHeader.className = 'day-header week-view';
        timeHeader.textContent = 'TIME SLOT';
        this.elements.grid.appendChild(timeHeader);

        DAYS.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header week-view';
            header.textContent = day.toUpperCase();
            this.elements.grid.appendChild(header);
        });

        // Rows
        TIME_SLOTS.forEach(slot => {
            // Time label
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-slot-header';
            timeLabel.textContent = slot;
            this.elements.grid.appendChild(timeLabel);

            // Availability for each day
            DAYS.forEach(day => {
                const cell = document.createElement('div');
                cell.className = 'availability-cell';

                this.instructors.forEach(ins => {
                    if (!this.filters.instructors[ins.name]) return;

                    const days = ins.availability[this.filters.mode][slot] || [];
                    if (days.includes(day)) {
                        const tag = document.createElement('div');
                        const baseColor = this.instructorColors[ins.name];
                        tag.className = 'availability-tag';
                        tag.style.backgroundColor = baseColor + '15'; // 15% opacity background
                        tag.style.color = baseColor;
                        tag.style.borderLeftColor = baseColor;

                        tag.textContent = ins.name;
                        tag.title = `${ins.name} - ${this.filters.mode}`;
                        cell.appendChild(tag);
                    }
                });

                this.elements.grid.appendChild(cell);
            });
        });
    }
}
