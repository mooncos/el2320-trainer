// All study content distilled from every EL2320 exam 2018-2026 (Part III = Monte Carlo / Particle Filter).
"use strict";
(() => {
const R = String.raw;

const home = R`
<h2>🏁 Parte III en una página</h2>
<div class="grid">
  <div class="card"><h3 style="margin-top:0">Lo que sale (11 de 11 exámenes con PF)</h3>
    <table><tr><th>Examen</th><th>Pts</th><th>Contenido</th></tr>
    <tr><td>Part III nov-2024, nov-2025</td><td>11p</td><td><b>UNA</b> pregunta de PF numérico, 5-7 apartados</td></tr>
    <tr><td>Re-exam ene-2025, ene-2026</td><td>10-11p</td><td>la misma pregunta (5 partículas)</td></tr>
    <tr><td>Full 2018-2024</td><td>10-14p</td><td>la misma pregunta + 2-8p de teoría corta (2018-2020)</td></tr></table>
    <p class="small muted">Formato Part III: 2 h, <b>sin ayudas y sin hoja de fórmulas</b>. Te dan una lista de números $U(0,1)$ "in the order that samples are asked for". No ha salido MCMC en ningún examen.</p>
  </div>
  <div class="card"><h3 style="margin-top:0">La cadena que SIEMPRE se pide</h3>
    <div class="flow"><span class="box">(a) muestrear prior<br><small>CDF inversa</small></span><span class="arr">→</span><span class="box">(b) propagar<br><small>CDF inversa de $p(x_t|x_{t-1})$</small></span><span class="arr">→</span><span class="box">(c) media / var<br><small>pesos iguales</small></span><span class="arr">→</span><span class="box">(d) pesos<br><small>$p(z|x)$ y normalizar</small></span><span class="arr">→</span><span class="box">(e) $E[x]$<br><small>$\sum w_ix_i$</small></span><span class="arr">→</span><span class="box">(f) multinomial<br><small>M números</small></span><span class="arr">→</span><span class="box">(g) sistemático<br><small>1 número</small></span></div>
    <p class="small">Cambian el orden y el disfraz (viento, submarino, escalera, habitaciones), pero la cadena es la misma. <b>Toda la puntuación es mecánica</b>: nada de teoría profunda, solo CDFs bien integradas, pesos bien normalizados y el convenio de los números.</p>
  </div>
</div>

<h3>Plan (≈3 h) — receta → ejemplos guiados → práctica activa → repaso espaciado</h3>
<ol class="recipe">
 <li><b>20 min · 🧭 Receta + 📖 Palabras→Mates.</b> Copia a mano la tabla de CDFs inversas y los dos algoritmos de remuestreo.</li>
 <li><b>45 min · 📝 Exámenes, filtro "Part III / re-exams".</b> nov-2025, nov-2024, ene-2026, ene-2025: resuélvelos en papel <i>antes</i> de revelar cada paso.</li>
 <li><b>60 min · 🎯 Entrenador.</b> Los 4 tipos PF + remuestreo + CDF inversa. Criterio de parada: 2 seguidos de cada tipo sin pista y sin la casilla "modelo".</li>
 <li><b>25 min · 📝 resto de exámenes</b> (2018-2024, incluidos los discretos). Revela y comprueba que sabías el siguiente paso.</li>
 <li><b>20 min · 🃏 Flashcards + ❓ Quiz</b> (teoría: deprivation, ESS, PF vs EKF, proposal/target).</li>
 <li><b>Antes de entrar · ✅ Checklist</b> (5 min).</li>
</ol>
<div class="trap"><b>Las 6 trampas que más puntos cuestan</b>
<ol><li><b>Orden de los números</b>: un número por partícula al muestrear, propagar y en cada sorteo multinomial; <b>uno solo</b> para el sistemático; <b>ninguno</b> para pesos y medias. Escribe al lado de cada apartado qué $u$ usas.</li>
<li><b>CDF sin soporte o mal desplazada</b>: $U(c\pm a)$ ⇒ $x=c-a+2au$, no $c+2au$. A trozos: la 2ª pieza empieza en la masa acumulada de la 1ª.</li>
<li><b>Altura de la uniforme</b>: $\pm0.1$ ⇒ densidad $5$, no 1. Mezclas: probabilidad / anchura total (¡dos intervalos en el outlier!).</li>
<li><b>Pesos = verosimilitud de la medida observada</b>: "not detected" ⇒ $1-P_D$; $P(Z=1|X>0)=1-P(Z=0|X>0)$. Fuera del soporte ⇒ peso 0 ⇒ la partícula muere.</li>
<li><b>Sistemático</b>: punteros $\frac{r}{M}+\frac{m-1}{M}$, no $r+\frac{m-1}{M}$.</li>
<li><b>Media antes vs después de la medida</b>: antes = media simple $\frac1M\sum x_i$; después = $\sum \tilde w_ix_i$.</li></ol></div>
`;

const recipe = R`
<h2>🧭 La receta (vale para TODAS las preguntas de PF 2018-2026)</h2>
<ol class="recipe">
<li><b>Paso 0 — Escribe los modelos como pdf con soporte Y su CDF</b> (1p casi gratis; nov-2024 (a)).
 $$p(z_t\mid w_t)=\begin{cases}\tfrac{1}{2a}&z_t\in(w_t-a,\,w_t+a)\\0&\text{else}\end{cases}\qquad P(Z_t<z\mid w_t)=\tfrac{z-w_t+a}{2a}$$
 Numera la lista de números: $u_1,u_2,\dots$ y apunta qué apartado gasta cuáles.</li>
<li><b>Paso 1 — Muestrear con CDF inversa</b>: $F(x)=\int_{-\infty}^xp$, resuelve $F(x)=u$.
 <table><tr><th>pdf</th><th>$F(x)$</th><th>$x=F^{-1}(u)$</th><th>salió en</th></tr>
 <tr><td>$U[a,b]$</td><td>$\frac{x-a}{b-a}$</td><td>$a+(b-a)u$</td><td>todos</td></tr>
 <tr><td>"uniform around $c\pm h$"</td><td>$\frac{x-c+h}{2h}$</td><td>$c-h+2hu$</td><td>2018, 2022-24, nov-2024</td></tr>
 <tr><td>$1/x^2$ en $[1,\infty)$</td><td>$1-1/x$</td><td>$1/(1-u)$</td><td>ene-2025</td></tr>
 <tr><td>$2e^{-2x}$, $x>0$</td><td>$1-e^{-2x}$</td><td>$-\tfrac12\ln(1-u)$</td><td>2022</td></tr>
 <tr><td>triangular $(3,5,7)$, $k=\tfrac14$</td><td>$\tfrac{(x-3)^2}{8}$ / $1-\tfrac{(7-x)^2}{8}$</td><td>$3+\sqrt{8u}$ / $7-\sqrt{8(1-u)}$</td><td>ene-2026</td></tr>
 <tr><td>a trozos: masa ½ en $[0,p]$, ½ en $(p,1]$</td><td>$\tfrac{0.5x}{p}$ / $0.5+\tfrac{0.5(x-p)}{1-p}$</td><td>$2up$ / $p+(2u-1)(1-p)$</td><td>nov-2025</td></tr>
 <tr><td>discreta $P(k)$</td><td>acumulada $F(k)$</td><td>primer $k$ con $u\le F(k)$</td><td>2019-2021, ene-2025 (±1)</td></tr></table>
 <b>Prior no informativo + medida</b> (nov-2024): $p(x_0|z_0)\propto p(z_0|x_0)$ ⇒ uniforme en $(z_0-a,z_0+a)$ ⇒ $x=z_0-a+2au$. Si la medida es binaria (nov-2025), "uninformed" = uniforme en el soporte ⇒ $x_0=u$. Estado conocido ⇒ todas las partículas iguales, sin gastar números.</li>
<li><b>Paso 2 — Propagar</b>: cada partícula $i$ usa SU $x_{t-1}^{(i)}$ y el siguiente $u$: $x_t^{(i)}=F^{-1}_{x_{t-1}^{(i)}}(u)$. Variables "sin inercia" ($X_t=W_t^3+\text{ruido}$): muestrea a partir del $w_t$ nuevo. Muros/bordes: el movimiento bloqueado ⇒ se queda.</li>
<li><b>Paso 3 — Media/varianza del conjunto</b> (antes de medir: pesos iguales) $\bar x=\frac1M\sum x_i$, $\mathrm{Var}=\frac1M\sum(x_i-\bar x)^2$ (di que usas $1/M$).</li>
<li><b>Paso 4 — Pesos</b>: $w^{(i)}=p(z\mid x^{(i)})$ evaluada en la medida observada; luego $\tilde w^{(i)}=w^{(i)}/\sum_jw^{(j)}$.
 <ul><li>Uniforme: $\tfrac1{2a}$ dentro, 0 fuera ⇒ pesos iguales entre las supervivientes.</li>
 <li>Mezcla inlier/outlier (2023): altura = prob./anchura total.</li>
 <li>$y=h(x)+u$, $p(u)$ dada (2024-01): evalúa $p$ en $u=y-h(x)$. ¡$p(0)$ puede ser 0!</li>
 <li>Binaria / detección: probabilidad del evento observado (complementos).</li>
 <li>Las constantes ($k$, alturas) se cancelan al normalizar. Si TODOS los pesos son 0: dilo y re-muestrea desde la medida.</li></ul></li>
<li><b>Paso 5 — $E[g(x)]\approx\sum_i\tilde w^{(i)}g(x^{(i)})$</b> (antes de remuestrear).</li>
<li><b>Paso 6 — Remuestreo</b>. Tabla de acumuladas $c_i=\sum_{j\le i}\tilde w^{(j)}$; la partícula $i$ ocupa $(c_{i-1},c_i]$.
 <ul><li><b>Multinomial ("vanilla")</b>: $M$ números nuevos; cada $u$ elige el primer $i$ con $u\le c_i$.</li>
 <li><b>Sistemático ("low variance")</b>: <b>un</b> número $r$; punteros $p_m=\frac{r+(m-1)}{M}$, $m=1..M$; cada puntero elige el primer $i$ con $p_m\le c_i$. (Thrun: $r\sim U(0,1/M)$ ⇒ aquí $r/M$.)</li>
 <li>Truco 2026: multiplica todo por la suma de pesos sin normalizar (65) y trabaja con enteros.</li>
 <li>Resultado = <b>valores</b> de las partículas (no solo índices), todas con peso $1/M$.</li></ul></li>
</ol>
<div class="key"><b>Convenio de números (escríbelo en el examen):</b> se consumen en el orden en que se piden; 1 por partícula para muestrear/propagar/multinomial, 1 para sistemático, 0 para pesos y esperanzas. "Using new random numbers / do not re-use" ⇒ sigue con el siguiente no usado. ⚠ En 2021 y 2022 la oficial reutilizó el primer número del multinomial para el sistemático porque decía "instead": si el enunciado es ambiguo, <b>declara tu supuesto</b>.</div>
<div class="trap"><b>Fronteras:</b> si un $u$ cae justo en un $c_i$, usa $(c_{i-1},c_i]$ (va a la partícula de abajo) y dilo. Las partículas de peso 0 tienen intervalo vacío y nunca se eligen.</div>
`;

const dict = R`
<h2>📖 Palabras del enunciado → matemáticas</h2>
<table>
<tr><th>Dice…</th><th>Escribe…</th></tr>
<tr><td>"use this list … in the order that samples are asked for"</td><td>numera $u_1..u_n$; un $u$ por muestra, en orden de partícula</td></tr>
<tr><td>"uniformly distributed around the true value $\pm a$"</td><td>$p=\tfrac1{2a}$ en $(x-a,x+a)$; $x=c-a+2au$</td></tr>
<tr><td>"uniformly distributed noise over a range $\pm10$"</td><td>$U(-10,10)$, altura $\tfrac1{20}$</td></tr>
<tr><td>"assuming an uninformed prior" + medida $Z_0$</td><td>$p(x_0|z_0)\propto p(z_0|x_0)$ ⇒ uniforme en $z_0\pm a$</td></tr>
<tr><td>"uninformed prior" en $X\in[0,1]$, medida binaria</td><td>$x_0^{(i)}=u_i$</td></tr>
<tr><td>"known / exactly / starts at"</td><td>todas las partículas iguales, sin gastar números</td></tr>
<tr><td>"no inertia, not influenced by $X_{t-1}$"</td><td>$x_t$ se muestrea solo desde $w_t$ nuevo</td></tr>
<tr><td>"$\Delta x\in\{-1,+1\}$ equal probability"</td><td>$u<0.5\Rightarrow-1$, si no $+1$</td></tr>
<tr><td>"write in terms of numbers without computing completely"</td><td>basta $(10.20)^3-6$</td></tr>
<tr><td>"normalized weights"</td><td>$\tilde w_i=p(z|x_i)/\sum_jp(z|x_j)$</td></tr>
<tr><td>"not hit / not detected"</td><td>$1-P(\text{hit}|x)$, $1-P_D$ ó $1-P_{FA}$</td></tr>
<tr><td>"spurious with probability 0.1, uniform on $1<|v|<4$"</td><td>altura $0.1/6$ (dos intervalos de 3)</td></tr>
<tr><td>"expected value after this measurement"</td><td>$\sum\tilde w_ix_i$</td></tr>
<tr><td>"mean / variance of the particle set" (sin pesos)</td><td>$\frac1M\sum x_i$, $\frac1M\sum(x_i-\bar x)^2$</td></tr>
<tr><td>"multinomial ('vanilla') re-sampling"</td><td>$M$ números; primer $i$ con $u\le c_i$</td></tr>
<tr><td>"systematic (low variance) re-sampling"</td><td>1 número; punteros $(r+m-1)/M$</td></tr>
<tr><td>"using new random numbers / do not re-use"</td><td>sigue en la lista</td></tr>
<tr><td>"if all your weights are 0, make up new particles"</td><td>dilo explícitamente y propón partículas dentro de la ventana de la medida</td></tr>
<tr><td>"proposal" / "target"</td><td>de donde muestreas / lo que quieres; $w\propto$ target/proposal</td></tr>
<tr><td>"particle deprivation"</td><td>no quedan partículas cerca del estado real</td></tr>
</table>
`;

const checklist = [
  ["Antes de empezar", [
    "Numero la lista de números u1..un y escribo al margen qué apartado consume cuáles.",
    "Escribo cada modelo como pdf con soporte Y su CDF (1p del apartado (a)).",
    "Compruebo que la pdf integra 1 (k de la triangular, 1/x², alturas de uniformes).",
  ]],
  ["Muestreo y propagación", [
    "Uniforme c±h: x = c − h + 2h·u (no olvido el −h).",
    "A trozos: elijo la rama comparando u con la masa acumulada en el punto de corte.",
    "Cada partícula usa SU valor anterior y el siguiente u (orden de partícula).",
    "Estado conocido o conjunto dado ⇒ no gasto números.",
  ]],
  ["Pesos y estimaciones", [
    "Peso = probabilidad/densidad de la medida OBSERVADA (complementos para 'not detected').",
    "Fuera del soporte ⇒ 0. Altura correcta (1/anchura).",
    "Divido por la suma y compruebo que suman 1.",
    "Media antes de medir: simple. Después: ponderada.",
  ]],
  ["Remuestreo", [
    "Tabla de acumuladas c_i con intervalos (c_{i-1}, c_i].",
    "Multinomial: M números nuevos, uno por partícula.",
    "Sistemático: UN número r, punteros r/M, r/M+1/M, …",
    "Doy los VALORES de las partículas resultantes y digo que pesan 1/M.",
    "Declaro el convenio (qué número uso, qué hago en fronteras).",
  ]],
];

const flash = [
  { cat: "Algoritmo", front: "Los 3 pasos del PF (bootstrap) en cada $t$", back: "1) Muestrear $x_t^{(i)}\\sim p(x_t|x_{t-1}^{(i)},u_t)$ (propuesta = modelo de movimiento). 2) Peso $w^{(i)}\\propto p(z_t|x_t^{(i)})$ y normalizar. 3) Remuestrear $M$ partículas con prob. $\\propto w$." },
  { cat: "Algoritmo", front: "Método de la CDF inversa", back: "Si $u\\sim U(0,1)$ y $F$ es la CDF, $x=F^{-1}(u)$ tiene pdf $p$. Integra $p$, iguala a $u$, despeja $x$." },
  { cat: "Algoritmo", front: "Multinomial ('vanilla') resampling", back: "$M$ números independientes; cada $u$ elige el primer $i$ con $u\\le c_i$ (acumuladas). Coste $O(M\\log M)$, varianza alta." },
  { cat: "Algoritmo", front: "Systematic / low-variance resampling", back: "Un solo $r$; punteros $\\frac{r+m-1}{M}$, $m=1..M$ (equiespaciados $1/M$). $O(M)$, menor varianza; toda partícula con $w\\ge1/M$ sobrevive al menos una vez; con pesos iguales devuelve el mismo conjunto." },
  { cat: "Algoritmo", front: "¿Qué pesan las partículas tras remuestrear?", back: "Todas $1/M$. La información del peso está ahora en el número de copias." },
  { cat: "Algoritmo", front: "Monte Carlo para $E[f(x)]$", back: "$\\int f(x)p(x)dx\\approx\\sum_i\\tilde w^{(i)}f(x^{(i)})$; con pesos iguales $\\frac1M\\sum f(x^{(i)})$ (2019 Q6h)." },
  { cat: "Algoritmo", front: "Proposal vs target (2020 Q6c)", back: "Target = distribución que queremos (posterior). Proposal = de la que muestreamos de verdad. Pesos $\\propto$ target/proposal; en el bootstrap PF, proposal = movimiento ⇒ $w\\propto p(z|x)$." },
  { cat: "Algoritmo", front: "Effective sample size", back: "$N_{\\text{eff}}=1/\\sum_i\\tilde w_i^2$. $=M$ con pesos iguales, $=1$ si una partícula tiene todo. Remuestrear solo si $N_{\\text{eff}}<$ umbral (p.ej. $M/2$)." },
  { cat: "CDF", front: "$U(c-h,c+h)$: $x=F^{-1}(u)$", back: "$x=c-h+2hu$. Ej.: $Z_0=10$, $\\pm0.1$, $u=.6$ ⇒ $10.02$." },
  { cat: "CDF", front: "$p(x)=1/x^2$ en $[1,\\infty)$", back: "$F=1-1/x$ ⇒ $x=1/(1-u)$. $u=.9\\to10$, $u=.5\\to2$ (ene-2025)." },
  { cat: "CDF", front: "$p(x)=2e^{-2x}$", back: "$F=1-e^{-2x}$ ⇒ $x=-\\tfrac12\\ln(1-u)$. $u=.97\\to1.75$ (2022)." },
  { cat: "CDF", front: "Triangular en $(3,7)$, pico en 5", back: "$k=\\tfrac14$ (área $4k=1$). $u\\le.5$: $x=3+\\sqrt{8u}$; $u>.5$: $x=7-\\sqrt{8(1-u)}$. $u=.125\\to4$, $.875\\to6$ (ene-2026)." },
  { cat: "CDF", front: "Transición nov-2025: $\\frac{0.5}{p}$ en $[0,p]$, $\\frac{0.5}{1-p}$ en $(p,1]$", back: "$F(p)=0.5$. $u<.5$: $x=2up$; $u\\ge.5$: $x=p+(2u-1)(1-p)$. $p=.81,u=.7\\to.886$." },
  { cat: "CDF", front: "Discreta (habitaciones, ±1, rejilla)", back: "Acumula en el orden indicado y elige el primer valor con $u\\le F$. Usa la FILA del estado anterior de esa partícula. Uniforme en $\\{0..9\\}$: $\\lfloor10u\\rfloor$." },
  { cat: "Pesos", front: "Medida uniforme $\\pm a$: pesos", back: "$\\tfrac1{2a}$ si $|z-x|<a$, si no 0 ⇒ tras normalizar, iguales entre las supervivientes (nov-2024: $.5,.5,0$)." },
  { cat: "Pesos", front: "Mezcla 0.9 inlier $U(\\pm1)$ + 0.1 spurious $1<|v|<4$", back: "Alturas $0.9/2=0.45$ y $0.1/6\\approx0.0167$; fuera 0 (2023: $1/28,27/28$)." },
  { cat: "Pesos", front: "$y=x^2+u$, $p(u)=ku^2$ en $(-.5,.5)$, $y=0$", back: "Evalúa en $u=y-x^2$: $x=\\pm.2\\Rightarrow k(.04)^2$; $x=0\\Rightarrow p(0)=0$ ¡muere la 'mejor'!; $x=\\pm.8$ fuera. $k$ se cancela." },
  { cat: "Pesos", front: "Detector: $P_D=0.9$, $P_{FA}=0.05$, NO detecta", back: "Partícula en la habitación del robot: $0.1$; en otra: $0.95$ (2020: $2/23,2/23,19/23$)." },
  { cat: "Pesos", front: "$P(Z=0|X>0)=0.2$, $P(Z=1|X\\le0)=0.3$, observas $z=1$", back: "$X>0\\Rightarrow0.8$ (complemento), $X\\le0\\Rightarrow0.3$ (2022)." },
  { cat: "Pesos", front: "Si todos los pesos son 0", back: "El PF ha divergido (deprivation). En el examen: dilo y re-inicializa partículas compatibles con la medida (nov-2024 lo pedía explícitamente)." },
  { cat: "Convenio", front: "¿Cuántos números gasta cada apartado?", back: "Muestrear/propagar: 1 por partícula (2 si el estado es 2D). Multinomial: $M$. Sistemático: 1. Pesos, medias, varianzas: 0." },
  { cat: "Convenio", front: "Puntero sistemático con $r=0.8$, $M=3$", back: "$.8/3=.267$, $.600$, $.933$ (nov-2024). NO $.8, 1.13,\\dots$" },
  { cat: "Convenio", front: "Frontera: $u=c_i$ exactamente", back: "Intervalo $(c_{i-1},c_i]$ ⇒ partícula $i$. Decláralo; nunca ha pasado en un examen." },
  { cat: "Convenio", front: "¿Media antes o después de pesar?", back: "\"Mean of the particle set\" tras predecir: simple. \"Expected value after the measurement\": $\\sum\\tilde w_ix_i$." },
  { cat: "Teoría", front: "Particle deprivation: qué es", back: "Tras remuestrear repetidamente, no quedan partículas cerca del estado verdadero (se pierde diversidad por azar). Peor con pocas partículas / medidas muy precisas." },
  { cat: "Teoría", front: "3 formas de reducir deprivation (2018 Q6a, 2019 Q6g)", back: "Más partículas; inyectar partículas aleatorias; remuestrear solo cuando haga falta (ESS); remuestreo sistemático/estratificado; añadir ruido (roughening)." },
  { cat: "Teoría", front: "¿Qué pasa si no remuestreas nunca? (2018 Q6f)", back: "Las posiciones solo siguen el modelo de movimiento y se dispersan como el prior; los pesos degeneran (una partícula con casi todo, $N_{\\text{eff}}\\to1$)." },
  { cat: "Teoría", front: "Densidad continua a partir de partículas (2018 Q6g, 2019 Q6a)", back: "Kernel (Gaussiana) en cada partícula (KDE); histograma; ajustar una Gaussiana con media y covarianza del conjunto." },
  { cat: "Teoría", front: "PF mejor que EKF cuando… (2018 Q6d, 2020 Q6a)", back: "Creencia multimodal, localización global, robot secuestrado, modelos muy no lineales o ruido no Gaussiano: el PF representa cualquier distribución." },
  { cat: "Teoría", front: "KF/EKF mejor que PF cuando… (2018 Q6c, 2020 Q6a)", back: "Sistema lineal (o casi) y Gaussiano unimodal: el KF es exacto y mucho más barato. El EKF nunca asigna probabilidad 0 (no hay deprivation)." },
  { cat: "Teoría", front: "Debilidad / fortaleza del PF (2019 Q6c/d)", back: "Debilidad: deprivation; coste crece con la dimensión. Fortaleza: representa cualquier distribución con suficientes partículas." },
  { cat: "Teoría", front: "¿Por qué el sistemático tiene menos varianza?", back: "Un solo número ⇒ las copias de la partícula $i$ son $\\lfloor M\\tilde w_i\\rfloor$ o $\\lceil M\\tilde w_i\\rceil$; con multinomial el nº de copias es aleatorio Binomial." },
  { cat: "Teoría", front: "Relación PF ↔ filtro de Bayes / histograma", back: "El PF es una implementación Monte Carlo del filtro de Bayes: predicción = muestrear el movimiento; corrección = pesos por la verosimilitud; normalización = $\\eta$." },
];

const quiz = [
  { q: "Lista $\\{.5,.6,.4,.6,\\dots\\}$, 3 partículas, $Z_0=10$ con ruido $\\pm0.1$ y prior no informativo. $w_0^{(2)}$=?", opts: ["10.02", "10.06", "10.12", "9.96"], a: 0, why: "$w=9.9+0.2u$, $u_2=.6\\Rightarrow10.02$." },
  { q: "Sistemático, $M=5$, $r=0.2$. Primer puntero:", opts: ["0.04", "0.2", "0.24", "0"], a: 0, why: "$r/M=0.04$; luego $0.24,0.44,0.64,0.84$." },
  { q: "Pesos normalizados $(.5,.5,0)$, multinomial con $u=.8$. Partícula elegida:", opts: ["2", "1", "3", "ninguna"], a: 0, why: "Acumuladas $(.5,1,1)$; $.5<.8\\le1$ ⇒ partícula 2. La 3 tiene intervalo vacío." },
  { q: "¿Cuántos números consume el remuestreo sistemático?", opts: ["1", "M", "M−1", "0"], a: 0, why: "Uno: el resto de punteros están a $1/M$." },
  { q: "Medida uniforme $\\pm0.1$: altura de $p(z|w)$ dentro de la ventana", opts: ["5", "0.2", "1", "10"], a: 0, why: "$1/(2\\cdot0.1)=5$." },
  { q: "Robot en la habitación 1, NO detecta el portátil, $P_D=.9$, $P_{FA}=.05$. Peso sin normalizar de una partícula en la habitación 2:", opts: ["0.95", "0.05", "0.1", "0.9"], a: 0, why: "Si el portátil está en 2, el robot (en 1) no tiene falsa alarma con prob. $1-0.05$." },
  { q: "Tras predecir (sin medida), 'mean of the particle set' es…", opts: ["la media simple $\\frac1M\\sum x_i$", "$\\sum w_ix_i$ con los pesos de la medida", "la mediana", "el valor de la partícula más pesada"], a: 0, why: "Todas pesan $1/M$ antes de la corrección." },
  { q: "$p(x)=1/x^2$ en $[1,\\infty)$, $u=0.6$:", opts: ["2.5", "1.67", "0.4", "1.6"], a: 0, why: "$x=1/(1-u)=1/0.4=2.5$." },
  { q: "¿Qué arregla el particle deprivation?", opts: ["Inyectar partículas aleatorias", "Remuestrear en cada paso aunque $N_{\\text{eff}}\\approx M$", "Reducir el número de partículas", "Usar medidas más precisas"], a: 0, why: "Inyectar, más partículas, remuestrear menos (según ESS), sistemático." },
  { q: "Situación en la que el PF supera al EKF:", opts: ["Localización global con creencia multimodal", "Sistema lineal Gaussiano", "Cuando el coste computacional es crítico", "Estado de dimensión muy alta"], a: 0, why: "El PF representa distribuciones multimodales; el EKF solo una Gaussiana." },
  { q: "$y=x^2+u$, $p(u)=ku^2$, $y=0$. La partícula $x=0$ tiene peso…", opts: ["0", "máximo", "$k$", "$1/M$"], a: 0, why: "$u=y-x^2=0$ y $p(0)=k\\cdot0=0$ (2024-01)." },
  { q: "Con pesos iguales, el remuestreo sistemático devuelve…", opts: ["exactamente una copia de cada partícula", "copias aleatorias", "solo la primera partícula", "depende de $r$"], a: 0, why: "Un puntero cae en cada intervalo de anchura $1/M$ (ene-2026 (e))." },
  { q: "Proposal en el PF bootstrap:", opts: ["el modelo de movimiento $p(x_t|x_{t-1},u_t)$", "la verosimilitud $p(z|x)$", "el posterior", "una Gaussiana del EKF"], a: 0, why: "Muestreamos del movimiento ⇒ peso = target/proposal = $p(z|x)$." },
];

// ---------------------------------------------------------------- past exams
const exams = [
{ id: "2025-11-27 Q1", featured: true, type: "pf", pts: "11p", title: "X∈[0,1], medida binaria, transición a trozos, 5 partículas (sin solución oficial)",
  statement: R`Uniforms: $\{.25,.54,.04,.36,.81,\ .42,.20,.50,.90,.30,\ .20,.40,.10,.30,.70,\ .49,.01,.25,.43,.62,\ .83\}$. $Y_t\in\{0,1\}$, $P(Y_t=0\mid X_t=x)=x$, $x\in[0,1]$.
  $$p(x_t\mid x_{t-1})=\begin{cases}\dfrac{0.5}{x_{t-1}}&x_t\in[0,x_{t-1}]\\[12pt]\dfrac{0.5}{1-x_{t-1}}&x_t\in(x_{t-1},1]\end{cases}$$
  (a,1p) At $t=0$ draw 5 samples, uninformed prior. (b,3p) $Y_0=0$: normalized weights? (c,1p) Multinomial resampling of 5 particles. (d,1p) Instead systematic resampling (new random numbers). (e,5p) Particles at $t=1$ from the particles of (c).`,
  tags: "prior uniforme → pesos binarios → multinomial → sistemático → propagación a trozos",
  steps: [
    ["Convenio de números", R`(a) $u_1..u_5$; (b) ninguno; (c) $u_6..u_{10}$; (d) $u_{11}=.20$ (uno); (e) $u_{12}..u_{16}=.40,.10,.30,.70,.49$. <b>Escríbelo en el examen.</b>`],
    ["(a) Prior no informativo", R`$X_0\sim U[0,1]$, $F(x)=x$ ⇒ $x_0^{(i)}=u_i$: $\{0.25,0.54,0.04,0.36,0.81\}$.`],
    ["(b) Pesos", R`$w^{(i)}=P(Y_0=0|x^{(i)})=x^{(i)}$, suma $=2.00$ ⇒ $\tilde w=(0.125,\ 0.270,\ 0.020,\ 0.180,\ 0.405)$. Acumuladas $(0.125,\ 0.395,\ 0.415,\ 0.595,\ 1)$.`],
    ["(c) Multinomial", R`$.42\in(.415,.595]\to4$; $.20\to2$; $.50\to4$; $.90\to5$; $.30\to2$ ⇒ $\{0.36,\ 0.54,\ 0.36,\ 0.81,\ 0.54\}$. ⚠ $.42$ está a $0.005$ de la frontera $.415$.`],
    ["(d) Sistemático ⚠", R`$r=.20$, punteros $(r+m-1)/5=.04,.24,.44,.64,.84\to1,2,4,5,5$ ⇒ $\{0.25,\ 0.54,\ 0.36,\ 0.81,\ 0.81\}$. (Usar $0.2$ sin dividir daría 2,3,5,5,5: incorrecto.)`],
    ["(e) CDF de la transición", R`$F(x)=\dfrac{0.5x}{p}$ en $[0,p]$, $F(x)=0.5+\dfrac{0.5(x-p)}{1-p}$ en $(p,1]$ ⇒ $u<.5$: $x=2up$; $u\ge.5$: $x=p+(2u-1)(1-p)$.`],
    ["(e) Propagación", R`$.36,u{=}.40\to.288$; $.54,.10\to.108$; $.36,.30\to.216$; $.81,.70\to.81+.4(.19)=.886$; $.54,.49\to.5292$ ⇒ $\{0.288,\ 0.108,\ 0.216,\ 0.886,\ 0.5292\}$.`],
  ],
  traps: R`Usar $1-x$ (sería $Y=1$); la 2ª pieza de la CDF no es $0.5x/(1-p)$; propagar las partículas de (d) en vez de (c); si (d) no gastara número, (e) daría $\{.144,.432,.072,.486,.724\}$: declara tu convenio.` },

{ id: "2024-11-28 Q1", featured: true, type: "pf", pts: "11p", title: "Parque eólico: (W, X), ruido uniforme, 3 partículas",
  statement: R`Uniforms: $\{.5,.6,.4,.6,.5,.9,.2,.5,.9,.8,.3,\dots\}$. Estimate $p(X_t,W_t)$ (power, wind) with 3 particles. $Z_t$ uniform around true wind $\pm0.1$. Wind: uniform around previous $\pm1$. Power $=W_t^3$ with uniform noise $\pm10$, no inertia.<br>(a,1p) Models for $W_t$. (b,1p) $Z_0=10$, uninformed prior: $w_0^{(i)}$. (c,2p) $w_1^{(i)}$. (d,1p) $(w_1^{(i)},x_1^{(i)})$ without computing completely. (e,2p) $Z_1=10.11$: normalized weights. (f,2p) $E[X_1]$. (g,2p) Systematic resampling.`,
  tags: "prior desde la medida → propagar → variable sin inercia → pesos uniformes → E → sistemático",
  steps: [
    ["(a) Modelos", R`$p(z_t|w_t)=5$ en $(w_t\pm.1)$, $P(Z_t<z|w_t)=5(z-w_t+.1)$. $p(w_t|w_{t-1})=.5$ en $(w_{t-1}\pm1)$, $P(W_t<w|w_{t-1})=.5(w-w_{t-1}+1)$. ⚠ La oficial escribe el soporte de la CDF como $(W_{t-1},W_{t-1}+1)$: es $(W_{t-1}-1,W_{t-1}+1)$.`],
    ["(b) Prior desde $Z_0$", R`Prior plano ⇒ $W_0\sim U(9.9,10.1)$, $u=5(w-9.9)$ ⇒ $w=9.9+0.2u$: $.5,.6,.4\to10.00,\ 10.02,\ 9.98$.`],
    ["(c) Propagar", R`$u=.5(w_1-w_0+1)$ ⇒ $w_1=w_0-1+2u$: $.6,.5,.9\to10.20,\ 10.02,\ 10.78$.`],
    ["(d) Potencia", R`$x=w^3-10+20u$: $.2,.5,.9$ ⇒ $(10.20,\ (10.20)^3-6)$, $(10.02,\ (10.02)^3)$, $(10.78,\ (10.78)^3+8)$.`],
    ["(e) Pesos", R`$p(10.11|w)=5$ si $w\in(10.01,10.21)$: partículas 1,2 ⇒ 5; partícula 3 ($10.78$) ⇒ 0. $\tilde w=(.5,.5,0)$.`],
    ["(f) Esperanza", R`$E[X_1]=.5[(10.2)^3-6+(10.02)^3]\approx1030.61$.`],
    ["(g) Sistemático", R`$r=u_{10}=.8$: $.8/3=.267\le.5\to1$; $.267+.333=.6\to2$; $.933\to2$ ⇒ $\{(10.2,(10.2)^3-6),\ (10.02,(10.02)^3),\ (10.02,(10.02)^3)\}$.`],
  ],
  traps: R`$w=w_0+2u$ (sin el $-1$); dar peso a la partícula 3; usar $r=.8$ como primer puntero; los números de (e)-(f) no se gastan.` },

{ id: "2026-01-07 Q4", featured: true, type: "pf", pts: "11p", title: "Escalera (triangular), 'not hit', 5 partículas",
  statement: R`Uniforms: $\{.125,.875,0,1,.5,\ .1,.9,.5,.2,.3,\ .3,\dots\}$. $x_0=0$ known. Increment $d=x_i-x_{i-1}$: $p(d)=k(d-3)$ on $(3,5)$, $k(7-d)$ on $[5,7)$. $P(\text{not hit}|x)=0.9-x/20$.<br>(a,4p) 5 samples $x_1^{(m)}$. (b,2p) Not hit: normalized weights. (c,2p) $E[x_1]$. (d,2p) Multinomial. (e,1p) Systematic (new numbers).`,
  tags: "CDF inversa triangular a trozos → pesos discretos → E → 2 remuestreos (×65 enteros)",
  steps: [
    ["(a) Normalizar y CDF", R`Área $=4k=1$ ⇒ $k=\tfrac14$. $F=\tfrac{(d-3)^2}{8}$ en $[3,5]$ ($F(5)=\tfrac12$), $F=1-\tfrac{(7-d)^2}{8}$ en $[5,7]$.`],
    ["(a) Muestras", R`$u\le.5$: $d=3+\sqrt{8u}$; $u>.5$: $d=7-\sqrt{8(1-u)}$. $.125\to4$, $.875\to6$, $0\to3$, $1\to7$, $.5\to5$ ⇒ $\{4,6,3,7,5\}$.`],
    ["(b) Pesos", R`$(18-x)/20$: $\{14,12,15,11,13\}/20$ ⇒ normalizados $\{14,12,15,11,13\}/65$.`],
    ["(c) Esperanza", R`$(56+72+45+77+65)/65=315/65\approx4.846$ (ponderada, ¡no 5!).`],
    ["(d) Multinomial", R`Acumuladas ×65: $14,26,41,52,65$. $.1\cdot65=6.5\to1$; $58.5\to5$; $32.5\to3$; $13\to1$; $19.5\to2$ ⇒ $\{4,5,3,4,6\}$. ⚠ La oficial etiqueta ".2·65=6.5": es $.1$.`],
    ["(e) Sistemático", R`$r=.3$, paso $65/5=13$: $3.9,16.9,29.9,42.9,55.9\to1,2,3,4,5$ ⇒ $\{4,6,3,7,5\}$ (pesos casi iguales ⇒ una copia de cada).`],
  ],
  traps: R`$k=\tfrac12$; rama equivocada de la raíz; usar $x/20$ (hit) en vez de not hit.` },

{ id: "2025-01-13 Q5", featured: true, type: "pf", pts: "10p", title: "Prior 1/x², pasos ±1, medida uniforme ±2, 5 partículas",
  statement: R`Uniforms: $\{.9,.1,.4,.6,.5,\ .9,.2,.3,.9,.8,\ .3,.4,.1,.3,.7,\ .8,\dots\}$. $p(x)\propto1/x^2$ on $[1,\infty)$. $x_t=x_{t-1}+\Delta x$, $\Delta x=\pm1$ equally likely. $y=x+u$, $u\sim U[-2,2]$, $y=3$.<br>(a,3p) Initial set (b,1p) after 1 s (c,1p) $E[x]$ (d,1p) unnormalized weights (e,1p) normalized (f,1.5p) multinomial (g,1.5p) systematic, do not reuse numbers.`,
  steps: [
    ["(a)", R`$\int_1^\infty x^{-2}=1$, $F=1-1/x$ ⇒ $x=1/(1-u)$: $\{10,\ \tfrac{10}9,\ \tfrac53,\ \tfrac52,\ 2\}$.`],
    ["(b)", R`$u<.5\Rightarrow-1$: $.9,.2,.3,.9,.8\to+,-,-,+,+$ ⇒ $\{11,\ \tfrac19,\ \tfrac23,\ \tfrac72,\ 3\}$.`],
    ["(c)", R`Pesos iguales: $E[x]=\tfrac15(\dots)=\tfrac{329}{90}\approx3.656$.`],
    ["(d)-(e)", R`$p(3|x)=\tfrac14$ si $1\le x\le5$: $\{0,0,0,\tfrac14,\tfrac14\}$ ⇒ $\{0,0,0,\tfrac12,\tfrac12\}$.`],
    ["(f)", R`$.3,.4,.1,.3,.7$ con acumuladas $(0,0,0,.5,1)$ ⇒ $\{\tfrac72,\tfrac72,\tfrac72,\tfrac72,3\}$.`],
    ["(g)", R`$r=.8$: $.16,.36,.56,.76,.96$ ⇒ $\{\tfrac72,\tfrac72,3,3,3\}$.`],
  ],
  traps: R`$F=1/x$ (invierte grandes y pequeños); $2/3$ queda fuera de $[1,5]$; usar $u_{11}$ otra vez en (g).` },

{ id: "2024-01-15 Q5", type: "pf", pts: "11p", title: "Inicio conocido, $y=x^2+u$ con $p(u)=ku^2$",
  statement: R`Uniforms $\{.9,.1,.4,.6,.5,\ .9,.2,.3,.9,.8,\ .3,\dots\}$. $x=0$ initially; each second $+U(-1,1)$. $y=x^2+u$, $p(u)=ku^2$ on $(-.5,.5)$, $y=0$.<br>(a) initial set (b) after 1 s (c) estimated variance (d) normalized weights (e) multinomial (f) systematic, no reuse.`,
  steps: [
    ["(a)", R`Conocido ⇒ $\{0,0,0,0,0\}$, sin gastar números.`],
    ["(b)", R`$x=2u-1$: $\{0.8,-0.8,-0.2,0.2,0\}$.`],
    ["(c)", R`Media 0, $\mathrm{Var}=\tfrac15(2\cdot.64+2\cdot.04)=1.36/5=0.272$ (con $1/M$).`],
    ["(d) ⚠", R`$u=-x^2$: $\pm.8\to u=-.64$ fuera ⇒ 0; $\pm.2\to k(.04)^2$; $0\to p(0)=0$. $\tilde w=(0,0,.5,.5,0)$. (La oficial escribe $k(.04)$: es $k(.04)^2$, mismo resultado.)`],
    ["(e)", R`$.9,.2,.3,.9,.8$ con acumuladas $(0,0,.5,1,1)$ ⇒ $\{.2,-.2,-.2,.2,.2\}$.`],
    ["(f)", R`$r=.3$: $.06,.26,.46\to3$; $.66,.86\to4$ ⇒ $\{-.2,-.2,-.2,.2,.2\}$.`],
  ],
  traps: R`La partícula en $x=0$ parece la mejor pero pesa 0; elevar $x^2$ en vez de $u^2$.` },

{ id: "2023-01-16 Q5", type: "pf", pts: "10p", title: "Submarino: deriva +100, mezcla inlier/outlier",
  statement: R`Uniforms $\{.9,.1,.4,.6,.5,\ .9,.2,.5,.9,.8,\ .3,\dots\}$. Particles $\{9.9,9.7,10.3,10.0,9.5\}$. $x'=x+100+\varepsilon$, $\varepsilon\sim U(-16,16)$. $z=x+v$: prob .9 $v\sim U(-1,1)$, prob .1 uniform on $1<|v|<4$. $z=109$.<br>(a) propagate (b) mean (c) model + weights (d) multinomial (e) systematic.`,
  steps: [
    ["(a)", R`$x'=x+84+32u$: $\{122.7,\ 96.9,\ 107.1,\ 113.2,\ 109.5\}$.`],
    ["(b)", R`$549.4/5=109.88$.`],
    ["(c)", R`$p=.45$ si $|z-x|<1$; $.1/6$ si $1<|z-x|<4$; 0 fuera. Residuos $-13.7,12.1,1.9,-4.2,-.5$ ⇒ $(0,0,\tfrac1{60},0,\tfrac{27}{60})$ ⇒ $(0,0,\tfrac1{28},0,\tfrac{27}{28})$.`],
    ["(d)-(e)", R`Todos los $u$ y punteros ($.06,.26,\dots$) $>1/28$ ⇒ 5 copias de $109.5$ (degeneración).`],
  ],
  traps: R`Altura del outlier: dos intervalos de 3 ⇒ anchura 6.` },

{ id: "2022-01-12 Q4", type: "pf", pts: "10p", title: "Prior exponencial, ruido U(−1,1), sensor binario",
  statement: R`Uniforms $\{.97,.08,.44,.69,\ .38,.92,.27,.52,\ .96,.85,.31,.54,\ .12,\dots\}$. $f(x)=2e^{-2x}$, $x_1=x_0+U(-1,1)$, $z_1=1$, $P(Z=0|X>0)=.2$, $P(Z=1|X\le0)=.3$. $M=4$.`,
  steps: [
    ["(a)", R`$x=-\tfrac12\ln(1-u)$: $1.75,\ 0.04,\ 0.29,\ 0.59$.`],
    ["(b)", R`$+2u-1$: $1.51,\ 0.88,\ -0.17,\ 0.63$.`],
    ["(c)", R`$(.8,.8,.3,.8)/2.7=(.296,.296,.111,.296)$.`],
    ["(d)", R`$.96,.85,.31,.54\to4,4,2,2$ ⇒ $\{.63,.63,.88,.88\}$.`],
    ["(e) ⚠", R`Oficial reutiliza $.96$ ("instead"): $.24,.49,.74,.99\to1,2,4,4$. Con el siguiente ($.12$): $1,1,2,4$. Declara el convenio.`],
  ],
  traps: R`Complemento: $P(Z=1|X>0)=.8$.` },

{ id: "2021-01-08 Q7", type: "disc", pts: "14p", title: "Robot en rejilla 10×10, muros, 4 partículas",
  statement: R`Uniforms $\{.97,.08,.44,.69,\ .38,.92,.27,.52,\ .96,.85,.31,.54,\dots\}$. $y=4$ known, $x\in\{0..9\}$ unknown. Moves R .75, U .1, D .1, L .05; blocked by walls ⇒ stays. $P(\text{wall}|\text{within 1 m of wall})=.8$, else .05; wall detected.`,
  steps: [
    ["(a)", R`$x=\lfloor10u\rfloor$: $(9,4),(0,4),(4,4),(6,4)$.`],
    ["(b) ⚠", R`Bins R $[0,.75)$, U, D $[.85,.95)$, L: $.38$ R pero muro ⇒ $(9,4)$; $.92$ D ⇒ $(0,3)$; $(5,4)$; $(7,4)$. (Oficial escribe $(0,5)$ y lo reconoce.)`],
    ["(c)", R`$(.8,.8,.05,.05)/1.7=(.47,.47,.03,.03)$.`],
    ["(d)", R`$.96\to3$, $.85\to2$, $.31\to1$, $.54\to2$.`],
    ["(e)", R`Oficial: $.96/4=.24$ ⇒ $1,2,2,4$.`],
  ] },

{ id: "2020-01-08 Q4", type: "disc", pts: "12p", title: "Portátil en 3 habitaciones (detector)",
  statement: R`Uniforms $\{.2,.1,.2,.6,.1,.5,\dots\}$. $x_0^i=i$. $p(x_t|x_{t-1})=\tfrac{1}{6|x_t-x_{t-1}|}$ ($x_t\ne x_{t-1}$). $P_D=.9$, $P_{FA}=.05$. Robot in room 1, no detection.`,
  steps: [
    ["(a)", R`$T=\begin{pmatrix}.75&\tfrac16&\tfrac1{12}\\\tfrac16&\tfrac23&\tfrac16\\\tfrac1{12}&\tfrac16&.75\end{pmatrix}$; $.2\to1$, $.1\to1$, $.2\to2$ ⇒ $\{1,1,2\}$.`],
    ["(b)", R`$(.1,.1,.95)/1.15=(\tfrac2{23},\tfrac2{23},\tfrac{19}{23})$.`],
    ["(c)", R`Multinomial $.6\to3$, $.1\to2$, $.5\to3$ ⇒ $\{2,1,2\}$. (Sistemático daría $\{2,2,2\}$.)`],
  ],
  traps: R`Quedarse = resto de la fila; usar $0.9$ en vez de $0.1$.` },

{ id: "2019-01-12 Q5", type: "disc", pts: "12p", title: "Rejilla 50×50 por cuadrantes",
  statement: R`Numbers 1..100: $80,10,5,40,20,30,85,57,23,3,91,60$. Stay .5, $x{+}1$ .25, $y{+}1$ .25. $z$ = quadrant, $z=1$.`,
  steps: [
    ["(a)", R`Un número por coordenada, $\lceil n/2\rceil$: $(40,5),(3,20),(10,15)$.`],
    ["(b)", R`$.85\to y{+}1$, $.57\to x{+}1$, $.23\to$ stay ⇒ $(40,6),(4,20),(10,15)$.`],
    ["(c)", R`$w=(0,.5,.5)$; $.03\to2$, $.91\to3$, $.60\to3$.`],
  ] },

{ id: "2018-01-13 Q5", type: "pf", pts: "12p", title: "1-D, prior U[−1,1], verosimilitud escalonada",
  statement: R`Numbers in $[0,100]$: $10,50,85,20,5,90,40,30,60$. Motion $+U(-1,1)$. $p(y|x)=1$ if $|y-x|<.25$, $.5$ if $.25\le|y-x|<.75$, else 0. $y=-1$.`,
  steps: [
    ["(a)", R`$x=(n-50)/50$: $\{-.8,0,.7\}$.`],
    ["(b)", R`$\{-1.4,-.9,1.5\}$.`],
    ["(c)", R`$(.5,1,0)/1.5=(\tfrac13,\tfrac23,0)$; $.4\to2$, $.3\to1$, $.6\to2$ ⇒ $\{-.9,-1.4,-.9\}$.`],
  ] },

{ id: "Teoría 2018-2020", type: "th", pts: "1-4p c/u", title: "Preguntas cortas de PF (2018 Q6, 2019 Q6, 2020 Q6)",
  statement: R`Deprivation (3 fixes), KF vs PF, sin remuestreo, densidad desde partículas, debilidad/fortaleza, MC expectation, PF vs EKF, proposal vs target.`,
  steps: [
    ["Deprivation (2018 Q6a, 2019 Q6g)", R`Más partículas; inyección aleatoria; remuestreo retrasado (ESS); sistemático/estratificado. Explica <i>por qué</i> cada uno ayuda.`],
    ["KF vs PF (2018 Q6c/d, 2020 Q6a)", R`KF: lineal-Gaussiano, exacto y rápido; EKF prob. $>0$ en todas partes. PF: multimodal, global, kidnapped, no lineal.`],
    ["Sin remuestreo (2018 Q6f)", R`Las posiciones se dispersan como el prior; pesos degeneran.`],
    ["Densidad (2018 Q6g, 2019 Q6a)", R`KDE gaussiano, histograma, Gaussiana ajustada.`],
    ["Debilidad/fortaleza (2019 Q6c/d)", R`Deprivation / representa cualquier distribución.`],
    ["MC (2019 Q6h)", R`$\int f p\approx\sum w_if(x_i)$.`],
    ["Proposal/target (2020 Q6c)", R`Target = posterior; proposal = de donde muestreas; $w\propto$ target/proposal.`],
  ] },
];

// part-specific wording for the shared app.js
const ui = {
  title: "Parte III · Particle Filter",
  examTitle: "📝 Todas las preguntas de Parte III (2018 → 2026)",
  filters: [["all", "Todas"], ["featured", "Solo Part III + re-exams (formato del examen)"], ["pf", "Solo PF continuo"], ["disc", "Solo PF discreto"], ["th", "Solo teoría"]],
  pill: { disc: "PF-D" },
  trainerIntro: R`Problemas nuevos cada vez, con el mismo formato que los exámenes de Parte III. Rellena cada paso (acepta fracciones <kbd>2/23</kbd> o decimales, tolerancia ±0.2%) y pulsa <b>Comprobar</b>. Remuestreo: da el <b>valor</b> (o el índice si se pide $i_m$) de cada partícula elegida.`,
  modelLabel: "mostrar modelos y qué números gasta cada apartado (más fácil)",
  before: R`Antes de calcular: numera los $u_i$, escribe cada pdf con su soporte y su CDF, y apunta qué apartado gasta qué números. (Marca la casilla de arriba para comprobarlo.)`,
  errHint: R`¿número $u$ equivocado? ¿soporte de la CDF? ¿altura 1/anchura? ¿punteros $r/M$?`,
};

window.CONTENT = { ui, home, recipe, dict, checklist, flash, quiz, exams };
})();
