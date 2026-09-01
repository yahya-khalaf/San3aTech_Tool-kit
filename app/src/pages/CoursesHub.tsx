import { ArrowLeft, BookOpen, Bug } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

type CourseCompanionAction = {
  name: string;
  description: string;
  href: string;
  badge?: string;
};

type CourseTool = {
  name: string;
  description: string;
  status: 'Ready' | 'Beta' | 'Coming soon';
  href: string;
  internal: boolean;
  tag?: string;
  features?: string[];
  formAction?: CourseCompanionAction;
};

type Course = {
  id: string;
  title: string;
  level: string;
  description: string;
  accent: string;
  icon: typeof BookOpen;
  tools: CourseTool[];
};

const courses: Course[] = [
  {
    id: 'code-create',
    title: 'Code & Create',
    level: 'Creative coding',
    description: 'Explore creative coding challenges, submit solutions, and showcase completed student projects on the live portfolio and challenge wall.',
    accent: 'from-[#781629] to-[#CF2027]',
    icon: BookOpen,
    tools: [
      {
        name: 'Final Project Journal',
        description: 'Exhibition-quality presentation dashboard showcasing each team’s complete engineering journal with slide cards, timeline storyboard, and hands-free presentation mode.',
        status: 'Ready',
        href: '/code-create/project-journal.html',
        internal: false,
        tag: 'Exhibition Showcase & Journals',
        features: ['Magazine Story Layout', 'Hands-Free Auto-Scroll', 'Storyboard Timeline', 'micro:bit Code Hub']
      },
      {
        name: 'Challenge Wall',
        description: 'Explore real-world problem statements submitted across all student cohorts, categorized by theme (School, Home, Transportation, Street).',
        status: 'Ready',
        href: '/code-create/challenge-wall.html',
        internal: false,
        tag: 'Problem Discovery & Wall',
        features: ['Live Google Sheet Sync', 'Theme Radar', 'Randomizer & Filter'],
        formAction: {
          name: 'Submit Challenge',
          description: 'Submit a new challenge statement directly to the live Challenge Wall.',
          href: 'https://forms.gle/SJX54XQpiazQJih8A',
          badge: 'Submission Form'
        }
      },
      {
        name: 'Student Projects Portfolio',
        description: 'Discover completed student creative coding builds, hardware-software prototypes, and documentation with multi-group filtering.',
        status: 'Ready',
        href: '/code-create/student-projects-portfolio.html',
        internal: false,
        tag: 'Showcase & Project Archive',
        features: ['Live Projects Feed', 'Student Showcase', 'Multi-Cohort Archive'],
        formAction: {
          name: 'Submit Student Project',
          description: 'Submit your completed student project and media to the showcase portfolio.',
          href: 'https://forms.gle/xLrEQwgiiLGuLKMG8',
          badge: 'Submission Form'
        }
      }
    ]
  },
  {
    id: 'debugging',
    title: 'Debugging Fundamentals',
    level: 'Troubleshooting skills',
    description: 'Practice systematic hardware & software troubleshooting with a guided wizard, explore the full decision flowchart, and author new flows.',
    accent: 'from-[#3D1221] to-[#781629]',
    icon: Bug,
    tools: [
      {
        name: 'Troubleshooting Wizard',
        description: 'Guided step-by-step debugging session for learners.',
        status: 'Ready',
        href: '/courses/debugging/wizard',
        internal: true
      },
      {
        name: 'Flowchart Explorer',
        description: 'Visualize the full decision tree behind a troubleshooting flow.',
        status: 'Ready',
        href: '/courses/debugging/flowchart',
        internal: true
      },
      {
        name: 'System Map',
        description: 'High-level overview of how all troubleshooting systems connect.',
        status: 'Ready',
        href: '/courses/debugging/system-map',
        internal: true
      },
      {
        name: 'Developer Editor',
        description: 'Author and edit flow content (staff).',
        status: 'Beta',
        href: '/courses/debugging/developer',
        internal: true
      }
    ]
  }
];

function CourseStatusPill({ status }: { status: CourseTool['status'] }) {
  const styles: Record<CourseTool['status'], string> = {
    Ready: 'bg-emerald-100 text-emerald-700',
    Beta: 'bg-amber-100 text-amber-700',
    'Coming soon': 'bg-slate-200 text-slate-600'
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function ToolAction({ tool }: { tool: CourseTool }) {
  const label = tool.internal ? `Open ${tool.name}` : `Open ${tool.name}`;

  if (tool.internal) {
    return (
      <Link
        to={tool.href}
        className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark shadow-sm"
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      href={tool.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark shadow-sm hover:shadow"
    >
      {label}
    </a>
  );
}

export default function CoursesHub() {
  const { courseId } = useParams();
  const selectedCourse = courses.find((course) => course.id === courseId);

  if (selectedCourse) {
    const CourseIcon = selectedCourse.icon;

    return (
      <div className="flex flex-col h-full">
        <header className="h-16 px-8 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-white/40">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-white/60 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to courses
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Course tools</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-xl">
              <div className={`bg-gradient-to-r ${selectedCourse.accent} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <CourseIcon size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/80">{selectedCourse.level}</p>
                    <h2 className="text-2xl font-montserrat font-bold mt-1">{selectedCourse.title}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-base text-gray-600 mb-6">{selectedCourse.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Available tools</h3>
                  <span className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">
                    {selectedCourse.tools.length} {selectedCourse.tools.length === 1 ? 'module' : 'modules'}
                  </span>
                </div>

                <div className={`grid gap-6 ${selectedCourse.id === 'code-create' ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                  {selectedCourse.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-6 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          {tool.tag && (
                            <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary mb-1">
                              {tool.tag}
                            </span>
                          )}
                          <h4 className="text-xl font-montserrat font-bold text-gray-900">{tool.name}</h4>
                        </div>
                        <CourseStatusPill status={tool.status} />
                      </div>

                      <p className="text-sm leading-6 text-gray-600 mb-4">{tool.description}</p>

                      {tool.features && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {tool.features.map((feature) => (
                            <span
                              key={feature}
                              className="inline-flex items-center rounded-md bg-white/80 border border-gray-200/80 px-2.5 py-1 text-xs font-medium text-gray-700"
                            >
                              ✓ {feature}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Primary Action Button */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <ToolAction tool={tool} />

                        {/* Joined Form Submission Action */}
                        {tool.formAction && (
                          <a
                            href={tool.formAction.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-primary-light/50 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white hover:border-primary shadow-sm"
                            title={tool.formAction.description}
                          >
                            <span>📝</span>
                            <span>{tool.formAction.name}</span>
                            <span className="text-xs opacity-70">↗</span>
                          </a>
                        )}
                      </div>

                      {/* Form description helper note */}
                      {tool.formAction && (
                        <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Linked with live Google Form
                          </span>
                          <a
                            href={tool.formAction.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary font-semibold hover:underline"
                          >
                            Open form directly
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="h-16 px-8 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-white/40">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Courses</p>
          <h2 className="text-lg font-bold text-gray-900">San3a Academy course tools</h2>
        </div>
        <div className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">
          {courses.length} courses
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-2">
            <h3 className="text-2xl font-montserrat font-bold text-gray-900">Course library</h3>
            <p className="text-gray-600 max-w-2xl">
              Each course groups the tools built specifically for its curriculum. General-purpose tools
              (QR codes, whiteboard, WIGs, etc.) live under General Tools in the sidebar instead.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const CourseIcon = course.icon;

              return (
                <div key={course.id} className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-lg group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`bg-gradient-to-r ${course.accent} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                        <CourseIcon size={22} />
                      </div>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white/90">
                        {course.level}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-xl font-montserrat font-bold text-gray-900 mb-2">{course.title}</h4>
                    <p className="text-sm leading-6 text-gray-600 mb-5">{course.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500">{course.tools.length} tools</span>
                    </div>

                    <Link
                      to={`/courses/${course.id}`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      View course tools
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
