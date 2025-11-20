document.addEventListener('DOMContentLoaded', () => {

    const dial = document.getElementById('dial');
    const dialArea = document.getElementById('dial-area');
    const mainDisplay = document.getElementById('main-display');
    const modeDisplay = document.getElementById('mode-display');
    const lcdScreen = document.getElementById('lcd-screen');
    const backlightBtn = document.getElementById('backlight-btn');
    const holdBtn = document.getElementById('hold-btn');
    const holdIndicator = document.getElementById('hold-indicator');
    const probePoints = document.querySelectorAll('.probe-point');
    const measurementInfo = document.getElementById('measurement-info');
    const circuitImg = document.getElementById('circuit-img');
    const schemaBtns = document.querySelectorAll('.schema-btn');

    const modes = [
        { name: 'OFF',   angle: -90, display: '', type: 'OFF' },
        { name: 'V AC',  angle: -50, display: 'V AC', type: 'AC' },
        { name: 'V DC',  angle: -10, display: 'V DC', type: 'DC' },
        { name: 'mV DC', angle: 30,  display: 'mV DC', type: 'DC' },
        { name: 'Ω',     angle: 70,  display: 'Ω', type: 'RES' },
        { name: 'mA DC', angle: 110, display: 'mA DC', type: 'DC' },
        { name: 'A DC',  angle: 150, display: 'A DC', type: 'DC' },
        { name: 'A AC',  angle: 190, display: 'A AC', type: 'AC' },
        { name: 'mA AC', angle: 230, display: 'mA AC', type: 'AC' }
    ];
    
    let currentModeIndex = 0;
    let rotationCount = 0;
    
    let redProbePoint = null;
    let blackProbePoint = null;
    let isHoldActive = false;
    let heldMeasurement = { value: '', unit: '' };
    let activeCircuitIndex = 0;

    // === SCHEMŲ DUOMENYS ===
    const circuitsData = [
        {
            // SCHEMA 1: DC Series
            id: 0,
            type: 'DC',
            img: 'assets/Schem1.jpg',
            nodes: {
                'p-1': { v: 110, name: 'A' }, // Bat+
                'p-3': { v: 110, name: 'A' }, // R1 In
                'p-4': { v: 90,  name: 'B' }, // R1 Out
                'p-5': { v: 90,  name: 'B' }, // R2 In
                'p-6': { v: 60,  name: 'C' }, // R2 Out
                'p-7': { v: 60,  name: 'C' }, // R3 In
                'p-8': { v: 0,   name: 'D' }, // R3 Out
                'p-2': { v: 0,   name: 'D' }  // Bat-
            },
            positions: {
                'p-1': { top: '35%', left: '20.4%' },
                'p-2': { top: '67%', left: '20.4%' },
                'p-3': { top: '17%', left: '35%' },
                'p-4': { top: '17%', left: '67%' },
                'p-5': { top: '35%', left: '82%' },
                'p-6': { top: '67%', left: '82%' },
                'p-7': { top: '86%', left: '67%' }, 
                'p-8': { top: '86%', left: '35%' }  
            },
            components: { R1: 10, R2: 15, R3: 30 },
            get current() { return 110 / (10 + 15 + 30); }, 

            seriesPairs: [
                 ['p-1', 'p-3'], 
                 ['p-4', 'p-5'], 
                 ['p-6', 'p-7'], 
                 ['p-8', 'p-2']  
            ]
        },
        {
            // SCHEMA 2: DC Parallel
            id: 1,
            type: 'DC',
            img: 'assets/Schem2.jpg',
            nodes: {
                'p-1': { v: 10, name: 'A' }, 'p-2': { v: 0, name: 'D' },
                'p-3': { v: 10, name: 'A' }, 'p-4': { v: 0, name: 'D' },
                'p-5': { v: 10, name: 'A' }, 'p-6': { v: 0, name: 'D' },
                'p-7': { v: 10, name: 'A' }, 'p-8': { v: 0, name: 'D' }
            },
            positions: {
                'p-1': { top: '26%', left: '19.7%' }, 'p-2': { top: '75%', left: '19.7%' },
                'p-3': { top: '26%', left: '45.5%' }, 'p-4': { top: '75%', left: '45.5%' },
                'p-5': { top: '26%', left: '62.5%' }, 'p-6': { top: '75%', left: '62.5%' },
                'p-7': { top: '26%', left: '78.5%' }, 'p-8': { top: '75%', left: '78.5%' }
            },
            components: { R1: 5, R2: 6, R3: 10 },
            get totalResistance() { return 1 / (1/5 + 1/6 + 1/10); }, 
            get currents() {
                return {
                    total: 10 / this.totalResistance, 
                    R1: 10 / 5,  
                    R2: 10 / 6,  
                    R3: 10 / 10  
                };
            },

            branchPairs: {
                'p-1-p-3': 'total', 
                'p-3-p-4': 'R1',   
                'p-5-p-6': 'R2',   
                'p-7-p-8': 'R3'   
            }
        },
        {
            // SCHEMA 3: AC Series
            id: 2,
            type: 'AC',
            img: 'assets/Schem3.png',
            nodes: {
                'p-1': { v: 10, name: 'A' },
                'p-3': { v: 10, name: 'A' },
                'p-4': { v: 9,  name: 'B' },
                'p-5': { v: 9,  name: 'B' },
                'p-6': { v: 4,  name: 'C' },
                'p-7': { v: 4,  name: 'C' },
                'p-8': { v: 0,  name: 'D' },
                'p-2': { v: 0,  name: 'D' }
            },
            positions: {
                'p-1': { top: '21%', left: '24%' }, 'p-2': { top: '80%', left: '24%' },
                'p-3': { top: '21%', left: '40%' }, 'p-4': { top: '21%', left: '60%' },
                'p-5': { top: '21%', left: '75.5%' }, 'p-6': { top: '80%', left: '75.5%' },
                'p-7': { top: '80%', left: '60%' }, 'p-8': { top: '80%', left: '40%' }
            },
            components: { R1: 100, R2: 500, R3: 400 },
            get current() { return 10 / (100 + 500 + 400); }, 
            seriesPairs: [
                ['p-1', 'p-3'], ['p-4', 'p-5'], ['p-6', 'p-7'], ['p-8', 'p-2']
            ]
        }
    ];

    // --- Funkcija Schemos Keitimui ---
    function loadCircuit(index) {
        activeCircuitIndex = index;
        const circuit = circuitsData[index];
        circuitImg.src = circuit.img;

        probePoints.forEach(point => {
            const pos = circuit.positions[point.id];
            if (pos) {
                point.style.display = 'block';
                point.style.top = pos.top;
                point.style.left = pos.left;
            } else {
                point.style.display = 'none';
            }
            point.classList.remove('red-probe', 'black-probe');
        });

        redProbePoint = null;
        blackProbePoint = null;
        heldMeasurement = { value: '', unit: '' };
        isHoldActive = false;
        holdBtn.classList.remove('active');
        holdIndicator.classList.remove('active');
        
        schemaBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.circuit) === index);
        });

        updateMultimeterDisplay();
    }

    // --- PAGRINDINĖ MATAVIMO LOGIKA ---
    function calculateMeasurement() {
        const mode = modes[currentModeIndex];
        const circuit = circuitsData[activeCircuitIndex];
        
        if (!redProbePoint || !blackProbePoint || mode.name === 'OFF') {
            return { value: (mode.name === 'OFF' ? '' : '0.000'), unit: mode.display };
        }

        const nodeRed = circuit.nodes[redProbePoint];
        const nodeBlack = circuit.nodes[blackProbePoint];

        if (!nodeRed || !nodeBlack) return { value: '---', unit: mode.display };

        // 1. ĮTAMPA
        if (mode.name.includes('V') || mode.name.includes('mV')) {
            if (mode.type === 'AC' && circuit.type === 'DC') return { value: '0.000', unit: mode.display };
            if (mode.type === 'DC' && circuit.type === 'AC') return { value: '0.000', unit: mode.display };

            let voltage = nodeRed.v - nodeBlack.v;
            if (mode.name.includes('AC')) voltage = Math.abs(voltage);

            const isMilli = mode.name.includes('mV');
            return {
                value: isMilli ? (voltage * 1000).toFixed(1) : voltage.toFixed(2),
                unit: mode.display
            };
        }

        // 2. VARŽA (Ω)
        if (mode.name === 'Ω') {
            let resistance = 0;

            const pairKey = [redProbePoint, blackProbePoint].sort().join('-');

            // Schema 1 ir 3 (Serijinė)
            if (circuit.id === 0 || circuit.id === 2) {
                const n1 = nodeRed.name;
                const n2 = nodeBlack.name;
                const isR1 = (n1 === 'A' && n2 === 'B') || (n1 === 'B' && n2 === 'A');
                const isR2 = (n1 === 'B' && n2 === 'C') || (n1 === 'C' && n2 === 'B');
                const isR3 = (n1 === 'C' && n2 === 'D') || (n1 === 'D' && n2 === 'C');
                const isTotal = (n1 === 'A' && n2 === 'D') || (n1 === 'D' && n2 === 'A');

                if (isR1) resistance = circuit.components.R1;
                else if (isR2) resistance = circuit.components.R2;
                else if (isR3) resistance = circuit.components.R3;
                else if (isTotal) resistance = circuit.components.R1 + circuit.components.R2 + circuit.components.R3;
                else return { value: '0.0', unit: 'Ω' };
            }
            // Schema 2 (Lygiagreti) - Išmanus matavimas
            else if (circuit.id === 1) {
                if (pairKey === 'p-3-p-4') resistance = circuit.components.R1;     
                else if (pairKey === 'p-5-p-6') resistance = circuit.components.R2; 
                else if (pairKey === 'p-7-p-8') resistance = circuit.components.R3; 
                else {
   
                    if ((nodeRed.name === 'A' && nodeBlack.name === 'D') || (nodeRed.name === 'D' && nodeBlack.name === 'A')) {
                        resistance = circuit.totalResistance;
                    } else {
                        return { value: '0.0', unit: 'Ω' };
                    }
                }
            }
            return { value: resistance.toFixed(1), unit: 'Ω' };
        }

        // 3. SROVĖ (A / mA)
        if (mode.name.includes('A')) {
            if (mode.type !== circuit.type) return { value: '0.000', unit: mode.display };

            let currentA = 0;

            // --- Logika Serijinėms Schemoms (1 ir 3) ---
            if (circuit.id === 0 || circuit.id === 2) {
                let matchedCurrent = 0;
                let isReverse = false;
            
                const forwardMatch = circuit.seriesPairs.find(p => p[0] === redProbePoint && p[1] === blackProbePoint);

                const reverseMatch = circuit.seriesPairs.find(p => p[1] === redProbePoint && p[0] === blackProbePoint);

                if (forwardMatch) {
                    matchedCurrent = circuit.current;
                } else if (reverseMatch) {
                    matchedCurrent = circuit.current;
                    isReverse = true;
                }

                if (matchedCurrent > 0) {
                    if (mode.type === 'DC' && isReverse) currentA = -matchedCurrent;
                    else currentA = matchedCurrent;
                }
            }
            // --- Logika Lygiagrečiai Schemai (2) ---
            else if (circuit.id === 1) {
                const p1 = redProbePoint;
                const p2 = blackProbePoint;
                const pairKey = [p1, p2].sort().join('-'); 

                const branchName = circuit.branchPairs[pairKey] || circuit.branchPairs[`${p1}-${p2}`] || circuit.branchPairs[`${p2}-${p1}`]; // Backup check

                if (branchName) {
                    let val = circuit.currents[branchName];

                    const redIndex = parseInt(redProbePoint.split('-')[1]);
                    const blackIndex = parseInt(blackProbePoint.split('-')[1]);
                    
                    if (redIndex < blackIndex) currentA = val;
                    else currentA = -val;
                    
                } else {
                    currentA = 0;
                }
            }

            if (mode.name.includes('mA')) {
                return { value: (currentA * 1000).toFixed(1), unit: mode.display };
            } else {
                return { value: currentA.toFixed(3), unit: mode.display };
            }
        }

        return { value: '---', unit: mode.display };
    }

    // --- UI ---
    function updateMultimeterDisplay() {
        const currentMode = modes[currentModeIndex];
        const totalAngle = currentMode.angle + (rotationCount * 360);
        document.documentElement.style.setProperty('--dial-rotation', `${totalAngle}deg`);

        const modeName = currentMode.name;
        const isCurrentMode = modeName.includes('A DC') || modeName.includes('A AC') || modeName.includes('mA');
        
        if (isCurrentMode) {
            if (circuitsData[activeCircuitIndex].id === 1) {
                measurementInfo.innerHTML = "<b>Srovė:</b> Lygiagrečioje schemoje matuokite srovę tarp komponento kojelių, kad pamatytumėte srovės pasiskirstymą.";
            } else {
                measurementInfo.innerHTML = "<b>Srovė:</b> Matuokite nuosekliai, 'nutraukdami' grandinę (pvz. tarp Bat+ ir R1 pradžios).";
            }
            measurementInfo.style.display = 'block';
        } else {
            measurementInfo.style.display = 'none';
        }

        if (isHoldActive) {
            mainDisplay.textContent = heldMeasurement.value;
            modeDisplay.textContent = heldMeasurement.unit;
        } else {
            const measurement = calculateMeasurement();
            mainDisplay.textContent = measurement.value;
            modeDisplay.textContent = measurement.unit;
        }

        if (currentMode.name === 'OFF') {
            mainDisplay.textContent = '';
            modeDisplay.textContent = '';
            measurementInfo.style.display = 'none';
        }
    }

    // --- Valdymas (Events) ---
    function turnClockwise() {
        currentModeIndex++;
        if (currentModeIndex >= modes.length) {
            currentModeIndex = 0;
            rotationCount++;
        }
        updateMultimeterDisplay();
    }

    function turnCounterClockwise() {
        currentModeIndex--;
        if (currentModeIndex < 0) {
            currentModeIndex = modes.length - 1;
            rotationCount--;
        }
        updateMultimeterDisplay();
    }
    
    function handleProbeClick(event) {
        const clickedPoint = event.target;
        if (isHoldActive) return;

        if (clickedPoint.id === redProbePoint) {
            clickedPoint.classList.remove('red-probe');
            redProbePoint = null;
        } else if (clickedPoint.id === blackProbePoint) {
            clickedPoint.classList.remove('black-probe');
            blackProbePoint = null;
        } else {
            if (!redProbePoint) {
                redProbePoint = clickedPoint.id;
                clickedPoint.classList.add('red-probe');
            } else if (!blackProbePoint) {
                blackProbePoint = clickedPoint.id;
                clickedPoint.classList.add('black-probe');
            } else {
                probePoints.forEach(p => p.classList.remove('red-probe', 'black-probe'));
                blackProbePoint = null;
                redProbePoint = clickedPoint.id;
                clickedPoint.classList.add('red-probe');
            }
        }
        updateMultimeterDisplay();
    }
    
    dial.addEventListener('click', turnClockwise);
    dialArea.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.deltaY < 0 ? turnCounterClockwise() : turnClockwise();
    });
    backlightBtn.addEventListener('click', () => lcdScreen.classList.toggle('backlight'));
    holdBtn.addEventListener('click', () => {
        isHoldActive = !isHoldActive;
        holdBtn.classList.toggle('active', isHoldActive);
        holdIndicator.classList.toggle('active', isHoldActive);
        if (isHoldActive) heldMeasurement = calculateMeasurement();
        updateMultimeterDisplay();
    });

    document.querySelectorAll('.dummy-btn').forEach(btn => {
        btn.addEventListener('mousedown', () => btn.style.transform = 'translateY(3px)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'translateY(0px)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0px)');
    });

    probePoints.forEach(point => point.addEventListener('click', handleProbeClick));

    schemaBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.circuit);
            loadCircuit(index);
        });
    });

    // Start
    loadCircuit(0);

});
