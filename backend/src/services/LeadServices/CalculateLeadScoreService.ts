interface LeadData {
  email?: string;
  phone?: string;
  budgetMin?: number;
  budgetMax?: number;
  propertyType?: string;
  preferredLocations?: string[];
  source?: string;
  contactCount?: number;
  daysAsLead?: number;
}

const CalculateLeadScoreService = (data: LeadData): number => {
  let score = 0;

  if (data.email) score += 10;
  if (data.phone) score += 10;

  if (data.budgetMin && data.budgetMax) {
    score += 15;
    const avgBudget = (data.budgetMin + data.budgetMax) / 2;
    if (avgBudget > 500000) score += 10;
    if (avgBudget > 1000000) score += 15;
  }

  if (data.propertyType) score += 5;

  if (data.preferredLocations && data.preferredLocations.length > 0) {
    score += 5;
    if (data.preferredLocations.length >= 3) score += 5;
  }

  if (data.source) {
    switch (data.source) {
      case "referral":
        score += 20;
        break;
      case "direct":
        score += 15;
        break;
      case "website":
        score += 10;
        break;
      case "social":
        score += 5;
        break;
    }
  }

  if (data.contactCount) {
    if (data.contactCount >= 5) score += 10;
    else if (data.contactCount >= 3) score += 5;
    else if (data.contactCount >= 1) score += 2;
  }

  if (data.daysAsLead) {
    if (data.daysAsLead <= 7) score += 10;
    else if (data.daysAsLead <= 30) score += 5;
  }

  return Math.min(score, 100);
};

export default CalculateLeadScoreService;
