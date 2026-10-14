const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seed=[['구름뿡뿡이의 알록달록 감정','cloud','기쁨','#eee9dc','오늘도 좋은 날!'],['모콩이 오늘도 파이팅','bear','응원','#e8ecd9','넌 할 수 있어!'],['부기의 마음 배달','','위로','#f8e5dc','마음을 전해요'],['포포의 오늘 표정','cat','기쁨','#f7ebce','앗! 행복 발견'],['행복천의 다정한 하루','bear','위로','#eedfcd','토닥토닥'],['퇴근이 기다려지는 직장인','cat','공감','#e4e8e6','퇴근하고 싶다…'],['몽글몽글 사랑 표현','','사랑','#f5e0e1','많이 좋아해 ♡'],['잘 자요 꿈친구','cloud','휴식','#e8e3ef','좋은 꿈 꿔요']].map((a,i)=>({id:i+1,name:a[0],type:a[1],emotion:a[2],color:a[3],caption:a[4],status:'pending',likes:0,visible:true}));
let works=[],users=[],liked=[],cart=[],posts=[],filter='전체',search='',sort='default',adminTab='overview';
let profile=null,cloud=null,connection='loading',connectionError='',authGeneration=0,authSubmitting=false;
const currentUser=()=>profile;
const character=(type='')=>`<div class="character ${esc(type)}" aria-hidden="true"><div class="face"><i class="eyes"></i><i class="mouth"></i><i class="cheeks"></i></div></div>`;
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
function header(){return `<header><a class="logo" href="#home"><img src="images/logo.png" alt="EMOTIVE"></a><nav id="nav"><a href="#works">이모티콘 & 굿즈</a><a href="#magazine">작가 매거진</a><a href="#community">팬 커뮤니티</a><a href="#about">Emotive 소개</a></nav><div class="utilities"><a class="search-button" href="#works" aria-label="작품 검색">⌕</a><a href="#cart" aria-label="장바구니">♧ <small>${cart.reduce((n,c)=>n+c.qty,0)}</small></a>${currentUser()?`<a href="#account">${esc(currentUser().name)}님</a><button data-action="logout" class="small">로그아웃</button>`:'<a class="small" href="#login">로그인</a><a class="pill" href="#signup">회원가입</a>'}<button class="menu-toggle" data-action="menu" aria-label="메뉴 열기" aria-expanded="false">☰</button></div></header>`}
function footer(){return `<footer><div class="container"><div class="footer-top"><div><a href="#home" class="logo"><img src="images/logo.png" alt="EMOTIVE"></a><p>작은 표현에 담긴 커다란 마음.<br>당신의 일상에 다정한 온기를 더합니다.</p></div><div><strong>함께 만나요</strong><p><a href="#works">이모티콘 & 굿즈</a>　 <a href="#magazine">작가 인터뷰</a><br><a href="#community">팬 라운지</a>　 <a href="#about">작가 소개 · 문의</a></p></div><div><strong>작가 천보식</strong><p><a href="mailto:cjsk1126@naver.com">cjsk1126@naver.com ↗</a><br><a href="tel:01034232704">010-3423-2704</a></p></div></div><div class="footer-bottom"><span>© 2026 EMOTIVE. All characters, all hearts.</span><span><button data-action="policy">이용 안내 · 개인정보</button>　<a href="#admin">관리자 스튜디오 ↗</a></span></div></div></footer>`}
function cards(list){return list.length?list.map(w=>`<article class="art-card"><button class="art-image full" style="background:${esc(w.color)}" data-action="detail" data-id="${esc(w.id)}" aria-label="${esc(w.name)} 상세 보기"><span class="caption">${esc(w.caption)}</span>${character(w.type)}${w.status==='approved'?'<span class="badge">승인 작품</span>':''}</button><button class="heart ${liked.includes(w.id)?'liked':''}" data-action="like" data-id="${esc(w.id)}" aria-label="${esc(w.name)} 찜" aria-pressed="${liked.includes(w.id)}">${liked.includes(w.id)?'♥':'♡'}</button><h3><a href="#work/${esc(w.id)}">${esc(w.name)}</a></h3><p>천보식 작가 · 캐릭터 콘셉트</p><div class="meta"><span>#${esc(w.emotion)}　#일상의온기</span><span>♡ ${w.likes+Number(liked.includes(w.id))}</span></div></article>`).join(''):'<p class="empty">찾는 작품이 없어요. 다른 검색어나 감정을 선택해 주세요.</p>'}
function filters(){return `<div class="filters">${['전체','기쁨','위로','응원','사랑','공감','휴식'].map(f=>`<button class="chip ${filter===f?'active':''}" data-action="filter" data-filter="${f}" aria-pressed="${filter===f}">${f==='전체'?'전체 보기':f}</button>`).join('')}</div>`}
function selectedWorks(){let list=works.filter(w=>w.visible&&(filter==='전체'||w.emotion===filter)&&w.name.includes(search));if(sort==='likes')list.sort((a,b)=>b.likes-a.likes);if(sort==='new')list.sort((a,b)=>(b.createdAt??0)-(a.createdAt??0));return list}
function home(){return `<main class="container"><section class="hero"><div><span class="eyebrow">A LITTLE WARMTH FOR YOUR EVERYDAY</span><h1>오늘의 감정을,<br><span>오래 곁에 두는 방법.</span></h1><p>말로 다 전하지 못한 마음도 괜찮아요.<br>천보식 작가의 다정한 캐릭터가 당신의 마음을 대신 전해줄게요.</p><div class="actions"><a href="#works" class="btn">이모티콘 만나보기 <span>↗</span></a><a href="#magazine" class="btn secondary">작가 이야기 읽기</a></div><div class="hero-note"><span class="dots">● ● ●</span>작은 캐릭터, 커다란 마음. EMOTIVE와 함께해요.</div></div><div class="stage" aria-label="다정한 토끼와 곰, 고양이 캐릭터 일러스트"><span class="bubble">오늘도, 마음은 몽글몽글 ♡</span><span class="star">✧</span>${character('')}${character('bear')}${character('cat')}<span class="floating">♡</span></div></section><div class="quick"><a href="#works"><span class="icon">☀</span><div><strong>캐릭터 만나기</strong><small>마음에 쏙 드는 친구 찾기</small></div></a><a href="#goods"><span class="icon">♧</span><div><strong>일상 속 작은 굿즈</strong><small>좋아하는 마음을 곁에</small></div></a><a href="#magazine"><span class="icon">▤</span><div><strong>작가의 이야기</strong><small>캐릭터 뒤에 숨은 마음</small></div></a><a href="#community"><span class="icon">☏</span><div><strong>우리의 팬 라운지</strong><small>함께 나누면 더 따뜻해요</small></div></a></div><section><div class="section-head"><div><span class="eyebrow">MEET YOUR LITTLE FRIENDS</span><h2>어떤 마음을 전하고 싶나요?</h2><p>당신의 오늘과 닮은 캐릭터를 만나보세요.</p></div><a class="text-link" href="#works">전체 작품 보기 ↗</a></div>${filters()}<div class="grid" id="work-grid">${cards(selectedWorks().slice(0,4))}</div><div class="story-row"><article class="story"><span class="eyebrow">ARTIST'S NOTE</span><h2>작은 낙서에서 시작된<br>다정한 세계</h2><p>하나의 표정에 마음을 담는 일.<br>천보식 작가의 캐릭터 이야기를 만나보세요.</p><a class="text-link" href="#magazine">작가 매거진 읽기 ↗</a>${character('bear')}</article><article class="story second"><span class="eyebrow">COMING SOON</span><h2>좋아하는 마음을<br>일상에 데려오세요.</h2><p>키링부터 스티커까지, 작고 소중한 친구들.<br>캐릭터 굿즈를 준비하고 있어요.</p><a class="text-link" href="#goods">굿즈 미리보기 ↗</a>${character('')}</article></div></section><section class="lounge"><div><span class="eyebrow">OUR LITTLE LOUNGE</span><h2>함께 나누는 다정한 순간</h2><p style="color:var(--muted);line-height:1.8">오늘의 기분, 좋아하는 캐릭터, 작가에게 하고 싶은 말.<br>당신의 이야기를 들려주세요.</p><a class="text-link" href="#community">팬 라운지 놀러가기 ↗</a></div><div>${posts.length?posts.slice(-3).reverse().map(p=>`<div class="post"><div>${esc(p.text)}<p>${esc(p.name)} · ${esc(p.date)}</p></div><span>♡</span></div>`).join(''):'<div class="post"><div>아직 첫 이야기를 기다리고 있어요.<p>가장 먼저 다정한 한마디를 남겨보세요.</p></div><span>♡</span></div>'}<div class="post"><div>캐릭터 콘셉트 8종을 소개합니다.<p>EMOTIVE · 작품 승인 및 굿즈는 준비 중입니다.</p></div><span>↗</span></div></div></section><section class="about-banner"><div><h2>마음과 마음 사이, EMOTIVE.</h2><p>당신의 평범한 하루에 작은 웃음이 되기를.</p></div><a href="#about" class="btn secondary">작가를 소개합니다 ↗</a></section></main>`}
function worksPage(goods=false){return `<main class="container page"><span class="eyebrow">${goods?'LITTLE THINGS, BIG LOVE':'CHARACTER COLLECTION'}</span><h1>${goods?'일상에 데려오는 작은 친구들':'당신의 마음을 닮은 캐릭터'}</h1><p style="color:var(--muted)">${goods?'굿즈 콘셉트 미리보기 · 실제 판매와 결제는 준비 중입니다.':'기획 콘셉트 8선 · 실제 승인 여부가 확인되면 승인 배지가 표시됩니다.'}</p><div class="search-row"><input class="search" id="search" placeholder="캐릭터 이름으로 찾아보세요" aria-label="작품 검색" value="${esc(search)}"><select class="search" id="sort" aria-label="작품 정렬" style="max-width:150px"><option value="default">기본순</option><option value="new" ${sort==='new'?'selected':''}>최신순</option><option value="likes" ${sort==='likes'?'selected':''}>공감순</option></select><button class="pill" data-action="reset">초기화</button></div>${filters()}<p id="result-count" class="small">${selectedWorks().length}개의 캐릭터</p><div id="work-grid" class="grid">${cards(selectedWorks())}</div></main>`}
function auth(signup=false){return `<main class="container page"><div class="auth-wrap"><span class="eyebrow">WELCOME TO OUR WARM WORLD</span><h1>${signup?'다정한 만남의 시작':'다시 만나 반가워요.'}</h1><p>${signup?'EMOTIVE의 작은 친구들과 함께해요.':'당신이 좋아하는 마음들을 만나보세요.'}</p><form id="auth-form" data-mode="${signup?'signup':'login'}">${signup?'<label>닉네임<input name="name" required maxlength="20" autocomplete="nickname" placeholder="어떻게 불러드릴까요?"></label>':''}<label>이메일<input type="email" name="email" required autocomplete="email" placeholder="hello@example.com"></label><label>비밀번호<input type="password" name="password" required minlength="8" maxlength="128" autocomplete="${signup?'new-password':'current-password'}" placeholder="8자 이상 입력해 주세요"></label>${signup?'<label>비밀번호 확인<input type="password" name="confirm" required minlength="8" autocomplete="new-password" placeholder="비밀번호를 한 번 더 입력해 주세요"></label><label class="check"><input type="checkbox" required>Firebase를 통한 계정 생성 및 프로필 저장을 확인했습니다.</label>':''}<p class="error" id="auth-error" role="alert"></p><button class="btn full" type="submit">${signup?'회원가입':'로그인'} ↗</button></form><div class="auth-link">${signup?'이미 함께하고 계신가요? <a href="#login">로그인</a>':'처음 오셨나요? <a href="#signup">회원가입</a>'}</div><p class="notice" style="margin-top:25px">Firebase Authentication으로 계정을 안전하게 관리합니다. 관리자 권한은 운영자가 별도로 지정합니다.</p></div></main>`}
function magazine(){return `<main class="container page article"><span class="eyebrow">EMOTIVE MAGAZINE · EDITORIAL PREVIEW</span><h1>작은 낙서에서 시작된<br>다정한 세계</h1><p class="small">천보식 작가 · 브랜드 이야기 / 소개용 편집 콘텐츠</p><div class="portrait">${character('bear')}</div><h2>표정 하나에 담긴 마음</h2><p>반가움, 고마움, 그리고 말없이 건네는 응원. EMOTIVE는 일상에서 느끼는 작은 감정을 캐릭터의 표정으로 표현하는 공간입니다. 다정한 한마디가 필요한 순간, 내 마음과 닮은 친구를 찾아보세요.</p><blockquote>오늘의 감정을, 오래 곁에 두는 방법.</blockquote><h2>캐릭터와 함께하는 하루</h2><p>구름뿡뿡이부터 꿈친구까지, 여덟 가지 캐릭터 콘셉트를 준비했습니다. 작품과 굿즈는 준비 과정을 거쳐 차례로 소개합니다. 작가에게 궁금한 점이 있다면 팬 라운지에 남겨 주세요.</p><a class="btn" href="#community">작가에게 한마디 ↗</a></main>`}
function community(){return `<main class="container page article"><span class="eyebrow">OUR LITTLE LOUNGE</span><h1>우리의 다정한 이야기</h1><p>응원도, 질문도, 오늘의 작은 기쁨도 좋아요.</p><div class="notice">다른 팬들에게 공개되는 팬 라운지입니다. 전화번호나 주소 등 개인정보는 남기지 마세요.</div><form id="post-form"><label>작가에게 한마디<textarea name="text" rows="4" maxlength="500" required placeholder="오늘의 마음을 나눠주세요."></textarea></label><button class="btn">이야기 남기기 ↗</button></form><h2>팬 라운지 <small>(${posts.length})</small></h2>${posts.length?posts.slice().reverse().map(p=>`<div class="post"><div><strong>${esc(p.name)}</strong><p>${esc(p.date)}</p><div style="white-space:pre-wrap">${esc(p.text)}</div>${p.reply?`<p>작가의 답변: ${esc(p.reply)}</p>`:''}</div>${currentUser()?.id===p.userId?`<button data-action="delete-post" data-id="${esc(p.id)}">삭제</button>`:''}</div>`).join(''):'<p class="empty">첫 번째 이야기를 기다리고 있어요 ♡</p>'}</main>`}
function about(){return `<main class="container page article"><span class="eyebrow">HELLO, I'M YOUR ARTIST</span><h1>마음에 작은 온기를.<br>작가 천보식입니다.</h1><div class="portrait">${character('')}</div><h2>EMOTIVE에 오신 것을 환영해요.</h2><p>이모티콘과 캐릭터 굿즈, 작가 이야기와 팬들의 마음이 만나는 곳. EMOTIVE에서 당신의 오늘과 닮은 감정을 발견해 보세요.</p><h2>함께 이야기해요</h2><p>작품 및 협업 문의는 아래 연락처로 보내주세요.</p><div class="actions"><a class="btn" href="mailto:cjsk1126@naver.com">이메일로 문의 ↗</a><a class="btn secondary" href="tel:01034232704">010-3423-2704</a></div></main>`}
function admin(){if(!currentUser())return `<main class="container page"><div class="auth-wrap"><h1>작가 스튜디오</h1><p>관리자 계정으로 로그인해 주세요.<br>운영자가 지정한 관리자 계정으로 이용할 수 있습니다.</p><a class="btn full" href="#login">로그인하기</a></div></main>`;if(currentUser().role!=='admin')return '<main class="container page"><h1>관리자 전용 공간입니다.</h1><a class="btn" href="#home">홈으로 돌아가기</a></main>';return `<main class="container page"><div class="admin-layout"><aside class="sidebar"><strong>EMOTIVE STUDIO</strong>${[['overview','◫ 대시보드'],['works','✎ 작품 관리'],['members','♙ 회원 관리'],['messages','☏ 팬 메시지'],['settings','⚙ 설정']].map(([id,name])=>`<button class="${adminTab===id?'active':''}" data-action="admin-tab" data-tab="${id}">${name}</button>`).join('')}<a class="small" href="#home">← 홈페이지 보기</a></aside><div><div class="section-head"><div><span class="eyebrow">YOUR CREATIVE SPACE</span><h1 style="margin:10px 0">${{overview:'안녕하세요, 작가님 ☀',works:'작품 관리',members:'함께하는 사람들',messages:'팬들의 다정한 메시지',settings:'스튜디오 설정'}[adminTab]}</h1><p>오늘도 당신의 이야기를 세상에 전해보세요.</p></div><div class="actions"><button class="btn secondary" data-action="import-examples">예시 8종 등록</button><button class="btn" data-action="new-work">＋ 작품 등록</button></div></div><div class="notice">Firebase 연동 스튜디오 · 작품 승인 및 공개 상태가 홈페이지에 반영됩니다.</div>${adminContent()}</div></div></main>`}
function adminContent(){if(adminTab==='settings')return `<div class="panel"><h3>계정 설정</h3><form id="settings-form"><label>작가 닉네임<input name="name" value="${esc(currentUser().name)}" required maxlength="20"></label><label>이메일<input value="${esc(currentUser().email)}" disabled></label><button class="btn">변경 저장</button></form><p class="small">회원 프로필은 Firebase에 저장됩니다.</p></div>`;if(adminTab==='members')return `<div class="panel table-wrap"><h3>회원 목록 · ${users.length}명</h3><table><thead><tr><th>닉네임</th><th>이메일</th><th>역할</th><th>가입일</th></tr></thead><tbody>${users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role==='admin'?'관리자':'회원'}</td><td>${esc(u.date)}</td></tr>`).join('')}</tbody></table></div>`;if(adminTab==='messages')return `<div class="panel"><h3>팬 메시지 · ${posts.length}개</h3>${posts.length?posts.map(p=>`<div class="post"><div><strong>${esc(p.name)}</strong><p>${esc(p.text)}</p>${p.reply?`<p>답변: ${esc(p.reply)}</p>`:''}<button class="text-link" data-action="reply" data-id="${esc(p.id)}">답변 ${p.reply?'수정':'등록'}</button></div><button data-action="delete-post" data-id="${esc(p.id)}">삭제</button></div>`).join(''):'<p class="empty">아직 도착한 메시지가 없어요.</p>'}</div>`;return `${adminTab==='overview'?`<div class="stats">${[['등록 작품',works.length+'종'],['가입 회원',users.length+'명'],['내 계정의 찜',liked.length+'개'],['팬 메시지',posts.length+'개']].map(([label,n])=>`<div class="stat"><span>${label}</span><strong>${n}</strong></div>`).join('')}</div><div class="panels"><div class="panel"><h3>캐릭터별 반응 <small class="small">· 내 계정의 찜 기록</small></h3><div class="chart">${works.slice(0,8).map((w,i)=>`<div class="bar" style="height:${liked.includes(w.id)?'100':'3'}%" title="${esc(w.name)}: ${Number(liked.includes(w.id))}개"><span>${i+1}번</span></div>`).join('')}</div></div><div class="panel"><h3>작품 현황</h3><div class="post"><span>승인 완료</span><strong>${works.filter(w=>w.status==='approved').length}종</strong></div><div class="post"><span>승인 준비 중</span><strong>${works.filter(w=>w.status!=='approved').length}종</strong></div><div class="post"><span>공개 작품</span><strong>${works.filter(w=>w.visible).length}종</strong></div></div></div>`:''}<div class="panel table-wrap"><h3>작품 목록 <small class="small">· 실제 승인 확인 후 상태를 변경해 주세요.</small></h3><table><thead><tr><th>작품명</th><th>감정</th><th>심사 상태</th><th>공개</th><th>관리</th></tr></thead><tbody>${works.map(w=>`<tr><td>${esc(w.name)}</td><td>${esc(w.emotion)}</td><td><span class="status ${w.status==='approved'?'approved':''}">${w.status==='approved'?'승인 완료':'준비 중'}</span></td><td>${w.visible?'공개':'비공개'}</td><td><button data-action="approve" data-id="${esc(w.id)}">${w.status==='approved'?'승인 해제':'승인 처리'}</button> · <button data-action="visibility" data-id="${esc(w.id)}">${w.visible?'숨기기':'공개'}</button></td></tr>`).join('')}</tbody></table></div>`}
function cartPage(){return `<main class="container page article"><span class="eyebrow">YOUR LITTLE COLLECTION</span><h1>내 굿즈 보관함</h1><div class="notice">굿즈 콘셉트를 보관하는 데모 장바구니입니다. 실제 주문·결제·배송은 제공되지 않습니다.</div>${cart.length?cart.map(c=>{const w=works.find(w=>w.id===c.id);return w?`<div class="cart-row"><div><strong>${esc(w.name)}</strong><p class="small">아크릴 키링 · 가격 및 판매 일정 준비 중</p></div><div><button data-action="qty" data-id="${esc(w.id)}" data-delta="-1">−</button> ${c.qty} <button data-action="qty" data-id="${esc(w.id)}" data-delta="1">＋</button> <button data-action="remove-cart" data-id="${esc(w.id)}">삭제</button></div></div>`:''}).join(''):'<p class="empty">아직 보관한 굿즈가 없어요.</p>'}<a href="#goods" class="btn" style="margin-top:25px">굿즈 둘러보기 ↗</a></main>`}
function account(){if(!currentUser())return auth();return `<main class="container page"><h1>${esc(currentUser().name)}님의 작은 보관함 ♡</h1><p class="small">찜한 캐릭터 ${liked.length}개</p><div class="grid" style="margin-top:30px">${cards(works.filter(w=>liked.includes(w.id)&&w.visible))}</div>${currentUser().role==='admin'?'<a class="btn" style="margin-top:30px" href="#admin">관리자 스튜디오 ↗</a>':''}</main>`}
function render(){const route=location.hash.slice(1)||'home';$('#modal').close();$('#app').innerHTML=header()+connectionNotice()+({home,works:()=>worksPage(),goods:()=>worksPage(true),login:()=>auth(),signup:()=>auth(true),magazine,community,about,admin,cart:cartPage,account}[route]||home)()+footer();if(route.startsWith('work/'))detail(route.split('/')[1]);window.scrollTo(0,0)}
function modal(content){$('#modal').innerHTML=`<button class="close" data-action="close" aria-label="닫기">×</button>${content}`;$('#modal').showModal()}
function detail(id){const w=works.find(w=>w.id===id&&w.visible);if(!w)return toast('이 작품은 현재 공개되어 있지 않습니다.');modal(`<span class="eyebrow">CHARACTER STORY</span><h2>${esc(w.name)}</h2><div class="detail-image" style="background:${esc(w.color)}">${character(w.type)}</div><p>${esc(w.caption)}. ${esc(w.emotion)}의 순간을 함께하는 작은 친구예요.</p><p class="small">천보식 작가 · ${w.status==='approved'?'승인 작품':'기획 콘셉트 / 승인 준비 중'}</p><div class="notice">연계 굿즈: 아크릴 키링 · 스티커팩<br>가격, 규격, 재고 및 실제 판매 일정은 준비 중입니다.</div><button class="btn full" data-action="add-cart" data-id="${esc(w.id)}">굿즈 보관함에 담기 ♧</button>`)}
function refreshGrid(){if($('#work-grid'))$('#work-grid').innerHTML=cards((location.hash==='#home'||!location.hash)?selectedWorks().slice(0,4):selectedWorks());if($('#result-count'))$('#result-count').textContent=selectedWorks().length+'개의 캐릭터';document.querySelectorAll('[data-action="filter"]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-pressed',b.dataset.filter===filter)})}
document.addEventListener('input',e=>{if(e.target.id==='search'){search=e.target.value.trim();refreshGrid()}});document.addEventListener('change',e=>{if(e.target.id==='sort'){sort=e.target.value;refreshGrid()}});
function connectionNotice() {
  if(connection==='ready')return '';
  return `<div class="container"><div class="notice" role="status" style="margin-top:20px">${connection==='loading'?'Firebase 연결 정보를 불러오는 중입니다…':`${esc(connectionError)} <button class="text-link" data-action="retry">다시 연결</button>`}</div></div>`;
}
function requireCloud() {if(!cloud||connection!=='ready')throw Error('Firebase 연결을 먼저 확인해 주세요.');}
function requireMember() {requireCloud();if(!profile)throw Error('로그인 후 이용해 주세요.');}
function requireAdmin() {requireMember();if(profile.role!=='admin')throw Error('관리자 계정이 필요합니다.');}
async function refreshCloud() {
  const generation=authGeneration,activeProfile=profile;
  const data=await withTimeout(cloud.loadData(activeProfile));
  if(generation!==authGeneration)return;
  ({works,users,liked,cart,posts}=data);connection='ready';connectionError='';
}
async function syncAuth(user) {
  const generation=++authGeneration;
  profile=null;users=[];liked=[];cart=[];works=[];posts=[];connection='loading';render();
  try {
    const nextProfile=user?await withTimeout(cloud.ensureProfile(user)):null;
    if(generation!==authGeneration)return;
    profile=nextProfile;
    await refreshCloud();
    if(generation===authGeneration)render();
  } catch(error) {
    if(generation!==authGeneration)return;
    connection='error';connectionError=cloud.errorMessage(error);render();
  }
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const a=b.dataset.action,id=b.dataset.id,w=works.find(w=>w.id===id);
  try {
    if(a==='menu'){const open=$('#nav').classList.toggle('open');b.setAttribute('aria-expanded',open);return;}
    if(a==='close'){$('#modal').close();return;}
    if(a==='filter'){filter=b.dataset.filter;refreshGrid();return;}
    if(a==='reset'){filter='전체';search='';sort='default';render();return;}
    if(a==='retry'){if(!cloud)await startFirebase();else await syncAuth(cloud.auth.currentUser);return;}
    if(a==='detail'){detail(id);return;}
    if(a==='policy'){modal('<h2>데이터 이용 안내</h2><p>이메일과 비밀번호 인증은 Firebase Authentication이 처리합니다. 회원 프로필, 작품, 팬 메시지, 찜 및 굿즈 보관함은 Realtime Database에 저장됩니다.</p><p>팬 라운지의 닉네임과 메시지는 공개됩니다. 개인정보를 글에 입력하지 마세요. 실제 굿즈 주문·결제는 제공되지 않습니다.</p><p>계정 및 개인정보 관련 문의: cjsk1126@naver.com</p>');return;}
    if(a==='logout'){if(!cloud)throw Error('연결을 확인해 주세요.');await cloud.logout();location.hash='home';toast('로그아웃했어요.');return;}
    if(a==='admin-tab'){requireAdmin();adminTab=b.dataset.tab;render();return;}
    if(a==='new-work'){
      requireAdmin();modal(`<h2>새로운 친구 등록</h2><form id="work-form"><label>작품명<input name="name" required maxlength="45"></label><label>캐릭터 타입<select name="type"><option value="">토끼</option><option value="bear">곰</option><option value="cat">고양이</option><option value="cloud">구름</option></select></label><label>감정<select name="emotion">${['기쁨','위로','응원','사랑','공감','휴식'].map(n=>`<option>${n}</option>`).join('')}</select></label><label>짧은 한마디<input name="caption" required maxlength="18"></label><button class="btn full">작품 등록</button></form>`);return;
    }
    if(a==='reply'){
      requireAdmin();const p=posts.find(p=>p.id===id);if(p)modal(`<h2>다정한 답변</h2><p>${esc(p.text)}</p><form id="reply-form" data-id="${esc(id)}"><label>작가의 답변<textarea name="reply" required maxlength="500" rows="4">${esc(p.reply||'')}</textarea></label><button class="btn full">답변 저장</button></form>`);return;
    }
    b.disabled=true;
    if(a==='like'){requireMember();await cloud.setLike(id,!liked.includes(id));}
    else if(a==='add-cart'){requireMember();const c=cart.find(c=>c.id===id);await cloud.setCart(id,(c?.qty??0)+1);}
    else if(a==='qty'){requireMember();const c=cart.find(c=>c.id===id);if(!c)return;await cloud.setCart(id,c.qty+Number(b.dataset.delta));}
    else if(a==='remove-cart'){requireMember();await cloud.setCart(id,0);}
    else if(a==='approve'){requireAdmin();if(!w)return;await cloud.changeWork(id,{status:w.status==='approved'?'pending':'approved'});}
    else if(a==='visibility'){requireAdmin();if(!w)return;await cloud.changeWork(id,{visible:!w.visible});}
    else if(a==='delete-post'){requireMember();const p=posts.find(p=>p.id===id);if(!p||(p.userId!==profile.id&&profile.role!=='admin'))throw Error('이 글을 삭제할 권한이 없습니다.');await cloud.removePost(id);}
    else if(a==='import-examples'){requireAdmin();await cloud.importExamples(seed);}
    else return;
    await refreshCloud();render();toast(a==='add-cart'?'굿즈 보관함에 담았어요 ♡':'변경 사항을 저장했습니다.');
  } catch(error) {toast(cloud?cloud.errorMessage(error):error.message);} finally {b.disabled=false;}
});
document.addEventListener('submit',async e=>{
  e.preventDefault();const form=e.target,d=new FormData(form),button=form.querySelector('button');
  button.disabled=true;
  const errorNode=$('#auth-error');if(errorNode)errorNode.textContent='';
  try {
    if(form.id==='auth-form'){
      if(!cloud)throw Error('Firebase SDK를 불러오지 못했습니다. 인터넷 연결과 HTTP 실행을 확인해 주세요.');
      if(authSubmitting)throw Error('로그인 요청을 처리 중입니다.');
      authSubmitting=true;
      const email=String(d.get('email')).trim().toLowerCase(),password=String(d.get('password'));
      if(form.dataset.mode==='signup'){
        const name=String(d.get('name')).trim();if(!name)throw Error('닉네임을 입력해 주세요.');
        if(password!==d.get('confirm'))throw Error('비밀번호가 서로 달라요.');
        await cloud.signup(email,password,name);
      } else await cloud.login(email,password);
      await syncAuth(cloud.auth.currentUser);
      if(connection!=='ready')throw Error(connectionError);
      location.hash=profile.role==='admin'?'admin':'account';render();toast('다시 만나 반가워요 ♡');return;
    }
    if(form.id==='post-form'){
      requireMember();const text=String(d.get('text')).trim();if(!text)throw Error('이야기를 입력해 주세요.');await cloud.addPost(text,profile.name);
    } else if(form.id==='work-form'){
      requireAdmin();const name=String(d.get('name')).trim(),caption=String(d.get('caption')).trim();if(!name||!caption)throw Error('작품명과 한마디를 입력해 주세요.');
      await cloud.addWork({name,caption,type:d.get('type'),emotion:d.get('emotion'),color:'#f1e6d7',status:'pending',visible:true,likes:0});
    } else if(form.id==='settings-form'){
      requireAdmin();const name=String(d.get('name')).trim();if(!name)throw Error('닉네임을 입력해 주세요.');await cloud.changeName(name);profile=await cloud.ensureProfile(cloud.auth.currentUser);
    } else if(form.id==='reply-form'){
      requireAdmin();const reply=String(d.get('reply')).trim();if(!reply)throw Error('답변을 입력해 주세요.');await cloud.replyPost(form.dataset.id,reply);
    } else return;
    await refreshCloud();render();toast('저장했습니다 ♡');
  } catch(error) {
    const message=cloud?cloud.errorMessage(error):error.message;
    const currentError=$('#auth-error');if(form.id==='auth-form'&&currentError)currentError.textContent=message;else toast(message);
  } finally {if(form.id==='auth-form')authSubmitting=false;button.disabled=false;}
});
window.addEventListener('hashchange',()=>{filter='전체';search='';sort='default';render();});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
window.addEventListener('focus',async()=>{if(cloud&&connection==='ready'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){try{await refreshCloud();render();}catch(error){toast(cloud.errorMessage(error));}}});
let authUnsubscribe;
async function withTimeout(operation) {
  let timer;
  try {return await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Firebase 응답 시간이 초과되었습니다. Realtime Database URL·보안 규칙과 인터넷 연결을 확인해 주세요.')),12000);})]);}
  finally {clearTimeout(timer);}
}
async function startFirebase() {
  connection='loading';render();
  try {cloud=await withTimeout(import('./firebase.js'));authUnsubscribe?.();authUnsubscribe=cloud.observeAuth(user=>{if(!authSubmitting)syncAuth(user);});}
  catch(error){connection='error';connectionError='Firebase SDK를 불러오지 못했습니다. 인터넷 연결을 확인하고 localhost 또는 HTTPS로 실행해 주세요.';render();}
}
render();startFirebase();
