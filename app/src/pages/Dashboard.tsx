import { Link } from 'react-router-dom';
import {
  QrCode,
  Video,
  BarChart3,
  Users,
  PenTool,
  CalendarDays,
  BookOpen,
  Bug,
  ArrowUpRight
} from 'lucide-react';

const courseCards = [
  {
    name: 'Code & Create',
    description: 'Challenge wall, student portfolio, and submission forms for the creative coding course.',
    icon: BookOpen,
    to: '/courses/code-create'
  },
  {
    name: 'Debugging Fundamentals',
    description: 'Troubleshooting wizard, flowchart explorer, and the developer flow editor.',
    icon: Bug,
    to: '/courses/debugging'
  }
];

const generalTools = [
  {
    name: 'QR Code Generator',
    description: 'Create custom QR codes with logo and branding.',
    icon: QrCode,
    href: '/tools/qr-generator.html',
    external: true
  },
  {
    name: 'Video to GIF',
    description: 'Convert video clips to optimized GIFs.',
    icon: Video,
    href: '/tools/video-to-gif.html',
    external: true
  },
  {
    name: 'Team WIGs',
    description: 'Track team-wide goals and progress leaderboards.',
    icon: BarChart3,
    href: '/tools/team-wigs.html',
    external: true
  },
  {
    name: 'Individual WIGs',
    description: 'Monitor individual performance and goals.',
    icon: Users,
    href: '/tools/individual-wigs.html',
    external: true
  },
  {
    name: 'Online Whiteboard',
    description: 'Real-time collaborative drawing for meetings.',
    icon: PenTool,
    href: '/whiteboard/index.html',
    external: true,
    newTab: true
  },
  {
    name: 'Crash Courses Calendar',
    description: 'Live schedule for all crash courses and workshops.',
    icon: CalendarDays,
    href: '/calendar/index.html',
    external: true
  }
];

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full">
      <header className="h-16 px-8 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-white/40">
        <div>
          <h1 className="text-lg font-montserrat font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Welcome back, Team!</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Welcome / hero */}
          <section
            className="relative overflow-hidden rounded-2xl p-8 text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, #CF2027 0%, #781629 55%, #240D18 100%)' }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-montserrat font-bold">Welcome to San3a Toolkit</h2>
              <p className="mt-2 text-white/90">Access every course tool and general utility in one place.</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-white/70">Zero to Maker</p>
            </div>
            <div
              className="absolute -top-24 -right-16 w-80 h-80 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
            />
          </section>

          {/* Courses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-montserrat font-bold text-gray-900">Courses</h3>
              <Link to="/courses" className="text-sm font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1">
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {courseCards.map((course) => {
                const Icon = course.icon;
                return (
                  <Link
                    key={course.name}
                    to={course.to}
                    className="group flex flex-col rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                      <Icon size={22} />
                    </div>
                    <h4 className="font-montserrat font-bold text-gray-900 mb-1">{course.name}</h4>
                    <p className="text-sm text-gray-600 flex-1">{course.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Open course <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* General tools */}
          <section>
            <h3 className="text-xl font-montserrat font-bold text-gray-900 mb-4">General Tools</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generalTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <a
                    key={tool.name}
                    href={tool.href}
                    target={tool.newTab ? '_blank' : undefined}
                    rel={tool.newTab ? 'noreferrer' : undefined}
                    className="group flex flex-col rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                      <Icon size={22} />
                    </div>
                    <h4 className="font-montserrat font-bold text-gray-900 mb-1">{tool.name}</h4>
                    <p className="text-sm text-gray-600 flex-1">{tool.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Open tool <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
