import styles from './AuthForm.module.scss';

function AuthForm() {
    return (
        <form id="authorization-form" action="/submit-authorization" method="post">
            <h2>Legal Authorization & Agreement</h2>

            <div className="form-group">
                <label htmlFor="full-name">Full Legal Name *</label>
                <input 
                type="text" 
                id="full-name" 
                name="authorized_name" 
                autocomplete="name"
                required/>
            </div>

            <div className="form-group">
                <label htmlFor="auth-email">Email Address *</label>
                <input 
                type="email" 
                id="auth-email" 
                name="client_email" 
                autocomplete="email"
                required/>
            </div>

            <div className="form-group signature-area">
                <label htmlFor="e-signature">Digital Signature *</label>
                <div id="signature-pad-placeholder" style="border: 1px solid #ccc; height: 150px;">
                </div>
                <input type="hidden" id="e-signature" name="e_signature_data" required/>
            </div>

            <div className="form-group checkbox-group">
                <input type="checkbox" id="terms" name="terms_agreement" required/>
                <label htmlFor="terms">I agree to the Terms of Service and Privacy Policy. *</label>
            </div>

            <button type="submit" className="submit-button">Authorize & Complete</button>
        </form>
    )
}

export default AuthForm;