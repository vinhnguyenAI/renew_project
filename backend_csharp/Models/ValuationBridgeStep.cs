namespace DCFCalculator.Models
{
    /// <summary>
    /// Represents a step in building up the total valuation
    /// </summary>
    public class ValuationBridgeStep
    {
        /// <summary>
        /// Description of what this step represents
        /// </summary>
        public required string Description { get; set; }

        /// <summary>
        /// Value impact of this step
        /// </summary>
        public double Value { get; set; }

        /// <summary>
        /// Running total of valuation after this step
        /// </summary>
        public double CumulativeValue { get; set; }
    }
}
