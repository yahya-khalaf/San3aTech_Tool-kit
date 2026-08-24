import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

type AcademyTool = {
  name: string;
  description: string;
  status: 'Ready' | 'Beta' | 'Coming soon';
};

type AcademyCourse = {
  id: string;
  title: string;
  level: string;
  description: string;
  accent: string;
  icon: typeof BookOpen;
  tools: AcademyTool[];
};

const academyCourses: AcademyCourse[] = [
  {
    id: 'code-create',
    title: 'Code & Create',
    level: 'Creative coding',
    description: 'Explore creative coding challenges, submit solutions, and share your work on the challenge wall.',
    accent: 'from-violet-500 to-indigo-500',
    icon: BookOpen,
    tools: [
      {
        name: 'Challenge Wall',
        description: 'Open the full challenge wall page and view project submissions and tasks.',
        status: 'Ready'
      },
      {
        name: 'Student Projects Portfolio',
        description: 'Browse the student projects portfolio and discover completed Code & Create work.',
        status: 'Ready'
      },
      {
        name: 'Submit Student Project',
        description: 'Submit a student project to the Code & Create portfolio.',
        status: 'Ready'
      },
      {
        name: 'Submit Challenge',
        description: 'Fill in the challenge submission form for Code & Create.',
        status: 'Ready'
      }
    ]
  }
];

function CourseStatusPill({ status }: { status: AcademyTool['status'] }) {
  const styles: Record<AcademyTool['status'], string> = {
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

export default function San3aAcademy() {
  const { courseId } = useParams();
  const selectedCourse = academyCourses.find((course) => course.id === courseId);

  if (selectedCourse) {
    const CourseIcon = selectedCourse.icon;

    return (
      <div className="flex flex-col h-full bg-gray-50/50">
        <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link
              to="/academy"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to courses
            </Link>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Course tools</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className={`bg-gradient-to-r ${selectedCourse.accent} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <CourseIcon size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/80">{selectedCourse.level}</p>
                    <h2 className="text-2xl font-bold mt-1">{selectedCourse.title}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-base text-gray-600 mb-6">{selectedCourse.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Available tools</h3>
                  <span className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">
                    {selectedCourse.tools.length} tools
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedCourse.tools.map((tool) => {
                    const isChallengeWall = tool.name === 'Challenge Wall';
                    const isStudentProjectsPortfolio = tool.name === 'Student Projects Portfolio';
                    const isSubmitChallenge = tool.name === 'Submit Challenge';
                    const isSubmitStudentProject = tool.name === 'Submit Student Project';

                    return (
                      <div key={tool.name} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="text-base font-bold text-gray-900">{tool.name}</h4>
                          <CourseStatusPill status={tool.status} />
                        </div>
                        <p className="text-sm leading-6 text-gray-600">{tool.description}</p>

                        {(isChallengeWall || isStudentProjectsPortfolio || isSubmitChallenge || isSubmitStudentProject) && (
                          <a
                            href={
                              isChallengeWall
                                ? '/challenge-wall.html'
                                : isStudentProjectsPortfolio
                                  ? '/student-projects-portfolio.html'
                                  : isSubmitStudentProject
                                    ? 'https://forms.gle/xLrEQwgiiLGuLKMG8'
                                    : 'https://forms.gle/SJX54XQpiazQJih8A'
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                          >
                            {isChallengeWall
                              ? 'Open challenge wall'
                              : isStudentProjectsPortfolio
                                ? 'Open student portfolio'
                                : 'Open submission form'}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Academy</p>
          <h2 className="text-lg font-bold text-gray-900">San3a Academy courses tools</h2>
        </div>
        <div className="rounded-full bg-primary-light px-3 py-1 text-sm font-semibold text-primary">
          {academyCourses.length} courses
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-2">
            <h3 className="text-2xl font-bold text-gray-900">Course library</h3>
            <p className="text-gray-600 max-w-2xl">
              Explore the course list and open each course to manage and add the tools you want learners to use.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {academyCourses.map((course) => {
              const CourseIcon = course.icon;

              return (
                <div key={course.id} className="card group hover:shadow-lg transition-all duration-200">
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
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h4>
                    <p className="text-sm leading-6 text-gray-600 mb-5">{course.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500">{course.tools.length} tools</span>
                    </div>

                    <Link
                      to={`/academy/${course.id}`}
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
