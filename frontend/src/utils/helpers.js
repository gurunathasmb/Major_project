// filepath: C:\Users\mohit\Desktop\Major project\src\utils\helpers.js
export const genId = (prefix, list=[])=>{
  const existing = list.map(i=>i.id).filter(Boolean);
  let num = existing.length + 1;
  let id = `${prefix}${String(num).padStart(3,'0')}`;
  while (existing.includes(id)) {
    num++; id = `${prefix}${String(num).padStart(3,'0')}`;
  }
  return id;
};

export const isoNow = ()=> new Date().toISOString().split('T')[0];

// Mock: generate random landmark points as percentages
export const randomLandmarks = (landmarks)=>{
  return landmarks.map(name=>({
    name,
    xPercent: Math.random()*80 + 10, // keep inside 10-90%
    yPercent: Math.random()*80 + 10
  }));
};

// Mock analysis from landmarks -> angles and categories
export const mockAnalysis = ()=>{
  // simple random near-normal values
  const angles = {
    SNA: 80 + Math.round((Math.random()*8-4)),
    SNB: 78 + Math.round((Math.random()*8-4)),
    ANB: 2 + Math.round((Math.random()*4-2)),
    FMA: 25 + Math.round((Math.random()*10-5)),
    "UI-SN": 102 + Math.round((Math.random()*10-5))
  };
  const airwayOpts = ["Restricted","Normal","Enlarged"];
  const growthOpts = ["Horizontal","Vertical","Average"];
  return {
    angles,
    airwayMandible: airwayOpts[Math.floor(Math.random()*airwayOpts.length)],
    growthPattern: growthOpts[Math.floor(Math.random()*growthOpts.length)]
  };
};