import React from 'react';
import styles from'./FeedbackSubmitButton.module.scss';

function FeedbackSubmitButton({text = "Submit", disabled = false, onClick, type = "submit"}) {
    return (
        <button
            className={styles.material_button}
            type={type}
            disabled={disabled}
            onClick={onClick}
        >
            {/* The primary text */}
            {text}
        </button>
    );
};

export default FeedbackSubmitButton;