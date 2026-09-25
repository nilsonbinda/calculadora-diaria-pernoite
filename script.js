
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
        arr.setHours(12, 0, 0, 0);

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

        const suggestedBadge = document.getElementById('suggestedBadge');
        const durationCard = document.getElementById('durationCard');

        if (arrDate <= depDate) {
            if (suggestedBadge) suggestedBadge.classList.add('hidden');
            if (durationCard) durationCard.classList.add('hidden');
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

        let suggestedOvernights = 0;
        if (totalHours >= 25) {
            // Conta apenas os ciclos completos de 25h
            suggestedOvernights = Math.floor(totalHours / 25);
        } else if (totalHours > 14) {
            // Se a viagem total for menor que 25h mas maior que 14h, dá 1 pernoite
            suggestedOvernights = 1;
        }

        const suggestedCount = document.getElementById('suggestedCount');
        if (suggestedCount) suggestedCount.innerText = suggestedOvernights;
        if (suggestedBadge) suggestedBadge.classList.remove('hidden');

        const overnightInput = document.getElementById('overnightInput');
        if (overnightInput) overnightInput.value = suggestedOvernights;
    }

    function adjustOvernights(delta) {
        const input = document.getElementById('overnightInput');
        if (!input) return;
        let val = parseInt(input.value, 10) || 0;
        input.value = Math.max(0, val + delta);
    }

    function calculate() {
        const depVal = document.getElementById('departureDateTime').value;
        const arrVal = document.getElementById('arrivalDateTime').value;
        const overnightCount = parseInt(document.getElementById('overnightInput').value, 10) || 0;

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

        const mealBreakdown = [];
        let mealCount = 0;

        let current = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate());
        const endDay = new Date(arrDate.getFullYear(), arrDate.getMonth(), arrDate.getDate());

        while (current <= endDay) {
            const dateStr = formatDate(current);
            const isStart = current.getTime() === (new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate())).getTime();
            const isEnd = current.getTime() === (new Date(arrDate.getFullYear(), arrDate.getMonth(), arrDate.getDate())).getTime();

            if (isStart && isEnd) {
                const depHour = depDate.getHours();
                const arrHour = arrDate.getHours();
                if (depHour <= 19 && arrHour >= 22) {
                    mealCount++;
                    mealBreakdown.push({ date: dateStr, reason: `Saída às ${formatTime(depDate)} (<= 19:00) e Chegada às ${formatTime(arrDate)} (>= 22:00)`, earned: true });
                } else {
                    mealBreakdown.push({ date: dateStr, reason: `Mesmo dia: Não atendeu janela de janta (Saída ${formatTime(depDate)} / Chegada ${formatTime(arrDate)})`, earned: false });
                }
            } else if (isStart) {
                if (depDate.getHours() <= 19) {
                    mealCount++;
                    mealBreakdown.push({ date: dateStr, reason: `Saída às ${formatTime(depDate)} (<= 19:00)`, earned: true });
                } else {
                    mealBreakdown.push({ date: dateStr, reason: `Saída às ${formatTime(depDate)} (Após as 19:00)`, earned: false });
                }
            } else if (isEnd) {
                if (arrDate.getHours() >= 22) {
                    mealCount++;
                    mealBreakdown.push({ date: dateStr, reason: `Chegada às ${formatTime(arrDate)} (>= 22:00)`, earned: true });
                } else {
                    mealBreakdown.push({ date: dateStr, reason: `Chegada às ${formatTime(arrDate)} (Antes das 22:00)`, earned: false });
                }
            } else {
                mealCount++;
                mealBreakdown.push({ date: dateStr, reason: `Dia intermediário completo em viagem`, earned: true });
            }

            current.setDate(current.getDate() + 1);
        }

        const mealSubtotal = mealCount * UNIT_VALUE;
        const overnightSubtotal = overnightCount * UNIT_VALUE;
        const grandTotal = mealSubtotal + overnightSubtotal;

        const totalHours = (arrDate - depDate) / (1000 * 60 * 60);
        const hInt = Math.floor(totalHours);
        const mInt = Math.round((totalHours - hInt) * 60);

        document.getElementById('mealTotalText').innerText = `${mealCount}x = ${formatCurrency(mealSubtotal)}`;
        const listEl = document.getElementById('mealBreakdownList');
        listEl.innerHTML = '';
        mealBreakdown.forEach(item => {
            const div = document.createElement('div');
            div.className = "flex items-start space-x-1.5";
            div.innerHTML = item.earned 
                ? `<i class="fa-solid fa-circle-check text-emerald-500 mt-0.5"></i> <span><strong>${item.date}:</strong> ${item.reason}</span>`
                : `<i class="fa-solid fa-circle-xmark text-slate-300 mt-0.5"></i> <span class="text-slate-400"><strong>${item.date}:</strong> ${item.reason}</span>`;
            listEl.appendChild(div);
        });

        document.getElementById('overnightTotalText').innerText = `${overnightCount}x = ${formatCurrency(overnightSubtotal)}`;
        document.getElementById('overnightBreakdownText').innerText = `${overnightCount} pernoite(s) confirmada(s) (${formatCurrency(UNIT_VALUE)} por descanso de 11h).`;
        document.getElementById('grandTotalText').innerText = formatCurrency(grandTotal);

        document.getElementById('resultsCard').classList.remove('hidden');

        window.lastCalculationSummary = {
            depFormatted: `${formatDate(depDate)} às ${formatTime(depDate)}`,
            arrFormatted: `${formatDate(arrDate)} às ${formatTime(arrDate)}`,
            durationText: `${hInt}h ${mInt}min`,
            mealCount,
            mealSub: mealSubtotal,
            breakdown: mealBreakdown,
            overnightCount,
            overnightSub: overnightSubtotal,
            total: grandTotal
        };
    }

    function copyWhatsAppReport() {
        const s = window.lastCalculationSummary;
        if (!s) return;

        const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        let text = `*RESUMO DE DIÁRIAS E REEMBOLSO*\n`;
        text += `-----------------------------------\n`;
        text += `🛫 *Saída:* ${s.depFormatted}\n`;
        text += `🛬 *Chegada:* ${s.arrFormatted}\n`;
        text += `⏱️ *Duração Total:* ${s.durationText}\n`;
        text += `-----------------------------------\n\n`;

        text += `🍽️ *Alimentação (Janta):* ${s.mealCount}x (${formatCurrency(s.mealSub)})\n`;
        s.breakdown.forEach(item => {
            if (item.earned) text += `   • ${item.date}: ${item.reason}\n`;
        });

        text += `\n🛌 *Pernoites (14h Jornada + 11h Descanso):* ${s.overnightCount}x (${formatCurrency(s.overnightSub)})\n`;
        text += `-----------------------------------\n`;
        text += `💰 *VALOR TOTAL:* ${formatCurrency(s.total)}\n`;
        text += `-----------------------------------\n`;
        text += `_Calculado via Calculadora de Pernoite/Alimentação_`;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => alert('Resumo copiado com sucesso!'));
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Resumo copiado com sucesso!');
        }
    }