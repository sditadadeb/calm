import React, { useState } from 'react'

const SAMPLE = {
  nombre: 'Manuel García',
  posicion: 'Engineering Manager',
  fechaIngreso: '01/11/2014',
  evaluador: 'Santiago di Tada',
  definicionObjetivos: '04/2025',
  midYearReview: '07/2025',
  finalReviewDate: '12/2025',
  objetivos: [
    { numero: 1, titulo: 'Gestionar el equipo y desarrollar el talento técnico', descripcion: 'Responsable de liderar y acompañar al equipo de desarrollo, asegurando crecimiento profesional, motivación y alineamiento con los objetivos técnicos del área.', ponderacion: 30 },
    { numero: 2, titulo: 'Cumplir métricas técnicas y de calidad', descripcion: 'Deberá asegurar el cumplimiento de las entregas comprometidas por el equipo, velando por la calidad del código y la eficiencia en los procesos.', ponderacion: 20 },
    { numero: 3, titulo: 'Mejorar continuamente los procesos y la colaboración inter-áreas', descripcion: 'Se espera que impulse activamente mejoras en los procesos de desarrollo (CI/CD, documentación, etc.) y promueva prácticas de ingeniería sostenibles.', ponderacion: 15 },
    { numero: 4, titulo: 'Ejecutar las iniciativas clave del negocio o del trimestre', descripcion: 'Deberá asegurar la ejecución y seguimiento de los proyectos estratégicos definidos para el período.', ponderacion: 35 }
  ],
  midYearProgreso: [
    { objetivoNumero: 1, estado: 'Cumplido', porcentajeCumplimiento: 25, comentarios: 'Buen progreso en el desarrollo del equipo.' },
    { objetivoNumero: 2, estado: 'Cumplido', porcentajeCumplimiento: 25, comentarios: 'Métricas de calidad en buen nivel.' },
    { objetivoNumero: 3, estado: 'En proceso', porcentajeCumplimiento: 15, comentarios: 'Mejoras en CI/CD implementadas parcialmente.' },
    { objetivoNumero: 4, estado: 'En proceso', porcentajeCumplimiento: 35, comentarios: 'Proyectos en curso según lo planificado.' }
  ],
  resultadoParcialSmart: 90,
  finalProgreso: [
    { objetivoNumero: 1, estado: 'Cumplido', porcentajeCumplimiento: 30, comentarios: 'Equipo consolidado y con buen rendimiento.' },
    { objetivoNumero: 2, estado: 'Cumplido', porcentajeCumplimiento: 20, comentarios: 'Todas las métricas cumplidas.' },
    { objetivoNumero: 3, estado: 'En proceso', porcentajeCumplimiento: 12, comentarios: 'Algunas mejoras pendientes.' },
    { objetivoNumero: 4, estado: 'No cumplido', porcentajeCumplimiento: 30, comentarios: 'Un proyecto se retrasó.' }
  ],
  resultadoFinalSmart: 92,
  resolvemosEficientemente: 4,
  somosTransparentes: 5,
  nosDesafiamos: 4,
  confiamosEnElOtro: 5,
  resultadoCoreValues: 18,
  areasMejora: 'Creo que tiene que tomar más responsabilidad y libertad para tomar decisiones claves. Más autonomía.',
  planAccion1: 'Tomar ownership de decisiones técnicas críticas',
  planAccion2: 'Liderar la definición de arquitectura del próximo proyecto',
  planAccion3: 'Mejorar comunicación proactiva con otras áreas',
  feedbackDesempeno: 'Siento que he crecido mucho este año, especialmente en liderazgo.',
  feedbackApoyo: 'Me gustaría más capacitación en gestión de conflictos.',
  fechaBonoProporcional: '15/07/2025',
  fechaBonoFinal: '15/01/2026'
}

const ESTADOS = ['Cumplido', 'En proceso', 'No cumplido']

// Login Component
function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      
      if (data.success) {
        onLogin(data.user)
      } else {
        setError(data.message || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="16" fill="#7C3AED" />
              <text x="50" y="65" fontSize="50" textAnchor="middle" fill="#fff" fontFamily="Arial" fontWeight="bold">N</text>
            </svg>
          </div>
          <h1>Numia</h1>
          <p>Performance Review System</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          <div className="login-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2025 Numia. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

// Main App Component
function PerformanceReview({ user, onLogout }) {
  const [form, setForm] = useState({
    nombre: '', posicion: '', fechaIngreso: '', evaluador: '',
    definicionObjetivos: '', midYearReview: '', finalReviewDate: '',
    objetivos: [
      { numero: 1, titulo: '', descripcion: '', ponderacion: 30 },
      { numero: 2, titulo: '', descripcion: '', ponderacion: 20 },
      { numero: 3, titulo: '', descripcion: '', ponderacion: 15 },
      { numero: 4, titulo: '', descripcion: '', ponderacion: 35 }
    ],
    midYearProgreso: [
      { objetivoNumero: 1, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' },
      { objetivoNumero: 2, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' },
      { objetivoNumero: 3, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' },
      { objetivoNumero: 4, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' }
    ],
    resultadoParcialSmart: 0,
    finalProgreso: [
      { objetivoNumero: 1, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' },
      { objetivoNumero: 2, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' },
      { objetivoNumero: 3, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' },
      { objetivoNumero: 4, estado: 'En proceso', porcentajeCumplimiento: 0, comentarios: '' }
    ],
    resultadoFinalSmart: 0,
    resolvemosEficientemente: 3, somosTransparentes: 3, nosDesafiamos: 3, confiamosEnElOtro: 3,
    resultadoCoreValues: 12,
    areasMejora: '',
    planAccion1: '', planAccion2: '', planAccion3: '',
    feedbackDesempeno: '', feedbackApoyo: '',
    fechaBonoProporcional: '', fechaBonoFinal: ''
  })
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState(1)

  const setField = (k, v) => setForm(s => ({ ...s, [k]: v }))
  
  const setObjetivo = (idx, field, value) => {
    setForm(s => {
      const objetivos = [...s.objetivos]
      objetivos[idx] = { ...objetivos[idx], [field]: value }
      return { ...s, objetivos }
    })
  }

  const setProgreso = (type, idx, field, value) => {
    setForm(s => {
      const progreso = [...s[type]]
      progreso[idx] = { ...progreso[idx], [field]: value }
      return { ...s, [type]: progreso }
    })
  }

  const calcularCoreValues = () => {
    return form.resolvemosEficientemente + form.somosTransparentes + form.nosDesafiamos + form.confiamosEnElOtro
  }

  const loadSample = () => setForm(SAMPLE)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, resultadoCoreValues: calcularCoreValues() }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Error generando PDF: ' + res.status)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-review-${form.nombre || 'colaborador'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    { num: 1, title: 'Datos Generales' },
    { num: 2, title: 'Objetivos SMART' },
    { num: 3, title: 'Mid Year Review' },
    { num: 4, title: 'Final Review' },
    { num: 5, title: 'Core Values' },
    { num: 6, title: 'Áreas de Mejora' },
    { num: 7, title: 'Feedback' },
    { num: 8, title: 'Seguimiento' }
  ]

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="12" fill="#7C3AED" />
            <text x="50" y="62" fontSize="42" textAnchor="middle" fill="#fff" fontFamily="Arial">N</text>
          </svg>
          <div className="brand-text">
            <span className="brand-name">Numia</span>
            <span className="brand-sub">Performance Review</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-info">
            <span className="user-name">{user.displayName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button type="button" onClick={loadSample} className="btn btn-secondary">Cargar ejemplo</button>
          <button type="button" onClick={onLogout} className="btn btn-outline">Cerrar sesión</button>
      </div>
      </header>

      <div className="layout">
        <nav className="sidebar">
          <div className="sidebar-header">
            <span>Secciones</span>
          </div>
          {sections.map(s => (
            <button
              key={s.num}
              className={`nav-item ${activeSection === s.num ? 'active' : ''}`}
              onClick={() => setActiveSection(s.num)}
            >
              <span className="nav-num">{s.num}</span>
              <span className="nav-title">{s.title}</span>
            </button>
          ))}
        </nav>

        <form className="main-content" onSubmit={onSubmit}>
          {activeSection === 1 && (
            <section className="section">
              <h2>1. Datos Generales</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del/de la colaborador/a</label>
                  <input value={form.nombre} onChange={e => setField('nombre', e.target.value)} placeholder="Nombre completo" required />
                </div>
                <div className="form-group">
                  <label>Posición</label>
                  <input value={form.posicion} onChange={e => setField('posicion', e.target.value)} placeholder="Cargo actual" required />
                </div>
                <div className="form-group">
                  <label>Fecha de ingreso</label>
                  <input value={form.fechaIngreso} onChange={e => setField('fechaIngreso', e.target.value)} placeholder="DD/MM/YYYY" />
                </div>
                <div className="form-group">
                  <label>Evaluador/a</label>
                  <input value={form.evaluador} onChange={e => setField('evaluador', e.target.value)} placeholder="Nombre del evaluador" required />
                </div>
              </div>
              <h3>Fechas del ciclo de evaluación</h3>
              <div className="form-grid three-col">
                <div className="form-group">
                  <label>Definición de objetivos</label>
                  <input value={form.definicionObjetivos} onChange={e => setField('definicionObjetivos', e.target.value)} placeholder="MM/YYYY" />
                </div>
                <div className="form-group">
                  <label>Mid Year Review</label>
                  <input value={form.midYearReview} onChange={e => setField('midYearReview', e.target.value)} placeholder="MM/YYYY" />
                </div>
                <div className="form-group">
                  <label>Final Review</label>
                  <input value={form.finalReviewDate} onChange={e => setField('finalReviewDate', e.target.value)} placeholder="MM/YYYY" />
                </div>
              </div>
            </section>
          )}

          {activeSection === 2 && (
            <section className="section">
              <h2>2. Objetivos SMART de la posición</h2>
              <p className="section-desc">Peso: 100% total - Define los objetivos y su ponderación</p>
              {form.objetivos.map((obj, idx) => (
                <div key={idx} className="objetivo-card">
                  <div className="objetivo-header">
                    <span className="objetivo-num">Objetivo {obj.numero}</span>
                    <div className="ponderacion-input">
                      <label>Ponderación:</label>
                      <input
                        type="number"
                        value={obj.ponderacion}
                        onChange={e => setObjetivo(idx, 'ponderacion', parseInt(e.target.value) || 0)}
                        min="0" max="100"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Título del objetivo</label>
                    <input
                      value={obj.titulo}
                      onChange={e => setObjetivo(idx, 'titulo', e.target.value)}
                      placeholder="Ej: Gestionar el equipo y desarrollar el talento técnico"
                    />
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      value={obj.descripcion}
                      onChange={e => setObjetivo(idx, 'descripcion', e.target.value)}
                      placeholder="Describe en detalle el objetivo y los resultados esperados..."
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeSection === 3 && (
            <section className="section">
              <h2>3. Progreso - Mid Year Review</h2>
              <p className="section-desc">Evalúa el progreso a mitad del período</p>
              {form.midYearProgreso.map((prog, idx) => (
                <div key={idx} className="progreso-card">
                  <div className="progreso-header">
                    <span>Objetivo {prog.objetivoNumero}: {form.objetivos[idx]?.titulo || ''}</span>
                  </div>
                  <div className="form-grid three-col">
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={prog.estado}
                        onChange={e => setProgreso('midYearProgreso', idx, 'estado', e.target.value)}
                      >
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>% Cumplimiento</label>
                      <input
                        type="number"
                        value={prog.porcentajeCumplimiento}
                        onChange={e => setProgreso('midYearProgreso', idx, 'porcentajeCumplimiento', parseInt(e.target.value) || 0)}
                        min="0" max="100"
                      />
                    </div>
            </div>
                  <div className="form-group">
                    <label>Comentarios</label>
                    <textarea
                      value={prog.comentarios}
                      onChange={e => setProgreso('midYearProgreso', idx, 'comentarios', e.target.value)}
                      placeholder="Observaciones sobre el progreso..."
                    />
            </div>
          </div>
              ))}
              <div className="resultado-input">
                <label>Resultado parcial Objetivos SMART:</label>
                <input
                  type="number"
                  value={form.resultadoParcialSmart}
                  onChange={e => setField('resultadoParcialSmart', parseInt(e.target.value) || 0)}
                  min="0" max="100"
                />
                <span>%</span>
              </div>
            </section>
          )}

          {activeSection === 4 && (
            <section className="section">
              <h2>4. Progreso - Final Review</h2>
              <p className="section-desc">Evaluación final del período</p>
              {form.finalProgreso.map((prog, idx) => (
                <div key={idx} className="progreso-card">
                  <div className="progreso-header">
                    <span>Objetivo {prog.objetivoNumero}: {form.objetivos[idx]?.titulo || ''}</span>
            </div>
                  <div className="form-grid three-col">
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={prog.estado}
                        onChange={e => setProgreso('finalProgreso', idx, 'estado', e.target.value)}
                      >
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
                    <div className="form-group">
                      <label>% Cumplimiento</label>
                      <input
                        type="number"
                        value={prog.porcentajeCumplimiento}
                        onChange={e => setProgreso('finalProgreso', idx, 'porcentajeCumplimiento', parseInt(e.target.value) || 0)}
                        min="0" max="100"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comentarios</label>
                    <textarea
                      value={prog.comentarios}
                      onChange={e => setProgreso('finalProgreso', idx, 'comentarios', e.target.value)}
                      placeholder="Observaciones finales..."
                    />
                  </div>
                </div>
              ))}
              <div className="resultado-input">
                <label>Resultado final Objetivos SMART:</label>
                <input
                  type="number"
                  value={form.resultadoFinalSmart}
                  onChange={e => setField('resultadoFinalSmart', parseInt(e.target.value) || 0)}
                  min="0" max="100"
                />
                <span>%</span>
              </div>
            </section>
          )}

          {activeSection === 5 && (
            <section className="section">
              <h2>
                5. Core Values
                <a 
                  href="https://docs.google.com/document/d/18vuVQirtcTrpnjU0OUNDkTj7A3weIH5fO4s8IKByjR4/edit?tab=t.0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="info-icon"
                  title="Ver documento de Core Values"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </a>
              </h2>
              <p className="section-desc">Evalúa en una escala del 1 al 5</p>
              <div className="core-values-grid">
                {[
                  { key: 'resolvemosEficientemente', label: 'Resolvemos eficientemente' },
                  { key: 'somosTransparentes', label: 'Somos transparentes' },
                  { key: 'nosDesafiamos', label: 'Nos desafiamos para mejorar' },
                  { key: 'confiamosEnElOtro', label: 'Confiamos en el otro' }
                ].map(cv => (
                  <div key={cv.key} className="core-value-row">
                    <span className="cv-label">{cv.label}</span>
                    <div className="cv-options">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`cv-btn ${form[cv.key] === n ? 'active' : ''}`}
                          onClick={() => setField(cv.key, n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="resultado-box">
                Resultado Core Values: <strong>{calcularCoreValues()}/20</strong>
              </div>
            </section>
          )}

          {activeSection === 6 && (
            <section className="section">
              <h2>6. Áreas de Mejora</h2>
              <p className="section-desc">Identifica oportunidades de mejora según la performance resultante</p>
              <div className="escala-bono">
                <ul>
                  <li><strong>16 a 20</strong> - Accede al 100% del bono.</li>
                  <li><strong>13 a 15</strong> - Bono para acompañamiento y accede al 75% del bono.</li>
                  <li><strong>10 a 12</strong> - Accede al 50% del bono.</li>
                  <li><strong>Debajo de 10</strong> - No accede al bono.</li>
                </ul>
              </div>
              <div className="form-group">
                <label>Áreas de mejora identificadas</label>
                <textarea
                  value={form.areasMejora}
                  onChange={e => setField('areasMejora', e.target.value)}
                  placeholder="Describe las áreas donde el colaborador puede mejorar..."
                  rows={4}
                />
              </div>
              <h3>Plan de acción para mejorar</h3>
              <div className="form-group">
                <label>1.</label>
                <input value={form.planAccion1} onChange={e => setField('planAccion1', e.target.value)} placeholder="Primera acción de mejora" />
              </div>
              <div className="form-group">
                <label>2.</label>
                <input value={form.planAccion2} onChange={e => setField('planAccion2', e.target.value)} placeholder="Segunda acción de mejora" />
              </div>
              <div className="form-group">
                <label>3.</label>
                <input value={form.planAccion3} onChange={e => setField('planAccion3', e.target.value)} placeholder="Tercera acción de mejora" />
          </div>
            </section>
          )}

          {activeSection === 7 && (
            <section className="section">
              <h2>7. Feedback del colaborador</h2>
              <div className="form-group">
                <label>¿Qué opinas sobre tu desempeño hasta ahora?</label>
                <textarea
                  value={form.feedbackDesempeno}
                  onChange={e => setField('feedbackDesempeno', e.target.value)}
                  placeholder="Espacio para que el colaborador reflexione sobre su desempeño..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>¿Qué apoyo adicional necesitas para lograr tus objetivos?</label>
                <textarea
                  value={form.feedbackApoyo}
                  onChange={e => setField('feedbackApoyo', e.target.value)}
                  placeholder="Recursos, capacitación, herramientas que necesita..."
                  rows={4}
                />
          </div>
            </section>
          )}

          {activeSection === 8 && (
            <section className="section">
              <h2>8. Seguimiento</h2>
              <p className="section-desc">Próximos pasos y fechas</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha Bono proporcional</label>
                  <input value={form.fechaBonoProporcional} onChange={e => setField('fechaBonoProporcional', e.target.value)} placeholder="DD/MM/YYYY" />
                </div>
                <div className="form-group">
                  <label>Fecha Bono restante (final)</label>
                  <input value={form.fechaBonoFinal} onChange={e => setField('fechaBonoFinal', e.target.value)} placeholder="DD/MM/YYYY" />
                </div>
          </div>
            </section>
          )}

          <div className="form-actions">
            {activeSection > 1 && (
              <button type="button" className="btn btn-secondary" onClick={() => setActiveSection(s => s - 1)}>
                ← Anterior
              </button>
            )}
            {activeSection < 8 ? (
              <button type="button" className="btn btn-primary" onClick={() => setActiveSection(s => s + 1)}>
                Siguiente →
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Generando...' : 'Descargar PDF'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// Root App with Auth
export default function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return <PerformanceReview user={user} onLogout={handleLogout} />
}
