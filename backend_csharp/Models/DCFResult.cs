namespace DCFCalculator.Models
{
    /// <summary>
    /// Results of a DCF calculation
    /// </summary>
    public class DCFResult
    {
        /// <summary>
        /// Net Present Value of future cash flows
        /// </summary>
        public double NPV { get; set; }

        /// <summary>
        /// Internal Rate of Return
        /// </summary>
        public double IRR { get; set; }

        /// <summary>
        /// Number of years required to recover initial investment
        /// </summary>
        public double PaybackPeriod { get; set; }

        /// <summary>
        /// Projected cash flows for each year
        /// </summary>
        public List<double> AnnualCashFlows { get; set; }

        /// <summary>
        /// Steps showing how the valuation was built up
        /// </summary>
        public List<ValuationBridgeStep> ValuationSteps { get; set; }

        /// <summary>
        /// Results of sensitivity analysis on key variables
        /// </summary>
        public Dictionary<string, double> SensitivityAnalysis { get; set; }

        public DCFResult()
        {
            AnnualCashFlows = new List<double>();
            ValuationSteps = new List<ValuationBridgeStep>();
            SensitivityAnalysis = new Dictionary<string, double>();
        }
    }
}
