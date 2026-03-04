import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', pass: '', confirmPass: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Подготавливаем данные под твои Java модели
        const payload = isLogin
            ? { email: formData.email, password: formData.pass } // Для LoginRequest
            : { name: formData.name, email: formData.email, pass: formData.pass, confirmPass: formData.confirmPass }; // Для UserDto

        try {
            const url = `http://localhost:8081/api/auth/${isLogin ? 'login' : 'register'}`;
            await axios.post(url, payload);
            if (isLogin) navigate('/dashboard');
            else { alert("Регистрация успешна! Теперь войдите."); setIsLogin(true); }
        } catch (err) {
            alert("Ошибка: " + (err.response?.data || "Проверьте данные"));
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!isLogin && <input placeholder="Имя" onChange={e => setFormData({...formData, name: e.target.value})} />}
                <input placeholder="Email" type="email" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input placeholder="Пароль" type="password" onChange={e => setFormData({...formData, pass: e.target.value})} />
                {!isLogin && <input placeholder="Повторите пароль" type="password" onChange={e => setFormData({...formData, confirmPass: e.target.value})} />}
                <button type="submit">{isLogin ? 'Войти' : 'Создать аккаунт'}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
                {isLogin ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
            </button>
        </div>
    );
};

export default Login;