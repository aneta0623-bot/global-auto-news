const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const companiesSource = html.match(/const companies=(\{[\s\S]*?\});\s*const articles=/)?.[1];
if (!companiesSource) throw new Error('Could not read the dashboard company list');
const companies = vm.runInNewContext(`(${companiesSource})`);
const startDate = '2025-07-01';
const afterDate = '2025-06-30';
const markets = {
  Thailand: { gl:'TH', hl:'en-US', local:'Thailand OR Thai OR ประเทศไทย OR ไทย', lang:'th-TH' },
  Indonesia: { gl:'ID', hl:'en-US', local:'Indonesia OR Indonesian OR Indonesia', lang:'id-ID' },
  Malaysia: { gl:'MY', hl:'en-MY', local:'Malaysia OR Malaysian', lang:'ms-MY' },
  Vietnam: { gl:'VN', hl:'en-US', local:'Vietnam OR Vietnamese OR Việt Nam OR Việt', lang:'vi-VN' },
  Japan: { gl:'JP', hl:'en-US', local:'Japan OR Japanese OR 日本', lang:'ja-JP' },
  Mexico: { gl:'MX', hl:'en-US', local:'Mexico OR Mexican OR México', lang:'es-MX' },
  Brazil: { gl:'BR', hl:'en-US', local:'Brazil OR Brazilian OR Brasil', lang:'pt-BR' },
  EU: { gl:'IE', hl:'en-US', local:'Europe OR European OR EU', lang:'en-IE' }
};
const aliases = {
  TOYOTA:['Toyota','โตโยต้า'], AAT:['AutoAlliance Thailand','Auto Alliance Thailand','ออโต้อัลลายแอนซ์'], HONDA:['Honda','ฮอนด้า'], ISUZU:['Isuzu','อีซูซุ'], NISSAN:['Nissan','นิสสัน'],
  Mitsubishi:['Mitsubishi Motors','Mitsubishi','มิตซูบิชิ'], BYD:['BYD','บีวายดี'], SAIC:['SAIC Motor','SAIC','MG Motor','MG Thailand','เอ็มจี'], Changan:['Changan'], GWM:['Great Wall Motor','GWM','ORA'],
  ADM:['Astra Daihatsu Motor Indonesia','Astra Daihatsu Motor','Daihatsu Indonesia','Daihatsu'], HPM:['Honda Prospect Motor Indonesia','Honda Prospect Motor','PT Honda Prospect Motor','Honda Indonesia'], AHM:['Astra Honda Motor Indonesia','Astra Honda Motor','AHM'],
  PERODUA:['Perodua'], PROTON:['Proton'], VINFAST:['VinFast'], THACO:['THACO','Truong Hai Auto'],
  SUZUKI:['Suzuki'], DAIHATSU:['Daihatsu'], MAZDA:['Mazda'], SUBARU:['Subaru'], MITSUBISHI:['Mitsubishi Motors','Mitsubishi'],
  NISSAN:['Nissan'], GM:['General Motors','Chevrolet','GM'], VOLKSWAGEN:['Volkswagen','VW'], KIA:['Kia'], STELLANTIS:['Stellantis'], FORD:['Ford'], HYUNDAI:['Hyundai'],
  FIAT:['Fiat'], CHEVROLET:['Chevrolet','GM'], RENAULT:['Renault'], 'VOLKSWAGEN GROUP':['Volkswagen Group','Volkswagen','VW'],
  'RENAULT GROUP':['Renault Group','Renault'], 'BMW GROUP':['BMW Group','BMW'], 'MERCEDES-BENZ':['Mercedes-Benz','Mercedes Benz'],
  'VOLVO CARS':['Volvo Cars','Volvo'], 'HYUNDAI-KIA':['Hyundai','Kia'], TESLA:['Tesla']
};
const searchExpansions={
  AAT:['AutoAlliance Thailand Mazda Ford manufacturing plant','Mazda Thailand production factory','Mazda Thailand production base AutoAlliance','Ford Thailand Mazda Thailand news'],
  SAIC:['MG Thailand SAIC production plant','MG4 Thailand launch sales','MG Motor Thailand new model','เอ็มจี ประเทศไทย รถยนต์'], ISUZU:['Isuzu Thailand assembly sales','อีซูซุ ประเทศไทย รถยนต์','Isuzu D-Max Thailand 2026','Isuzu MU-X Thailand 2025','Isuzu Fast Auto Show Thailand 2025','Isuzu Thailand export 3 million 2025','Isuzu Thailand Motor Expo 2025','Isuzu Thailand 2025 launch official','Isuzu Astra Motor Indonesia IAMI','Isuzu Indonesia commercial vehicle sales'],
  ADM:['Astra Daihatsu Motor Indonesia production sales'], HPM:['Honda Prospect Motor Indonesia HPM cars','Honda Indonesia new car launch sales'],
  AHM:['Astra Honda Motor Indonesia motorcycle sales','AHM sepeda motor Indonesia produksi'], MAZDA:['Mazda Mexico automotriz ventas','Mazda de Mexico production plant'],
  THACO:['THACO Vietnam automobile production'], VINFAST:['VinFast Vietnam automobile production']
};
const localIndustry={Thailand:'รถยนต์ โรงงาน ผลิต',Indonesia:'otomotif mobil pabrik produksi',Malaysia:'automotif kereta kilang',Vietnam:'ô tô nhà máy sản xuất',Japan:'自動車 生産 工場',Mexico:'automotriz planta producción',Brazil:'automotivo fábrica produção',EU:'automotive production factory'};

const decode = s => {let out=s||'';for(let i=0;i<2;i++)out=out.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;|&#160;/gi,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));return out.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()};
const field = (s, tag) => decode((s.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')) || [])[1]);
const normalize = s => decode(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const cleanUrl = raw => {
  try {
    let u = new URL(raw);
    if (u.hostname.includes('bing.com') && u.searchParams.has('url')) return decodeURIComponent(u.searchParams.get('url'));
    u.hash='';
    for (const k of ['oc','utm_source','utm_medium','utm_campaign','utm_content']) u.searchParams.delete(k);
    return u.toString();
  } catch { return raw; }
};
const articleLinkFixes = new Map([
  ['https://www.autossegredos.com.br/marcas/volkswagen-marcas/volkswagen-sao-carlos-30-anos-15-milhoes-de-motores', {
    url:'https://www.vrum.com.br/aceleradas/2026/10/7524891-volkswagen-sao-carlos-faz-30-anos-com-recorde-de-15-milhoes-de-motores.html',
    source:'Vrum', sourceUrl:'https://www.vrum.com.br/'
  }],
  ['https://www.reuters.com/business/autos-transportation/kia-invest-649-million-bring-electric-car-production-mexico-2026-07-29', {
    url:'https://www.investmonterrey.com/investment-announcements/kia-announces-649-million-usd-investment-to-produce-its-first-electric-vehicle-in-monterrey/',
    source:'Invest Monterrey', sourceUrl:'https://www.investmonterrey.com/'
  }]
]);
function parseFeed(xml, engine, country) {
  const out=[];
  for (const item of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const block=item[1], rawTitle=field(block,'title'), rawUrl=field(block,'link'), desc=field(block,'description');
    const sourceTag=block.match(/<(?:[\w.-]+:)?source([^>]*)>([\s\S]*?)<\/(?:[\w.-]+:)?source>/i);
    const source=decode(sourceTag?.[2]) || engine;
    const suffix=` - ${source}`;
    const title=rawTitle.toLowerCase().endsWith(suffix.toLowerCase())?rawTitle.slice(0,-suffix.length).trim():rawTitle;
    const sourceUrl=decode((sourceTag?.[1]?.match(/url=["']([^"']+)["']/i)||[])[1]||'');
    const date=new Date(field(block,'pubDate'));
    if (!title || !rawUrl || !Number.isFinite(date.getTime())) continue;
    const day=date.toISOString().slice(0,10);
    if (day < startDate || day > new Date().toISOString().slice(0,10)) continue;
    const cleanedUrl=cleanUrl(rawUrl), linkFix=articleLinkFixes.get(cleanedUrl.replace(/\/+$/,''));
    out.push({country,title,desc:engine==='Google News'?'':desc.slice(0,500),url:linkFix?.url||cleanedUrl,source:linkFix?.source||source,sourceUrl:linkFix?.sourceUrl||sourceUrl,engine,date:day});
  }
  return out;
}
function escapeQuery(s) { return encodeURIComponent(s).replace(/%20/g,'+'); }
function matchScores(item, country) {
  const body=normalize(`${item.title} ${item.desc}`);
  const title=normalize(item.title);
  const scores=[];
  for (const company of companies[country]) {
    const variants=aliases[company] || [company];
    let best=0;
    for (const v of variants) {
      const n=normalize(v); if (!n) continue;
      const escaped=n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
      if (new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`,'i').test(body)) best=Math.max(best, (normalize(item.title).includes(n)?100:35)+n.length/10);
    }
    if(country==='Indonesia' && company==='HPM' && /\bhonda\b/.test(` ${body} `) && !/motorcycle|motorbike|scooter|sepeda motor|motosikal/.test(body)) best=Math.max(best,45);
    if(country==='Indonesia' && company==='AHM' && /\bhonda\b/.test(` ${body} `) && /motorcycle|motorbike|scooter|sepeda motor|motosikal|pcx|scoopy|vario|beat|supra x|cbr\b/.test(body)) best=Math.max(best,55);
    if(country==='Thailand' && company==='AAT' && /(autoalliance|auto alliance|ออโต้อัลลายแอนซ์)/.test(body)) best=Math.max(best,90);
    if(country==='Thailand' && company==='AAT' && /(mazda|ford|มาสด้า|ฟอร์ด)/.test(body) && !/suzuki/.test(body) && /(thailand|thai|rayong|ประเทศไทย|ไทย)/.test(body)) best=Math.max(best,42);
    if(country==='Thailand' && company==='SAIC' && /\bmg\s?(?:4|3|5|6|zs|hs|s5|ev)\b/.test(body)) best=Math.max(best,50);
    if(country==='Thailand' && company==='ISUZU' && /\b(d[- ]?max|mu[- ]?x)\b/.test(body)) best=Math.max(best,45);
    if (best) scores.push({company,score:best});
  }
  return scores.sort((a,b)=>b.score-a.score);
}
const countryPattern={
  Thailand:/thailand|thai|ประเทศไทย|ไทย/i, Indonesia:/indonesia|indonesian|indonesia/i,
  Malaysia:/malaysia|malaysian/i, Vietnam:/vietnam|vietnamese|viet nam|việt nam|việt/i,
  Japan:/japan|japanese|日本|にほん/i, Mexico:/mexico|mexican|méxico/i,
  Brazil:/brazil|brazilian|brasil/i, EU:/europe|european|europa|eu-27/i
};
const localSourceHosts={
  Thailand:['honda.co.th','nissan.co.th','changan.co.th','gwm.co.th','autolifethailand.tv','nationthailand.com','motorexpo.co.th','boi.go.th'],
  Indonesia:['honda-indonesia.com','isuzu-astra.com','gaikindo.or.id','daihatsu.co.id','byd.com/id','astra.co.id','astramotor.co.id'],
  Malaysia:['honda.com.my','perodua.com.my','proton.com','paultan.org','carlist.my'],
  Vietnam:['vinfastauto.com','vingroup.net','thaco.com.vn','vietnam.vn'], Japan:['global.toyota','honda.co.jp','nissan-global.com','subaru.co.jp','mazda.com','suzuki.co.jp','isuzu-global.com'],
  Mexico:['ford.mx','honda.com.mx','nissan.com.mx','kia.com/mx','gob.mx','inegi.org.mx'], Brazil:['honda.com.br','toyotacomunica.com.br','media.stellantis.com/br','byd.com/br','nissannews.com/pt-br','gm.com.br'],
  EU:['acea.auto','europa.eu','media.stellantis.com','volkswagen-newsroom.com','press.bmwgroup.com','media.mercedes-benz.com','hyundai.news/eu']
};
function isInMarket(item,country){
  if(countryPattern[country].test(`${item.title} ${item.desc}`))return true;
  const src=(item.sourceUrl||'').toLowerCase();
  return (localSourceHosts[country]||[]).some(h=>src.includes(h));
}
function eventText(s){const tr=String(s||'').toLowerCase().replace(/ประเทศไทย/g,' thailand ').replace(/อีซูซุ/g,' isuzu ').replace(/บีโอไอ/g,' boi ').replace(/อนุมัติ/g,' approve ').replace(/ขยายฐานผลิต/g,' factory upgrade ').replace(/ฐานผลิต/g,' factory ').replace(/ขยาย/g,' upgrade ').replace(/ผลิต/g,' production ').replace(/จ้างงาน/g,' jobs ').replace(/ลงทุน/g,' invest ').replace(/ส่งออกรถ/g,' vehicle export ').replace(/ส่งออก/g,' export ').replace(/ประเทศไทย/g,' thailand ');return normalize(tr).replace(/\b300(?:[.,]0{3}|k| ribu| thousand|000)\b/g,'300000').replace(/\b(produksi|production|manufacturing|manufacture|manufactured|producing)\b/g,'manufacture').replace(/\b(pabrik|factory|plant|kilang)\b/g,'factory').replace(/\b(rayakan|celebrates?|celebrating|reaches?|hits?|capai|reached)\b/g,'record').replace(/\b(units?|kendaraan|vehicles?|cars?)\b/g,'vehicle').replace(/\b(export|ekspor|exports?)\b/g,'export').replace(/\b(approves?|approved)\b/g,'approve');}
function similar(a,b,dateA,dateB){
  if(dateA&&dateB&&Math.abs(new Date(dateA)-new Date(dateB))>4*86400000)return false;
  const A=new Set(eventText(a).split(' ').filter(x=>x.length>2)), B=new Set(eventText(b).split(' ').filter(x=>x.length>2));
  if(!A.size||!B.size)return false;
  let overlap=0;for(const w of A)if(B.has(w))overlap++;
  const ratio=overlap/Math.min(A.size,B.size);
  if(ratio>.88)return true;
  const shared=new Set([...A].filter(x=>B.has(x)));
  return ratio>.55&&shared.has('isuzu')&&shared.has('boi')&&(shared.has('upgrade')||shared.has('factory'));
}
async function get(url) {
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; PersonalAutoNewsReader/1.0)'},signal:AbortSignal.timeout(25000)});
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}
const jobs=[];
for (const [country, list] of Object.entries(companies)) {
  const market=markets[country];
  for (const company of list) {
    const terms=aliases[company] || [company];
    const primary=terms[0];
    const queries=[`${primary} ${market.local} after:${afterDate}`, `${primary} ${country} car OR automotive after:${afterDate}`, `${primary} ${localIndustry[country]} ${country} after:${afterDate}`,...(searchExpansions[company]||[]).map(q=>`${q} after:${afterDate}`)];
    for (const q of queries) {
      const google=`https://news.google.com/rss/search?q=${escapeQuery(q)}&hl=${market.hl}&gl=${market.gl}&ceid=${market.gl}:${market.lang}`;
      const bing=`https://www.bing.com/news/search?q=${escapeQuery(q)}&format=rss&mkt=${market.lang}`;
      jobs.push({country,company,engine:'Google News',url:google});
      jobs.push({country,company,engine:'Bing News',url:bing});
    }
  }
}
let cursor=0, completed=0, succeeded=0;
const rawByMarket={};
async function worker(){
  while(true){
    const i=cursor++; if(i>=jobs.length) return;
    const job=jobs[i];
    try { const xml=await get(job.url); succeeded++; (rawByMarket[job.country] ||= []).push(...parseFeed(xml,job.engine,job.country)); }
    catch(e){ console.warn(`${job.country}/${job.company}/${job.engine}: ${e.message}`); }
    completed++; if(completed%24===0) console.log(`Fetched ${completed}/${jobs.length} feeds`);
  }
}
(async()=>{
  await Promise.all(Array.from({length:12},worker));
  if(succeeded<jobs.length*.7) throw new Error(`Only ${succeeded}/${jobs.length} search feeds returned; keeping the previous data file.`);
  const output={updatedAt:new Date().toISOString(),since:startDate,scope:'Google News and Bing News RSS; search candidates plus verified official releases',markets:{}};
  for (const [country,list] of Object.entries(companies)) {
    const unique=[];
    for (const item of (rawByMarket[country]||[])) {
      if(/youtube|tiktok|instagram|facebook|reddit/i.test(item.source)) continue;
      const owners=matchScores(item,country); if(!owners.length) continue;
      if(!isInMarket(item,country)) continue;
      const owner=owners[0].company;
      const titleKey=eventText(item.title).replace(/\b(reuters|ap news|yahoo finance|msn)\b/g,'').trim();
      const same=unique.find(a=>a.country===country && (a.url===item.url || similar(a.titleKey,titleKey,a.date,item.date)));
      if (!same) unique.push({...item,owner,titleKey});
      else if (item.engine==='Google News' && same.engine!=='Google News') Object.assign(same,item,{owner,titleKey});
    }
    const officialSupplements=country==='Thailand' ? [
      {date:'2025-07-03',company:'ISUZU',title:'Isuzu, Fast Auto Show Thailand 2025에서 D-MAX·MU-X 전시 및 현지 캠페인 진행',desc:'Isuzu Thailand가 D-MAX와 MU-X 8대를 전시하고 사후 서비스 디지털 전환과 현지 생산·수출 기반을 소개했다.',url:'https://www.isuzu-tis.com/news-activities/public-relations/isuzu-fast-auto-show-thailand-2025',source:'Isuzu Thailand Official'},
      {date:'2025-10-22',company:'ISUZU',title:'Isuzu Thailand, 신형 D-MAX·MU-X 공개 및 4x4 체험장 개선',desc:'신형 픽업·SUV 라인업을 공개하고 4x4 체험 시설에 1억 바트를 투자했다고 발표했다.',url:'https://www.isuzu-tis.com/news-activities/public-relations/isuzu-4x4-experience-launch-2025',source:'Isuzu Thailand Official'},
      {date:'2025-12-09',company:'ISUZU',title:'Isuzu Thailand, 현지 생산차 글로벌 누적 수출 300만대 달성',desc:'태국 생산 D-MAX와 MU-X의 누적 수출이 300만대에 도달했으며, 수출 국가와 현지 부품 조달 현황을 공개했다.',url:'https://www.isuzu-tis.com/news-activities/public-relations/isuzu-final-exporting-3m',source:'Isuzu Thailand Official'},
      {date:'2025-11-10',company:'ISUZU',title:'Isuzu, 2025 태국 국제 모터 엑스포 참가 및 부스 운영 발표',desc:'태국 모터 엑스포 2025 참가와 전시 일정·부스 정보를 공개했다.',url:'https://www.isuzu.co.th/news/WRV5anDgxY',source:'Isuzu Motors Asia (Thailand)'}
    ] : [];
    for(const item of officialSupplements){
      const titleKey=eventText(item.title), record={...item,country,owner:item.company,engine:'공식 발표',sourceUrl:item.url,titleKey,desc:item.desc,verified:true};
      const same=unique.find(a=>a.url===item.url||similar(a.titleKey,titleKey,a.date,item.date));
      if(same) Object.assign(same,record); else unique.push(record);
    }
    output.markets[country]={};
    for (const company of list) {
      const items=unique.filter(a=>a.owner===company).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
      output.markets[country][company]=items;
      console.log(`${country} / ${company}: ${items.length}`);
    }
  }
  const file=path.join(dist,'live-news.json'), temp=file+'.tmp';
  fs.writeFileSync(temp,JSON.stringify(output)); fs.renameSync(temp,file);
  console.log(`Wrote ${file} from ${completed}/${jobs.length} feeds.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
