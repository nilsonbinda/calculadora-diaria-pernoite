const UNIT_VALUE = 78.14;

window.addEventListener('DOMContentLoaded', () => {
    setInitialDates();
});

function setInitialDates() {
    const depEl = document.getElementById('departureDateTime');
    const arrEl = document.getElementById('arrivalDateTime');
    if (!depEl || !arrEl) return;

    const formatForInput = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:00`;
    };

    const dep = new Date();
    dep.setHours(12, 0, 0, 0);
    
    const arr = new Date(dep);
    arr.setDate(arr.getDate() + 1);
    arr.setHours(14, 0, 0, 0);

    depEl.value = formatForInput(dep);
    arrEl.value = formatForInput(arr);

    onDateInputChange();
}

function onDateInputChange() {
    const depEl = document.getElementById('departureDateTime');
    const arrEl = document.getElementById('arrivalDateTime');
    if (!depEl || !arrEl) return;

    const depVal = depEl.value;
    const arrVal = arrEl.value;
    if (!depVal || !arrVal) return;

    const depDate = new Date(depVal);
    const arrDate = new Date(arrVal);

    const durationCard = document.getElementById('durationCard');

    if (arrDate <= depDate) {
        if (durationCard) durationCard.classList.add('hidden');
        document.getElementById('dynamicOvernightsContainer').innerHTML = '<p class="text-sm text-red-500">Data de chegada inválida.</p>';
        return;
    }

    const diffMs = arrDate - depDate;
    const totalHours = diffMs / (1000 * 60 * 60);

    const hoursInt = Math.floor(totalHours);
    const minsInt = Math.round((totalHours - hoursInt) * 60);

    const tripDurationText = document.getElementById('tripDurationText');
    if (tripDurationText) {
        tripDurationText.innerText = `${hoursInt}h ${minsInt}min`;
    }
    if (durationCard) durationCard.classList.remove('hidden');

    renderOvernightFields(depDate, arrDate);
}

function renderOvernightFields(depDate, arrDate) {
    const container = document.getElementById('dynamicOvernightsContainer');
    container.innerHTML = '';
    
    // CORREÇÃO: O loop agora começa no próprio dia da saída, sem pular 1 dia
    let current = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate());
    let end = new Date(arrDate.getFullYear(), arrDate.getMonth(), arrDate.getDate());
    
    while (current <= end) {
        const dateStr = current.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'});
        const shortDate = current.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
        
        const div = document.createElement('div');
        div.className = "flex flex-col sm:flex-row sm:items-center justify-between bg-white border-2 border-slate-200 rounded-xl p-3 gap-3";
        
        div.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fa-solid fa-calendar-day text-indigo-500"></i>
                <span class="font-bold text-slate-800">${shortDate}</span>
            </div>
            <div class="flex items-center space-x-3 w-full sm:w-auto">
                <select class="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2 cursor-pointer transition-colors" onchange="toggleTimeInput(this)">
                    <option value="nao_teve" selected>Não teve</option>
                    <option value="teve">Registrar Pernoite</option>
                </select>
                <input type="time" class="overnight-time hidden bg-white border border-slate-300 text-slate-900 text-sm font-bold rounded-lg focus:ring-brand-500 focus:border-brand-500 p-2 w-28" data-date="${dateStr}">
            </div>
        `;
        container.appendChild(div);
        
        current.setDate(current.getDate() + 1);
    }
}

function toggleTimeInput(selectElement) {
    const timeInput = selectElement.nextElementSibling;
    if (selectElement.value === 'teve') {
        timeInput.classList.remove('hidden');
        timeInput.required = true;
    } else {
        timeInput.classList.add('hidden');
        timeInput.required = false;
        timeInput.value = '';
    }
}

function calculate() {
    const depVal = document.getElementById('departureDateTime').value;
    const arrVal = document.getElementById('arrivalDateTime').value;

    if (!depVal || !arrVal) return;

    const depDate = new Date(depVal);
    const arrDate = new Date(arrVal);

    if (arrDate <= depDate) {
        alert("A data de chegada deve ser posterior à data de saída!");
        return;
    }

    const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatTime = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const totalHours = (arrDate - depDate) / (1000 * 60 * 60);
    const hInt = Math.floor(totalHours);
    const mInt = Math.round((totalHours - hInt) * 60);

    // Preenche as informações do cabeçalho do Recibo
    document.getElementById('receiptDep').innerText = `${formatDate(depDate)} às ${formatTime(depDate)}`;
    document.getElementById('receiptArr').innerText = `${formatDate(arrDate)} às ${formatTime(arrDate)}`;
    document.getElementById('receiptDur').innerText = `${hInt}h ${mInt}min`;

    // 1. CÁLCULO DE ALIMENTAÇÃO (JANTA)
    const mealBreakdown = [];
    let mealCount = 0;

    let currentMealDate = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate());
    const endMealDate = new Date(arrDate.getFullYear(), arrDate.getMonth(), arrDate.getDate());

    while (currentMealDate <= endMealDate) {
        const dateStr = formatDate(currentMealDate);
        const isStart = currentMealDate.getTime() === (new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate())).getTime();
        const isEnd = currentMealDate.getTime() === (new Date(arrDate.getFullYear(), arrDate.getMonth(), arrDate.getDate())).getTime();

        if (isStart && isEnd) {
            const depHour = depDate.getHours();
            const arrHour = arrDate.getHours();
            if (depHour <= 19 && arrHour >= 22) {
                mealCount++;
                mealBreakdown.push({ date: dateStr, reason: `Saída às ${formatTime(depDate)} (<= 19h) e Chegada às ${formatTime(arrDate)} (>= 22h)`, earned: true });
            } else {
                mealBreakdown.push({ date: dateStr, reason: `Não atendeu janela (Saída ${formatTime(depDate)} / Chegada ${formatTime(arrDate)})`, earned: false });
            }
        } else if (isStart) {
            if (depDate.getHours() <= 19) {
                mealCount++;
                mealBreakdown.push({ date: dateStr, reason: `Saída às ${formatTime(depDate)} (<= 19h)`, earned: true });
            } else {
                mealBreakdown.push({ date: dateStr, reason: `Saída às ${formatTime(depDate)} (Após 19h)`, earned: false });
            }
        } else if (isEnd) {
            if (arrDate.getHours() >= 22) {
                mealCount++;
                mealBreakdown.push({ date: dateStr, reason: `Chegada às ${formatTime(arrDate)} (>= 22h)`, earned: true });
            } else {
                mealBreakdown.push({ date: dateStr, reason: `Chegada às ${formatTime(arrDate)} (Antes das 22h)`, earned: false });
            }
        } else {
            mealCount++;
            mealBreakdown.push({ date: dateStr, reason: `Dia completo em viagem`, earned: true });
        }
        currentMealDate.setDate(currentMealDate.getDate() + 1);
    }

    // 2. CÁLCULO DE PERNOITES (Lido diretamente do DOM)
    let overnightCount = 0;
    const overnightBreakdown = [];
    const timeInputs = document.querySelectorAll('.overnight-time');
    
    timeInputs.forEach(input => {
        if (!input.classList.contains('hidden')) {
            overnightCount++;
            const timeValue = input.value ? `às ${input.value}` : '(Horário não informado)';
            overnightBreakdown.push({ date: input.dataset.date, time: timeValue });
        }
    });

    const mealSubtotal = mealCount * UNIT_VALUE;
    const overnightSubtotal = overnightCount * UNIT_VALUE;
    const grandTotal = mealSubtotal + overnightSubtotal;

    // 3. RENDERIZAÇÃO DE RESULTADOS
    document.getElementById('mealTotalText').innerText = `${mealCount}x = ${formatCurrency(mealSubtotal)}`;
    const mealListEl = document.getElementById('mealBreakdownList');
    mealListEl.innerHTML = '';
    mealBreakdown.forEach(item => {
        const div = document.createElement('div');
        div.className = "flex items-start space-x-2";
        div.innerHTML = item.earned 
            ? `<i class="fa-solid fa-circle-check text-emerald-500 mt-1 text-base"></i> <span><strong>${item.date}:</strong> ${item.reason}</span>`
            : `<i class="fa-solid fa-circle-xmark text-slate-300 mt-1 text-base"></i> <span class="text-slate-500"><strong>${item.date}:</strong> ${item.reason}</span>`;
        mealListEl.appendChild(div);
    });

    document.getElementById('overnightTotalText').innerText = `${overnightCount}x = ${formatCurrency(overnightSubtotal)}`;
    
    const overnightTextEl = document.getElementById('overnightBreakdownText');
    if (overnightCount > 0) {
        let details = overnightBreakdown.map(item => `<strong>${item.date}</strong> ${item.time}`).join(' | ');
        overnightTextEl.innerHTML = `${overnightCount} pernoite(s) registada(s): <br><span class="text-indigo-600 mt-1 block">${details}</span>`;
    } else {
        overnightTextEl.innerText = "Nenhuma pernoite registada para esta viagem.";
    }

    document.getElementById('grandTotalText').innerText = formatCurrency(grandTotal);
    document.getElementById('resultsCard').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Nova função que captura o recibo e baixa em formato PNG
function downloadReceipt() {
    const receiptElement = document.getElementById('receiptContent');
    const btn = document.getElementById('downloadBtn');
    const originalText = btn.innerHTML;
    
    // Feedback visual de carregamento
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-2xl"></i><span>Gerando Imagem...</span>';
    btn.disabled = true;

    // Atraso curto para permitir que o botão atualize antes de congelar a interface
    setTimeout(() => {
        html2canvas(receiptElement, { 
            scale: 2, // Melhora a resolução para impressão/leitura no telemóvel
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `recibo_diarias_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Restaura o botão
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("Erro ao gerar imagem:", err);
            alert("Não foi possível gerar a imagem. Tente novamente.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }, 150);
}