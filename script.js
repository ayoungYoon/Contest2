document.getElementById("recommendation-form").addEventListener("submit", async function(e) {
    e.preventDefault();
  
    const userInput = document.getElementById("user_input").value;
    const region = document.getElementById("region").value;
  
    const [jobsData, matchData, industryData, youthData] = await Promise.all([
      fetch("data/jobs.json").then(r => r.json()),
      fetch("data/match.json").then(r => r.json()),
      fetch("data/industry.json").then(r => r.json()),
      fetch("data/youth.json").then(r => r.json())
    ]);
  
    const interestType = inferInterestType(userInput);
    if (!interestType) return alert("성향에서 흥미유형을 파악할 수 없습니다.");
  
    const topIndustries = getTopIndustries(region, industryData);
    if (topIndustries.length === 0) return alert("해당 지역 산업 데이터를 찾을 수 없습니다.");
  
    const topYouthJobs = getTopYouthJobs(youthData);
    const recommendedJobs = getRecommendedJobs(topIndustries, interestType, matchData, jobsData);
  
    document.getElementById("type").textContent = interestType;
    populateList("industries", topIndustries);
    populateList("youth_jobs", topYouthJobs);
    populateList("recommended_jobs", recommendedJobs);
  
    document.getElementById("result").style.display = "block";
  });
  
  function inferInterestType(text) {
    text = text.toLowerCase();
    if (["현실", "실용", "기계", "움직", "신체", "도구", "활동"].some(w => text.includes(w))) return "현실형 (R)";
    if (["탐구", "논리", "분석", "호기심", "지식", "이론", "추리"].some(w => text.includes(w))) return "탐구형 (I)";
    if (["예술", "감성", "창의", "자유", "표현", "상상", "창작"].some(w => text.includes(w))) return "예술형 (A)";
    if (["사람", "공감", "상담", "도움", "친절", "소통", "봉사"].some(w => text.includes(w))) return "사회형 (S)";
    if (["주도", "리더", "설득", "도전", "목표", "승부", "기획"].some(w => text.includes(w))) return "진취형 (E)";
    if (["계획", "정리", "규칙", "체계", "서류", "문서", "안정"].some(w => text.includes(w))) return "관습형 (C)";
    return null;
  }
  
  function getTopIndustries(region, data, topN = 3) {
    const filtered = data.filter(d => d["행정구역별"] === region && d["산업별"] !== "계");
    const converted = filtered.map(d => ({
      industry: d["산업별"],
      count: parseInt(d["2024.1/2"].replace(/,/g, "")) || 0
    })).filter(d => !isNaN(d.count));
    return converted.sort((a, b) => b.count - a.count).slice(0, topN).map(d => d.industry);
  }
  
  function getTopYouthJobs(data, topN = 3) {
    const processed = data.map(d => ({
      category: d["직업군"],
      count: (parseFloat(d["2023_13-18세"] || 0) + parseFloat(d["2023_19-24세"] || 0))
    })).sort((a, b) => b.count - a.count);
    return processed.slice(0, topN).map(d => d.category);
  }
  
  function getRecommendedJobs(industries, interestType, matchData, jobsData) {
    let matches = [];
    industries.forEach(ind => {
      const row = matchData.find(m => m["산업"] === ind && m["흥미유형"] === interestType);
      if (row && row["추천직업"]) {
        try {
          const parsed = JSON.parse(row["추천직업"].replace(/'/g, '"'));
          matches.push(...parsed);
        } catch {}
      }
    });
    if (matches.length === 0) {
      const fallback = jobsData.find(j => j["흥미유형"] === interestType);
      if (fallback && fallback["직업목록"]) {
        matches = fallback["직업목록"].split(',').map(s => s.trim());
      }
    }
    return [...new Set(matches)];
  }
  
  function populateList(id, items) {
    const ul = document.getElementById(id);
    ul.innerHTML = "";
    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  }
  