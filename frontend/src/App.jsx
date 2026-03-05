import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './App.css';

const API = '';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// --- ЗАЩИТА РОУТА ---
const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

// --- СТРАНИЦА ЛОГИНА (не изменять) ---
const Login = ({ setAuth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', pass: '', confirmPass: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                alert("Регистрация успешна! Теперь войдите.");
                setIsLogin(true);
            }
        } catch (err) {
            alert("Ошибка: " + (err.response?.data || "Проверьте данные"));
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', fontFamily: 'Arial' }}>
            <h2>{isLogin ? 'Вход в систему' : 'Регистрация'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!isLogin && <input placeholder="Имя" onChange={e => setFormData({...formData, name: e.target.value})} style={{padding: '8px'}} />}
                <input placeholder="Email" type="email" required onChange={e => setFormData({...formData, email: e.target.value})} style={{padding: '8px'}} />
                <input placeholder="Пароль" type="password" required onChange={e => setFormData({...formData, pass: e.target.value})} style={{padding: '8px'}} />
                {!isLogin && <input placeholder="Повторите пароль" type="password" onChange={e => setFormData({...formData, confirmPass: e.target.value})} style={{padding: '8px'}} />}
                <button type="submit" style={{padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px'}}>
                    {isLogin ? 'Войти' : 'Создать аккаунт'}
                </button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>
                {isLogin ? 'Еще нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
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
    const [chartData, setChartData] = useState([]);    // [{date, SBER: 280, GAZP: 150, ...}]
    const [stats, setStats] = useState({});            // {SBER: AnalysisResult, ...}
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('combined'); // 'combined' | 'individual'
    const navigate = useNavigate();

    const handleLogout = () => {
        setAuth(false);
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
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
            alert("Ошибка загрузки данных. Проверьте соединение с сервером.");
        } finally {
            setLoading(false);
        }
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
                <button className="btn-logout" onClick={handleLogout}>Выход</button>
            </header>

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
                    )}
                </aside>

                {/* Основной контент */}
                <main className="main-content">
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
