using Microsoft.AspNetCore.Mvc;
using DCFCalculator.Models;
using DCFCalculator.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.IO;
using Microsoft.Extensions.Logging;

namespace DCFCalculator.Controllers
{
    /// <summary>
    /// Controller for DCF calculation endpoints
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DCFController : ControllerBase
    {
        private readonly IDCFCalculationService _dcfService;
        private readonly ILogger<DCFController> _logger;

        public DCFController(IDCFCalculationService dcfService, ILogger<DCFController> logger)
        {
            _dcfService = dcfService;
            _logger = logger;
        }

        /// <summary>
        /// Calculates DCF valuation based on provided inputs
        /// </summary>
        /// <param name="input">The DCF calculation parameters</param>
        /// <returns>DCF calculation results including NPV, IRR, and cash flow projections</returns>
        /// <response code="200">Returns the calculation results</response>
        /// <response code="400">If the input model is invalid</response>
        /// <response code="500">If there was an internal error during calculation</response>
        [HttpPost("calculate")]
        [ProducesResponseType(typeof(DCFResult), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<DCFResult>> Calculate(DCFInput input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _dcfService.CalculateAsync(input);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Performs sensitivity analysis on a specified variable
        /// </summary>
        /// <param name="input">Base DCF calculation parameters</param>
        /// <param name="variable">Variable to analyze (e.g., "DiscountRate", "InitialProduction")</param>
        /// <param name="lowerBound">Lower bound for the variable</param>
        /// <param name="upperBound">Upper bound for the variable</param>
        /// <param name="steps">Number of steps between bounds</param>
        /// <returns>Dictionary of variable values and corresponding NPV results</returns>
        /// <response code="200">Returns the sensitivity analysis results</response>
        /// <response code="400">If the input parameters are invalid</response>
        /// <response code="500">If there was an internal error during calculation</response>
        [HttpPost("sensitivity")]
        [ProducesResponseType(typeof(Dictionary<string, double>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<Dictionary<string, double>>> AnalyzeSensitivity(
            [FromBody] DCFInput input,
            [FromQuery] string variable,
            [FromQuery] double lowerBound,
            [FromQuery] double upperBound,
            [FromQuery] int steps = 5)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var values = Enumerable.Range(0, steps)
                    .Select(i => lowerBound + (upperBound - lowerBound) * i / (steps - 1))
                    .ToArray();

                var results = await _dcfService.PerformSensitivityAnalysisAsync(input, variable, values);
                return Ok(results);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Batch processes multiple DCF calculations
        /// </summary>
        /// <param name="request">Request containing list of DCF inputs to process</param>
        /// <returns>List of DCF calculation results</returns>
        /// <response code="200">Returns the batch calculation results</response>
        /// <response code="400">If any of the inputs are invalid</response>
        /// <response code="500">If there was an internal error during calculation</response>
        [HttpPost("batch-calculate")]
        [ProducesResponseType(typeof(List<DCFResult>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<List<DCFResult>>> BatchCalculate([FromBody] BatchCalculateRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Items == null || !request.Items.Any())
                return BadRequest(new { message = "No items provided for batch calculation" });

            try
            {
                var results = await _dcfService.BatchCalculateAsync(request.Items);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Processes a batch of DCF calculations from CSV data
        /// </summary>
        /// <param name="file">CSV file containing multiple DCF inputs</param>
        /// <returns>List of DCF calculation results for each row in the CSV</returns>
        /// <response code="200">Returns the batch calculation results</response>
        /// <response code="400">If the CSV format is invalid</response>
        /// <response code="500">If there was an internal error during calculation</response>
        [HttpPost("process-csv")]
        [ProducesResponseType(typeof(List<DCFResult>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<ActionResult<List<DCFResult>>> ProcessCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });
            
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Only CSV files are supported" });
            
            try
            {
                // Read the CSV file
                var inputs = new List<DCFInput>();
                using (var reader = new StreamReader(file.OpenReadStream()))
                {
                    // Skip header row
                    var headerLine = await reader.ReadLineAsync();
                    var headers = headerLine?.Split(',');
                    
                    if (headers == null || headers.Length < 5)
                        return BadRequest(new { message = "CSV file has invalid format: missing required columns" });
                    
                    // Process rows
                    string? line;
                    while ((line = await reader.ReadLineAsync()) != null)
                    {
                        var values = line.Split(',');
                        if (values.Length < headers.Length)
                            continue; // Skip invalid rows
                        
                        try
                        {
                            // Create a DCF input from CSV row
                            var input = ParseCsvRow(headers, values);
                            inputs.Add(input);
                        }
                        catch (Exception ex)
                        {
                            // Log the error but continue processing other rows
                            Console.WriteLine($"Error parsing CSV row: {ex.Message}");
                        }
                    }
                }
                
                if (inputs.Count == 0)
                    return BadRequest(new { message = "No valid DCF inputs could be parsed from the CSV file" });
                
                // Process the batch of inputs
                var results = await _dcfService.BatchCalculateAsync(inputs);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Provides a sample DCF input for testing
        /// </summary>
        /// <returns>Sample DCF input model</returns>
        [HttpGet("sample-data")]
        [ProducesResponseType(typeof(DCFInput), 200)]
        public ActionResult<DCFInput> GetSampleData()
        {
            // Create a sample DCF input that mirrors the frontend sample data
            var sampleData = new DCFInput
            {
                ModelStartDate = DateTime.Parse("2023-01-01"),
                ValuationDate = DateTime.Parse("2023-01-01"),
                CommercialOperationDate = DateTime.Parse("2024-01-01"),
                ForecastLength = 25,
                DiscountRate = 0.085,
                ProductionMethod = "bottom-up",
                Capacity = 50,
                CapacityYield = 0.85,
                DegradationRate = 0.005,
                Availability = 0.98,
                ContractedPrice = 65,
                ContractedEscalationRate = 0.025,
                MerchantPrice = 45,
                MerchantEscalationRate = 0.015,
                ContractedPercentage = 0.7,
                CostMethod = "manual",
                OperatingCost = 350000,
                CostInflationRate = 0.025,
                TaxRate = 0.21,
                DepreciationMethod = "straight_line",
                DepreciationYears = 25,
                ReceivableDays = 45,
                PayableDays = 30,
                InventoryDays = 15,
                CapexInflationRate = 0.018,
                TerminalValueMethod = "perpetuity",
                TerminalGrowthRate = 0.015,
                Capex = new Dictionary<string, double>
                {
                    { "2023", 75000000 }
                },
                DebtAmount = 50000000,
                InterestRate = 0.055
            };

            return Ok(sampleData);
        }

        /// <summary>
        /// Provides a template CSV for batch processing
        /// </summary>
        /// <returns>CSV template file</returns>
        [HttpGet("batch-template")]
        [ProducesResponseType(typeof(FileResult), 200)]
        public IActionResult GetBatchTemplate()
        {
            // Create CSV template with headers and example row
            var csvContent = "AssetName,AssetType,Location,Capacity,CapacityYield,ContractedPrice,ContractedPercentage,DiscountRate,InitialCapex,InterestRate,ForecastLength\n";
            csvContent += "Solar Asset 1,solar,California,50,0.85,65,70,0.085,75000000,0.055,25";
            
            // Return as downloadable CSV file
            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);
            return File(bytes, "text/csv", "dcf_batch_template.csv");
        }

        /// <summary>
        /// Get a complete DCF template CSV file
        /// </summary>
        /// <returns>CSV file with complete template data</returns>
        [HttpGet("complete-template")]
        [ProducesResponseType(typeof(FileContentResult), 200)]
        public IActionResult GetCompleteTemplate()
        {
            try
            {
                var filePath = Path.Combine("wwwroot", "templates", "complete_dcf_template.csv");
                
                // Create directory if it doesn't exist
                var directory = Path.GetDirectoryName(filePath);
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // If file doesn't exist, create it with sample data
                if (!System.IO.File.Exists(filePath))
                {
                    var csvContent = @"assetName,assetType,location,capacity,capacityYield,degradationRate,availability,contractedPrice,contractedEscalationRate,merchantPrice,merchantEscalationRate,contractedPercentage,regulatoryPrice,discountRate,forecastLength,operatingCost,costInflationRate,taxRate,depreciationMethod,depreciationYears,receivableDays,payableDays,inventoryDays,initialCapex,capexInflationRate,debtAmount,interestRate,terminalValueMethod,terminalGrowthRate,terminalMultiple,modelStartDate,valuationDate,commercialOperationDate,capexDate
Solar Asset 1,solar,California,50,85,0.5,98,65,2.5,45,1.5,70,0,8.5,25,350000,2.5,21,straight_line,25,45,30,15,75000000,1.8,50000000,5.5,perpetuity,1.5,10,2023-01-01,2023-01-01,2024-01-01,2023-01-01
Wind Asset 1,wind,Texas,100,42,0.3,95,55,2.0,40,1.2,60,0,7.5,20,450000,2.0,21,straight_line,20,45,30,15,100000000,1.5,70000000,5.0,perpetuity,1.0,8,2023-01-01,2023-01-01,2024-01-01,2023-01-01
Battery Asset 1,battery,Nevada,75,95,0.8,99,85,3.0,75,2.0,80,0,9.0,15,250000,3.0,21,straight_line,15,30,30,10,60000000,2.0,40000000,6.0,perpetuity,2.0,12,2023-01-01,2023-01-01,2024-01-01,2027-01-01";
                    
                    System.IO.File.WriteAllText(filePath, csvContent);
                }
                
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                return File(fileBytes, "text/csv", "complete_dcf_template.csv");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting complete template: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving template" });
            }
        }

        // Helper method to parse a CSV row into a DCFInput
        private DCFInput ParseCsvRow(string[] headers, string[] values)
        {
            // Create a dictionary for easier mapping
            var rowData = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < Math.Min(headers.Length, values.Length); i++)
            {
                rowData[headers[i].Trim()] = values[i].Trim();
            }
            
            // Default dates
            var today = DateTime.Today;
            var startDate = today;
            var codDate = today.AddYears(1);
            var valuationDate = today;
            var capexDate = today;
            
            // Parse dates if provided (prioritize CSV values)
            if (rowData.TryGetValue("ModelStartDate", out var startDateStr) && DateTime.TryParse(startDateStr, out var parsedStartDate))
                startDate = parsedStartDate;
        
            if (rowData.TryGetValue("CommercialOperationDate", out var codDateStr) && DateTime.TryParse(codDateStr, out var parsedCodDate))
                codDate = parsedCodDate;
            else if (rowData.TryGetValue("CodDate", out codDateStr) && DateTime.TryParse(codDateStr, out parsedCodDate))
                codDate = parsedCodDate;
                
            if (rowData.TryGetValue("ValuationDate", out var valuationDateStr) && DateTime.TryParse(valuationDateStr, out var parsedValuationDate))
                valuationDate = parsedValuationDate;
                
            if (rowData.TryGetValue("CapexDate", out var capexDateStr) && DateTime.TryParse(capexDateStr, out var parsedCapexDate))
                capexDate = parsedCapexDate;
        
            // Create DCF input with required fields
            var input = new DCFInput
            {
                // Model parameters
                ModelStartDate = startDate,
                ValuationDate = valuationDate,
                CommercialOperationDate = codDate,
                ForecastLength = ParseInt(rowData, "ForecastLength", 25),
                DiscountRate = ParseDouble(rowData, "DiscountRate", 8.5) / 100, // Convert from percentage
                
                // Production parameters
                ProductionMethod = "bottom-up",
                Capacity = ParseDouble(rowData, "Capacity", 50),
                CapacityYield = ParseDouble(rowData, "CapacityYield", 85) / 100, // Convert from percentage
                DegradationRate = ParseDouble(rowData, "DegradationRate", 0.5) / 100, // Convert from percentage
                Availability = ParseDouble(rowData, "Availability", 98) / 100, // Convert from percentage
                
                // Pricing parameters
                ContractedPrice = ParseDouble(rowData, "ContractedPrice", 65),
                ContractedEscalationRate = ParseDouble(rowData, "ContractedEscalationRate", 2.5) / 100, // Convert from percentage
                MerchantPrice = ParseDouble(rowData, "MerchantPrice", 45),
                MerchantEscalationRate = ParseDouble(rowData, "MerchantEscalationRate", 1.5) / 100, // Convert from percentage
                ContractedPercentage = ParseDouble(rowData, "ContractedPercentage", 70) / 100, // Convert from percentage
                
                // Cost parameters
                CostMethod = "manual",
                OperatingCost = ParseDouble(rowData, "OperatingCost", 350000),
                CostInflationRate = ParseDouble(rowData, "CostInflationRate", 2.5) / 100, // Convert from percentage
                
                // Financial parameters
                TaxRate = ParseDouble(rowData, "TaxRate", 21) / 100, // Convert from percentage
                DepreciationMethod = "straight_line",
                DepreciationYears = ParseInt(rowData, "DepreciationYears", 25),
                ReceivableDays = ParseInt(rowData, "ReceivableDays", 45),
                PayableDays = ParseInt(rowData, "PayableDays", 30),
                InventoryDays = ParseInt(rowData, "InventoryDays", 15),
                
                // Capex
                CapexInflationRate = ParseDouble(rowData, "CapexInflationRate", 1.8) / 100, // Convert from percentage
                Capex = new Dictionary<string, double> {
                    { capexDate.Year.ToString(), ParseDouble(rowData, "InitialCapex", 75000000) }
                },
                
                // Debt parameters
                DebtAmount = ParseDouble(rowData, "DebtAmount", 50000000),
                InterestRate = ParseDouble(rowData, "InterestRate", 5.5) / 100, // Convert from percentage
                
                // Terminal value parameters
                TerminalValueMethod = rowData.TryGetValue("TerminalValueMethod", out var tvMethod) ? tvMethod : "perpetuity",
                TerminalGrowthRate = ParseDouble(rowData, "TerminalGrowthRate", 1.5) / 100 // Convert from percentage
            };
            
            return input;
        }

        // Helper methods to safely parse values from CSV
        private double ParseDouble(Dictionary<string, string> data, string key, double defaultValue)
        {
            if (data.TryGetValue(key, out var value) && double.TryParse(value, out var result))
                return result;
            return defaultValue;
        }

        private int ParseInt(Dictionary<string, string> data, string key, int defaultValue)
        {
            if (data.TryGetValue(key, out var value) && int.TryParse(value, out var result))
                return result;
            return defaultValue;
        }
    }

    /// <summary>
    /// Request model for batch calculation
    /// </summary>
    public class BatchCalculateRequest
    {
        /// <summary>
        /// List of DCF inputs to process
        /// </summary>
        public List<DCFInput> Items { get; set; } = new();
    }
}
