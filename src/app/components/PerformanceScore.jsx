// src/app/components/PerformanceScore.jsx
'use client';

const PerformanceScore = ({ score, lcp, cls }) => {
    const getColor = (value) => {
        if (value >= 90) return 'text-green-500';
        if (value >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="text-center">
            <div className={`text-6xl font-bold ${getColor(score)}`}>{score}</div>
            <div className="text-sm font-medium text-gray-500">Performance Score</div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="font-semibold text-gray-800">{lcp}</div>
                    <div className="text-gray-500">LCP</div>
                </div>
                <div>
                    <div className="font-semibold text-gray-800">{cls}</div>
                    <div className="text-gray-500">CLS</div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceScore;
