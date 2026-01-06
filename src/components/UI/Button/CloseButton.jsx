import styles from './CloseButton.module.scss';

function CloseButton({onClose}) {

    // const combinedHandler = () => {
    //     onClose();
    //     onChange();
    // };

    return (
        <div className={styles.closeButton_block}>
            <button onClick={() => onClose()} className={styles.closeButton} aria-label="Close" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
        </div>
    )
}

export default CloseButton;