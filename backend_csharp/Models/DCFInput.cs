using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace DCFCalculator.Models
{
    /// <summary>
    /// Input parameters for DCF calculation
    /// </summary>
    public class DCFInput
    {
        // Model Parameters
        [Required]
        public DateTime ModelStartDate { get; set; }
        [Required]
        public DateTime ValuationDate { get; set; }
        [Required]
        public DateTime CommercialOperationDate { get; set; }
        
        [Required]
        [Range(1, 100)]
        public int ForecastLength { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double DiscountRate { get; set; }
        
        [Required]
        public required string ProductionMethod { get; set; } // "manual" or "bottom-up"
        
        // Production Parameters
        [Required]
        [Range(0, double.MaxValue)]
        public double Capacity { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double CapacityYield { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double DegradationRate { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double Availability { get; set; }
        
        // Manual Production (if using manual method)
        public Dictionary<string, double>? ManualProduction { get; set; } = new();
        
        // Pricing Parameters
        [Required]
        [Range(0, double.MaxValue)]
        public double ContractedPrice { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double ContractedEscalationRate { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public double MerchantPrice { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double MerchantEscalationRate { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double ContractedPercentage { get; set; }
        
        [Range(0, double.MaxValue)]
        public double RegulatoryPrice { get; set; }
        
        // Cost Parameters
        [Required]
        public required string CostMethod { get; set; } // "manual", "per_mw", or "percentage"
        
        [Required]
        [Range(0, double.MaxValue)]
        public double OperatingCost { get; set; }
        
        [Required]
        [Range(0, 1)]
        public double CostInflationRate { get; set; }
        
        public Dictionary<string, object>? CostDetails { get; set; } = new();
        
        // Financial Parameters
        [Required]
        [Range(0, 1)]
        public double TaxRate { get; set; }
        
        // Depreciation
        [Required]
        public required string DepreciationMethod { get; set; } // "straight_line" or "declining_balance"
        
        [Required]
        [Range(1, 50)]
        public int DepreciationYears { get; set; }
        
        public Dictionary<string, object>? DepreciationDetails { get; set; } = new();
        
        // Working Capital
        [Required]
        [Range(0, 365)]
        public int ReceivableDays { get; set; }
        
        [Required]
        [Range(0, 365)]
        public int PayableDays { get; set; }
        
        [Required]
        [Range(0, 365)]
        public int InventoryDays { get; set; }
        
        // CAPEX
        [Required]
        public required Dictionary<string, double> Capex { get; set; } = new();
        
        [Required]
        [Range(0, 1)]
        public double CapexInflationRate { get; set; }
        
        // Debt Parameters
        [Range(0, double.MaxValue)]
        public double DebtAmount { get; set; }
        
        [Range(0, 1)]
        public double InterestRate { get; set; }
        
        public Dictionary<string, double>? DrawdownSchedule { get; set; } = new();
        
        public Dictionary<string, object>? RepaymentStructure { get; set; } = new();
        
        // Terminal Value Parameters
        [Required]
        public required string TerminalValueMethod { get; set; } // "perpetuity", "exit_multiple", or "none"
        
        [Range(0, 1)]
        public double TerminalGrowthRate { get; set; }
        
        [Range(0, double.MaxValue)]
        public double TerminalMultiple { get; set; }
    }
}
