import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './App.css';

const API = '';
axios.defaults.withCredentials = true;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// --- ЗАЩИТА РОУТА ---
const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

// --- СТРАНИЦА ЛОГИНА ---
const Login = ({ setAuth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', pass: '', confirmPass: '' });
    const [pendingEmail, setPendingEmail] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const switchMode = (login) => { setIsLogin(login); setError(''); setSuccess(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const payload = isLogin
            ? { email: formData.email, password: formData.pass }
            : { name: formData.name, email: formData.email, pass: formData.pass, confirmPass: formData.confirmPass };

        try {
            const url = `${API}/api/auth/${isLogin ? 'login' : 'register'}`;
            await axios.post(url, payload);
            if (isLogin) {
                setAuth(true);
                localStorage.setItem('isAuthenticated', 'true');
                navigate('/dashboard');
            } else {
                setPendingEmail(formData.email);
            }
        } catch (err) {
            const data = err.response?.data;
            setError(typeof data === 'string' ? data : data?.message || data?.error || "Проверьте данные");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API}/api/auth/verify`, { email: pendingEmail, code });
            setPendingEmail(null);
            setIsLogin(true);
            setSuccess("Регистрация завершена! Войдите в аккаунт.");
        } catch (err) {
            const data = err.response?.data;
            setError(typeof data === 'string' ? data : data?.message || data?.error || "Ошибка верификации");
        } finally {
            setLoading(false);
        }
    };

    if (pendingEmail) {
        return (
            <div className="auth-card">
                <h2 className="auth-title">Подтверждение email</h2>
                <p className="auth-hint">Код отправлен на <strong>{pendingEmail}</strong>. Введите его ниже.</p>
                {error && <div className="form-message error">{error}</div>}
                <form onSubmit={handleVerify} className="auth-form">
                    <input
                        className="auth-input code-input"
                        placeholder="000000"
                        value={code}
                        onChange={e => { setCode(e.target.value); setError(''); }}
                        maxLength={6}
                    />
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Проверка...' : 'Подтвердить'}
                    </button>
                </form>
                <button onClick={() => { setPendingEmail(null); setError(''); }} className="auth-link">← Назад</button>
            </div>
        );
    }

    return (
        <div className="auth-card">
            <h2 className="auth-title">{isLogin ? 'Вход в систему' : 'Регистрация'}</h2>
            {error && <div className="form-message error">{error}</div>}
            {success && <div className="form-message success">{success}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && <input className="auth-input" placeholder="Имя" onChange={e => { setFormData({...formData, name: e.target.value}); setError(''); }} />}
                <input className="auth-input" placeholder="Email" type="email" required onChange={e => { setFormData({...formData, email: e.target.value}); setError(''); }} />
                <input className="auth-input" placeholder="Пароль" type="password" required onChange={e => { setFormData({...formData, pass: e.target.value}); setError(''); }} />
                {!isLogin && <input className="auth-input" placeholder="Повторите пароль" type="password" onChange={e => { setFormData({...formData, confirmPass: e.target.value}); setError(''); }} />}
                <button type="submit" disabled={loading} className="auth-btn">
                    {loading ? 'Отправка...' : isLogin ? 'Войти' : 'Создать аккаунт'}
                </button>
            </form>
            <button onClick={() => switchMode(!isLogin)} className="auth-link">
                {isLogin ? 'Еще нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
            <div className="auth-divider"><span>или</span></div>
            <a href="/api/oauth2/authorization/google" className="auth-btn google-btn">
                <svg width="18" height="18" viewBox="0 0 48 48" style={{marginRight: '8px', flexShrink: 0}}>
                    <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.08 29.5 1 24 1 14.82 1 7.07 6.48 3.69 14.22l7.07 5.49C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.42c-.54 2.93-2.17 5.41-4.62 7.08l7.12 5.53C43.18 37.28 46.1 31.36 46.1 24.5z"/>
                    <path fill="#FBBC05" d="M10.76 28.29A14.5 14.5 0 0 1 9.5 24c0-1.49.26-2.93.72-4.29L3.15 14.22A23 23 0 0 0 1 24c0 3.72.87 7.23 2.42 10.35l7.34-6.06z"/>
                    <path fill="#34A853" d="M24 47c6.48 0 11.93-2.14 15.9-5.82l-7.12-5.53c-2.17 1.45-4.95 2.35-8.78 2.35-6.26 0-11.57-4.22-13.24-9.71l-7.07 5.49C7.07 41.52 14.82 47 24 47z"/>
                </svg>
                Войти через Google
            </a>
        </div>
    );
};

// --- ТУЛТИП ДЛЯ ГРАФИКА ---
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-date">{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
                    {p.name}: <strong>{p.value?.toFixed(2)}</strong>
                </p>
            ))}
        </div>
    );
};

// --- КАРТОЧКА СТАТИСТИКИ ---
const StatCard = ({ ticker, stats, color }) => {
    const pct = stats.priceChangePercent;
    const change = stats.priceChange;
    const isPositive = change >= 0;
    return (
        <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
            <div className="stat-card-header">
                <span className="stat-ticker" style={{ color }}>{ticker}</span>
                <span className={`stat-badge ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{pct.toFixed(2)}%
                </span>
            </div>
            <div className="stat-rows">
                <div className="stat-row"><span>Средняя цена</span><strong>{stats.avgClose.toFixed(2)}</strong></div>
                <div className="stat-row"><span>Максимум</span><strong>{stats.maxClose.toFixed(2)}</strong></div>
                <div className="stat-row"><span>Минимум</span><strong>{stats.minClose.toFixed(2)}</strong></div>
                <div className="stat-row">
                    <span>Изменение</span>
                    <strong className={isPositive ? 'positive' : 'negative'}>
                        {isPositive ? '+' : ''}{change.toFixed(2)}
                    </strong>
                </div>
                <div className="stat-row"><span>Торговых дней</span><strong>{stats.days}</strong></div>
            </div>
        </div>
    );
};

// --- ДАШБОРД ---
const Dashboard = ({ setAuth }) => {
    const [tickers, setTickers] = useState([]);
    const [selected, setSelected] = useState([]);
    const [range, setRange] = useState({ from: '2024-01-01', till: '2024-12-31' });
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('combined');
    const [notification, setNotification] = useState(null); // {type:'error'|'success', msg:''}
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [exporting, setExporting] = useState(false);
    const chartAreaRef = useRef(null);
    const navigate = useNavigate();

    const showNotification = (type, msg) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleLogout = () => {
        setAuth(false);
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${API}/api/auth/account`);
            setAuth(false);
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
        } catch (err) {
            setConfirmDelete(false);
            const data = err.response?.data;
            showNotification('error', typeof data === 'string' ? data : 'Не удалось удалить аккаунт.');
        }
    };

    useEffect(() => {
        axios.get(`${API}/stock/api/getTickers`)
            .then(res => {
                setTickers(res.data);
                if (res.data.length > 0) setSelected([res.data[0]]);
            })
            .catch(err => {
                if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
            });
    }, []);

    const toggleTicker = (ticker) => {
        setSelected(prev =>
            prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
        );
    };

    const loadData = async () => {
        if (selected.length === 0) return;
        setLoading(true);
        try {
            const params = (secid) => ({ params: { secid, from: range.from, till: range.till } });

            const [candleResults, analysisResults] = await Promise.all([
                Promise.all(selected.map(t =>
                    axios.get(`${API}/stock/api/getCandles`, params(t)).then(r => ({ ticker: t, data: r.data }))
                )),
                Promise.all(selected.map(t =>
                    axios.get(`${API}/stock/api/analyzeCandles`, params(t)).then(r => ({ ticker: t, data: r.data[0] }))
                )),
            ]);

            // Объединяем данные по дате
            const dateMap = new Map();
            candleResults.forEach(({ ticker, data }) => {
                data.forEach(candle => {
                    if (!dateMap.has(candle.TRADEDATE)) {
                        dateMap.set(candle.TRADEDATE, { date: candle.TRADEDATE });
                    }
                    dateMap.get(candle.TRADEDATE)[ticker] = candle.CLOSE;
                });
            });
            const merged = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
            setChartData(merged);

            const statsObj = {};
            analysisResults.forEach(({ ticker, data }) => { statsObj[ticker] = data; });
            setStats(statsObj);
        } catch {
            showNotification('error', 'Ошибка загрузки данных. Проверьте соединение с сервером.');
        } finally {
            setLoading(false);
        }
    };

    const exportToPdf = async () => {
        if (!chartAreaRef.current) return;
        setExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');
            const canvas = await html2canvas(chartAreaRef.current, { scale: 2, useCORS: true, backgroundColor: '#f5f6fa' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
            pdf.save(`moex_${selected.join('-')}_${range.from}_${range.till}.pdf`);
        } catch {
            showNotification('error', 'Не удалось сохранить PDF.');
        } finally {
            setExporting(false);
        }
    };

    const fmtDate = d =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const setPrevWeek = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun
        const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - daysToLastMonday - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        setRange({ from: fmtDate(lastMonday), till: fmtDate(lastSunday) });
    };

    const setPrevMonth = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        setRange({ from: fmtDate(firstDay), till: fmtDate(lastDay) });
    };

    const getTickerData = (ticker) =>
        chartData
            .map(d => ({ date: d.date, CLOSE: d[ticker] }))
            .filter(d => d.CLOSE !== undefined);

    const hasData = chartData.length > 0;

    return (
        <div className="dashboard">
            <header className="dash-header">
                <div className="dash-header-left">
                    <span className="dash-logo">MOEX</span>
                    <span className="dash-title">Аналитика</span>
                </div>
                <div className="dash-header-actions">
                    {confirmDelete ? (
                        <div className="delete-confirm">
                            <span className="delete-confirm-text">Вы уверены?</span>
                            <button className="btn-danger" onClick={handleDeleteAccount}>Да, удалить</button>
                            <button className="btn-cancel" onClick={() => setConfirmDelete(false)}>Отмена</button>
                        </div>
                    ) : (
                        <>
                            <button className="btn-logout" onClick={handleLogout}>Выход</button>
                            <button className="btn-delete-account" onClick={() => setConfirmDelete(true)}>Удалить аккаунт</button>
                        </>
                    )}
                </div>
            </header>
            {notification && (
                <div className={`notification ${notification.type}`}>
                    <span>{notification.msg}</span>
                    <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
                </div>
            )}

            <div className="dash-body">
                {/* Сайдбар */}
                <aside className="sidebar">
                    <div className="sidebar-section">
                        <h4 className="sidebar-label">Инструменты</h4>
                        <div className="ticker-list">
                            {tickers.map((t, i) => (
                                <label
                                    key={t}
                                    className={`ticker-item ${selected.includes(t) ? 'active' : ''}`}
                                    style={selected.includes(t) ? { borderColor: COLORS[selected.indexOf(t) % COLORS.length] } : {}}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(t)}
                                        onChange={() => toggleTicker(t)}
                                    />
                                    <span
                                        className="ticker-dot"
                                        style={{ background: selected.includes(t) ? COLORS[selected.indexOf(t) % COLORS.length] : '#ccc' }}
                                    />
                                    {t}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h4 className="sidebar-label">Период</h4>
                        <div className="period-presets">
                            <button className="btn-preset" onClick={setPrevWeek}>Прошлая неделя</button>
                            <button className="btn-preset" onClick={setPrevMonth}>Прошлый месяц</button>
                        </div>
                        <label className="date-label">С</label>
                        <input
                            type="date"
                            className="date-input"
                            value={range.from}
                            onChange={e => setRange({ ...range, from: e.target.value })}
                        />
                        <label className="date-label">По</label>
                        <input
                            type="date"
                            className="date-input"
                            value={range.till}
                            onChange={e => setRange({ ...range, till: e.target.value })}
                        />
                    </div>

                    <button
                        className="btn-load"
                        onClick={loadData}
                        disabled={loading || selected.length === 0}
                    >
                        {loading ? (
                            <span className="loading-dots">Загрузка<span>.</span><span>.</span><span>.</span></span>
                        ) : 'Загрузить данные'}
                    </button>

                    {hasData && (
                        <>
                            <div className="view-toggle">
                                <button
                                    className={viewMode === 'combined' ? 'active' : ''}
                                    onClick={() => setViewMode('combined')}
                                >Совмещённый</button>
                                <button
                                    className={viewMode === 'individual' ? 'active' : ''}
                                    onClick={() => setViewMode('individual')}
                                >Раздельный</button>
                            </div>
                            <button className="btn-export" onClick={exportToPdf} disabled={exporting}>
                                {exporting ? 'Экспорт...' : 'Скачать PDF'}
                            </button>
                        </>
                    )}
                </aside>

                {/* Основной контент */}
                <main className="main-content" ref={chartAreaRef}>
                    {!hasData ? (
                        <div className="empty-state">
                            <div className="empty-icon">📈</div>
                            <p>Выберите инструменты и нажмите «Загрузить данные»</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'combined' ? (
                                <div className="chart-card">
                                    <div className="chart-card-header">
                                        <h2>Сравнение: {selected.join(' / ')}</h2>
                                        <span className="chart-subtitle">Цена закрытия</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={420}>
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} minTickGap={50} />
                                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#888' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            {selected.map((t, i) => (
                                                <Line
                                                    key={t}
                                                    type="monotone"
                                                    dataKey={t}
                                                    stroke={COLORS[i % COLORS.length]}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 5 }}
                                                    connectNulls
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="individual-charts">
                                    {selected.map((t, i) => (
                                        <div key={t} className="chart-card">
                                            <div className="chart-card-header">
                                                <h2 style={{ color: COLORS[i % COLORS.length] }}>{t}</h2>
                                                <span className="chart-subtitle">Цена закрытия</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <LineChart data={getTickerData(t)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} minTickGap={50} />
                                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#888' }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="CLOSE"
                                                        stroke={COLORS[i % COLORS.length]}
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        activeDot={{ r: 5 }}
                                                        name={t}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Карточки статистики */}
                            {Object.keys(stats).length > 0 && (
                                <div className="stats-section">
                                    <h3 className="stats-title">Статистика за период</h3>
                                    <div className="stats-grid">
                                        {selected.map((t, i) => stats[t] && (
                                            <StatCard
                                                key={t}
                                                ticker={t}
                                                stats={stats[t]}
                                                color={COLORS[i % COLORS.length]}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- РОУТЕР ---
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );
    const [authChecked, setAuthChecked] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );

    useEffect(() => {
        if (authChecked) return;
        axios.get('/api/auth/me').then(() => {
            localStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
        }).catch(() => {
            localStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
        }).finally(() => setAuthChecked(true));
    }, []);

    if (!authChecked) return null;

    return (
        <Router>
            <Routes>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" /> : <Login setAuth={setIsAuthenticated} />
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <Dashboard setAuth={setIsAuthenticated} />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}
