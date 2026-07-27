import { University, UniversityMatch, UniversityProgramme, UNIVERSITIES_DB } from "../data/universityData";
import { CareerPath, ProfileSignals, PracticalConstraints } from "../types";

export function getUniversityRecommendations(
  path: CareerPath,
  signals: ProfileSignals,
  constraints: PracticalConstraints
): UniversityMatch[] {
  const matches: UniversityMatch[] = [];
  
  const careerKeywords = path.fieldName.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  
  // Normalize geo target
  const geoVal = (constraints.geography?.value || "").toLowerCase();
  const targetCountries: string[] = [];
  if (geoVal.includes("usa") || geoVal.includes("us ") || geoVal.includes("united states") || geoVal.includes("america") || geoVal === "us") {
    targetCountries.push("united states");
  }
  if (geoVal.includes("uk") || geoVal.includes("united kingdom") || geoVal.includes("britain") || geoVal.includes("london") || geoVal === "gb") {
    targetCountries.push("united kingdom");
  }
  if (geoVal.includes("swiss") || geoVal.includes("switzerland")) {
    targetCountries.push("switzerland");
  }
  if (geoVal.includes("singapore")) {
    targetCountries.push("singapore");
  }
  if (geoVal.includes("germany") || geoVal.includes("german") || geoVal.includes("europe")) {
    targetCountries.push("germany");
  }
  if (geoVal.includes("europe")) {
    if (!targetCountries.includes("switzerland")) targetCountries.push("switzerland");
    if (!targetCountries.includes("united kingdom")) targetCountries.push("united kingdom");
  }

  // Determine low budget preference
  const finVal = (constraints.financial?.value || "").toLowerCase();
  const prefersLowBudget = 
    finVal.includes("low") || 
    finVal.includes("under") || 
    finVal.includes("budget") || 
    finVal.includes("limit") || 
    finVal.includes("restrict") || 
    finVal.includes("scholarship") || 
    finVal.includes("moderate") || 
    finVal.includes("mid") || 
    finVal.includes("lakh") || 
    (finVal.match(/\d+/) && !finVal.includes("high"));

  for (const uni of UNIVERSITIES_DB) {
    const uniCountry = uni.country.toLowerCase();
    
    for (const prog of uni.programmes) {
      let score = 50;
      
      // 1. Match by career keywords in relatedCareers, title, and careerOutcomes
      const isRelated = prog.relatedCareers.some(rc => 
        careerKeywords.some(ck => rc.toLowerCase().includes(ck) || ck.includes(rc.toLowerCase()))
      ) || careerKeywords.some(ck => 
        prog.title.toLowerCase().includes(ck) || 
        prog.careerOutcomes.some(co => co.toLowerCase().includes(ck))
      );
      
      if (isRelated) {
        score += 30;
      }
      
      // 2. Match by geography constraints
      if (targetCountries.length > 0) {
        if (targetCountries.includes(uniCountry)) {
          score += 15;
        } else {
          score -= 5; // Slight penalty for non-matching specific country choice
        }
      } else if (geoVal.includes("abroad") || geoVal.includes("foreign") || geoVal.includes("outside india")) {
        score += 10; // Positive bias for any international options
      }
      
      // 3. Match by budget / tuition cost
      if (prefersLowBudget) {
        if (prog.tuitionFee === 0) {
          score += 20; // Massive boost for tuition-free (Germany)
        } else if (prog.tuitionFee < 15000) {
          score += 15;
        } else if (prog.tuitionFee < 35000) {
          score += 8;
        } else {
          score -= 5; // Negative bias for extremely high tuition if low budget preferred
        }
        
        if (prog.scholarshipsAvailable) {
          score += 5;
        }
      } else {
        // If they have high budget or "unlimited", favor high-ranking universities
        if (uni.qsRanking <= 10) {
          score += 10;
        }
      }
      
      // 4. Boost score based on QS Ranking of university
      if (uni.qsRanking <= 10) score += 5;
      else if (uni.qsRanking <= 50) score += 3;

      if (isRelated) {
        matches.push({
          university: uni,
          programme: prog,
          matchScore: Math.min(99, Math.max(10, score)),
          personalizedExplanation: `Northr recommends ${uni.name} because its "${prog.title}" program directly targets your career goals in ${path.fieldName}. It is located in ${uni.country} (${uni.internationalDiversity}) and aligns perfectly with your geographic preference ("${constraints.geography?.value || 'Abroad'}"), presenting a strong academic and financial fit.`
        });
      }
    }
  }
  
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
