import { Injectable } from '@nestjs/common';

// India tax slabs FY 2024-25 (New Regime)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 5 },
  { min: 600000, max: 900000, rate: 10 },
  { min: 900000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

// Old Regime Slabs
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

function computeTax(income: number, slabs: typeof NEW_REGIME_SLABS): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income > slab.min) {
      const taxable = Math.min(income, slab.max) - slab.min;
      tax += taxable * (slab.rate / 100);
    }
  }
  // 4% health & education cess
  return tax * 1.04;
}

@Injectable()
export class TaxService {
  calculate(annualIncome: number, deductions: Record<string, number>) {
    const total80C = Math.min((deductions.ppf || 0) + (deductions.elss || 0) + (deductions.lifeInsurance || 0) + (deductions.homeLoanPrincipal || 0) + (deductions.nsc || 0), 150000);
    const section80D = Math.min(deductions.healthInsurance || 0, 50000);
    const hra = deductions.hra || 0;
    const homeLoanInterest = Math.min(deductions.homeLoanInterest || 0, 200000);
    const nps = Math.min(deductions.nps || 0, 50000);
    const totalDeductions = total80C + section80D + hra + homeLoanInterest + nps;
    const taxableOldRegime = Math.max(0, annualIncome - totalDeductions);
    const taxableNewRegime = annualIncome;

    const oldTax = computeTax(taxableOldRegime, OLD_REGIME_SLABS);
    const newTax = computeTax(taxableNewRegime, NEW_REGIME_SLABS);

    const betterRegime = oldTax < newTax ? 'OLD' : 'NEW';
    const savings = Math.abs(oldTax - newTax);

    const suggestions = this.getSuggestions(deductions, total80C, annualIncome);

    return {
      disclaimer: 'These are educational estimates only. Consult a CA or tax advisor for filing. FinGuardian does not file taxes.',
      annualIncome,
      oldRegime: {
        totalDeductions,
        taxableIncome: taxableOldRegime,
        estimatedTax: Math.round(oldTax),
        breakdown: { section80C: total80C, section80D, hra, homeLoanInterest, nps },
      },
      newRegime: {
        totalDeductions: 75000, // Standard deduction
        taxableIncome: Math.max(0, taxableNewRegime - 75000),
        estimatedTax: Math.round(newTax),
      },
      recommendation: {
        betterRegime,
        potentialSavings: Math.round(savings),
        advice: betterRegime === 'OLD'
          ? `Old regime saves you ₹${Math.round(savings).toLocaleString('en-IN')} due to your deductions of ₹${totalDeductions.toLocaleString('en-IN')}.`
          : `New regime is better by ₹${Math.round(savings).toLocaleString('en-IN')}. Your deductions are insufficient to justify old regime.`,
      },
      suggestions,
    };
  }

  private getSuggestions(deductions: Record<string, number>, current80C: number, income: number) {
    const suggestions = [];
    const remaining80C = 150000 - current80C;
    if (remaining80C > 0) {
      suggestions.push({ action: `Invest ₹${remaining80C.toLocaleString('en-IN')} more in 80C instruments`, benefit: `Save up to ₹${Math.round(remaining80C * 0.3).toLocaleString('en-IN')} in tax`, instruments: 'ELSS (12-14% returns), PPF (7.1%, tax-free), NSC (7.7%)' });
    }
    if (!deductions.healthInsurance) {
      suggestions.push({ action: 'Buy health insurance for family', benefit: 'Save up to ₹15,600 under Section 80D', instruments: 'Mediclaim ₹5L cover starts at ~₹8,000/year' });
    }
    if (income > 1000000 && !deductions.nps) {
      suggestions.push({ action: 'Open NPS account (Section 80CCD)', benefit: 'Additional ₹50,000 deduction over 80C limit', instruments: 'NPS Tier I — lock-in till 60, partial withdrawal allowed' });
    }
    if (!deductions.homeLoanInterest && income > 700000) {
      suggestions.push({ action: 'Home loan interest deduction (Section 24B)', benefit: 'Deduct up to ₹2,00,000 on home loan interest', instruments: 'Applicable on self-occupied property' });
    }
    return suggestions;
  }
}
