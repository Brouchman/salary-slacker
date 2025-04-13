import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isSameWeek(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const startOfWeek = (d) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  return startOfWeek(d1).toDateString() === startOfWeek(d2).toDateString();
}

function isSameMonth(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

function App() {
  const [salary, setSalary] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [earned, setEarned] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [history, setHistory] = useState([]);
  const [goalHours, setGoalHours] = useState(2);
  const intervalRef = useRef(null);

  const handleDelete = (indexToDelete) => {
    const updated = history.filter((_, i) => i !== indexToDelete);
    setHistory(updated);
    localStorage.setItem('slacker-history', JSON.stringify(updated));
  };

  const getRatePerSecond = () => {
    const monthly = parseFloat(salary);
    return monthly / 30 / 8 / 60 / 60;
  };

  const startTimer = () => {
    const monthly = parseFloat(salary);
    if (isNaN(monthly) || monthly <= 0) {
      alert("請輸入有效的月薪！");
      return;
    }

    if (isRunning) return;

    const rate = getRatePerSecond();

    intervalRef.current = setInterval(() => {
      setEarned(prev => prev + rate);
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    setIsRunning(true);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    if (elapsedSeconds > 0) {
      const record = {
        timestamp: new Date().toISOString(),
        earned: parseFloat(earned.toFixed(2)),
        seconds: elapsedSeconds,
      };

      const updatedHistory = [...history, record];
      setHistory(updatedHistory);
      localStorage.setItem('slacker-history', JSON.stringify(updatedHistory));
    }
  };

  const reset = () => {
    stopTimer();
    setEarned(0);
    setElapsedSeconds(0);
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem('slacker-history');
    if (stored) {
      setHistory(JSON.parse(stored));
    }

    return () => clearInterval(intervalRef.current);
  }, []);

  const today = new Date();

  const todayStats = history.filter(item =>
    isSameDay(new Date(item.timestamp), today)
  );
  const weekStats = history.filter(item =>
    isSameWeek(new Date(item.timestamp), today)
  );
  const monthStats = history.filter(item =>
    isSameMonth(new Date(item.timestamp), today)
  );

  const sumStats = (list) => ({
    earned: list.reduce((acc, cur) => acc + cur.earned, 0),
    seconds: list.reduce((acc, cur) => acc + cur.seconds, 0),
  });

  return (
    <div className="container">
      <h1 className="header-alert">
            🛑 警報 🛑<br />
        ！有人正在爽! 
        </h1>

      <div className="input-group">
        <label style={{ color: '#0f172a' }}>月薪（NTD）</label>
        <input
          type="number"
          placeholder="例如：40000"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          disabled={isRunning}
          style={{ textAlign: 'center' }}
        />
      </div>

      <div className="input-group">
        <label style={{ color: '#0f172a' }}>目標摸魚時間（小時）</label>
        <input
          type="number"
          value={goalHours}
          onChange={(e) => setGoalHours(parseFloat(e.target.value))}
          min="0"
          step="0.1"
          style={{ textAlign: 'center' }}
        />
      </div>

      <div className="button-group">
        {!isRunning ? (
          <button onClick={startTimer}>開始摸魚</button>
        ) : (
          <button onClick={stopTimer}>結束摸魚</button>
        )}
        <button onClick={reset} style={{ backgroundColor: '#64748b' }}>
          重設
        </button>
      </div>

      <div className="timer-display">
        {isRunning ? '🟢 正在摸魚中...' : '⏸️ 摸魚暫停中'}
        <br />
        ⏱️ 時間：<strong>{formatTime(elapsedSeconds)}</strong>
        <br />
        💸 偷得：<strong>${earned.toFixed(2)}</strong> 元
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <h2 className='title-section'>🎯 今日偷薪達成率</h2>
      <div style={{
        backgroundColor: '#e2e8f0',
        borderRadius: '1rem',
        overflow: 'hidden',
        height: '1.5rem',
        width: '100%',
        marginBottom: '0.5rem',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min((sumStats(todayStats).seconds / (goalHours * 60 * 60)) * 100, 100)}%`,
          background: (sumStats(todayStats).seconds / (goalHours * 60 * 60)) >= 1
            ? '#ef4444'
            : 'linear-gradient(to right, #10b981, #3b82f6)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <p className="goal-percentage">
        {(sumStats(todayStats).seconds / (goalHours * 60 * 60) * 100).toFixed(1)}%（目標：{goalHours} 小時）
      </p>

      <h2 className="title-section">📊 摸魚統計總覽</h2>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: '今天', data: sumStats(todayStats), color: '#fef3c7' },
          { label: '本週', data: sumStats(weekStats), color: '#bfdbfe' },
          { label: '本月', data: sumStats(monthStats), color: '#ddd6fe' }
        ].map(({ label, data, color }) => (
          <div key={label} style={{
            background: color,
            padding: '1rem',
            borderRadius: '0.75rem',
            minWidth: '150px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            color: '#1e293b',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            ':hover':{
              background: '#bfdbfe',
            }
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{label}</div>
            <p>💸 {data.earned.toFixed(2)} 元</p>
            <p>⏱ {formatTime(data.seconds)}</p>
          </div>
        ))}
      </div>

      <h2 className='title-section'>📈 摸魚歷史紀錄</h2>
      {history.length === 0 ? (
        <p>目前還沒有紀錄喔～快去摸一波 🐟</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history.map((item, index) => ({
            name: `爽${index + 1}次`,
            earned: item.earned,
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="元" />
            <Tooltip />
            <Line type="monotone" dataKey="earned" stroke="#f97316" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}

      <h3 className='title-section'>📜 摸魚詳細紀錄</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {history.map((item, index) => (
          <li key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0f172a',
            padding: '0.5rem 1rem',
            marginBottom: '0.5rem',
            borderRadius: '0.5rem'
          }}>
            <span>
              {new Date(item.timestamp).toLocaleString()} - 💸 {item.earned.toFixed(2)} 元 - ⏱ {formatTime(item.seconds)}
            </span>
            <button
              onClick={() => handleDelete(index)}
              style={{
                backgroundColor: '#ef4444',
                color: '#333333',
                border: 'none',
                padding: '0.3rem 0.6rem',
                borderRadius: '0.3rem',
                cursor: 'pointer'
              }}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
