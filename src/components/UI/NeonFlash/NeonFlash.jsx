import React, { useState, useEffect, useMemo } from 'react';
// 1. IMPORT styles as an object
import styles from './NeonFlash.module.scss';

// Utility component to render a word broken down into flickering letters
const FlickeringWord = ({ text, className }) => {
    // The state will be an array of booleans (true for 'flash-on', false for 'off')
    const initialFlashState = useMemo(() => Array.from(text).map(() => true), [text]);
    const [isLit, setIsLit] = useState(initialFlashState);

    useEffect(() => {
        const letters = Array.from(text);
        const checkInterval = 50; 

        const triggerRandomDim = (index) => {
            // High random chance (e.g., 1 in 200 letters per interval) of a momentary dim
            if (Math.random() < 0.005) {
                // 1. Flash OFF
                setIsLit(prevLit => prevLit.map((lit, i) => (i === index ? false : lit)));

                // 2. Flash ON after a short, random duration
                const dimDuration = 50 + Math.random() * 150;
                setTimeout(() => {
                    setIsLit(prevLit => prevLit.map((lit, i) => (i === index ? true : lit)));
                }, dimDuration);
            }
        };

        const intervalId = setInterval(() => {
            letters.forEach((_, index) => {
                // Only try to dim if the letter is currently lit
                if (isLit[index]) {
                    triggerRandomDim(index);
                }
            });
        }, checkInterval);

        // Cleanup function to clear the interval
        return () => clearInterval(intervalId);
    }, [text, isLit]); 

    // Render the letters
    return (
        // Combine the local 'word' class with the external color class (e.g., 'rock')
        <span className={`${styles.word} ${className}`}> 
            {Array.from(text).map((letter, index) => (
                <span
                    key={index}
                    // Apply 'flash-on' class from the imported styles object if lit
                    className={`${styles.letter} ${isLit[index] ? styles['flash-on'] : ''}`}
                >
                    {letter === ' ' ? '\u00A0' : letter}
                </span>
            ))}
        </span>
    );
};

// Main component that uses the FlickeringWord
const NeonFlash = () => {
    return (
        // Applying the background container styles using the styles object
        <div className={styles['neon-flash-app-container']}>
            <div className={styles['neon-container']}>
                {/* Note: Classes defining colors (rock, still, rolls) must be defined globally
                  or passed as plain strings because they are used by the child component's logic 
                  to select the correct CSS variable (--light-color). 
                  Since they only contain CSS variable definitions, keeping them as global/plain 
                  is acceptable, or you can prefix them if they are complex. 
                  I've kept them as plain strings as they only modify custom properties.
                */}
                <FlickeringWord text="ROCK" className={styles.rock} />
                <FlickeringWord text="STILL" className={styles.still} />
                <FlickeringWord text="ROLLS" className={styles.rolls} />
            </div>
        </div>
    );
};

export default NeonFlash;