const ErrorMessage = ({ message, onRetry }) => {
    return (
        <div className="error-message">
            <div className="error-icon">⚠️</div>
            <p>{message || 'Something went wrong'}</p>
            {onRetry && (
                <button onClick={onRetry} className="btn btn-primary">
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
