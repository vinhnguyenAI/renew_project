using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using DCFCalculator.Models;
using DCFCalculator.Services;
using Xunit;
using Moq;

namespace DCFCalculator.Tests.Services
{
    public class DCFCalculationServiceTests
    {
        private readonly DCFCalculationService _service;
        private readonly DCFInput _sampleInput;
        private readonly Mock<ILoggingService> _mockLogger;
        private readonly Mock<ICacheService> _mockCache;

        public DCFCalculationServiceTests()
        {
            _mockLogger = new Mock<ILoggingService>();
            _mockCache = new Mock<ICacheService>();
            _service = new DCFCalculationService(_mockLogger.Object, _mockCache.Object);

            _sampleInput = new DCFInput
            {
                ModelStartDate = DateTime.Now,
                ValuationDate = DateTime.Now,
                CommercialOperationDate = DateTime.Now.AddMonths(6),
                ForecastLength = 25,
                DiscountRate = 0.085,
                ProductionMethod = "bottom-up",
                Capacity = 50,
                CapacityYield = 0.85,
                DegradationRate = 0.005,
                Availability = 0.98,
                ContractedPrice = 65,
                ContractedEscalationRate = 0.02,
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
                TerminalGrowthRate = 0.02,
                Capex = new Dictionary<string, double>
                {
                    { DateTime.Now.Year.ToString(), 75000000 }
                }
            };
        }

        [Fact]
        public async Task Calculate_WithValidInput_ReturnsValidResult()
        {
            // Act
            var result = await _service.CalculateAsync(_sampleInput);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.AnnualCashFlows);
            Assert.Equal(_sampleInput.ForecastLength, result.AnnualCashFlows.Count);
            Assert.True(result.NPV != 0);
            Assert.True(result.IRR >= -1 && result.IRR <= 1);
            Assert.True(result.PaybackPeriod >= 0);
        }

        [Fact]
        public async Task Calculate_WithNoDebt_ReturnsHigherNPV()
        {
            // Arrange
            var noDebtInput = _sampleInput with { DebtPercentage = 0 };

            // Act
            var withDebtResult = await _service.CalculateAsync(_sampleInput);
            var noDebtResult = await _service.CalculateAsync(noDebtInput);

            // Assert
            Assert.True(noDebtResult.NPV > withDebtResult.NPV);
        }

        [Fact]
        public async Task Calculate_WithHigherDiscountRate_ReturnsLowerNPV()
        {
            // Arrange
            var highDiscountInput = _sampleInput with { DiscountRate = 0.15 };

            // Act
            var baseResult = await _service.CalculateAsync(_sampleInput);
            var highDiscountResult = await _service.CalculateAsync(highDiscountInput);

            // Assert
            Assert.True(highDiscountResult.NPV < baseResult.NPV);
        }

        [Fact]
        public async Task Calculate_TracksValuationSteps()
        {
            // Act
            var result = await _service.CalculateAsync(_sampleInput);

            // Assert
            Assert.NotNull(result.ValuationSteps);
            Assert.NotEmpty(result.ValuationSteps);
            
            // Verify step sequence
            var productionStep = result.ValuationSteps.FirstOrDefault(s => s.Description == "Production Profile");
            var revenueStep = result.ValuationSteps.FirstOrDefault(s => s.Description == "Revenue");
            var costsStep = result.ValuationSteps.FirstOrDefault(s => s.Description == "Operating Costs");
            
            Assert.NotNull(productionStep);
            Assert.NotNull(revenueStep);
            Assert.NotNull(costsStep);
            
            // Revenue should be positive, costs should be negative
            Assert.True(revenueStep.Value > 0);
            Assert.True(costsStep.Value < 0);
        }

        [Fact]
        public async Task Calculate_WithHighDeclineRate_ShowsDecreasingProduction()
        {
            // Arrange
            var highDeclineInput = _sampleInput with { DeclineRate = 0.2 };

            // Act
            var result = await _service.CalculateAsync(highDeclineInput);

            // Assert
            for (int i = 1; i < result.AnnualCashFlows.Count; i++)
            {
                Assert.True(result.AnnualCashFlows[i] < result.AnnualCashFlows[i - 1]);
            }
        }
    }
}