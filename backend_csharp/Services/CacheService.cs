using System.Collections.Concurrent;
using DCFCalculator.Models;

namespace DCFCalculator.Services
{
    public interface ICacheService
    {
        DCFResult? GetCalculationResult(string key);
        void StoreCalculationResult(string key, DCFResult result);
        void InvalidateCalculationResult(string key);
    }

    public class CacheService : ICacheService
    {
        private readonly ConcurrentDictionary<string, DCFResult> _cache = new();

        public DCFResult? GetCalculationResult(string key)
        {
            _cache.TryGetValue(key, out var result);
            return result;
        }

        public void StoreCalculationResult(string key, DCFResult result)
        {
            _cache.AddOrUpdate(key, result, (_, _) => result);
        }

        public void InvalidateCalculationResult(string key)
        {
            _cache.Remove(key, out _);
        }
    }
}