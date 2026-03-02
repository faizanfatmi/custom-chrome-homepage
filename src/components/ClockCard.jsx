import { useClock } from '../hooks/useClock';

export default function ClockCard() {
    const { time, date } = useClock();

    return (
        <div className="card clock-card">
            <div className="card-title">Clock</div>
            <div className="card-body">
                <div className="clock-time">{time || '--:--:--'}</div>
                <div className="clock-date">{date || 'Loading date…'}</div>
            </div>
        </div>
    );
}
