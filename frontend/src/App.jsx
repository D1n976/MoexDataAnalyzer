import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- КОМПОНЕНТ ЗАЩИТЫ (HOC) ---
// Если пользователь не авторизован, этот компонент перенаправит его на логин
const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// --- СТРАНИЦА ЛОГИНА ---
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
            const url = `http://localhost:8081/api/auth/${isLogin ? 'login' : 'register'}`;
            await axios.post(url, payload);

            if (isLogin) {
                // 1. Устанавливаем флаг авторизации
                setAuth(true);
                localStorage.setItem('isAuthenticated', 'true'); // сохраняем после перезагрузки
                // 2. Переходим на дашборд
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

// --- СТРАНИЦА DASHBOARD ---
const Dashboard = ({ setAuth }) => {
    const [tickers, setTickers] = useState([]);
    const [selected, setSelected] = useState('');
    const [data, setData] = useState([]);
    const [range, setRange] = useState({ from: '2024-01-01', till: '2024-03-01' });
    const navigate = useNavigate();

    const handleLogout = () => {
        setAuth(false);
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    useEffect(() => {
        axios.get('http://localhost:8081/stock/api/getTickers')
            .then(res => {
                setTickers(res.data);
                if (res.data.length > 0) setSelected(res.data[0]);
            })
            .catch(err => {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    handleLogout(); // Выкидываем, если сессия на бэкенде умерла
                }
            });
    }, []);

    const loadChart = async () => {
        if (!selected) return;
        try {
            const res = await axios.get('http://localhost:8081/stock/api/getCandles', {
                params: { secid: selected, from: range.from, till: range.till }
            });
            setData(res.data);
        } catch (err) {
            alert("Ошибка при загрузке данных графика");
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h1>Аналитика MOEX</h1>
                <button onClick={handleLogout} style={{ padding: '5px 15px', height: '35px', marginTop: '20px', cursor: 'pointer' }}>Выход</button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                <div>
                    <label>Тикер:</label><br/>
                    <select value={selected} onChange={e => setSelected(e.target.value)} style={{padding: '5px'}}>
                        {tickers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label>От:</label><br/>
                    <input type="date" value={range.from} onChange={e => setRange({...range, from: e.target.value})} style={{padding: '4px'}} />
                </div>
                <div>
                    <label>До:</label><br/>
                    <input type="date" value={range.till} onChange={e => setRange({...range, till: e.target.value})} style={{padding: '4px'}} />
                </div>
                <button onClick={loadChart} style={{padding: '6px 20px', cursor: 'pointer'}}>Показать график</button>
            </div>

            <div style={{ width: '100%', height: 450, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="TRADEDATE" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="CLOSE" stroke="#8884d8" strokeWidth={2} name="Цена закрытия" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- ОСНОВНОЙ РОУТЕР ---
export default function App() {
    // Проверяем состояние при загрузке страницы
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );

    return (
        <Router>
            <Routes>
                {/* Если залогинен — редирект на дашборд */}
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" /> : <Login setAuth={setIsAuthenticated} />
                } />

                {/* Защищенный путь */}
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