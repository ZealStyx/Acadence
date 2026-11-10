"use client";

import { useState } from "react";
import type { Course, IconName, NavItem, ScheduleItem } from "../types";

const navigation: NavItem[] = [
  { label: "Overview", icon: "grid", active: true },
  { label: "My courses", icon: "book" },
  { label: "Calendar", icon: "calendar" },
  { label: "Assignments", icon: "check" },
  { label: "Progress", icon: "chart" },
];

const courses: Course[] = [
  {
    code: "CS 204",
    title: "Data Structures & Algorithms",
    progress: 68,
    color: "coral",
    next: "2h 40m",
    nextLabel: "next lesson",
  },
  {
    code: "MATH 118",
    title: "Linear Algebra",
    progress: 42,
    color: "purple",
    next: "Tomorrow",
    nextLabel: "next lesson",
  },
  {
    code: "DES 101",
    title: "Design Fundamentals",
    progress: 81,
    color: "teal",
    next: "Fri, 10:00 AM",
    nextLabel: "next lesson",
  },
];

const schedule: ScheduleItem[] = [
  {
    time: "09:00",
    title: "Algorithms: Graph traversal",
    course: "CS 204",
    type: "Lecture",
    color: "coral",
  },
  {
    time: "11:30",
    title: "Problem set review",
    course: "MATH 118",
    type: "Study session",
    color: "purple",
  },
  {
    time: "14:00",
    title: "Visual hierarchy",
    course: "DES 101",
    type: "Workshop",
    color: "teal",
  },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16M8 7h8M8 11h7" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: (
      <>
        <path d="M9 11l3 3L21 5" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 3-4 3 2 5-7" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 6 17.9l-.1.1A2 2 0 1 1 3.1 15l.1-.1a2 2 0 0 0-1.4-3.4h-.3a2 2 0 1 1 0-4h.2A2 2 0 0 0 3.1 4L3 3.9A2 2 0 1 1 5.9 1l.1.1a2 2 0 0 0 3.4-1.4V-.5a2 2 0 1 1 4 0v.2A2 2 0 0 0 16.8 1l.1-.1A2 2 0 1 1 19.7 3l-.1.1a2 2 0 0 0 1.4 3.4h.3a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.7 4.5Z" transform="translate(0 1)" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill="none">
      {paths[name]}
    </svg>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 23;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="ring" style={{ "--progress": `${value}%` } as React.CSSProperties}>
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle className="ring-track" cx="28" cy="28" r={radius} />
        <circle
          className="ring-value"
          cx="28"
          cy="28"
          r={radius}
          style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - value / 100) }}
        />
      </svg>
      <strong>{value}%</strong>
    </div>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">a</span>
          <span>acadence</span>
        </div>
        <div className="workspace-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
                setMenuOpen(false);
              }}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.label === "Assignments" && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item">
            <Icon name="settings" />
            Settings
          </button>
          <div className="profile">
            <div className="avatar">JD</div>
            <div>
              <strong>Jordan Davis</strong>
              <span>Computer Science</span>
            </div>
            <span className="profile-more">•••</span>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
            <span />
            <span />
            <span />
          </button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b> {activeNav}</div>
          <div className="top-actions">
            <button className="icon-button notification" aria-label="Notifications"><span>2</span>◌</button>
            <div className="top-avatar">JD</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">Tuesday, October 14, 2025</p>
              <h1>Good morning, Jordan <span>✦</span></h1>
              <p className="muted">Here&apos;s what&apos;s happening with your learning today.</p>
            </div>
            <button className="primary-button">+ Add to schedule</button>
          </section>

          <section className="stats-grid" aria-label="Learning summary">
            <article className="stat-card highlight">
              <div className="stat-icon">◒</div>
              <div><span className="stat-label">Weekly focus</span><strong>12h 45m</strong><small><b>↑ 18%</b> vs last week</small></div>
              <div className="mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="stat-card">
              <div className="stat-icon purple-icon">✓</div>
              <div><span className="stat-label">Completed</span><strong>24 tasks</strong><small><b>8 this week</b></small></div>
            </article>
            <article className="stat-card">
              <div className="stat-icon teal-icon">◷</div>
              <div><span className="stat-label">Current streak</span><strong>7 days</strong><small>Personal best: <b>12 days</b></small></div>
              <span className="flame">♨</span>
            </article>
          </section>

          <div className="dashboard-grid">
            <section className="panel courses-panel">
              <div className="panel-heading"><div><p className="eyebrow">Your semester</p><h2>Course progress</h2></div><button className="text-button">View all <span>→</span></button></div>
              <div className="course-list">
                {courses.map((course) => (
                  <article className="course-row" key={course.code}>
                    <div className={`course-badge ${course.color}`}>{course.code.split(" ")[0].slice(0, 2)}</div>
                    <div className="course-name"><strong>{course.title}</strong><span>{course.code}</span></div>
                    <div className="course-progress"><div className="progress-label"><span>Progress</span><b>{course.progress}%</b></div><div className="progress-bar"><i className={course.color} style={{ width: `${course.progress}%` }} /></div></div>
                    <div className="course-next"><span>{course.nextLabel}</span><b>{course.next}</b></div>
                    <button className="row-arrow" aria-label={`Open ${course.title}`}>↗</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel focus-panel">
              <div className="panel-heading"><div><p className="eyebrow">Your goal</p><h2>Weekly focus</h2></div><button className="more-button" aria-label="More options">•••</button></div>
              <div className="focus-content"><ProgressRing value={68} /><div><strong>Almost there</strong><p>Keep this pace and you&apos;ll hit your weekly goal.</p></div></div>
              <div className="focus-meta"><span><i className="dot coral-dot" /> 8h 40m completed</span><span>Goal: <b>12h 45m</b></span></div>
            </section>

            <section className="panel schedule-panel">
              <div className="panel-heading"><div><p className="eyebrow">Tuesday, Oct 14</p><h2>Today&apos;s schedule</h2></div><button className="text-button">Calendar <span>→</span></button></div>
              <div className="schedule-list">
                {schedule.map((item) => (
                  <div className="schedule-row" key={item.time}><time>{item.time}</time><div className={`schedule-line ${item.color}`} /><div className="schedule-info"><strong>{item.title}</strong><span>{item.course} <em>·</em> {item.type}</span></div><button className="row-arrow" aria-label={`Open ${item.title}`}>↗</button></div>
                ))}
              </div>
            </section>

            <section className="panel tasks-panel">
              <div className="panel-heading"><div><p className="eyebrow">Due soon</p><h2>Upcoming tasks</h2></div><button className="text-button">See all <span>→</span></button></div>
              <div className="task-list">
                <label className="task-row"><input type="checkbox" /><span className="fake-check" /><span><strong>Implement BFS & DFS</strong><small>CS 204 · Assignment</small></span><time>Today</time></label>
                <label className="task-row"><input type="checkbox" /><span className="fake-check" /><span><strong>Read chapter 5 notes</strong><small>MATH 118 · Reading</small></span><time>Tomorrow</time></label>
                <label className="task-row done-task"><input type="checkbox" checked readOnly /><span className="fake-check" /><span><strong>Submit moodboard</strong><small>DES 101 · Assignment</small></span><time>Oct 17</time></label>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}