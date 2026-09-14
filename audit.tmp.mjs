import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pages=[['/','home'],['/services','services'],['/how-it-works','howitworks'],['/service-areas','areas'],['/short-term-rentals','str'],['/about','about'],['/blog','blog'],['/book','book']];
for (const [path,name] of pages){
  const ctx=await b.newContext({viewport:{width:1280,height:900}});
  const p=await ctx.newPage();
  await p.goto('http://localhost:8099/').catch(()=>{});
  await p.waitForTimeout(400);
  await p.evaluate(u=>history.pushState({},'',u), path);
  await p.evaluate(()=>window.dispatchEvent(new PopStateEvent('popstate')));
  await p.waitForTimeout(1400);
  const d=await p.evaluate(()=>{
    const secs=[...document.querySelectorAll('section,[id]')].filter(e=>e.tagName==='SECTION');
    return {
      h: Math.round(document.body.scrollHeight),
      sections: secs.length,
      headings: [...document.querySelectorAll('h1,h2,h3')].map(h=>h.tagName+': '+h.innerText.replace(/\s+/g,' ').trim()).filter(t=>t.length<90),
      words: document.body.innerText.split(/\s+/).filter(Boolean).length,
    };
  });
  console.log(`\n===== ${path}  (${d.h}px tall, ${d.sections} sections, ~${d.words} words) =====`);
  d.headings.forEach(h=>console.log('   '+h));
  await ctx.close();
}
await b.close();
