'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  score: number; // 0-5
  maxStars?: number;
  size?: number;
  showScore?: boolean;
}

export default function StarRating({ score, maxStars = 5, size = 20, showScore = true }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const filled = score >= i + 1;
          const half = !filled && score > i && score < i + 1;
          return (
            <div key={i} className="relative">
              <Star
                size={size}
                className="text-gray-200"
                fill="#e5e7eb"
                strokeWidth={0}
              />
              {(filled || half) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : `${(score - i) * 100}%` }}
                >
                  <Star
                    size={size}
                    className="text-yellow-400"
                    fill="#facc15"
                    strokeWidth={0}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showScore && (
        <span className="text-sm font-bold text-gray-700 ml-1">{score.toFixed(1)}</span>
      )}
    </div>
  );
}
