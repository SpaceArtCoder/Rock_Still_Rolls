import React, { useState, useEffect, useMemo } from 'react';
import styles from './NeonFlash.module.scss';

/**
 * Компонент для отображения слова с мерцающими буквами (неоновый эффект)
 * @param {Object} props - Свойства компонента
 * @param {string} props.text - Текст для отображения
 * @param {string} props.className - CSS класс для стилизации цвета
 */
const FlickeringWord = ({ text, className }) => {
    // Инициализируем массив состояний для каждой буквы (true - светится, false - погашена)
    const initialFlashState = useMemo(() => 
        Array.from(text).map(() => true), 
        [text]
    );
    
    const [isLit, setIsLit] = useState(initialFlashState);

    useEffect(() => {
        const letters = Array.from(text);
        const checkInterval = 50; // Интервал проверки в миллисекундах

        /**
         * Запускает случайное потухание буквы
         * @param {number} index - Индекс буквы в слове
         */
        const triggerRandomDim = (index) => {
            // Вероятность потухания: 0.5% за каждый интервал проверки
            if (Math.random() < 0.005) {
                // 1. Гасим букву
                setIsLit(prevLit => 
                    prevLit.map((lit, i) => (i === index ? false : lit))
                );

                // 2. Включаем букву через случайный промежуток времени
                const dimDuration = 50 + Math.random() * 150;
                setTimeout(() => {
                    setIsLit(prevLit => 
                        prevLit.map((lit, i) => (i === index ? true : lit))
                    );
                }, dimDuration);
            }
        };

        // Устанавливаем интервал для проверки и потухания букв
        const intervalId = setInterval(() => {
            letters.forEach((_, index) => {
                // Пытаемся погасить только те буквы, которые сейчас горят
                if (isLit[index]) {
                    triggerRandomDim(index);
                }
            });
        }, checkInterval);

        // Очистка интервала при размонтировании компонента
        return () => clearInterval(intervalId);
    }, [text, isLit]);

    // Рендерим буквы слова
    return (
        <span className={`${styles.word} ${className}`}>
            {Array.from(text).map((letter, index) => (
                <span
                    key={index}
                    className={`${styles.letter} ${isLit[index] ? styles['flash-on'] : ''}`}
                >
                    {letter === ' ' ? '\u00A0' : letter}
                </span>
            ))}
        </span>
    );
};

/**
 * Основной компонент NeonFlash
 * Отображает три слова с неоновым мерцающим эффектом
 */
const NeonFlash = () => {
    return (
        <div className={styles['neon-flash-app-container']}>
            <div className={styles['neon-container']}>
                {/* Слово "ROCK" с классом для цвета */}
                <FlickeringWord text="ROCK" className={styles.rock} />
                
                {/* Слово "STILL" с классом для цвета */}
                <FlickeringWord text="STILL" className={styles.still} />
                
                {/* Слово "ROLLS" с классом для цвета */}
                <FlickeringWord text="ROLLS" className={styles.rolls} />
            </div>
        </div>
    );
};

export default NeonFlash;
