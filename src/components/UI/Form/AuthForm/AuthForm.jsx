import styles from './AuthForm.module.scss';

/**
 * Компонент формы авторизации
 * Содержит поля для ввода юридической информации и цифровой подписи
 */
function AuthForm() {
    return (
        <form id="authorization-form" action="/submit-authorization" method="post">
            {/* Заголовок формы */}
            <h2>Legal Authorization & Agreement</h2>

            {/* Поле для ввода полного имени */}
            <div className="form-group">
                <label htmlFor="full-name">Full Legal Name *</label>
                <input 
                    type="text" 
                    id="full-name" 
                    name="authorized_name" 
                    autoComplete="name"
                    required
                />
            </div>

            {/* Поле для ввода email */}
            <div className="form-group">
                <label htmlFor="auth-email">Email Address *</label>
                <input 
                    type="email" 
                    id="auth-email" 
                    name="client_email" 
                    autoComplete="email"
                    required
                />
            </div>

            {/* Область для цифровой подписи */}
            <div className="form-group signature-area">
                <label htmlFor="e-signature">Digital Signature *</label>
                <div 
                    id="signature-pad-placeholder" 
                    style={{ border: '1px solid #ccc', height: '150px' }}
                >
                    {/* Здесь будет размещен компонент подписи */}
                </div>
                <input type="hidden" id="e-signature" name="e_signature_data" required />
            </div>

            {/* Чекбокс согласия с условиями */}
            <div className="form-group checkbox-group">
                <input type="checkbox" id="terms" name="terms_agreement" required />
                <label htmlFor="terms">I agree to the Terms of Service and Privacy Policy. *</label>
            </div>

            {/* Кнопка отправки формы */}
            <button type="submit" className="submit-button">Authorize & Complete</button>
        </form>
    );
}

export default AuthForm;
