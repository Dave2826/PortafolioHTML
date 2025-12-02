/* -------- Guard anti-duplicados -------- */
(function () {
  if (window.__numberLineAppLoaded) {
    console.warn('App ya estaba cargada. Evitando inicialización duplicada.');
    return;
  }
  window.__numberLineAppLoaded = true;

  // Estado global compartido (por si el script se re-evalúa)
  const state = (window.__numberLineState = window.__numberLineState || {
    points: [],
    currentRange: 10
  });

  const points = state.points;   // misma referencia
  let currentRange = state.currentRange;

  /* ====== CONSTANTES ====== */
  const CONSTANTS = {
    'π': Math.PI, 'pi': Math.PI, 'e': Math.E,
    'φ': (1 + Math.sqrt(5)) / 2, 'phi': (1 + Math.sqrt(5)) / 2,
    'τ': 2 * Math.PI, 'tau': 2 * Math.PI,
    'ln2': Math.LN2, 'ln10': Math.LN10,
    '√2': Math.sqrt(2), '√3': Math.sqrt(3), '√5': Math.sqrt(5),
    '√7': Math.sqrt(7), '√8': Math.sqrt(8), '√10': Math.sqrt(10),
    '√11': Math.sqrt(11), '√12': Math.sqrt(12), '√13': Math.sqrt(13),
    '√15': Math.sqrt(15), '√17': Math.sqrt(17), '√19': Math.sqrt(19), '√20': Math.sqrt(20),
    '-√2': -Math.sqrt(2), '-√3': -Math.sqrt(3), '-√5': -Math.sqrt(5)
  };

  /* ====== PARSER ====== */
  function parseNumber(input){
    input = input.trim().replace(/\s+/g,'');
    if (CONSTANTS.hasOwnProperty(input)) return CONSTANTS[input];

    let processedInput = input;
    for (const [symbol, value] of Object.entries(CONSTANTS)){
      const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
      processedInput = processedInput.replace(regex, value.toString());
    }

    if (input.includes('/') && !input.includes('*') && !input.includes('+') && !input.includes('-',1)){
      const parts = input.split('/');
      if (parts.length===2){
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator!==0) return numerator/denominator;
      }
    }

    if (input.startsWith('√') && !input.includes('*') && !input.includes('+') && !input.includes('-',1)){
      const rad = parseFloat(input.slice(1));
      if (!isNaN(rad) && rad>=0) return Math.sqrt(rad);
    }
    if (input.startsWith('-√') && !input.includes('*') && !input.includes('+')){
      const rad = parseFloat(input.slice(2));
      if (!isNaN(rad) && rad>=0) return -Math.sqrt(rad);
    }

    if (input.includes('sqrt(')){
      const match = input.match(/sqrt\(([^)]+)\)/);
      if (match){
        const innerExpression = match[1];
        let innerValue;
        try{
          if (innerExpression.includes('/') && !innerExpression.includes('*') && !innerExpression.includes('+') && !innerExpression.includes('-',1)){
            const parts = innerExpression.split('/');
            if (parts.length===2){
              const num = parseFloat(parts[0]);
              const den = parseFloat(parts[1]);
              if (!isNaN(num) && !isNaN(den) && den!==0) innerValue = num/den;
            }
          } else {
            const safeChars = /^[0-9+\-*/.() ]+$/;
            if (safeChars.test(innerExpression)){
              innerValue = Function('"use strict"; return ('+innerExpression+')')();
            } else {
              innerValue = parseFloat(innerExpression);
            }
          }
          if (!isNaN(innerValue) && innerValue>=0) return Math.sqrt(innerValue);
        }catch(e){}
      }
    }

    try{
      processedInput = processedInput.replace(/\^/g,'**');
      const safeChars = /^[0-9+\-*/.() ]+$/;
      if (safeChars.test(processedInput)){
        const result = Function('"use strict"; return ('+processedInput+')')();
        if (typeof result==='number' && !isNaN(result) && isFinite(result)) return result;
      }
    }catch(e){}

    const num = parseFloat(processedInput);
    if (!isNaN(num)) return num;
    return null;
  }

  /* ====== CLASIFICACIÓN ====== */
  function classifyNumber(num, originalInput){
    if (num>0 && Number.isInteger(num)) return 'naturals';
    if (Number.isInteger(num)) return 'integers';

    const irrationalConstants = [
      'π','pi','e','φ','phi','τ','tau','ln2','ln10',
      '√2','√3','√5','√7','√8','√10','√11','√12',
      '√13','√15','√17','√19','√20','-√2','-√3','-√5'
    ];
    if (irrationalConstants.includes(originalInput)) return 'irrationals';

    if (originalInput.includes('sqrt(')){
      const sqrtMatch = originalInput.match(/sqrt\(([^)]+)\)/);
      if (sqrtMatch){
        const innerExpression = sqrtMatch[1];
        let innerValue;
        try{
          if (innerExpression.includes('/')){
            const parts = innerExpression.split('/');
            if (parts.length===2){
              const num = parseFloat(parts[0]);
              const den = parseFloat(parts[1]);
              if (!isNaN(num) && !isNaN(den) && den!==0) innerValue = num/den;
            }
          } else {
            innerValue = parseFloat(innerExpression);
          }
          if (!isNaN(innerValue) && innerValue>=0){
            const sqrtResult = Math.sqrt(innerValue);
            if (Number.isInteger(sqrtResult)){
              if (sqrtResult>0) return 'naturals';
              if (sqrtResult===0) return 'integers';
            } else {
              return 'irrationals';
            }
          }
        }catch(e){ return 'irrationals'; }
      }
    }

    if (originalInput.includes('√')) return 'irrationals';

    if (originalInput.includes('*') || originalInput.includes('+') || originalInput.includes('-') || originalInput.includes('/')){
      const irrationalSymbols = ['π','pi','e','φ','phi','τ','tau','ln2','ln10','√','sqrt'];
      const containsIrrationals = irrationalSymbols.some(s => originalInput.includes(s));
      if (containsIrrationals){
        const specialRationalCases = [
          /π\/π/,/pi\/pi/,/e\/e/,/φ\/φ/,/phi\/phi/,/τ\/τ/,/tau\/tau/,
          /√2\/√2/,/√3\/√3/,/√5\/√5/,
          /π-π/,/pi-pi/,/e-e/,/φ-φ/,/phi-phi/,
          /2\*π\/τ/,/τ\/2\*π/
        ];
        const isSpecialRational = specialRationalCases.some(p => p.test(originalInput.replace(/\s/g,'')));
        if (isSpecialRational){
          if (num>0 && Number.isInteger(num)) return 'naturals';
          if (Number.isInteger(num)) return 'integers';
          return 'rationals';
        }
        return 'irrationals';
      }
    }

    if (originalInput.includes('/')) return 'rationals';
    return 'rationals';
  }

  function getClassificationName(c){
    const names = {
      'naturals':'ℕ (Naturales)',
      'integers':'ℤ (Enteros)',
      'rationals':'ℚ (Racionales)',
      'irrationals':'ℝ-ℚ (Irracionales)'
    };
    return names[c] || 'No clasificado';
  }

  /* ====== UI ====== */
  window.addNumber = function(){
    const input = document.getElementById('numberInput').value;
    if (!input){
      alert('Por favor ingresa un número');
      return;
    }

    const value = parseNumber(input);
    if (value===null){
      alert('Formato de número no válido. Ejemplos válidos: sqrt(7), 2*π, 1/e, √2, -1/2');
      return;
    }
    if (Math.abs(value)>currentRange){
      alert(`El número está fuera del rango actual (-${currentRange} a ${currentRange}).`);
      return;
    }

    const existingPoint = points.find(p => Math.abs(p.value - value) < 0.0001);
    if (existingPoint){
      alert('Este número ya está en la recta numérica');
      return;
    }

    const classification = classifyNumber(value, input);
    points.push({value, originalInput: input, classification});
    document.getElementById('numberInput').value = '';
    updateDisplay();
  };

  window.addPresetNumber = function(input){
    const value = parseNumber(input);
    if (value===null || Math.abs(value)>currentRange){
      alert(`El número ${input} está fuera del rango actual`);
      return;
    }
    const existingPoint = points.find(p => Math.abs(p.value - value) < 0.0001);
    if (existingPoint){
      alert('Este número ya está en la recta numérica');
      return;
    }
    const classification = classifyNumber(value, input);
    points.push({value, originalInput: input, classification});
    updateDisplay();
  };

  window.clearAll = function(){
    points.splice(0, points.length);
    updateDisplay();
  };

  function updateDisplay(){
    drawNumberLine();
    updatePointsList();
    updateDistanceSelectors();
  }

  /* ====== DIBUJO DE LA RECTA ====== */
  function drawNumberLine(){
    const numberLine = document.getElementById('numberLine');
    numberLine.innerHTML = '';

    const line = document.createElement('div');
    line.className = 'line';
    numberLine.appendChild(line);

    const tickCount = currentRange * 2 + 1;
    for (let i=0;i<tickCount;i++){
      const value = -currentRange + i;
      const percentage = (i/(tickCount-1))*90 + 5;

      const tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.left = percentage+'%';
      numberLine.appendChild(tick);

      const label = document.createElement('div');
      label.className = 'tick-label';
      label.style.left = percentage+'%';
      label.textContent = value;
      numberLine.appendChild(label);
    }

    points.forEach((point,index)=>{
      const percentage = ((point.value + currentRange)/(2*currentRange))*90 + 5;
      const pointElement = document.createElement('div');
      pointElement.className = `number-point ${point.classification}`;
      pointElement.style.left = percentage+'%';
      pointElement.draggable = false;

      const pointLabel = document.createElement('div');
      pointLabel.className = 'point-label';
      pointLabel.textContent = `${point.originalInput} ≈ ${point.value.toFixed(3)}`;
      pointElement.appendChild(pointLabel);

      pointElement.onclick = ()=>removePoint(index);
      pointElement.title = `${point.originalInput} (${getClassificationName(point.classification)})\nHaz clic para eliminar`;

      numberLine.appendChild(pointElement);
    });
  }

  function removePoint(index){
    if (confirm('¿Deseas eliminar este punto?')){
      points.splice(index,1);
      updateDisplay();
    }
  }

  function updatePointsList(){
    const pointsList = document.getElementById('pointsList');
    if (points.length===0){
      pointsList.innerHTML = `
        <div class="empty-state">
          <p>Agrega números para ver su clasificación automática aquí</p>
          <small>Los puntos aparecerán ordenados de menor a mayor</small>
        </div>`;
      return;
    }

    const sorted = [...points].sort((a,b)=>a.value-b.value);
    pointsList.innerHTML = sorted.map(p=>`
      <div class="point-item" style="border-left:4px solid ${getClassificationColor(p.classification)}">
        <div><strong>${p.originalInput}</strong> ≈ ${p.value.toFixed(6)}<br><small>${getClassificationName(p.classification)}</small></div>
        <div style="text-align:right;"><small>Posición: ${p.value.toFixed(3)}</small></div>
      </div>`).join('');
  }

  function getClassificationColor(c){
    const colors = {
      naturals:'#e74c3c',
      integers:'#3498db',
      rationals:'#27ae60',
      irrationals:'#f1c40f'
    };
    return colors[c] || '#95a5a6';
  }

  /* ====== CALCULADORA DE DISTANCIAS ====== */
  function updateDistanceSelectors(){
    const pointAItems = document.getElementById('pointA-items');
    const pointBItems = document.getElementById('pointB-items');
    const pointASelected = document.getElementById('pointA-selected');
    const pointBSelected = document.getElementById('pointB-selected');

    pointAItems.innerHTML = '<div data-value="">Selecciona un punto</div>';
    pointBItems.innerHTML = '<div data-value="">Selecciona un punto</div>';

    if (points.length===0){
      pointASelected.textContent = 'Selecciona un punto';
      pointBSelected.textContent = 'Selecciona un punto';
      document.getElementById('pointA-container').setAttribute('data-value','');
      document.getElementById('pointB-container').setAttribute('data-value','');
      return;
    }

    points.forEach((point,index)=>{
      const text = `${point.originalInput} (${point.value.toFixed(3)})`;

      const a = document.createElement('div');
      a.setAttribute('data-value', index);
      a.textContent = text;
      a.onclick = ()=>selectPoint('A', index, text);
      pointAItems.appendChild(a);

      const b = document.createElement('div');
      b.setAttribute('data-value', index);
      b.textContent = text;
      b.onclick = ()=>selectPoint('B', index, text);
      pointBItems.appendChild(b);
    });
  }

  function selectPoint(selector,index,text){
    document.getElementById(`point${selector}-selected`).textContent = text;
    document.getElementById(`point${selector}-container`).setAttribute('data-value', index);
    document.getElementById(`point${selector}-items`).classList.remove('show');
  }

  window.calculateDistance = function(){
    const aVal = document.getElementById('pointA-container').getAttribute('data-value');
    const bVal = document.getElementElementById
  }
})();
  window.calculateDistance = function(){
    const aVal = document.getElementById('pointA-container').getAttribute('data-value');
    const bVal = document.getElementById('pointB-container').getAttribute('data-value');
    const resultDiv = document.getElementById('distanceResult');

    if (!aVal || !bVal){
      resultDiv.innerHTML = '<div style="color:#dc3545;text-align:center;padding:15px;">Selecciona ambos puntos para calcular la distancia</div>';
      return;
    }
    if (aVal === bVal){
      resultDiv.innerHTML = '<div style="color:#dc3545;text-align:center;padding:15px;">Selecciona dos puntos diferentes</div>';
      return;
    }

    const A = points[parseInt(aVal)];
    const B = points[parseInt(bVal)];
    const d = Math.abs(A.value - B.value);

    resultDiv.innerHTML = `
      <div class="distance-result">
        <strong>Distancia entre ${A.originalInput} y ${B.originalInput}:</strong><br>
        <strong>d(a,b) = |${A.value.toFixed(3)} - ${B.value.toFixed(3)}| = ${d.toFixed(6)} unidades</strong>
      </div>`;
  };

  /* ====== EVENTOS ====== */
  document.getElementById('numberInput').addEventListener('keypress', e=>{
    if (e.key === 'Enter') addNumber();
  });

  document.getElementById('pointA-selected').onclick = e=>{
    e.stopPropagation();
    const items = document.getElementById('pointA-items');
    const isOpen = items.classList.contains('show');
    document.querySelectorAll('.select-items').forEach(i=>i.classList.remove('show'));
    if (!isOpen) items.classList.add('show');
  };
  document.getElementById('pointB-selected').onclick = e=>{
    e.stopPropagation();
    const items = document.getElementById('pointB-items');
    const isOpen = items.classList.contains('show');
    document.querySelectorAll('.select-items').forEach(i=>i.classList.remove('show'));
    if (!isOpen) items.classList.add('show');
  };
  document.addEventListener('click', e=>{
    if (!e.target.closest('.custom-select')){
      document.querySelectorAll('.select-items').forEach(i=>i.classList.remove('show'));
    }
  });

  // Ripple: calcula coordenadas del click para la onda en botones
  document.addEventListener('click', e=>{
    if(e.target.tagName === 'BUTTON'){
      const r = e.target.getBoundingClientRect();
      e.target.style.setProperty('--x', (e.clientX - r.left) + 'px');
      e.target.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }
  });

  // (Opcional) Alternar modo oscuro desde consola o con botón
  window.toggleTheme = () => document.body.classList.toggle('dark');

  // Render inicial
  drawNumberLine();
  updatePointsList();
  updateDistanceSelectors();
})();

