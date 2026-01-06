import React from 'react';
import './LoadingSpinner.module.scss';

const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <div className="spinner-container">
                <div className="spinner"></div>
                <p className="loading-text">Загрузка...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;