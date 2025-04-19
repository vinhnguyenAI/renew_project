using DCFCalculator.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DCFCalculator.Services
{
    public interface IDCFCalculationService
    {
        Task<DCFResult> CalculateAsync(DCFInput input);
        Task<Dictionary<string, double>> PerformSensitivityAnalysisAsync(DCFInput input, string variable, double[] values);
        Task<List<DCFResult>> BatchCalculateAsync(List<DCFInput> inputs);
    }

    public class DCFCalculationService : IDCFCalculationService
    {
        private readonly ILoggingService _logger;
        private readonly ICacheService _cache;
        private DCFInput? _input;
        private List<ValuationBridgeStep> _bridgeSteps;
        private double _currentValue;

        public DCFCalculationService(ILoggingService logger, ICacheService cache)
        {
            _logger = logger;
            _cache = cache;
            _bridgeSteps = new List<ValuationBridgeStep>();
        }

        public async Task<DCFResult> CalculateAsync(DCFInput input)
        {
            var correlationId = Guid.NewGuid().ToString();
            try
            {
                _logger.LogCalculationStart(correlationId);

                // Check cache first
                var cacheKey = GenerateCacheKey(input);
                var cachedResult = _cache.GetCalculationResult(cacheKey);
                if (cachedResult != null)
                {
                    _logger.LogCalculationComplete(correlationId, cachedResult.NPV, cachedResult.IRR);
                    return cachedResult;
                }

                _input = input;
                var result = new DCFResult();

                var production = CalculateProduction();
                _logger.LogCalculationStep(correlationId, "Production", production.Sum());

                var revenue = CalculateRevenue(production);
                _logger.LogCalculationStep(correlationId, "Revenue", revenue.Sum());

                var operatingCosts = CalculateOperatingCosts(production);
                _logger.LogCalculationStep(correlationId, "Operating Costs", operatingCosts.Sum());

                var depreciation = CalculateDepreciation();
                var capex = CalculateCapex();
                var workingCapital = CalculateWorkingCapital(revenue);
                var debtFinancing = CalculateDebtFinancing(capex);

                var freeCashFlows = CalculateFreeCashFlows(revenue, operatingCosts, depreciation, capex, workingCapital, debtFinancing);
                
                result.NPV = CalculateNPV(freeCashFlows);
                result.IRR = CalculateIRR(freeCashFlows);
                result.PaybackPeriod = CalculatePaybackPeriod(freeCashFlows);
                result.AnnualCashFlows = freeCashFlows;
                result.ValuationSteps = _bridgeSteps;

                // Cache the result
                _cache.StoreCalculationResult(cacheKey, result);

                _logger.LogCalculationComplete(correlationId, result.NPV, result.IRR);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogCalculationError(correlationId, ex);
                throw;
            }
        }

        public async Task<Dictionary<string, double>> PerformSensitivityAnalysisAsync(DCFInput input, string variable, double[] values)
        {
            var results = new Dictionary<string, double>();
            var baseResult = await CalculateAsync(input);
            var baseValue = GetVariableValue(input, variable);

            foreach (var value in values)
            {
                // Create a deep copy of the input
                var modifiedInput = new DCFInput
                {
                    ModelStartDate = input.ModelStartDate,
                    ValuationDate = input.ValuationDate,
                    CommercialOperationDate = input.CommercialOperationDate,
                    ForecastLength = input.ForecastLength,
                    DiscountRate = input.DiscountRate,
                    ProductionMethod = input.ProductionMethod,
                    Capacity = input.Capacity,
                    CapacityYield = input.CapacityYield,
                    DegradationRate = input.DegradationRate,
                    Availability = input.Availability,
                    ManualProduction = input.ManualProduction != null ? new Dictionary<string, double>(input.ManualProduction) : null,
                    ContractedPrice = input.ContractedPrice,
                    ContractedEscalationRate = input.ContractedEscalationRate,
                    MerchantPrice = input.MerchantPrice,
                    MerchantEscalationRate = input.MerchantEscalationRate,
                    ContractedPercentage = input.ContractedPercentage,
                    RegulatoryPrice = input.RegulatoryPrice,
                    CostMethod = input.CostMethod,
                    OperatingCost = input.OperatingCost,
                    CostInflationRate = input.CostInflationRate,
                    CostDetails = input.CostDetails != null ? new Dictionary<string, object>(input.CostDetails) : null,
                    TaxRate = input.TaxRate,
                    DepreciationMethod = input.DepreciationMethod,
                    DepreciationYears = input.DepreciationYears,
                    DepreciationDetails = input.DepreciationDetails != null ? new Dictionary<string, object>(input.DepreciationDetails) : null,
                    ReceivableDays = input.ReceivableDays,
                    PayableDays = input.PayableDays,
                    InventoryDays = input.InventoryDays,
                    Capex = input.Capex != null ? new Dictionary<string, double>(input.Capex) : null,
                    CapexInflationRate = input.CapexInflationRate,
                    DebtAmount = input.DebtAmount,
                    InterestRate = input.InterestRate,
                    DrawdownSchedule = input.DrawdownSchedule != null ? new Dictionary<string, double>(input.DrawdownSchedule) : null,
                    RepaymentStructure = input.RepaymentStructure != null ? new Dictionary<string, object>(input.RepaymentStructure) : null,
                    TerminalValueMethod = input.TerminalValueMethod,
                    TerminalGrowthRate = input.TerminalGrowthRate,
                    TerminalMultiple = input.TerminalMultiple
                };
                
                SetVariableValue(modifiedInput, variable, value);
                
                var result = await CalculateAsync(modifiedInput);
                results[value.ToString("F2")] = result.NPV;
            }

            // Reset the original value
            SetVariableValue(input, variable, baseValue);

            return results;
        }

        private string GenerateCacheKey(DCFInput input)
        {
            // Generate a unique key based on input parameters
            return $"DCF_{input.GetHashCode()}";
        }

        private double GetVariableValue(DCFInput input, string variable)
        {
            return variable switch
            {
                "DiscountRate" => input.DiscountRate,
                "Capacity" => input.Capacity,
                "DegradationRate" => input.DegradationRate,
                "ContractedPrice" => input.ContractedPrice,
                "MerchantPrice" => input.MerchantPrice,
                "OperatingCost" => input.OperatingCost,
                "TaxRate" => input.TaxRate,
                "ContractedPercentage" => input.ContractedPercentage,
                "CapacityYield" => input.CapacityYield,
                "Availability" => input.Availability,
                _ => throw new ArgumentException($"Unknown variable: {variable}")
            };
        }

        private void SetVariableValue(DCFInput input, string variable, double value)
        {
            switch (variable)
            {
                case "DiscountRate":
                    input.DiscountRate = value;
                    break;
                case "Capacity":
                    input.Capacity = value;
                    break;
                case "DegradationRate":
                    input.DegradationRate = value;
                    break;
                case "ContractedPrice":
                    input.ContractedPrice = value;
                    break;
                case "MerchantPrice":
                    input.MerchantPrice = value;
                    break;
                case "OperatingCost":
                    input.OperatingCost = value;
                    break;
                case "TaxRate":
                    input.TaxRate = value;
                    break;
                case "ContractedPercentage":
                    input.ContractedPercentage = value;
                    break;
                case "CapacityYield":
                    input.CapacityYield = value;
                    break;
                case "Availability":
                    input.Availability = value;
                    break;
                default:
                    throw new ArgumentException($"Unknown variable: {variable}");
            }
        }

        private List<double> CalculateProduction()
        {
            var production = new List<double>();
            const int hoursPerYear = 8760;

            if (_input.ProductionMethod == "manual" && _input.ManualProduction != null)
            {
                // Use manual production inputs
                for (int year = 0; year < _input.ForecastLength; year++)
                {
                    string yearKey = (_input.ModelStartDate.Year + year).ToString();
                    if (_input.ManualProduction.TryGetValue(yearKey, out double yearlyProduction))
                    {
                        production.Add(yearlyProduction);
                    }
                    else
                    {
                        // Use last known production or 0
                        production.Add(production.LastOrDefault());
                    }
                }
            }
            else
            {
                // Bottom-up calculation
                for (int year = 0; year < _input.ForecastLength; year++)
                {
                    double yearlyProduction = _input.Capacity * // MW
                                            hoursPerYear * // Hours per year
                                            _input.CapacityYield * // Capacity factor
                                            _input.Availability * // Availability factor
                                            Math.Pow(1 - _input.DegradationRate, year); // Degradation
                    production.Add(yearlyProduction);
                }
            }

            TrackChange("Production Profile", production.Sum());
            return production;
        }

        private List<double> CalculateRevenue(List<double> production)
        {
            var revenue = new List<double>();
            
            for (int year = 0; year < production.Count; year++)
            {
                // Calculate contracted revenue with escalation
                double contractedPrice = _input.ContractedPrice * 
                    Math.Pow(1 + _input.ContractedEscalationRate, year);
                
                // Calculate merchant price with escalation
                double merchantPrice = _input.MerchantPrice * 
                    Math.Pow(1 + _input.MerchantEscalationRate, year);

                // Calculate regulatory price if applicable
                double regulatoryRevenue = 0;
                if (_input.RegulatoryPrice > 0)
                {
                    regulatoryRevenue = production[year] * _input.RegulatoryPrice;
                }
                
                // Calculate blended revenue
                double annualRevenue = production[year] * (
                    (contractedPrice * _input.ContractedPercentage) +
                    (merchantPrice * (1 - _input.ContractedPercentage))
                ) + regulatoryRevenue;
                
                revenue.Add(annualRevenue);
            }

            TrackChange("Revenue", revenue.Sum());
            return revenue;
        }

        private List<double> CalculateOperatingCosts(List<double> production)
        {
            var costs = new List<double>();
            
            for (int year = 0; year < production.Count; year++)
            {
                double yearCosts = 0;
                double inflationFactor = Math.Pow(1 + _input.CostInflationRate, year);

                switch (_input.CostMethod.ToLower())
                {
                    case "manual":
                        if (_input.CostDetails != null)
                        {
                            foreach (var cost in _input.CostDetails)
                            {
                                if (cost.Value is double costValue)
                                {
                                    yearCosts += costValue * inflationFactor;
                                }
                            }
                        }
                        break;

                    case "per_mw":
                        yearCosts = _input.Capacity * _input.OperatingCost * inflationFactor;
                        break;

                    case "percentage":
                        // Calculate as percentage of revenue
                        if (_input.CostDetails != null)
                        {
                            foreach (var cost in _input.CostDetails)
                            {
                                if (cost.Value is double percentage)
                                {
                                    yearCosts += production[year] * _input.OperatingCost * (percentage / 100);
                                }
                            }
                        }
                        break;

                    default:
                        yearCosts = production[year] * _input.OperatingCost * inflationFactor;
                        break;
                }

                costs.Add(yearCosts);
            }

            TrackChange("Operating Costs", -costs.Sum());
            return costs;
        }

        private List<double> CalculateDepreciation()
        {
            var depreciation = new List<double>();
            double assetBase = _input.Capex.Values.Sum();

            switch (_input.DepreciationMethod.ToLower())
            {
                case "straight_line":
                    double annualDepreciation = assetBase / _input.DepreciationYears;
                    for (int year = 0; year < _input.ForecastLength; year++)
                    {
                        depreciation.Add(year < _input.DepreciationYears ? annualDepreciation : 0);
                    }
                    break;

                case "declining_balance":
                    double rate = 0.0;
                    if (_input.DepreciationDetails != null && 
                        _input.DepreciationDetails.ContainsKey("rate") && 
                        _input.DepreciationDetails["rate"] is double r)
                    {
                        rate = r;
                    }
                    else
                    {
                        rate = 2.0 / _input.DepreciationYears;
                    }
                    
                    double bookValue = assetBase;
                    for (int year = 0; year < _input.ForecastLength; year++)
                    {
                        if (year < _input.DepreciationYears)
                        {
                            double yearDepreciation = bookValue * rate;
                            depreciation.Add(yearDepreciation);
                            bookValue -= yearDepreciation;
                        }
                        else
                        {
                            depreciation.Add(0);
                        }
                    }
                    break;

                default:
                    for (int year = 0; year < _input.ForecastLength; year++)
                    {
                        depreciation.Add(0);
                    }
                    break;
            }

            TrackChange("Depreciation", -depreciation.Sum());
            return depreciation;
        }

        private List<double> CalculateCapex()
        {
            var capex = new List<double>();
            
            for (int year = 0; year < _input.ForecastLength; year++)
            {
                string yearKey = (_input.ModelStartDate.Year + year).ToString();
                double inflationFactor = Math.Pow(1 + _input.CapexInflationRate, year);
                
                if (_input.Capex.TryGetValue(yearKey, out double yearCapex))
                {
                    capex.Add(yearCapex * inflationFactor);
                }
                else
                {
                    capex.Add(0);
                }
            }

            TrackChange("Capital Expenditure", -capex.Sum());
            return capex;
        }

        private List<double> CalculateWorkingCapital(List<double> revenue)
        {
            var workingCapital = new List<double>();
            double previousWC = 0;

            for (int year = 0; year < revenue.Count; year++)
            {
                // Calculate working capital components
                double receivables = revenue[year] * (_input.ReceivableDays / 365.0);
                double payables = revenue[year] * (_input.PayableDays / 365.0);
                double inventory = revenue[year] * (_input.InventoryDays / 365.0);
                
                double currentWC = receivables + inventory - payables;
                workingCapital.Add(currentWC - previousWC);
                previousWC = currentWC;
            }

            TrackChange("Working Capital", -workingCapital.Sum());
            return workingCapital;
        }

        private List<double> CalculateDebtFinancing(List<double> capex)
        {
            var debtService = new List<double>();
            
            // Calculate total debt based on debt amount or as percentage of capex
            double totalDebt = _input.DebtAmount > 0 ? _input.DebtAmount : capex[0] * 0.7; // Default to 70% if not specified
            double annualPayment = CalculateDebtPayment(totalDebt, _input.InterestRate, _input.ForecastLength);

            for (int year = 0; year < _input.ForecastLength; year++)
            {
                debtService.Add(annualPayment);
            }

            TrackChange("Debt Service", -debtService.Sum());
            return debtService;
        }

        private List<double> CalculateFreeCashFlows(
            List<double> revenue, 
            List<double> operatingCosts,
            List<double> depreciation,
            List<double> capex,
            List<double> workingCapital,
            List<double> debtService)
        {
            var freeCashFlows = new List<double>();

            for (int year = 0; year < _input.ForecastLength; year++)
            {
                double ebitda = revenue[year] - operatingCosts[year];
                double taxableIncome = ebitda - depreciation[year];
                double taxes = Math.Max(0, taxableIncome * _input.TaxRate);
                
                double fcf = ebitda - taxes - capex[year] - workingCapital[year] - debtService[year];
                freeCashFlows.Add(fcf);
            }

            return freeCashFlows;
        }

        private List<double> CalculateTerminalValue(List<double> cashFlows)
        {
            var terminalValues = new List<double>();
            for (int year = 0; year < cashFlows.Count - 1; year++)
            {
                terminalValues.Add(0);
            }

            // Calculate terminal value for the final year
            double finalCashFlow = cashFlows.Last();
            double terminalValue = 0;

            switch (_input.TerminalValueMethod.ToLower())
            {
                case "perpetuity":
                    terminalValue = finalCashFlow * (1 + _input.TerminalGrowthRate) / 
                                  (_input.DiscountRate - _input.TerminalGrowthRate);
                    break;

                case "exit_multiple":
                    terminalValue = finalCashFlow * _input.TerminalMultiple;
                    break;

                case "none":
                    terminalValue = 0;
                    break;
            }

            terminalValues.Add(terminalValue);
            TrackChange("Terminal Value", terminalValue);
            return terminalValues;
        }

        private double CalculateNPV(List<double> cashFlows)
        {
            double npv = 0;
            for (int t = 0; t < cashFlows.Count; t++)
            {
                npv += cashFlows[t] / Math.Pow(1 + _input.DiscountRate, t);
            }
            return npv;
        }

        private double CalculateIRR(List<double> cashFlows)
        {
            // Check if all cash flows are negative, which would result in infinite negative IRR
            if (cashFlows.All(cf => cf <= 0))
            {
                // Return a sentinel value instead of negative infinity
                return -999.0;
            }
            
            // Newton-Raphson method for IRR calculation
            double guess = 0.1;
            double tolerance = 0.0001;
            int maxIterations = 100;

            for (int i = 0; i < maxIterations; i++)
            {
                double npv = 0;
                double derivative = 0;

                for (int t = 0; t < cashFlows.Count; t++)
                {
                    npv += cashFlows[t] / Math.Pow(1 + guess, t);
                    if (t > 0)
                        derivative -= t * cashFlows[t] / Math.Pow(1 + guess, t + 1);
                }

                // Check if derivative is too close to zero to avoid division by zero
                if (Math.Abs(derivative) < 1e-10)
                {
                    return -999.0; // Return sentinel value
                }

                double newGuess = guess - npv / derivative;
                
                // Check if newGuess is valid
                if (double.IsNaN(newGuess) || double.IsInfinity(newGuess))
                {
                    return -999.0;
                }
                
                if (Math.Abs(newGuess - guess) < tolerance)
                    return newGuess;

                guess = newGuess;
            }

            return guess;
        }

        private double CalculatePaybackPeriod(List<double> cashFlows)
        {
            double cumulativeCashFlow = 0;
            for (int year = 0; year < cashFlows.Count; year++)
            {
                cumulativeCashFlow += cashFlows[year];
                if (cumulativeCashFlow >= 0)
                    return year + (cumulativeCashFlow - cashFlows[year]) / cashFlows[year];
            }
            return _input.ForecastLength; // If never pays back
        }

        private double CalculateDebtPayment(double principal, double rate, int years)
        {
            // Calculate annual debt payment using PMT formula
            if (rate == 0)
                return principal / years;
                
            double r = rate;
            return principal * r * Math.Pow(1 + r, years) / (Math.Pow(1 + r, years) - 1);
        }

        private void TrackChange(string description, double value)
        {
            _currentValue += value;
            _bridgeSteps.Add(new ValuationBridgeStep
            {
                Description = description,
                Value = value,
                CumulativeValue = _currentValue
            });
        }

        public async Task<List<DCFResult>> BatchCalculateAsync(List<DCFInput> inputs)
        {
            if (inputs == null || !inputs.Any())
            {
                _logger.LogError("Batch calculation received empty inputs");
                return new List<DCFResult>();
            }

            _logger.LogInformation($"Starting batch calculation for {inputs.Count} assets");
            var batchId = Guid.NewGuid().ToString();
            var results = new List<DCFResult>();
            
            // Use parallel processing for better performance, but with a reasonable degree of parallelism
            // to avoid overwhelming the server
            var options = new ParallelOptions { MaxDegreeOfParallelism = Math.Min(inputs.Count, Environment.ProcessorCount) };
            var resultTasks = new List<Task<DCFResult>>();
            
            // Create tasks for all inputs
            foreach (var input in inputs)
            {
                // Verify the input is valid before adding to task list
                if (input == null)
                {
                    _logger.LogWarning($"Skipping null input in batch {batchId}");
                    continue;
                }
                
                resultTasks.Add(CalculateAsync(input));
            }
            
            // Wait for all tasks to complete
            try
            {
                results = (await Task.WhenAll(resultTasks)).ToList();
                _logger.LogInformation($"Batch calculation {batchId} completed successfully with {results.Count} results");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in batch calculation {batchId}: {ex.Message}");
                // Return any successful results, rather than failing the entire batch
                results = resultTasks
                    .Where(t => t.IsCompletedSuccessfully)
                    .Select(t => t.Result)
                    .ToList();
                
                _logger.LogInformation($"Batch calculation {batchId} partially completed with {results.Count} out of {inputs.Count} results");
            }
            
            return results;
        }
    }
}
