import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
    const [tickers, setTickers] = useState([]);
    const [selected, setSelected] = useState('');
    const [data, setData] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [range, setRange] = useState({ from: '2024-01-01', till: '2024-12-31' });

    // 1. Загрузка списка тикеров при инициализации
    useEffect(() => {
        const fetchTickers = async () => {
            try {
                console.log("Запрос тикеров к API...");
                const res = await axios.get('http://localhost:8081/stock/api/getTickers');

                if (Array.isArray(res.data) && res.data.length > 0) {
                    setTickers(res.data);
                    setSelected(res.data[0]);
                }
            } catch (err) {
                console.error("Не удалось загрузить тикеры:", err);
            }
        };
        fetchTickers();
    }, []);

    // 2. Загрузка данных свечей и запуск анализа
    const loadChart = async () => {
        if (!selected) return;
        try {
            // Получаем свечи
            const res = await axios.get('http://localhost:8081/stock/api/getCandles', {
                params: { secid: selected, from: range.from, till: range.till }
            });
            console.log("Данные свечей получены:", res.data[0]); // Проверка полей в консоли
            setData(res.data);

            // Получаем анализ
            const analysisRes = await axios.get('http://localhost:8081/stock/api/analyzeCandles', {
                params: { secid: selected, from: range.from, till: range.till }
            });
            setAnalysis(analysisRes.data[0]);
        } catch (err) {
            console.error("Ошибка при обновлении данных:", err);
            alert("Ошибка загрузки данных. Проверьте соединение с сервером.");
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h1 style={{ marginTop: 0, color: '#333' }}>Аналитика MOEX</h1>

                {/* Панель фильтров */}
                <div style={{ marginBottom: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Инструмент:</label>
                        <select value={selected} onChange={e => setSelected(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '120px' }}>
                            {tickers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Начало:</label>
                        <input type="date" value={range.from} onChange={e => setRange({...range, from: e.target.value})} style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Конец:</label>
                        <input type="date" value={range.till} onChange={e => setRange({...range, till: e.target.value})} style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                    </div>
                    <button onClick={loadChart} style={{ padding: '10px 25px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>
                        Обновить данные
                    </button>
                </div>

                {/* Результаты анализа */}
                {analysis && (
                    <div style={{ marginBottom: '25px', padding: '15px 20px', backgroundColor: '#f8f9fa', borderLeft: '5px solid #007bff', borderRadius: '4px' }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>Результат анализа {selected}:</h4>
                        <p style={{ margin: 0, color: '#555' }}>
                            Данные успешно обработаны сервисом MoexAnalysisService.
                        </p>
                    </div>
                )}

                {/* График */}
                <div style={{ width: '100%', height: 450, marginTop: '10px' }}>
                    {data.length > 0 ? (
                        <ResponsiveContainer>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis
                                    dataKey="TRADEDATE"
                                    tick={{fontSize: 11, fill: '#666'}}
                                    minTickGap={30}
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    tick={{fontSize: 12, fill: '#666'}}
                                    orientation="right"
                                />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="top" height={36}/>
                                <Line
                                    type="monotone"
                                    dataKey="CLOSE"
                                    stroke="#007bff"
                                    strokeWidth={3}
                                    name="Цена закрытия"
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="HIGH"
                                    stroke="#28a745"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    name="Максимум (High)"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999', border: '2px dashed #eee', borderRadius: '12px' }}>
                            Нет данных для отображения. Выберите параметры и нажмите "Обновить".
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;