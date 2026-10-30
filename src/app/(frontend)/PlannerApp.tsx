'use client'

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'

export type Subject = {
  code: string
  name: string
  period: number
  hours: number
  credits: number
  kind: 'required' | 'optional' | 'activity' | 'internship' | 'tcc'
  active?: boolean | null
  category?: string | null
  nucleus?: string | null
  reviewStatus?: 'ok' | 'check' | null
  notes?: string | null
  prerequisiteStatus?: 'verified' | 'pending' | null
  prerequisites?: Array<{ name: string; source?: string | null }>
}

export type Curriculum = {
  slug: string
  name: string
  shortName: string
  totalHours: number
  periodCount: number
  colors: { accent: string; soft: string; dark: string }
  subjects: Subject[]
}

type View = 'curriculum' | 'electives' | 'planning' | 'schedule'
type PlannedSubject = Subject & { schedule: string; external?: boolean }

const courseOrder = ['bict', 'aeroespacial', 'ambiental', 'civil', 'computacao', 'transportes', 'mecanica']
const pathwaySlugs = courseOrder.filter((slug) => slug !== 'bict')
const days = [
  { number: '2', label: 'Segunda' },
  { number: '3', label: 'Terça' },
  { number: '4', label: 'Quarta' },
  { number: '5', label: 'Quinta' },
  { number: '6', label: 'Sexta' },
  { number: '7', label: 'Sábado' },
]
const slots = [
  ['M1', '07:30–08:20'], ['M2', '08:20–09:10'], ['M3', '09:20–10:10'],
  ['M4', '10:10–11:00'], ['M5', '11:10–12:00'], ['M6', '12:00–12:50'],
  ['T1', '13:10–14:00'], ['T2', '14:00–14:50'], ['T3', '14:50–15:40'],
  ['T4', '15:50–16:40'], ['T5', '16:40–17:30'], ['T6', '17:40–18:30'],
  ['N1', '18:30–19:20'], ['N2', '19:20–20:10'], ['N3', '20:20–21:10'], ['N4', '21:10–22:00'],
]
const printPalettes = {
  course: null,
  ufma: ['#1e3a8a', '#2563eb'],
  mint: ['#065f46', '#10b981'],
  amber: ['#27272a', '#d97706'],
} as const

function Icon({ name, size = 18 }: { name: 'grid' | 'calendar' | 'clock' | 'list' | 'print' | 'moon' | 'sun' | 'check' | 'plus' | 'trash' | 'alert' | 'info' | 'close'; size?: number }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    list: <><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    print: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></>,
    moon: <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 9 9 0 1 0 20.5 14Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /></>,
    alert: <><path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function parseSchedule(value: string) {
  const cells: string[] = []
  const normalized = value.toUpperCase().replaceAll(',', ' ')
  const matcher = /([2-7]+)([MTN])([1-6]+)/g
  for (const match of normalized.matchAll(matcher)) {
    for (const day of match[1]) {
      for (const slot of match[3]) {
        if (match[2] === 'N' && Number(slot) > 4) continue
        cells.push(`${day}-${match[2]}${slot}`)
      }
    }
  }
  return cells
}

function storageRead<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export default function PlannerApp({ curricula }: { curricula: Curriculum[] }) {
  const ordered = useMemo(() => [...curricula].sort((a, b) => courseOrder.indexOf(a.slug) - courseOrder.indexOf(b.slug)), [curricula])
  const [courseSlug, setCourseSlug] = useState(ordered.find((item) => item.slug === 'computacao')?.slug ?? ordered[0]?.slug ?? '')
  const [pathwaySlug, setPathwaySlug] = useState('computacao')
  const [view, setView] = useState<View>('curriculum')
  const [night, setNight] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [simulated, setSimulated] = useState<string[]>([])
  const [planned, setPlanned] = useState<PlannedSubject[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printPalette, setPrintPalette] = useState<keyof typeof printPalettes>('course')
  const [printDark, setPrintDark] = useState(false)
  const [showExternal, setShowExternal] = useState(false)
  const [subjectQuery, setSubjectQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

  const course = ordered.find((item) => item.slug === courseSlug) ?? ordered[0]
  const pathway = ordered.find((item) => item.slug === pathwaySlug && item.slug !== 'bict')

  useEffect(() => {
    const loadedCompleted = storageRead<string[]>(`trajeto:done:${courseSlug}`, [])
    const loadedPlanned = storageRead<PlannedSubject[]>(`trajeto:planned:${courseSlug}`, [])
    const loadedSimulated = storageRead<string[]>(`trajeto:simulated:${courseSlug}`, [])
    setCompleted(loadedCompleted)
    setSimulated([...new Set([...loadedSimulated, ...loadedPlanned.filter((subject) => !loadedCompleted.includes(subject.code)).map((subject) => subject.code)])])
    setPlanned(loadedPlanned)
    setHydrated(true)
  }, [courseSlug])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(`trajeto:done:${courseSlug}`, JSON.stringify(completed))
  }, [completed, courseSlug, hydrated])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(`trajeto:planned:${courseSlug}`, JSON.stringify(planned))
  }, [planned, courseSlug, hydrated])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(`trajeto:simulated:${courseSlug}`, JSON.stringify(simulated))
  }, [simulated, courseSlug, hydrated])

  if (!course) return <main className="empty-state">Nenhuma matriz curricular cadastrada.</main>

  const rootStyle = {
    '--accent': course.colors.accent,
    '--accent-soft': course.colors.soft,
    '--accent-dark': course.colors.dark,
  } as CSSProperties

  const palette = printPalettes[printPalette] ?? [course.colors.dark, course.colors.accent]
  const printStyle = {
    '--print-accent': palette[1],
    '--print-border': palette[0],
    '--print-bg': printDark ? '#111827' : '#ffffff',
    '--print-surface': printDark ? '#1f2937' : '#ffffff',
    '--print-text': printDark ? '#f8fafc' : '#172033',
  } as CSSProperties

  const activeCourseSubjects = course.subjects.filter((subject) => subject.active !== false)
  const bictBaseSubjects = activeCourseSubjects.filter((subject) => subject.period > 0 && !subject.name.startsWith('Núcleo Formativo') && !subject.name.startsWith('Núcleo Eletivo'))
  const pathwaySubjects = course.slug === 'bict'
    ? (pathway?.subjects ?? []).filter((subject) => subject.active !== false && (subject.period === 5 || subject.period === 6) && subject.kind !== 'tcc' && subject.kind !== 'activity' && subject.kind !== 'internship')
    : []
  const curriculumSubjects = course.slug === 'bict'
    ? [...bictBaseSubjects, ...pathwaySubjects]
    : activeCourseSubjects.filter((subject) => subject.period > 0)
  const availableSubjects = course.slug === 'bict'
    ? [...curriculumSubjects, ...activeCourseSubjects.filter((subject) => subject.period === 0)]
    : activeCourseSubjects
  const namedElectives = activeCourseSubjects.filter((subject) => subject.period === 0 || (subject.kind === 'optional' && !/^Optativa|^Disciplina Optativa/i.test(subject.name)))
  const electiveSubjects = course.slug === 'bict'
    ? [...activeCourseSubjects.filter((subject) => subject.period === 0), ...pathwaySubjects]
    : namedElectives.length > 3
      ? namedElectives
      : activeCourseSubjects.filter((subject) => subject.period >= 5 && subject.kind !== 'activity' && subject.kind !== 'internship' && subject.kind !== 'tcc' && !/^Optativa|^Disciplina Optativa/i.test(subject.name))
  const completedHours = Math.min(course.totalHours, availableSubjects.filter((subject) => completed.includes(subject.code)).reduce((sum, subject) => sum + subject.hours, 0))
  const completedSubjectCount = availableSubjects.filter((subject) => completed.includes(subject.code)).length
  const percent = Math.round((completedHours / course.totalHours) * 100)
  const remainingHours = Math.max(0, course.totalHours - completedHours)
  const plannedCredits = planned.reduce((sum, subject) => sum + subject.credits, 0)
  const plannedHours = planned.reduce((sum, subject) => sum + subject.hours, 0)

  const scheduleMap = new Map<string, PlannedSubject[]>()
  for (const subject of planned) {
    for (const cell of parseSchedule(subject.schedule)) {
      scheduleMap.set(cell, [...(scheduleMap.get(cell) ?? []), subject])
    }
  }
  const conflicts = [...scheduleMap.values()].filter((items) => items.length > 1).length

  function cycleSubjectStatus(code: string) {
    if (!completed.includes(code) && !simulated.includes(code)) {
      setCompleted((current) => [...current, code])
      return
    }
    if (completed.includes(code)) {
      setCompleted((current) => current.filter((item) => item !== code))
      setSimulated((current) => [...current, code])
      return
    }
    setSimulated((current) => current.filter((item) => item !== code))
  }

  function selectCourse(slug: string) {
    setHydrated(false)
    setCourseSlug(slug)
  }

  function togglePlanned(subject: Subject) {
    const isSelected = planned.some((item) => item.code === subject.code)
    setPlanned((current) => isSelected
      ? current.filter((item) => item.code !== subject.code)
      : [...current, { ...subject, schedule: '' }])
    if (!completed.includes(subject.code)) {
      setSimulated((current) => isSelected
        ? current.filter((item) => item !== subject.code)
        : current.includes(subject.code) ? current : [...current, subject.code])
    }
  }

  function updateSchedule(code: string, schedule: string) {
    setPlanned((current) => current.map((item) => item.code === code ? { ...item, schedule } : item))
  }

  function addExternal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const code = String(data.get('code')).trim().toUpperCase()
    const name = String(data.get('name')).trim()
    if (!code || !name || planned.some((item) => item.code === code)) return
    setPlanned((current) => [...current, {
      code,
      name,
      period: 0,
      hours: Number(data.get('hours')),
      credits: Number(data.get('credits')),
      kind: 'optional',
      schedule: String(data.get('schedule')).trim().toUpperCase(),
      external: true,
    }])
    event.currentTarget.reset()
    setShowExternal(false)
  }

  function printPage() {
    setPrintOpen(false)
    window.setTimeout(() => window.print(), 100)
  }

  return (
    <div className={night ? 'app-shell night' : 'app-shell'} style={{ ...rootStyle, ...printStyle }}>
      <aside className="sidebar no-print">
        <div className="brand-mark"><span className="brand-symbol"><i /><i /><i /></span><span>FLUXO BICT</span></div>
        <nav className="main-nav" aria-label="Navegação principal">
          <button className={`nav-item ${view === 'curriculum' ? 'active' : ''}`} onClick={() => setView('curriculum')}><Icon name="grid" /><span>Organograma</span></button>
          <button className={`nav-item ${view === 'electives' ? 'active' : ''}`} onClick={() => setView('electives')}><Icon name="list" /><span>Optativas</span></button>
          <button className={`nav-item ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}><Icon name="calendar" /><span>Grade semanal</span></button>
          <button className={`nav-item ${view === 'planning' ? 'active' : ''}`} onClick={() => setView('planning')}><Icon name="clock" /><span>Planejamento</span></button>
        </nav>
        <div className="sidebar-note"><strong>{percent}% integralizado</strong><span>{remainingHours.toLocaleString('pt-BR')} h restantes</span><div><i style={{ width: `${percent}%` }} /></div></div>
      </aside>

      <main className="workspace">
        <header className="topbar no-print">
          <div className="mobile-brand">FLUXO BICT</div>
          <div className="mobile-nav">
            <button onClick={() => setView('curriculum')} className={view === 'curriculum' ? 'active' : ''}><Icon name="grid" /></button>
            <button onClick={() => setView('electives')} className={view === 'electives' ? 'active' : ''}><Icon name="list" /></button>
            <button onClick={() => setView('schedule')} className={view === 'schedule' ? 'active' : ''}><Icon name="calendar" /></button>
            <button onClick={() => setView('planning')} className={view === 'planning' ? 'active' : ''}><Icon name="clock" /></button>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setNight((value) => !value)} aria-label="Alternar tema"><Icon name={night ? 'sun' : 'moon'} /></button>
            <button className="print-button" onClick={() => setPrintOpen(true)}><Icon name="print" /><span>Imprimir / PDF</span></button>
          </div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{view === 'curriculum' ? 'INTEGRALIZAÇÃO CURRICULAR' : view === 'electives' ? 'PERCURSOS DE APROFUNDAMENTO' : view === 'planning' ? 'SIMULAÇÃO DE MATRÍCULA' : 'HORÁRIOS DO PERÍODO'}</div>
              <h1>{view === 'curriculum' ? 'Meu organograma' : view === 'electives' ? 'Optativas possíveis' : view === 'planning' ? 'Planejamento do período' : 'Grade semanal'}</h1>
              <p>{view === 'curriculum' ? 'Clique nos componentes: concluído, simulado e pendente.' : view === 'electives' ? 'Explore possibilidades e adicione diretamente ao planejamento.' : view === 'planning' ? 'Selecione disciplinas e valide o teto de créditos.' : 'Gerada automaticamente pelos códigos de horário do SIGAA.'}</p>
            </div>
            <div className="progress-summary print-progress">
              <div className="progress-ring" style={{ background: `conic-gradient(var(--accent) ${percent}%, var(--line) 0)` }}><span>{percent}%</span></div>
              <div><strong>{completedHours.toLocaleString('pt-BR')} de {course.totalHours.toLocaleString('pt-BR')} horas</strong><span>Faltam {remainingHours.toLocaleString('pt-BR')} horas para integralizar</span></div>
            </div>
          </div>

          <div className="course-picker no-print">
            <div className="picker-label">Curso / trajetória</div>
            <div className="course-tabs">
              {ordered.map((item) => <button key={item.slug} className={`course-tab ${item.slug === courseSlug ? 'active' : ''}`} onClick={() => selectCourse(item.slug)}><span className="course-dot" style={{ background: item.colors.accent }} />{item.shortName}</button>)}
            </div>
          </div>

          {course.slug === 'bict' && (
            <div className="pathway-picker no-print">
              <div>
                <span>Engenharia almejada</span>
                <strong>Escolha a trilha de optativas do BICT</strong>
              </div>
              <div className="pathway-tabs">
                {ordered.filter((item) => pathwaySlugs.includes(item.slug)).map((item) => (
                  <button key={item.slug} className={item.slug === pathwaySlug ? 'active' : ''} onClick={() => setPathwaySlug(item.slug)}>
                    <span style={{ background: item.colors.accent }} />
                    {item.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="track-banner">
            <div className="track-icon">{course.shortName.slice(0, 2)}</div>
            <div>
              <span>{course.slug === 'bict' ? 'TRILHA FORMATIVA SELECIONADA' : 'TRAJETÓRIA SELECIONADA'}</span>
              <strong>{course.name}{course.slug === 'bict' && pathway ? ` → ${pathway.name}` : ''}</strong>
            </div>
            <div className="track-meta">{course.periodCount} períodos <i /> {course.totalHours.toLocaleString('pt-BR')} horas</div>
          </div>

          {view === 'curriculum' && (
            <>
              <div className="metric-grid">
                <div><span>Componentes concluídos</span><strong>{completedSubjectCount}<small> / {curriculumSubjects.length}</small></strong></div>
                <div><span>Carga integralizada</span><strong>{completedHours.toLocaleString('pt-BR')}<small> h</small></strong></div>
                <div><span>Carga restante</span><strong>{remainingHours.toLocaleString('pt-BR')}<small> h</small></strong></div>
              </div>
              <div className="status-guide no-print">
                <span><i className="pending" />Pendente</span>
                <span><i className="done"><Icon name="check" size={9} /></i>Concluída</span>
                <span><i className="simulated"><Icon name="clock" size={9} /></i>Simulada</span>
                <small>Clique no cartão para alternar</small>
              </div>
              <div className="curriculum-scroll">
                <div className="curriculum-grid" style={{ gridTemplateColumns: `repeat(${course.periodCount}, minmax(110px, 1fr))` }}>
                  {Array.from({ length: course.periodCount }, (_, index) => {
                    const subjects = curriculumSubjects.filter((subject) => subject.period === index + 1)
                    return <section className="period-column" key={index}>
                      <div className="period-head"><span>{index + 1}º</span><div><strong>Período</strong><small>{subjects.reduce((sum, item) => sum + item.hours, 0)} horas</small></div></div>
                      <div className="subject-list">
                        {subjects.map((subject) => {
                          const checked = completed.includes(subject.code)
                          const isSimulated = simulated.includes(subject.code)
                          return <article
                            className={`subject-card ${checked ? 'concluida' : isSimulated ? 'simulada' : 'pendente'}`}
                            key={subject.code}
                            onClick={() => cycleSubjectStatus(subject.code)}
                            onKeyDown={(event) => {
                              if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
                                event.preventDefault()
                                cycleSubjectStatus(subject.code)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${subject.name}: ${checked ? 'concluída' : isSimulated ? 'simulada' : 'pendente'}`}
                          >
                            <div className="subject-code">{subject.code}<span>{subject.hours} h</span></div>
                            <h2>{subject.name}</h2>
                            <span className="subject-kind">{checked ? 'Concluída' : isSimulated ? 'Simulada' : subject.kind === 'optional' ? 'Optativa' : subject.kind === 'internship' ? 'Estágio' : subject.kind === 'tcc' ? 'TCC' : subject.kind === 'activity' ? 'Atividade' : `${subject.credits} cr`}</span>
                            <span className="check-box">{isSimulated ? <Icon name="clock" size={11} /> : <Icon name="check" size={11} />}</span>
                            <button className="subject-info" onClick={(event) => { event.stopPropagation(); setSelectedSubject(subject) }} aria-label={`Ver pré-requisitos de ${subject.name}`}><Icon name="info" size={11} /></button>
                          </article>
                        })}
                      </div>
                    </section>
                  })}
                </div>
              </div>
            </>
          )}

          {view === 'electives' && (
            <section className="electives-section">
              <div className="electives-intro">
                <div><span>{electiveSubjects.length}</span><p>possibilidades encontradas</p></div>
                <p>{course.slug === 'bict' && pathway ? <>A lista combina optativas gerais do BICT com a trilha tecnológica de <strong>{pathway.name}</strong>.</> : <>Disciplinas optativas e possibilidades de aprofundamento cadastradas para <strong>{course.name}</strong>.</>}</p>
              </div>
              <div className="elective-grid">
                {electiveSubjects.map((subject) => {
                  const selected = planned.some((item) => item.code === subject.code)
                  return <article className={`elective-card ${selected ? 'selected' : ''}`} key={subject.code}>
                    <div className="elective-top"><span>{subject.code}</span><b>{subject.hours}h</b></div>
                    <h2>{subject.name}</h2>
                    <div className="elective-meta"><span>{subject.credits} créditos</span>{subject.period > 0 && <span>{subject.period}º período sugerido</span>}</div>
                    <div className="elective-actions">
                      <button className="elective-details" onClick={() => setSelectedSubject(subject)}><Icon name="info" size={13} />Pré-requisitos</button>
                      <button onClick={() => togglePlanned(subject)}>{selected ? <><Icon name="check" size={14} />No planejamento</> : <><Icon name="plus" size={14} />Planejar</>}</button>
                    </div>
                  </article>
                })}
              </div>
            </section>
          )}

          {view === 'planning' && (
            <div className="planning-layout">
              <section className="planning-catalog">
                <div className="panel-head"><div><h2>Disciplinas disponíveis</h2><p>Inclui obrigatórias e todas as optativas cadastradas.</p></div><input value={subjectQuery} onChange={(event) => setSubjectQuery(event.target.value)} placeholder="Buscar disciplina ou código" /></div>
                <div className="catalog-list">
                  {availableSubjects.filter((subject) => !completed.includes(subject.code) && `${subject.name} ${subject.code}`.toLowerCase().includes(subjectQuery.toLowerCase())).map((subject) => {
                    const selected = planned.some((item) => item.code === subject.code)
                    return <button key={subject.code} className={`catalog-row ${selected ? 'selected' : ''}`} onClick={() => togglePlanned(subject)}>
                      <span className="catalog-check">{selected && <Icon name="check" size={13} />}</span>
                      <span><strong>{subject.name}</strong><small>{subject.code} · {subject.hours} h · {subject.credits} créditos{subject.period ? ` · ${subject.period}º período` : ' · Optativa'}</small></span>
                    </button>
                  })}
                </div>
              </section>
              <aside className="plan-summary">
                <div className="plan-total"><span>Seleção atual</span><strong className={plannedCredits > 26 ? 'danger' : ''}>{plannedCredits}<small> / 26 créditos</small></strong><div><i style={{ width: `${Math.min(100, plannedCredits / 26 * 100)}%` }} /></div><p>{planned.length} disciplinas · {plannedHours} horas</p></div>
                {plannedCredits > 26 && <div className="credit-alert"><Icon name="alert" /><span><strong>Teto excedido</strong>A seleção ultrapassa os 26 créditos regulamentares.</span></div>}
                <h3>Horários SIGAA</h3>
                <p className="helper">Ex.: <b>24M12</b> para segunda e quarta, manhã, horários 1 e 2.</p>
                <div className="planned-list">
                  {planned.map((subject) => <div className="planned-item" key={subject.code}>
                    <div><strong>{subject.name}</strong><small>{subject.code} · {subject.credits} cr</small></div>
                    <input value={subject.schedule} onChange={(event) => updateSchedule(subject.code, event.target.value.toUpperCase())} placeholder="24M12" aria-label={`Horário de ${subject.name}`} />
                    <button onClick={() => togglePlanned(subject)} aria-label={`Remover ${subject.name}`}><Icon name="trash" size={15} /></button>
                  </div>)}
                </div>
                <button className="external-button" onClick={() => setShowExternal((value) => !value)}><Icon name="plus" />Registrar disciplina externa</button>
                {showExternal && <form className="external-form" onSubmit={addExternal}>
                  <input required name="name" placeholder="Nome da disciplina" />
                  <div><input required name="code" placeholder="Código" /><input required name="hours" type="number" min="1" placeholder="CH" /></div>
                  <div><input required name="credits" type="number" min="0" placeholder="Créditos" /><input required name="schedule" placeholder="Código SIGAA" /></div>
                  <button type="submit">Adicionar à simulação</button>
                </form>}
              </aside>
            </div>
          )}

          {view === 'schedule' && (
            <div className="schedule-section">
              <div className="schedule-summary">
                <div><span>Disciplinas no período</span><strong>{planned.length}</strong></div>
                <div><span>Créditos</span><strong>{plannedCredits}</strong></div>
                <div className={conflicts ? 'has-conflict' : ''}><span>Conflitos encontrados</span><strong>{conflicts}</strong></div>
                <button className="no-print" onClick={() => setView('planning')}>Editar planejamento</button>
              </div>
              {!planned.length ? <div className="schedule-empty"><Icon name="calendar" size={30} /><h2>Sua grade ainda está vazia</h2><p>Selecione disciplinas no Planejamento e informe os códigos SIGAA.</p><button onClick={() => setView('planning')}>Ir para Planejamento</button></div> :
              <div className="schedule-scroll"><table className="schedule-table"><thead><tr><th>Horário</th>{days.map((day) => <th key={day.number}>{day.label}</th>)}</tr></thead><tbody>
                {slots.map(([slot, time], index) => <tr key={slot} className={index === 6 || index === 12 ? 'turn-start' : ''}>
                  <th><strong>{slot}</strong><span>{time}</span></th>
                  {days.map((day) => {
                    const items = scheduleMap.get(`${day.number}-${slot}`) ?? []
                    return <td key={day.number} className={items.length > 1 ? 'conflict-cell' : ''}>{items.map((item) => <div className="schedule-class" key={item.code}><strong>{item.name}</strong><span>{item.code}</span></div>)}</td>
                  })}
                </tr>)}
              </tbody></table></div>}
              <div className="sigaa-legend no-print"><strong>Como ler o código SIGAA</strong><span><b>2–7</b> dias da semana</span><span><b>M / T / N</b> turno</span><span><b>1–6</b> horários (noite: 1–4)</span></div>
            </div>
          )}
        </section>
      </main>

      {printOpen && <div className="modal-layer no-print" onMouseDown={(event) => event.target === event.currentTarget && setPrintOpen(false)}>
        <section className="print-modal">
          <header><div><span className="modal-kicker">PERSONALIZAÇÃO</span><h2>Preparar impressão</h2><p>A paleta será aplicada à página atual no PDF.</p></div></header>
          <div className="simple-print-options">
            <h3>Paleta</h3>
            <div className="print-palette-grid">
              {Object.entries(printPalettes).map(([key, colors]) => {
                const pair = colors ?? [course.colors.dark, course.colors.accent]
                return <button key={key} className={printPalette === key ? 'selected' : ''} onClick={() => setPrintPalette(key as keyof typeof printPalettes)}><span><i style={{ background: pair[0] }} /><i style={{ background: pair[1] }} /></span>{key === 'course' ? 'Cor do curso' : key === 'ufma' ? 'UFMA institucional' : key === 'mint' ? 'Menta' : 'Grafite & âmbar'}</button>
              })}
            </div>
            <h3>Modo do documento</h3>
            <div className="mode-options"><button className={!printDark ? 'selected' : ''} onClick={() => setPrintDark(false)}><Icon name="sun" />Claro</button><button className={printDark ? 'selected' : ''} onClick={() => setPrintDark(true)}><Icon name="moon" />Escuro</button></div>
          </div>
          <footer><button className="cancel-button" onClick={() => setPrintOpen(false)}>Cancelar</button><button className="confirm-button" onClick={printPage}><Icon name="print" />Imprimir agora</button></footer>
        </section>
      </div>}

      {selectedSubject && (
        <div className="subject-detail-layer no-print" onMouseDown={(event) => event.target === event.currentTarget && setSelectedSubject(null)}>
          <section className="subject-detail" role="dialog" aria-modal="true" aria-labelledby="subject-detail-title">
            <header>
              <div>
                <span>{selectedSubject.code} · {selectedSubject.period ? `${selectedSubject.period}º período` : 'Optativa'}</span>
                <h2 id="subject-detail-title">{selectedSubject.name}</h2>
              </div>
              <button onClick={() => setSelectedSubject(null)} aria-label="Fechar detalhes"><Icon name="close" /></button>
            </header>
            <div className="subject-detail-meta">
              <span>{selectedSubject.hours} horas</span>
              <span>{selectedSubject.credits} créditos</span>
              {selectedSubject.category && <span>{selectedSubject.category}</span>}
            </div>
            {selectedSubject.nucleus && <div className="subject-nucleus"><small>NÚCLEO CURRICULAR</small><strong>{selectedSubject.nucleus}</strong></div>}
            {selectedSubject.reviewStatus === 'check' && <div className="review-warning"><Icon name="alert" size={16} /><span><strong>Informação a conferir</strong>Esta linha foi marcada para revisão na planilha anexada.</span></div>}
            <div className="prerequisite-section">
              <h3>Pré-requisitos</h3>
              {selectedSubject.prerequisites?.length ? (
                <ul>{selectedSubject.prerequisites.map((prerequisite, index) => <li key={`${prerequisite.name}-${index}`}><span><Icon name="check" size={12} /></span><div><strong>{prerequisite.name}</strong>{prerequisite.source && <small>{prerequisite.source}</small>}</div></li>)}</ul>
              ) : (
                <div className="prerequisite-pending"><Icon name="clock" /><div><strong>Informação ainda não disponível</strong><p>O pré-requisito não foi informado na planilha nem localizado de forma verificável nas páginas públicas consultadas da UFMA. Será implementado em breve.</p></div></div>
              )}
            </div>
            {selectedSubject.notes && <div className="subject-notes"><small>OBSERVAÇÕES DA PLANILHA</small><p>{selectedSubject.notes}</p></div>}
            <footer><button onClick={() => setSelectedSubject(null)}>Entendi</button></footer>
          </section>
        </div>
      )}
    </div>
  )
}
