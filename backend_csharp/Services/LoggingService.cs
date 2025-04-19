using Microsoft.Extensions.Logging;

namespace DCFCalculator.Services
{
    public interface ILoggingService
    {
        void LogCalculationStart(string correlationId);
        void LogCalculationStep(string correlationId, string step, double value);
        void LogCalculationComplete(string correlationId, double npv, double irr);
        void LogCalculationError(string correlationId, Exception ex);
        
        // Additional logging methods for batch processing
        void LogError(string message);
        void LogWarning(string message);
        void LogInformation(string message);
    }

    public class LoggingService : ILoggingService
    {
        private readonly ILogger<LoggingService> _logger;

        public LoggingService(ILogger<LoggingService> logger)
        {
            _logger = logger;
        }

        public void LogCalculationStart(string correlationId)
        {
            _logger.LogInformation("Starting DCF calculation {CorrelationId}", correlationId);
        }

        public void LogCalculationStep(string correlationId, string step, double value)
        {
            _logger.LogInformation("DCF calculation step {Step}: {Value} ({CorrelationId})", 
                step, value, correlationId);
        }

        public void LogCalculationComplete(string correlationId, double npv, double irr)
        {
            _logger.LogInformation("DCF calculation complete - NPV: {NPV}, IRR: {IRR} ({CorrelationId})", 
                npv, irr, correlationId);
        }

        public void LogCalculationError(string correlationId, Exception ex)
        {
            _logger.LogError(ex, "DCF calculation error ({CorrelationId})", correlationId);
        }

        public void LogError(string message)
        {
            _logger.LogError(message);
        }

        public void LogWarning(string message)
        {
            _logger.LogWarning(message);
        }

        public void LogInformation(string message)
        {
            _logger.LogInformation(message);
        }
    }
}