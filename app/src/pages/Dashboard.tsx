import { Link } from 'react-router-dom';
import {
  QrCode,
  Video,
  PenTool,
  CalendarDays,
  BookOpen,
  Bug,
  BriefcaseBusiness,
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
  },
  {
    name: 'Employability',
    description: 'Pre-course onboarding workflows, cohort preparation, and learner orientation tools.',
    icon: BriefcaseBusiness,
    to: '/courses/employability'
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
    name: 'Online Whiteboard',
    description: 'Live shared board for online sessions.',
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
      <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200">
        <div>
          <h1 className="text-lg font-heading font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Welcome back, Team!</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Welcome / hero: brand-night band with the guideline stripe ramp */}
          <section className="relative overflow-hidden bg-brand-night text-white">
            <div className="p-8 md:p-10">
              <p className="s3-eyebrow text-[#FF7A80]">Zero to Maker</p>
              <h2 className="mt-2 s3-display text-[28px] md:text-[40px] leading-[1.1] text-white">Welcome to San3a Academy Toolkit</h2>
              <p className="mt-3 text-white/85 text-lg">Access every course tool and general utility in one place.</p>
            </div>
            <div className="s3-stripes" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /></div>
          </section>

          {/* Courses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-gray-900">Courses</h3>
              <Link to="/courses" className="text-sm font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1">
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courseCards.map((course) => {
                const Icon = course.icon;
                return (
                  <Link
                    key={course.name}
                    to={course.to}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                      <Icon size={22} />
                    </div>
                    <h4 className="font-heading font-bold text-gray-900 mb-1">{course.name}</h4>
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
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">General Tools</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {generalTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <a
                    key={tool.name}
                    href={tool.href}
                    target={tool.newTab ? '_blank' : undefined}
                    rel={tool.newTab ? 'noreferrer' : undefined}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-md hover:shadow-xl transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                      <Icon size={22} />
                    </div>
                    <h4 className="font-heading font-bold text-gray-900 mb-1">{tool.name}</h4>
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
