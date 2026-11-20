// All study content distilled from every EL2320 exam 2018-2026 (Part II = KF / EKF / UKF / iEKF).
"use strict";
(() => {
const R = String.raw;

const home = R`
<h2>🏁 Parte II en una página</h2>
<div class="grid">
  <div class="card"><h3 style="margin-top:0">Lo que sale (100% de los exámenes)</h3>
    <table><tr><th>Pregunta</th><th>Pts</th><th>Contenido</th></tr>
    <tr><td>Q1</td><td>5p</td><td><b>KF</b> lineal, estado 2D, medida escalar: predict → update (→ predict)</td></tr>
    <tr><td>Q2</td><td>7p</td><td><b>EKF</b>: mismas variables + no linealidad en $g$ y/o $h$</td></tr></table>
    <p class="small muted">Formato de los dos exámenes Part II (nov-2024, nov-2025). Los "Full"/re-exam 2018-2026 tienen las mismas preguntas con 3 estados o un robot $(x,y,\theta)$, y a veces 1-4p de teoría (iEKF, UKF, inconsistencia del EKF).</p>
  </div>
  <div class="card"><h3 style="margin-top:0">Te dan la hoja de fórmulas</h3>
    $$\bar\mu_t=g(u_t,\mu_{t-1}),\quad \bar\Sigma_t=G_t\Sigma_{t-1}G_t^T+R_t$$
    $$K_t=\bar\Sigma_tH_t^T(H_t\bar\Sigma_tH_t^T+Q_t)^{-1}$$
    $$\mu_t=\bar\mu_t+K_t\eta_t,\quad \Sigma_t=\bar\Sigma_t-K_tH_t\bar\Sigma_t$$
    <p class="small">⇒ <b>No necesitas memorizar fórmulas. Necesitas: (1) traducir el texto a $g,h,R,Q,\mu_0,\Sigma_0$; (2) Jacobianos en el punto correcto; (3) aritmética de 2×2 sin errores.</b> Ahí se pierden los puntos.</p>
  </div>
</div>

<h3>Las dos variantes del examen (sota, caballo, rey)</h3>
<div class="grid">
 <div class="card"><b>Variante "inicio exacto"</b> (nov-2025, 2020, 2023, 2024-01)
   <div class="flow"><span class="box">$\Sigma_0=0$</span><span class="arr">→</span><span class="box">(a) predict: $\bar\Sigma_1=R$</span><span class="arr">→</span><span class="box">(b) update con $z_1$</span><span class="arr">→</span><span class="box">(c) predict $t=2$</span></div></div>
 <div class="card"><b>Variante "inicializa desde la medida"</b> (nov-2024, 2024-01 Q3)
   <div class="flow"><span class="box">(a) $\sigma_0^2$ del sensor</span><span class="arr">→</span><span class="box">(b) $x_0$ steady state</span><span class="arr">→</span><span class="box">(c) $\Sigma_0$ con $\rho$</span><span class="arr">→</span><span class="box">(d) [$g,h$]</span><span class="arr">→</span><span class="box">(e) predict</span><span class="arr">→</span><span class="box">(f) update</span></div></div>
</div>

<h3>Plan para esta noche (≈3 h) — método: receta → ejemplos guiados → práctica activa → repaso espaciado</h3>
<ol class="recipe">
 <li><b>20 min · 🧭 Receta + 📖 Palabras→Mates.</b> Léelas una vez despacio. Copia la receta de 6 pasos a mano en un papel (escribirla = recordarla).</li>
 <li><b>40 min · 📝 Exámenes, filtro "Part II".</b> Los 4 problemas nov-2024 / nov-2025: resuélvelos en papel <i>antes</i> de revelar cada paso. Son los más parecidos a mañana.</li>
 <li><b>60 min · 🎯 Entrenador.</b> Alterna los 4 tipos. Criterio de parada: 2 seguidos de cada tipo sin pista. Sin la casilla "mostrar modelo" (traducir el texto es parte del examen).</li>
 <li><b>30 min · 📝 resto de exámenes</b> (robots, 3 estados, iEKF). Basta con revelar y comprobar que sabías el siguiente paso.</li>
 <li><b>20 min · 🃏 Flashcards + ❓ Quiz</b> hasta dominar todas (trampas + teoría corta).</li>
 <li><b>Mañana antes de entrar · ✅ Checklist</b> (5 min). Luego, duerme. 🙂</li>
</ol>
<div class="trap"><b>Las 5 trampas que más puntos cuestan</b> (aparecen en casi todos los exámenes):
<ol><li><b>std vs varianza</b>: "standard deviation 4" ⇒ $Q=16$. "variance ½" ⇒ $Q=\tfrac12$. Lo cambian <i>dentro del mismo examen</i>.</li>
<li>"Belief at $t=1$" sin medida todavía ⇒ es la <b>predicción</b>. Algunos enunciados dicen "a posteriori" y quieren la predicción.</li>
<li><b>$G$ en $\mu_{t-1}$</b> (posterior anterior), <b>$H$ en $\bar\mu_t$</b> (predicción).</li>
<li>Innovación con la <b>función no lineal</b>: $\eta=z-h(\bar\mu)$, nunca $z-H\bar\mu$. Media predicha $g(\mu)$, nunca $G\mu$.</li>
<li>"Known / exactly / released from rest" ⇒ varianza 0 ⇒ $\bar\Sigma_1=R$.</li></ol></div>
`;

const recipe = R`
<h2>🧭 La receta (sirve para TODAS las preguntas numéricas de Parte II)</h2>
<ol class="recipe">
<li><b>Paso 0 — Escribe el modelo</b> (da puntos parciales aunque falles los números).
 <ul><li>Declara el estado y su orden: $\mathbf x=(x,v)^T$ o $(w,x)^T$. Mantén el orden siempre.</li>
 <li>$g$ (o $A$ y término constante $b$): <b>una fila por variable</b>. "Gaussian around the previous value" ⇒ fila identidad.</li>
 <li>$R$ = ruido de <b>proceso</b> (diag. de las varianzas de la dinámica). $h$ (o $C$) y $Q$ = ruido de <b>medida</b>.</li>
 <li><b>Eleva al cuadrado toda std.</b> $N(0,a)$ ⇒ $a$ es varianza.</li>
 <li>EKF: escribe $G=\partial g/\partial\mathbf x$ y $H=\partial h/\partial\mathbf x$ <b>simbólicos</b> antes de evaluar.</li></ul></li>
<li><b>Paso 1 — Inicialización $\mu_0,\Sigma_0$</b>
 <ul><li>Conocido exactamente ⇒ $\Sigma_0=0$ (o 0 en esa entrada).</li>
 <li>Medida directa $z=w+\delta$ ⇒ $\mu_{w,0}=z_0$, $\sigma^2_{w,0}=\sigma_z^2$.</li>
 <li>Medida no lineal $z=h(w)+\delta$ ⇒ $w_0=h^{-1}(z_0)$ (raíz física; dilo), $\sigma^2_{w,0}=\sigma_z^2/h'(w_0)^2$.</li>
 <li>Variable no medida ⇒ <b>steady state</b>: $x_t=x_{t-1}$ en la media de $g$, despeja.</li>
 <li>$\sigma_{12}=\rho\,\sigma_1\sigma_2$ (stds). "No correlations" ⇒ 0. Dados momentos: $\Sigma_{ij}=E[x_ix_j]-\mu_i\mu_j$.</li></ul></li>
<li><b>Paso 2 — Predict</b>
 $$\bar\mu_t=g(\mu_{t-1})\ \ (\text{o }A\mu_{t-1}+b),\qquad G_t=\tfrac{\partial g}{\partial \mathbf x}\Big|_{\mu_{t-1}},\qquad \bar\Sigma_t=G_t\Sigma_{t-1}G_t^T+R$$
 Atajos: $\Sigma_{t-1}=0\Rightarrow\bar\Sigma=R$. Con $A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$: $(A\Sigma A^T)=\begin{pmatrix}\sigma_{xx}+2\sigma_{xv}+\sigma_{vv}&\sigma_{xv}+\sigma_{vv}\\ \cdot&\sigma_{vv}\end{pmatrix}$. Si $\Sigma_{t-1}$ diagonal: $(A\Sigma A^T)=\sum_k \sigma_k^2\,a_ka_k^T$ (columnas de $A$).
 <br>Respuesta: "Gaussian with mean $\bar\mu$ and covariance $\bar\Sigma$".</li>
<li><b>Paso 3 — Update</b> (medida escalar, lo habitual)
 $$\hat z=h(\bar\mu_t),\ \ \eta=z-\hat z,\ \ H=\tfrac{\partial h}{\partial\mathbf x}\Big|_{\bar\mu_t},\ \ \mathbf s=\bar\Sigma H^T,\ \ S=H\mathbf s+Q$$
 $$K=\mathbf s/S,\qquad \mu=\bar\mu+K\eta,\qquad \Sigma=\bar\Sigma-\frac{\mathbf s\,\mathbf s^T}{S}$$
 <b>Truco:</b> calcula $\mathbf s=\bar\Sigma H^T$ una sola vez. Si $H=(1,0)$: $\mathbf s$ = 1ª columna de $\bar\Sigma$ y $S=\bar\Sigma_{11}+Q$. $\mathbf s\mathbf s^T/S$ es simétrica, menos errores que $KH\bar\Sigma$.
 <br>Medida vectorial ($H=I$): $K=\bar\Sigma(\bar\Sigma+Q)^{-1}$, inversa 2×2: $\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac1{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$.</li>
<li><b>Paso 4 — Siguiente predict</b> desde $(\mu_t,\Sigma_t)$. EKF: <b>re-evalúa $G$ en $\mu_t$</b>. Ojo: ahora $\Sigma_t$ tiene términos cruzados.</li>
<li><b>Paso 5 — Sanity checks</b> (30 s, salvan puntos)
 <ul><li>$\Sigma$ simétrica, diagonal positiva, $\Sigma_{ii}\le\bar\Sigma_{ii}$ tras el update.</li>
 <li>Signo de $K\eta$ intuitivo: si $z>\hat z$ y $h$ crece con $x$ ⇒ $x$ sube. $h$ decreciente ⇒ $K<0$ (¡es normal!).</li>
 <li>Las variables no medidas solo cambian vía $\bar\Sigma_{ij}\neq0$. Si $\bar\Sigma_{ij}=0$ no se actualizan.</li>
 <li>Medir una suma/combinación $2x+v$ crea correlación <b>negativa</b> en el posterior.</li></ul></li>
</ol>

<h3>Jacobianos que han salido (deriva sin miedo)</h3>
<table><tr><th>Función</th><th>Jacobiano</th><th>Examen</th></tr>
<tr><td>$x+v^2+1$</td><td>$(1,\ 2v)$</td><td>2025-11 Q2</td></tr>
<tr><td>$\dfrac{1}{x^2+v^2+1}$</td><td>$\left(\dfrac{-2x}{(x^2+v^2+1)^2},\ \dfrac{-2v}{(x^2+v^2+1)^2}\right)$ — ¡el denominador al <b>cuadrado</b>!</td><td>2025-11 Q2</td></tr>
<tr><td>$x+2(w-2x)^3$</td><td>$\big(6(w-2x)^2,\ 1-12(w-2x)^2\big)$ → en steady state $=(0,1)$</td><td>2024-11 Q2</td></tr>
<tr><td>$w^2$</td><td>$(2w,\ 0)$</td><td>2024-11 Q2</td></tr>
<tr><td>$x+2y^2$; $\ xy$</td><td>$(1,\ 4y)$; $\ (y,\ x)$</td><td>2019 Q4</td></tr>
<tr><td>$x+xy$, $\ x^2+y$; $\ \sin x$</td><td>$\begin{pmatrix}1+y&x\\2x&1\end{pmatrix}$; $\ (\cos x, 0)$</td><td>2020 Q5</td></tr>
<tr><td>$x+v\Delta t\cos\theta,\ y+v\Delta t\sin\theta$</td><td>$\begin{pmatrix}1&0&-v\Delta t\sin\theta\\0&1&v\Delta t\cos\theta\\0&0&1\end{pmatrix}$</td><td>2018 Q4, 2024-01 Q4</td></tr>
<tr><td>rango $\sqrt{(x-l_x)^2+(y-l_y)^2}$</td><td>$\left(\frac{x-l_x}{r},\frac{y-l_y}{r},0\right)$</td><td>2018 Q4, 2024-01 Q4</td></tr>
<tr><td>$KQ,\ KI$ (parámetro como estado)</td><td>$\begin{pmatrix}K&0&Q\\0&K&I\\0&0&1\end{pmatrix}$</td><td>2022 Q3</td></tr>
<tr><td>$a(1-0.1v)$; $\ 2.5-2h-0.5v^2$</td><td>$(0,-0.1a,1-0.1v)$; $\ (-2,-v,0)$</td><td>2025-01 Q4</td></tr>
</table>
<div class="key"><b>Patrón del examinador:</b> elige el punto de linealización para que el Jacobiano sea "bonito" ($\theta=0$, origen, $v=0$, steady state ⇒ $G=I$). A menudo el EKF colapsa al KF de la pregunta anterior (2021 Q5, 2025-01 Q4). Si te sale un $G$ feo, revisa el punto de evaluación.</div>
`;

const dict = R`
<h2>📖 Diccionario: frase del enunciado → matemática</h2>
<table>
<tr><th>Si el enunciado dice…</th><th>Escribes…</th></tr>
<tr><td>"starts <b>exactly</b> with $X_0=0$", "known", "released from rest", "you are at the origin"</td><td>$\mu_0$ = ese valor, $\Sigma_0=0$ (en esa entrada)</td></tr>
<tr><td>"standard deviation of 4"</td><td>varianza $=16$</td></tr>
<tr><td>"variance of ½", "$N(0,a)$", "$\mathcal G(0,4)$"</td><td>varianza = ese número tal cual</td></tr>
<tr><td>"$E[X_t]=x_{t-1}+v_{t-1}$, $E[V_t]=v_{t-1}$"</td><td>filas de $A$ (o de $g$): $A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$</td></tr>
<tr><td>"process noise variances $\sigma^2_{xx},\sigma^2_{vv},\sigma^2_{xv}$ … conditional on $X_{t-1},V_{t-1}$"</td><td>Son $R$ (no $\Sigma_0$)</td></tr>
<tr><td>"Gaussian around the previous wind speed with std 1"</td><td>fila identidad de $g$, varianza 1 en $R$</td></tr>
<tr><td>"linear factor −3 on the $x_{t-1}$ term and 4 for the other term"</td><td>$x_t=-3x_{t-1}+4w_{t-1}$ ⇒ fila $(4,-3)$ en orden $(w,x)$</td></tr>
<tr><td>"$p(z_t|x_t,v_t)$ Gaussian with mean $2x_t+v_t$"</td><td>$C=(2,1)$ (o $h$ = esa media)</td></tr>
<tr><td>"we measure $Z_0$ which directly gives the initial value for $w_0$"</td><td>$\mu_{w,0}=z_0$, $\sigma_{w,0}^2=\sigma_z^2$ (o $\sigma_z^2/h'^2$ si no lineal)</td></tr>
<tr><td>"give a reasonable value… steady state assumption"</td><td>$x_t=x_{t-1}$ en la media de $g$ → despejar</td></tr>
<tr><td>"variance 0.04 and correlation coefficient 0.5"</td><td>$\sigma_{12}=0.5\cdot\sqrt{0.04}\cdot\sigma_2$</td></tr>
<tr><td>"no correlations"</td><td>$\Sigma_0$ diagonal</td></tr>
<tr><td>"$E[x_0^2]=1,\ E[x_0y_0]=0$" (momentos crudos)</td><td>$\mathrm{Var}=E[x^2]-\mu^2$, $\mathrm{Cov}=E[xy]-\mu_x\mu_y$</td></tr>
<tr><td>"What is the belief at $t=1$?" (sin $Z_1$ aún)</td><td>Predicción $\mathcal N(\bar\mu_1,\bar\Sigma_1)$</td></tr>
<tr><td>"a posteriori at $t=1$" pero sin medida dada</td><td>También predicción (enunciados 2020 Q5, 2024-01 Q4)</td></tr>
<tr><td>"carry the computations up to a sum of products and quotients"</td><td>Puedes dejar $10-\frac{1.01}{1.02}$ sin dividir</td></tr>
<tr><td>"final answers should have all calculations completed"</td><td>Números finales, no expresiones</td></tr>
<tr><td>"What are the dynamic $g$ and measurement $h$ models?"</td><td>$g(\cdot)$ vectorial, $h(\cdot)$, ruidos $\varepsilon\sim N(0,R)$, $\delta\sim N(0,Q)$, y los Jacobianos $G,H$</td></tr>
<tr><td>"innovation"</td><td>$\eta=z-h(\bar\mu)$ (escalar)</td></tr>
<tr><td>"constant 10 m/s descent with error std 2 m/s for 10 s (unchanging)"</td><td>$R=(10\cdot2)^2=400$ (no $10\cdot 4$)</td></tr>
<tr><td>"related by $x=10(p-1)$", sensor mide $p$</td><td>Invertir: $h(x)=0.1x+1$, $Q$ en unidades de $p$</td></tr>
<tr><td>Constante en la dinámica (gravedad, $+1$, $\omega\Delta t$)</td><td>Solo afecta a la media ($b$ o dentro de $g$); no a $G$ ni a $\Sigma$</td></tr>
<tr><td>Parámetro desconocido constante (p.ej. $K=e^{-1/RC}$)</td><td>Añádelo al estado con $K_t=K_{t-1}$ y ruido 0</td></tr>
<tr><td>"linearize $\Delta x(r,u)$ as in the EKF", entradas ruidosas</td><td>Taylor 1er orden en las entradas: $\mathrm{Var}=\sum_i(\partial_i\Delta x)^2\sigma_i^2$</td></tr>
<tr><td>"Are $\varphi$ and $\dot\varphi$ independent?"</td><td>Gaussiana: independiente ⇔ $\Sigma_{12}=0$</td></tr>
</table>
`;

const checklist = [
  ["Antes de calcular", [
    "He declarado el orden del estado y lo mantengo.",
    "He subrayado cada 'standard deviation' y la he elevado al cuadrado.",
    "R = proceso, Q = medida (notación Thrun de la hoja).",
    "He escrito g/A, h/C, R, Q, μ0, Σ0 explícitamente (puntos parciales).",
    "'Exactly/known' ⇒ Σ0 = 0.",
  ]],
  ["Predict", [
    "μ̄ = g(μ) con la función no lineal (incluyendo constantes como +1).",
    "G evaluado en μ_{t-1} (posterior anterior).",
    "Σ̄ = GΣGᵀ + R: primero multiplico, después sumo R.",
    "He dicho 'Gaussian with mean … and covariance …'.",
  ]],
  ["Update", [
    "ẑ = h(μ̄) con la función no lineal; η = z − ẑ (signo).",
    "H evaluado en μ̄ (predicción), no en μ0.",
    "S = HΣ̄Hᵀ + Q (¡sumé Q!).",
    "K = Σ̄Hᵀ/S; μ = μ̄ + Kη; Σ = Σ̄ − ssᵀ/S.",
    "Σ simétrica, diagonal positiva y menor que Σ̄.",
  ]],
  ["Teoría (si cae)", [
    "iEKF: misma predicción, itera el update relinealizando h en el último iterado.",
    "UKF: 2n+1 sigma points, sin Jacobianos, captura 2º orden, coste similar.",
    "EKF inconsistente/overconfident por error de linealización (no linealidad grande sobre la dispersión de la creencia).",
  ]],
];

// ---------------------------------------------------------------- flashcards
const flash = [
  // traps / reading
  { cat: "Lectura del enunciado", front: R`"The measurement has standard deviation 4." ¿$Q$?`, back: R`$Q=16$. Siempre elevar la std al cuadrado. (2025-11 Q1: con $Q=4$ te sale $S=21$ en vez de 33.)` },
  { cat: "Lectura del enunciado", front: R`"Mean of $Z_t$ is … and a variance of ½." ¿$Q$?`, back: R`$Q=\tfrac12$ (ya es varianza). En el mismo examen Q1 usó std y Q2 varianza.` },
  { cat: "Lectura del enunciado", front: R`"$X_0=0$, $V_0=1$ exactly." ¿$\Sigma_0$ y $\bar\Sigma_1$?`, back: R`$\Sigma_0=0\Rightarrow\bar\Sigma_1=G\cdot0\cdot G^T+R=R$. $G$ no importa en el primer paso.` },
  { cat: "Lectura del enunciado", front: R`"What is the belief at $t=1$?" y aún no te han dado $Z_1$.`, back: R`Es la <b>predicción</b> $\overline{bel}(x_1)=\mathcal N(\bar\mu_1,\bar\Sigma_1)$. Igual si dicen "a posteriori" sin medida.` },
  { cat: "Lectura del enunciado", front: R`Te dan $E[x_0]=1,\ E[x_0^2]=1,\ E[y_0]=0,\ E[y_0^2]=4,\ E[x_0y_0]=0$. ¿$\Sigma_0$?`, back: R`$\mathrm{Var}(x)=1-1^2=0$, $\mathrm{Var}(y)=4$, $\mathrm{Cov}=0-0=0$ ⇒ $\Sigma_0=\mathrm{diag}(0,4)$. (2021 Q4)` },
  { cat: "Lectura del enunciado", front: R`Velocidad 10 m/s con error std 2 m/s (constante durante el intervalo), $\Delta t=10$ s. ¿Ruido de proceso en posición?`, back: R`Desplazamiento $=10\,v$ ⇒ std $=20$ ⇒ $R=400$. No $10\cdot 4=40$. (2023 Q3)` },
  { cat: "Lectura del enunciado", front: R`Hay una constante en la dinámica ($+10$, $+1$, $\omega\Delta t$). ¿Dónde va?`, back: R`Solo en la media ($b$ o dentro de $g$). No aparece en $A$, $G$ ni en $\Sigma$.` },
  // init
  { cat: "Inicialización", front: R`$Z_0=10$ mide directamente $w$ con std 0.1. ¿$\mu_{w,0}$, $\sigma^2_{w,0}$?`, back: R`$\mu_{w,0}=10$, $\sigma^2_{w,0}=0.01$ (el likelihood de la 1ª medida hace de prior).` },
  { cat: "Inicialización", front: R`$Z=W^2+\eta$, std 2, $Z_0=100$. ¿$w_0$ y su varianza?`, back: R`$w_0=10$ (raíz positiva, físicamente $w\ge0$). $h'(w_0)=20$. $\sigma_w^2=\sigma_z^2/h'^2=4/400=0.01$. <b>Divide</b> por la pendiente al cuadrado.` },
  { cat: "Inicialización", front: R`"Reasonable value for $x_0$ (steady state)" con $x_t=-3x_{t-1}+4w_{t-1}$.`, back: R`$x=-3x+4w\Rightarrow 4x=4w\Rightarrow x_0=w_0$.` },
  { cat: "Inicialización", front: R`Steady state de $X_t=X_{t-1}+2(W_{t-1}-2X_{t-1})^3$.`, back: R`$(w-2x)^3=0\Rightarrow x_0=w_0/2$. Bonus: ahí $G=I$ porque la derivada de $(\cdot)^3$ se anula.` },
  { cat: "Inicialización", front: R`Varianzas $0.01$ y $0.04$, $\rho=0.5$. ¿Covarianza?`, back: R`$\sigma_{12}=\rho\sigma_1\sigma_2=0.5\cdot0.1\cdot0.2=0.01$. Con <b>stds</b>, no varianzas.` },
  // KF
  { cat: "KF", front: R`$H=(1,0)$. ¿Atajo para $K$ y $S$?`, back: R`$\mathbf s=\bar\Sigma H^T$ = 1ª columna de $\bar\Sigma$; $S=\bar\Sigma_{11}+Q$; $K=\mathbf s/S$; $\Sigma=\bar\Sigma-\mathbf s\mathbf s^T/S$.` },
  { cat: "KF", front: R`$(A\Sigma A^T)$ con $A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$, rápido.`, back: R`$\begin{pmatrix}\sigma_{xx}+2\sigma_{xv}+\sigma_{vv}&\sigma_{xv}+\sigma_{vv}\\ \sigma_{xv}+\sigma_{vv}&\sigma_{vv}\end{pmatrix}$` },
  { cat: "KF", front: R`Solo se mide $x$. ¿Por qué cambia también $v$ en el update?`, back: R`Por la covarianza cruzada $\bar\Sigma_{xv}\neq0$ (creada por la dinámica). $K_v=\bar\Sigma_{vx}/S$. Si $\bar\Sigma_{xv}=0$, $v$ no cambia.` },
  { cat: "KF", front: R`Se mide $2x+v$. ¿Qué signo tiene la correlación del posterior?`, back: R`Negativa: la medida fija la suma, si $x$ es mayor, $v$ debe ser menor. (2025-11 Q1: $\Sigma_{12}=-8/33$.)` },
  { cat: "KF", front: R`Fusión escalar: prior $N(10,1)$, medida 9 con varianza 3.`, back: R`$K=\frac{1}{1+3}=\frac14$, $\mu=9.75$, $\sigma^2=\frac34$. Información: $\frac1{\sigma^2}=\frac11+\frac13$.` },
  { cat: "KF", front: R`¿Cuándo es óptimo el KF?`, back: R`Modelos lineales + ruido gaussiano (blanco, conocido) + prior gaussiano ⇒ la creencia es exactamente gaussiana y el KF es el estimador óptimo (MMSE = MAP).` },
  { cat: "KF", front: R`Gaussianas: ¿incorrelado ⇒ independiente?`, back: R`Sí, para conjuntamente gaussianas. Mira $\Sigma_{12}$: $0$ ⇔ independientes.` },
  { cat: "KF", front: R`Comprobación de sanidad del posterior escalar.`, back: R`$\sigma^2_{post}\le\min(\bar\sigma^2,\sigma_z^2)$ y $\mu$ entre $\bar\mu$ y $z$.` },
  { cat: "KF", front: R`Un sesgo desconocido en la medida: ¿el filtro queda over- o under-confident?`, back: R`<b>Over-confident</b>: la varianza no incluye el sesgo, el error real es mayor que lo que dice $\Sigma$. (2026-01 Q3b)` },
  { cat: "KF", front: R`Dos lecturas a distinto tiempo: ¿qué más necesitas modelar para fusionarlas con un KF?`, back: R`El modelo dinámico (cómo cambia el estado entre lecturas) y su ruido $R$ (inventarlo y justificarlo). Sin él ($R=0$) sale el promedio. (2024-01 Q3)` },
  // EKF
  { cat: "EKF", front: R`¿Dónde se evalúa $G_t$? ¿Y $H_t$?`, back: R`$G_t$ en $\mu_{t-1}$ (posterior anterior). $H_t$ en $\bar\mu_t$ (predicción).` },
  { cat: "EKF", front: R`¿Cómo se calculan $\bar\mu$ y $\hat z$ en el EKF?`, back: R`Con las funciones <b>no lineales</b>: $\bar\mu=g(\mu)$, $\hat z=h(\bar\mu)$. $G$ y $H$ solo para covarianzas y ganancia. ($z-H\bar\mu$ en 2024-11 Q2 daría 200 en vez de 100.)` },
  { cat: "EKF", front: R`$\partial_x\,(x^2+v^2+1)^{-1}$`, back: R`$-2x/(x^2+v^2+1)^2$. En $(1,0)$: $-2/4=-\tfrac12$.` },
  { cat: "EKF", front: R`Te sale $K<0$. ¿Está mal?`, back: R`No necesariamente: si $h$ es decreciente en esa variable ($H<0$), $K<0$. Ej. 2025-11 Q2 $K=(-1,0)$, 2018 Q4, 2025-01 Q4.` },
  { cat: "EKF", front: R`¿Por qué el EKF puede ser inconsistente aunque el KF sea óptimo?`, back: R`Error de linealización: ignora términos de orden superior ⇒ media sesgada y covarianza demasiado pequeña (overconfident); se acumula recursivamente. Peor cuanto más no lineal sea la función sobre la dispersión de la creencia (σ grande).` },
  { cat: "EKF", front: R`Robot con incertidumbre en $\theta$ que avanza: ¿forma de la creencia real vs EKF?`, back: R`Real: "banana"/arco (radio = distancia recorrida). EKF: elipse gaussiana, no puede representar el arco. Error ∝ $\sigma_\theta\times$ distancia.` },
  { cat: "EKF", front: R`¿Qué pasa si el Jacobiano tiene entradas 0 en el punto de linealización (p.ej. $2v$ en $v=0$)?`, back: R`El EKF se vuelve "ciego" a esa variable: no propaga su incertidumbre ni la actualiza. La verdadera $E[v^2]=\sigma_v^2\neq0$ se ignora ⇒ media y varianza subestimadas. El UKF sí lo captura.` },
  { cat: "EKF", front: R`Parámetro constante desconocido (p.ej. $K=e^{-1/RC}$). ¿Cómo se estima con EKF?`, back: R`Aumentar el estado: $K_t=K_{t-1}$ con ruido 0. Se corrige vía la covarianza cruzada que crea $G$ (términos bilineales $KQ$).` },
  { cat: "EKF", front: R`Propagar varianza de entradas ruidosas $r,u$ por $\Delta x(r,u)$.`, back: R`Taylor 1er orden: $\mathrm{Var}(\Delta x)\approx J\Sigma_{ru}J^T=\sum_i(\partial_i\Delta x)^2\sigma_i^2$ si independientes. (Thrun: $VMV^T$.)` },
  // iEKF / UKF / other
  { cat: "iEKF / UKF / otros", front: R`iEKF: ¿qué cambia respecto al EKF?`, back: R`La predicción es igual. El update se itera: relinealiza $h$ en el último iterado $\mu^{(i)}$: $\mu^{(i+1)}=\bar\mu+K^{(i)}(z-h(\mu^{(i)})-H^{(i)}(\bar\mu-\mu^{(i)}))$. La 1ª iteración = EKF. $\Sigma$ al final con el último $H$. Igual al EKF si $h$ es lineal.` },
  { cat: "iEKF / UKF / otros", front: R`UKF: idea en 2 frases.`, back: R`Elige $2n+1$ sigma points deterministas alrededor de la media (columnas de $\sqrt{(n+\lambda)\Sigma}$), los pasa por la función no lineal y recalcula media y covarianza con pesos. Sin Jacobianos, exacto hasta 2º orden, más consistente, coste del mismo orden que el EKF.` },
  { cat: "iEKF / UKF / otros", front: R`Fórmulas de sigma points (Thrun).`, back: R`$\chi^0=\mu$, $\chi^{i}=\mu\pm\big(\sqrt{(n+\lambda)\Sigma}\big)_i$, $\lambda=\alpha^2(n+\kappa)-n$. $w_m^0=\frac{\lambda}{n+\lambda}$, $w_c^0=w_m^0+(1-\alpha^2+\beta)$, $w^i=\frac{1}{2(n+\lambda)}$.` },
  { cat: "iEKF / UKF / otros", front: R`Asociación de datos ML en un filtro gaussiano.`, back: R`$\hat c=\arg\max_c p(z\mid x,c)$ ⇔ mínima distancia de Mahalanobis $\eta^TS^{-1}\eta$ (+$\log|S|$). Outlier: rechazar si $\eta^TS^{-1}\eta$ > umbral ($\chi^2$).` },
  { cat: "iEKF / UKF / otros", front: R`¿Cuándo PF mejor que EKF? ¿Y EKF/KF mejor que PF?`, back: R`PF: creencia multimodal, localización global, kidnapped robot, ruido no gaussiano. EKF: más rápido, sin particle deprivation. KF: lineal-gaussiano unimodal ⇒ óptimo y barato.` },
  { cat: "iEKF / UKF / otros", front: R`MAP de una trayectoria.`, back: R`$\arg\max_{x_{1:n}}p(x_{1:n}\mid z_{1:n})$.` },
];

// ---------------------------------------------------------------- quiz
const quiz = [
  { q: R`En el EKF, el Jacobiano de medida $H_t$ se evalúa en…`, opts: [R`$\bar\mu_t$ (media predicha)`, R`$\mu_{t-1}$`, R`la medida $z_t$`, R`$\mu_t$ (posterior)`], a: 0, why: R`$H_t=\partial h/\partial x|_{\bar\mu_t}$. $G_t$ en $\mu_{t-1}$.` },
  { q: R`2025-11 Q2: $h=1/(x^2+v^2+1)$, $\bar\mu=(1,0)$, $\bar\Sigma=\mathrm{diag}(2,1)$, $Q=\tfrac12$. ¿$S$?`, opts: ["1", "2.5", "1.5", "0.5"], a: 0, why: R`$H=(-\tfrac12,0)$, $H\bar\Sigma H^T=\tfrac14\cdot2=\tfrac12$, $S=\tfrac12+\tfrac12=1$.` },
  { q: R`¿Qué cambia el iEKF respecto al EKF?`, opts: ["Solo el paso de update (se itera la linealización de h)", "Solo la predicción", "Ambos pasos se iteran", "Usa sigma points"], a: 0, why: R`"The prediction stays the same; the gain, mean and covariance are computed iteratively, evaluating $H$ and the innovation at the previous iterate."` },
  { q: R`Principal causa de inconsistencia del EKF:`, opts: ["Error de linealización cuando la no linealidad es grande sobre la dispersión de la creencia", "Ruido no blanco", "Usar demasiadas iteraciones", "Matrices no invertibles"], a: 0, why: R`Ignora términos de orden superior ⇒ overconfident, y el error se propaga recursivamente.` },
  { q: R`UKF frente a EKF: ¿qué es FALSO?`, opts: ["El UKF necesita los Jacobianos de g y h", "El UKF usa 2n+1 sigma points", "El UKF captura mejor la no linealidad", "Su coste es del mismo orden"], a: 0, why: R`El UKF no necesita derivadas.` },
  { q: R`Inicio "exactly" $X_0=0,V_0=1$; $R=\mathrm{diag}(4,1)$. ¿$\bar\Sigma_1$?`, opts: [R`$\mathrm{diag}(4,1)$`, R`$\begin{pmatrix}5&1\\1&1\end{pmatrix}$`, R`$0$`, R`$\mathrm{diag}(16,1)$`], a: 0, why: R`$\Sigma_0=0\Rightarrow\bar\Sigma_1=R$.` },
  { q: R`$Z=W^2+\eta$ con std 2 y $Z_0=100$. ¿$\sigma^2_{w,0}$?`, opts: ["0.01", "4", "1600", "0.2"], a: 0, why: R`$\sigma_z^2/h'(w_0)^2=4/20^2=0.01$.` },
  { q: R`Solo se mide la aceleración $a$ de un estado $(h,v,a)$. Tras el update…`, opts: [R`$h$ y $v$ también cambian si $\bar\Sigma_{ha},\bar\Sigma_{va}\neq0$`, R`Solo cambia $a$`, R`No cambia nada porque $H$ solo tiene un 1`, R`Cambian $h,v$ pero no $a$`], a: 0, why: R`$K=\bar\Sigma H^T/S$ = 3ª columna de $\bar\Sigma$ / $S$.` },
  { q: R`Con medida de rango a lo largo de $x$ ($H=(1,0,0)$) y $\bar\Sigma$ con $\bar\Sigma_{xy}=\bar\Sigma_{x\theta}=0$:`, opts: [R`Solo se reduce $\Sigma_{xx}$`, R`Se reducen todas las varianzas`, R`Se reduce $\Sigma_{yy}$`, R`Aumenta $\Sigma_{\theta\theta}$`], a: 0, why: R`La información entra solo en la dirección de $H$ (2024-01 Q4e).` },
  { q: R`Un sensor con sesgo desconocido hace que el filtro sea…`, opts: ["Over-confident", "Under-confident", "Igual de confiado", "Divergente siempre"], a: 0, why: R`$\Sigma$ no refleja el error sistemático.` },
  { q: R`ML data association en EKF equivale a…`, opts: ["Escoger el landmark con menor distancia de Mahalanobis de la innovación", "Escoger el landmark más cercano en distancia euclídea", "Promediar todos los landmarks", "Escoger el de mayor ganancia K"], a: 0, why: R`$\arg\max_c\mathcal N(\eta_c;0,S_c)$ ⇔ min $\eta^TS^{-1}\eta+\log|S|$.` },
  { q: R`¿Cuál es la innovación en 2024-11 Q2 ($h=w^2$, $\bar w=10$, $z_1=81$)?`, opts: ["−19", "−119", "61", "−9"], a: 0, why: R`$\eta=z-h(\bar\mu)=81-100$. Con $H\bar\mu=200$ saldría −119 (error clásico).` },
  { q: R`¿Cuándo es preferible un PF a un EKF?`, opts: ["Creencia multimodal / localización global", "Sistema lineal gaussiano", "Cuando hay poco tiempo de cómputo", "Siempre"], a: 0, why: R`PF representa distribuciones arbitrarias; el EKF es unimodal.` },
];

// ---------------------------------------------------------------- past exams
const exams = [
{ id: "2025-11-20 Q1", part2: true, type: "kf", pts: "5p", title: "KF (x,v), inicio exacto, medida 2x+v",
  statement: R`$X_0=0$, $V_0=1$ <b>exactly</b>. $E[X_t]=x_{t-1}+v_{t-1}$, $E[V_t]=v_{t-1}$. Process noise $\sigma^2_{xx}=4$, $\sigma^2_{vv}=1$, $\sigma^2_{xv}=0$. $p(z_t|x_t,v_t)$ Gaussian with mean $2x_t+v_t$ and <b>standard deviation 4</b>.<br>(a,1p) Belief at $t=1$? (b,2p) $Z_1=2$: belief after the measurement? (c,2p) Belief at $t=2$?`,
  tags: "inicio exacto ⇒ predict / update / predict",
  steps: [
   ["Modelo", R`$A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$, $R=\mathrm{diag}(4,1)$, $C=(2,1)$, <b>$Q=16$</b> ⚠ (std 4), $\mu_0=(0,1)^T$, $\Sigma_0=0$.`],
   ["(a) Predict", R`$\bar\mu_1=A\mu_0=(1,1)^T$, $\bar\Sigma_1=R=\mathrm{diag}(4,1)$. "Gaussian with mean $(1,1)^T$ and covariance diag(4,1)".`],
   ["(b) Update", R`$\hat z=2+1=3$, $\eta=2-3=-1$. $\mathbf s=\bar\Sigma C^T=(8,1)^T$, $S=2\cdot8+1+16=33$, $K=\tfrac1{33}(8,1)^T$.`],
   ["(b) Resultado", R`$\mu_1=(1,1)-\tfrac1{33}(8,1)=(\tfrac{25}{33},\tfrac{32}{33})$, $\Sigma_1=\bar\Sigma-\mathbf s\mathbf s^T/33=\tfrac1{33}\begin{pmatrix}68&-8\\-8&32\end{pmatrix}$.`],
   ["(c) Predict t=2", R`$\bar\mu_2=A\mu_1=(\tfrac{57}{33},\tfrac{32}{33})$. Atajo: $A\Sigma_1A^T=\tfrac1{33}\begin{pmatrix}68-16+32&-8+32\\ \cdot&32\end{pmatrix}=\tfrac1{33}\begin{pmatrix}84&24\\24&32\end{pmatrix}$, $+R$: $\bar\Sigma_2=\tfrac1{33}\begin{pmatrix}216&24\\24&65\end{pmatrix}$.`]],
  traps: R`$Q=4$ en vez de 16; olvidar que $\Sigma_1$ ya tiene término cruzado (−8/33) en (c).` },
{ id: "2025-11-20 Q2", part2: true, type: "ekf", pts: "7p", title: "EKF: g con v², h = 1/(x²+v²+1)",
  statement: R`$X_0=0,V_0=0$ exactly. $E[X_t]=x_{t-1}+v_{t-1}^2+1$, $E[V_t]=v_{t-1}$. $\sigma^2_{xx}=2,\sigma^2_{vv}=1,\sigma^2_{xv}=0$. Mean of $Z_t$ is $\dfrac1{x_t^2+v_t^2+1}$, <b>variance</b> ½.<br>(a,2p) Belief at $t=1$? (b,3p) $Z_1=1$: belief after it? (c,2p) Belief at $t=2$?`,
  tags: "EKF inicio exacto; Jacobianos con ceros en v=0",
  steps: [
   ["Modelo", R`$g=(x+v^2+1,\ v)$, $G=\begin{pmatrix}1&2v\\0&1\end{pmatrix}$, $R=\mathrm{diag}(2,1)$. $h=(x^2+v^2+1)^{-1}$, $H=\big(\frac{-2x}{D^2},\frac{-2v}{D^2}\big)$, $Q=\tfrac12$ (varianza ⚠).`],
   ["(a) Predict", R`$\bar\mu_1=g(0,0)=(1,0)$ (¡el +1!). $\Sigma_0=0\Rightarrow\bar\Sigma_1=R=\mathrm{diag}(2,1)$.`],
   ["(b) Linealiza en μ̄₁ ⚠", R`En $(1,0)$: $D=2$, $\hat z=\tfrac12$, $\eta=\tfrac12$, $H=(-\tfrac24,0)=(-\tfrac12,0)$. (En $\mu_0$ saldría $H=0$: mal.)`],
   ["(b) Gain y posterior", R`$\mathbf s=\bar\Sigma H^T=(-1,0)$, $S=\tfrac12+\tfrac12=1$, $K=(-1,0)$. $\mu_1=(1,0)+(-1,0)\cdot\tfrac12=(\tfrac12,0)$, $\Sigma_1=\bar\Sigma-\mathbf s\mathbf s^T=I$.`],
   ["(c) Predict t=2", R`$G$ en $\mu_1=(\tfrac12,0)$: $2v=0\Rightarrow G=I$. $\bar\mu_2=(\tfrac12+0+1,0)=(\tfrac32,0)$, $\bar\Sigma_2=I+R=\mathrm{diag}(3,2)$.`],
   ["Extra (teoría)", R`$v=0$ anula todas las derivadas en $v$: el EKF ignora $v$. La verdad (Monte Carlo): $E[X_2]=2.5$, $\mathrm{Var}X_2=5$ ⇒ el EKF subestima media y varianza. Buen ejemplo de "cuándo falla el EKF".`]],
  traps: R`Olvidar el cuadrado del denominador en $H$; evaluar $H$ en $\mu_0$; perder el $+1$ de $g$; $K<0$ es correcto.` },
{ id: "2024-11-21 Q1", part2: true, type: "kf", pts: "5p", title: "KF parque eólico: init desde medida, steady state, ρ",
  statement: R`State $(W,X)$. Wind measured with std 0.1. Wind: Gaussian around previous, std 1.0. Power: linear, factor −3 on $x_{t-1}$, 4 on $w_{t-1}$, noise variance 1. $Z_0=10$ gives $w_0$.<br>(a) Var of $W_0$? (b) $x_0$ (steady state)? (c) Power variance .04, $\rho=0.5$: $\Sigma_0$? (d) Predicted distribution $t=1$? (e) $Z_1=9$: updated belief?`,
  tags: "variante 'inicializa desde medida'",
  steps: [
   ["(a)", R`Medida directa ⇒ $\sigma^2_{w,0}=0.1^2=0.01$.`],
   ["(b) Steady state", R`$x=-3x+4w\Rightarrow x=w\Rightarrow x_0=10$. $\mu_0=(10,10)$.`],
   ["(c) ρ ⚠", R`$\sigma_{wx}=0.5\cdot0.1\cdot0.2=0.01$ ⇒ $\Sigma_0=\begin{pmatrix}0.01&0.01\\0.01&0.04\end{pmatrix}$.`],
   ["(d) Predict", R`$A=\begin{pmatrix}1&0\\4&-3\end{pmatrix}$, $R=I$. $\bar\mu_1=(10,10)$. $A\Sigma_0A^T=\begin{pmatrix}0.01&0.01\\0.01&0.28\end{pmatrix}$ ⇒ $\bar\Sigma_1=\begin{pmatrix}1.01&0.01\\0.01&1.28\end{pmatrix}$.`],
   ["(e) Update", R`$C=(1,0)$, $Q=0.01$, $\eta=-1$, $\mathbf s=(1.01,0.01)$, $S=1.02$, $K=\tfrac1{1.02}(1.01,0.01)$.`],
   ["(e) Resultado", R`$\mu_1=(10-\frac{1.01}{1.02},\ 10-\frac{0.01}{1.02})=(\tfrac{919}{102},\tfrac{1019}{102})$. $\Sigma_1=\tfrac1{1.02}\begin{pmatrix}0.0101&0.0001\\0.0001&1.02\cdot1.28-0.0001\end{pmatrix}$.`]],
  traps: R`$\rho\sigma\sigma$ con varianzas; orden del estado inconsistente; la oficial escribe $\mu_0+K\eta$ (correcto solo porque $\bar\mu_1=\mu_0$): tú escribe $\bar\mu_1+K\eta$.` },
{ id: "2024-11-21 Q2", part2: true, type: "ekf", pts: "7p", title: "EKF parque eólico: Z = W², cúbica",
  statement: R`$Z_t=W_t^2+\eta_t$, std 2. Wind: Gaussian around previous, std 1. $X_t=X_{t-1}+2(W_{t-1}-2X_{t-1})^3+\epsilon_t$, var 1. $Z_0=100$.<br>(a,1p) Var of $W_0$? (b) $x_0$? (c) Power var .01, no correlations: $\Sigma_0$? (d,2p) $g,h$? (e,1p) Predicted at $t=1$? (f,2p) $Z_1=81$: innovation, $K$, mean?`,
  tags: "init vía inversa + Jacobiano; G = I en steady state",
  steps: [
   ["(a)", R`$w_0=\sqrt{100}=10$ (raíz positiva). $h'=2w=20$. $\sigma^2_w=4/400=0.01$.`],
   ["(b)", R`$(w-2x)^3=0\Rightarrow x_0=5$.`],
   ["(c)", R`$\Sigma_0=\mathrm{diag}(0.01,0.01)$.`],
   ["(d) Modelos", R`$g=\begin{pmatrix}W\\X+2(W-2X)^3\end{pmatrix}$, $R=I$; $h=W^2$, $Q=4$. $G=\begin{pmatrix}1&0\\6(W-2X)^2&1-12(W-2X)^2\end{pmatrix}$, $H=(2W,0)$.`],
   ["(e) Predict", R`En $\mu_0$, $W-2X=0\Rightarrow G=I$. $\bar\mu_1=(10,5)$, $\bar\Sigma_1=\mathrm{diag}(1.01,1.01)$.`],
   ["(f) Update ⚠", R`$\hat z=h(\bar\mu)=100$, $\eta=-19$ (no $81-200$). $H=(20,0)$, $S=400\cdot1.01+4=408$, $K=(\tfrac{20.2}{408},0)=(\tfrac{101}{2040},0)$, $\mu_1=(10-\tfrac{19\cdot101}{2040},\ 5)\approx(9.059,5)$.`]],
  traps: R`$Q=2$ en vez de 4; multiplicar por $h'^2$ en vez de dividir; $\eta=z-H\bar\mu$.` },
{ id: "2026-01-07 Q3", type: "kf", pts: "11p", title: "Fusión escalar + linealización de entradas ruidosas",
  statement: R`Prior $bel(x)=\mathcal N(10,1)$. Rope measurement $z=9$, variance 3. (a) New belief? (b) Unknown bias ⇒ over/under-confident? Next day $\Delta x=0.1r-0.06u^{1/3}$, $r=1$, $u=\tfrac18$, Var$(r)=0.5$, Var$(u)=1$. (c) Linearized $\Delta x$? (d) New mean? (e) Var$(\Delta x)$? (f) New variance? (g) Where did you assume independence?`,
  steps: [
   ["(a)", R`$K=\tfrac14$, $\mu=9.75$, $\sigma^2=\tfrac34$.`],
   ["(b)", R`Over-confident.`],
   ["(c)", R`$\partial_r=0.1$, $\partial_u=-0.02u^{-2/3}=-0.08$; $\Delta x(1,\tfrac18)=0.07$ ⇒ $\Delta x\approx0.07+0.1(r-1)-0.08(u-\tfrac18)$.`],
   ["(d)–(f)", R`$\bar\mu=9.82$; Var$(\Delta x)=0.01\cdot0.5+0.0064\cdot1=0.0114$; $\bar\sigma^2=0.75+0.0114=0.7614$ (la oficial tiene typo .07614).`],
   ["(g)", R`$r\perp u$ (sin término cruzado), $\Delta x\perp x$ (las varianzas se suman), prior ⊥ ruido de medida.`]],
  traps: R`Usar el prior original en vez del posterior de (a); olvidar elevar al cuadrado los Jacobianos.` },
{ id: "2025-01-13 Q3", type: "kf", pts: "4p", title: "KF globo (h,v,a), se mide a",
  statement: R`Initial $a=1$ (std 0.1), $h=0$ (std 0.05), $v=0$ exactly. Rises 1 s constant acceleration, then wind adds variance 0.1 to $a$. (a) initial distribution (b) after 1 s (c) measurement $a$: $z=1.1$, var 0.39.`,
  steps: [
   ["(a)", R`$\mu_0=(0,0,1)$, $\Sigma_0=\mathrm{diag}(0.0025,0,0.01)$ (¡cuadrados!).`],
   ["(b)", R`$A=\begin{pmatrix}1&1&\tfrac12\\0&1&1\\0&0&1\end{pmatrix}$, $R=\mathrm{diag}(0,0,0.1)$. $\bar\mu=(0.5,1,1)$, $\bar\Sigma=\begin{pmatrix}.005&.005&.005\\.005&.01&.01\\.005&.01&.11\end{pmatrix}$.`],
   ["(c)", R`$S=0.11+0.39=0.5$, $K=2(0.005,0.01,0.11)=(0.01,0.02,0.22)$, $\eta=0.1$ ⇒ $\mu=(0.501,1.002,1.022)$.`]],
  traps: R`Medir solo $a$ también corrige $h$ y $v$ por las covarianzas cruzadas.` },
{ id: "2025-01-13 Q4", type: "ekf", pts: "6p", title: "EKF globo: drag a(1−0.1v), presión",
  statement: R`Same start. $a_t=a_{t-1}(1-0.1v_{t-1})$, wind var 0.1. (a) Distribution after 1 s. (b) $P=1.1$, $P=2.5-2h-0.5v^2$, var 0.05.`,
  steps: [
   ["(a)", R`$G_0=\begin{pmatrix}1&1&.5\\0&1&1\\0&-0.1a&1-0.1v\end{pmatrix}_{\mu_0}=\begin{pmatrix}1&1&.5\\0&1&1\\0&-0.1&1\end{pmatrix}$. Como $\Sigma_{vv}=0$, $\bar\Sigma$ = mismo que Q3. $\bar\mu=(0.5,1,1)$.`],
   ["(b)", R`$H=(-2,-v,0)|_{\bar\mu}=(-2,-1,0)$, $\hat z=2.5-1-0.5=1$, $\eta=0.1$. $H\bar\Sigma=(-.015,-.02,-.02)$, $S=0.05+0.05=0.1$ ⚠ (la oficial no muestra $+Q$).`],
   ["(b) Resultado", R`$K=(-0.15,-0.2,-0.2)$, $\mu=(0.485,0.98,0.98)$.`]],
  traps: R`$H$ en $\bar\mu$ ($v=1$), no en $\mu_0$; $K$ negativo es correcto.` },
{ id: "2024-01-15 Q3", type: "kf", pts: "7p", title: "KF escalar: velocímetro, inventar R",
  statement: R`Speedometer 5.0 m/s, std 0.5. (a) $p(v_0)$. (b) 10 s later 5.2: what other process must you model? (c) Model it and compute the posterior, stating everything you make up.`,
  steps: [
   ["(a)", R`$\mathcal N(5.0,0.25)$.`], ["(b)", R`El modelo dinámico de la velocidad (cómo cambia en 10 s).`],
   ["(c)", R`Random walk con $R=0.1$ (justificado). $\bar\sigma^2=0.35$, $K=0.35/0.6=\tfrac7{12}$, $\mu=5+\tfrac7{12}0.2=\tfrac{307}{60}$, $\sigma^2=\tfrac7{48}$.`]],
  traps: R`Los puntos están en justificar $R$.` },
{ id: "2024-01-15 Q4", type: "ekf", pts: "6p", title: "EKF robot (x,y,θ), 2 predicciones, rango a baliza",
  statement: R`10 m/s along heading, 1 s steps, noise var 0.01 ($x,y$), 0.0001 ($\theta$). Starts exactly at origin facing $+x$, travels 2 s. Beacon at origin measures range, var 1, $z=19$.`,
  steps: [
   ["Modelo", R`$g=(x+10\cos\theta,\ y+10\sin\theta,\ \theta)$, $G=\begin{pmatrix}1&0&-10\sin\theta\\0&1&10\cos\theta\\0&0&1\end{pmatrix}$.`],
   ["2 predicts", R`Paso 1: $\Sigma_1=R$. Paso 2 con $G$ en $\theta=0$: $\bar\Sigma_2=GRG^T+R=\begin{pmatrix}.02&0&0\\0&.03&.001\\0&.001&.0002\end{pmatrix}$, $\bar\mu_2=(20,0,0)$. Forma real: banana.`],
   ["Update", R`$H=(x/r,y/r,0)=(1,0,0)$, $\eta=-1$, $S=1.02$, $K=(\tfrac1{51},0,0)$, $\mu_x=\tfrac{1019}{51}$, $\Sigma_{xx}=\tfrac1{51}$, resto igual.`]],
  traps: R`Añadir $R$ en cada paso; rango solo informa en la dirección de $H$.` },
{ id: "2023-01-16 Q3", type: "kf", pts: "4p", title: "KF escalar submarino",
  statement: R`Descends ~10 m/s, error std 2 m/s (unchanging). Measurement every 10 s, std 2 m. Start at known 10 m. (a) belief after 10 s (b) after measuring 100 m.`,
  steps: [["(a)", R`$R=(10\cdot2)^2=400$ ⚠, $\bar\mu=110$, $\bar\Sigma=400$.`], ["(b)", R`$K=\tfrac{400}{404}=\tfrac{100}{101}$, $\mu=\tfrac{10110}{101}$, $\Sigma=\tfrac{400}{101}$.`]] },
{ id: "2023-01-16 Q4", type: "ekf", pts: "7p", title: "EKF escalar: descenso no lineal, sensor de presión",
  statement: R`Descent per second $\sim N(11-e^{k(x-10)},4)$, $k=\tfrac1{20}$, $x_0=10$ known. Pressure $p=3.1$ bar with $x=10(p-1)$, std 0.1 bar. (d) predicted belief after 2 s as expression.`,
  steps: [
   ["Predict", R`$g=x+11-e^{(x-10)/20}$, $G=1-\tfrac1{20}e^{(x-10)/20}=0.95$ en 10. $\bar\mu=20$, $\bar\Sigma=4$.`],
   ["Update", R`Invertir: $h=0.1x+1$, $H=0.1$, $Q=0.01$, $\hat z=3$, $\eta=0.1$, $S=0.05$, $K=8$, $\mu=20.8$, $\Sigma=0.8$.`],
   ["(d)", R`Linealiza en 20.8: $\bar\mu_2=31.8-e^{0.54}$, $\bar\Sigma_2=(1-0.05e^{0.54})^2\cdot0.8+4$.`]],
  traps: R`$K=8>1$ es correcto (unidades distintas).` },
{ id: "2022-01-12 Q3", type: "ekf", pts: "10p", title: "EKF 3D (Q,I,K): parámetro como estado",
  statement: R`$Q_t=K Q_{t-1}$, $I_t=KI_{t-1}$, $K_t=K_{t-1}$; noise var ½ on $Q,I$, 0 on $K$. $\mu_0=(4,2,\tfrac12)$, variances $2,1,\tfrac1{16}$. Measure current $z_1=2$, std ½.`,
  steps: [
   ["G", R`$G=\begin{pmatrix}K&0&Q\\0&K&I\\0&0&1\end{pmatrix}_{\mu_0}=\begin{pmatrix}.5&0&4\\0&.5&2\\0&0&1\end{pmatrix}$.`],
   ["Predict", R`$\bar\mu=(2,1,\tfrac12)$, $\bar\Sigma=\begin{pmatrix}2&.5&.25\\.5&1&.125\\.25&.125&.0625\end{pmatrix}$.`],
   ["Update", R`$H=(0,1,0)$, $Q=\tfrac14$, $\eta=1$, $S=\tfrac54$, $K=(0.4,0.8,0.1)$, $\mu=(2.4,1.8,0.6)$.`]],
  traps: R`No confundir el estado $K$ con la ganancia; std ½ ⇒ $\tfrac14$.` },
{ id: "2021-01-08 Q4", type: "kf", pts: "10p", title: "KF 2D desde momentos crudos",
  statement: R`$x_t=\tfrac12x-y+\varepsilon_x(1)$, $y_t=-\tfrac12x+\tfrac12y+\varepsilon_y(4)$, $z=x+y+\eta(3)$. $E[x_0]=1,E[x_0^2]=1,E[y_0]=0,E[y_0^2]=4,E[x_0y_0]=0$. $z_1=1$.`,
  steps: [
   ["Σ₀", R`$\mathrm{diag}(0,4)$.`],
   ["Predict", R`$\bar\mu=(\tfrac12,-\tfrac12)$, $\bar\Sigma=4a_2a_2^T+R=\begin{pmatrix}5&-2\\-2&5\end{pmatrix}$.`],
   ["Update", R`$H=(1,1)$, $\mathbf s=(3,3)$, $S=9$, $K=\tfrac13(1,1)$, $\eta=1$, $\mu=(\tfrac56,-\tfrac16)$, $\Sigma=\begin{pmatrix}4&-3\\-3&4\end{pmatrix}$.`]] },
{ id: "2021-01-08 Q5–Q6", type: "ekf", pts: "8p+2p", title: "EKF que colapsa al KF anterior + iEKF",
  statement: R`Q4 plus $+y^2$ and $+2y^3$ in dynamics, $z=\tfrac32x+\tfrac12y+xy-\tfrac14$. Q6: how do answers change with iEKF?`,
  steps: [
   ["G y H", R`$G$ en $(1,0)$ = $A$ de Q4. $H=(\tfrac32+y,\tfrac12+x)$ en $\bar\mu=(\tfrac12,-\tfrac12)$ = $(1,1)$. $h(\bar\mu)=0$. ⇒ Todo igual que Q4.`],
   ["iEKF", R`Predicción igual; el update se itera relinealizando $h$ en el último iterado (con el término $-H(\bar\mu-\mu^{(i)})$). Aquí cambia algo porque $h$ tiene $xy$.`]] },
{ id: "2020-01-08 Q3", type: "kf", pts: "10p", title: "KF 2D, se mide x",
  statement: R`$x_t=x+20y$, $y_t=-x+y$, $R=\mathrm{diag}(1,2)$, $\mu_0=(0,1)$, var .01 each. $x_1$ measured 16, var 1.`,
  steps: [["Predict", R`$\bar\mu=(20,1)$, $\bar\Sigma=.01AA^T+R=\begin{pmatrix}5.01&.19\\.19&2.02\end{pmatrix}$.`],
   ["Update", R`$S=6.01$, $K=(\tfrac{5.01}{6.01},\tfrac{.19}{6.01})$, $\eta=-4$, $\mu=(20-\tfrac{20.04}{6.01},1-\tfrac{.76}{6.01})$.`]] },
{ id: "2020-01-08 Q5", type: "ekf", pts: "7p", title: "EKF en el origen (G = I), z = sin x",
  statement: R`$x_t=x+xy$, $y_t=x^2+y$, $R=\mathrm{diag}(1,.5)$, $\mu_0=0$, $\Sigma_0=I$. $z=\sin x$, $Q=.2$, $z_1=.1$.`,
  steps: [["Predict", R`$G=\begin{pmatrix}1+y&x\\2x&1\end{pmatrix}_0=I$, $\bar\Sigma=\mathrm{diag}(2,1.5)$.`],
   ["Update", R`$H=(\cos0,0)=(1,0)$, $S=2.2$, $K=(\tfrac{10}{11},0)$, $\mu=(\tfrac1{11},0)$, $\Sigma=\mathrm{diag}(\tfrac2{11},1.5)$.`]] },
{ id: "2019-01-12 Q3", type: "kf", pts: "8p", title: "KF ángulo y velocidad angular, H = I",
  statement: R`$\mu_0=(0,.1)$, $\Sigma_0=\mathrm{diag}(.04,.01)$, $A=\begin{pmatrix}1&1\\0&1\end{pmatrix}$, $R=\mathrm{diag}(.04,.01)$. Both measured, $Q=\mathrm{diag}(.01,.01)$, $z=(0,.1)$. Independent at t=0? at t=1?`,
  steps: [["Independencia", R`t=0 sí (gaussiana diagonal); t=1 no ($\bar\Sigma_{12}=.01$).`],
   ["Predict", R`$\bar\mu=(.1,.1)$, $\bar\Sigma=\begin{pmatrix}.09&.01\\.01&.02\end{pmatrix}$.`],
   ["Update", R`$K=\bar\Sigma(\bar\Sigma+Q)^{-1}$ con inversa 2×2; $\mu=(\tfrac3{290},\tfrac{14}{145})$.`]] },
{ id: "2019-01-12 Q4", type: "ekf", pts: "4p", title: "EKF: x + 2y², z = xy",
  statement: R`$x_t=x+2y^2$, $y_t=y$, $R=\mathrm{diag}(.1,.1)$, $\mu_0=(0,1)$, $\Sigma_0=\mathrm{diag}(.04,.04)$. $z=xy$, $Q=.02$, $z_1=2.1$.`,
  steps: [["Predict", R`$G=\begin{pmatrix}1&4y\\0&1\end{pmatrix}=\begin{pmatrix}1&4\\0&1\end{pmatrix}$, $\bar\mu=(2,1)$, $\bar\Sigma=\begin{pmatrix}.78&.16\\.16&.14\end{pmatrix}$.`],
   ["Update", R`$H=(y,x)=(1,2)$, $\mathbf s=(1.1,.44)$, $S=2$, $K=(.55,.22)$, $\eta=.1$, $\mu=(2.055,1.022)$.`]] },
{ id: "2018-01-13 Q3", type: "kf", pts: "6p", title: "KF 3 estados con término constante",
  statement: R`$x'=x+v+\tfrac12a$, $v'=v+a$, $a'=10-x/100$; noise var 1 each; $x_0=0,a_0=10$ known, Var$(v_0)=1$. Depth measured 5.3, var 1.`,
  steps: [["Modelo", R`Constante 10 en $b$, no en $A$. $\Sigma_0=\mathrm{diag}(0,1,0)$.`],
   ["Predict", R`$\bar\mu=(5,10,10)$, $\bar\Sigma=\begin{pmatrix}2&1&0\\1&2&0\\0&0&1\end{pmatrix}$.`],
   ["Update", R`$S=3$, $K=(\tfrac23,\tfrac13,0)$, $\eta=.3$, $\mu=(5.2,10.1,10)$.`]] },
{ id: "2018-01-13 Q4", type: "ekf", pts: "6p", title: "EKF robot, rango a landmark (2,0)",
  statement: R`$v\Delta t=1$, $\omega\Delta t=\pi/6$, $R=\mathrm{diag}(.2,.2,.04)$, $\mu_0=0$, $\Sigma_0=\mathrm{diag}(.05,.05,.01)$. Range 0.75, var .25.`,
  steps: [["Predict", R`$G$ en $\theta_0=0$ ⚠ (no $\pi/6$): $\begin{pmatrix}1&0&0\\0&1&1\\0&0&1\end{pmatrix}$. $\bar\mu=(1,0,\pi/6)$, $\bar\Sigma_{xx}=.25$.`],
   ["Update", R`$h=\sqrt{(2-x)^2+y^2}=1$, $H=(-1,0,0)$, $S=.5$, $K=(-.5,0,0)$, $\eta=-.25$, $\mu_x=\tfrac98$, $\Sigma_{xx}=\tfrac18$.`]] },
{ id: "Teoría 2018-2021", type: "th", pts: "1–4p", title: "Preguntas cortas que han caído",
  statement: R`EKF vs KF vs PF; iEKF y UKF; inconsistencia del EKF; ML data association; MAP.`,
  steps: [
   ["¿Cuándo EKF en lugar de KF?", R`Cualquier $g$ o $h$ no lineal (p.ej. localización con rango/rumbo).`],
   ["¿KF mejor que PF?", R`Lineal-gaussiano unimodal: óptimo y barato.`],
   ["¿PF mejor que EKF?", R`Multimodal, localización global, kidnapped robot.`],
   ["Dos variantes del EKF", R`iEKF (itera el update relinealizando $h$); UKF (sigma points, sin Jacobianos, 2º orden).`],
   ["¿Por qué el EKF es inconsistente?", R`Error de linealización ⇒ overconfident, se acumula recursivamente.`],
   ["ML data association", R`$\arg\max_c p(z|x,c)$ = mínima Mahalanobis.`]] },
];

window.CONTENT = { home, recipe, dict, checklist, flash, quiz, exams };
})();
