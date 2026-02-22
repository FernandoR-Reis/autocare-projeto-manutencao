/**
 * UI COMPONENTS - Renderização do Assistente
 */

const AssistantUI = {
    activeVehicleId: null,

    renderStatusCard(containerId, analysis) {
        const container = document.getElementById(containerId);
        if (!container || !analysis) return;

        const { overallStatus, recommendations, vehicle } = analysis;
        const criticalCount = recommendations.filter((item) => item.status.level === 'danger').length;
        const warningCount = recommendations.filter((item) => item.status.level === 'warning').length;

        container.innerHTML = `
            <div class="status-card status-card--${overallStatus.level}" style="
                background: linear-gradient(135deg, ${overallStatus.color}15 0%, ${overallStatus.color}05 100%);
                border-left: 4px solid ${overallStatus.color};
                border-radius: 1rem;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                animation: slideIn 0.5s ease;
            ">
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="
                        width: 56px;
                        height: 56px;
                        background: ${overallStatus.color};
                        border-radius: 1rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.75rem;
                        flex-shrink: 0;
                        box-shadow: 0 4px 12px ${overallStatus.color}40;
                    ">
                        ${overallStatus.icon}
                    </div>
                    <div style="flex: 1;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: ${overallStatus.color}; margin-bottom: 0.25rem;">
                            ${overallStatus.title}
                        </h3>
                        <p style="color: #475569; margin-bottom: 0.75rem; line-height: 1.5;">
                            ${overallStatus.subtitle}
                        </p>

                        ${criticalCount > 0 ? `
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                                ${recommendations
                                    .filter((item) => item.status.level === 'danger')
                                    .map((item) => `
                                        <span style="
                                            background: #fef2f2;
                                            color: #dc2626;
                                            padding: 0.25rem 0.75rem;
                                            border-radius: 9999px;
                                            font-size: 0.75rem;
                                            font-weight: 600;
                                        ">
                                            🚨 ${item.name}
                                        </span>
                                    `).join('')}
                            </div>
                        ` : ''}

                        ${warningCount > 0 ? `
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${recommendations
                                    .filter((item) => item.status.level === 'warning')
                                    .slice(0, 2)
                                    .map((item) => `
                                        <span style="
                                            background: #fffbeb;
                                            color: #d97706;
                                            padding: 0.25rem 0.75rem;
                                            border-radius: 9999px;
                                            font-size: 0.75rem;
                                            font-weight: 600;
                                        ">
                                            ⚠️ ${item.name}
                                        </span>
                                    `).join('')}
                                ${warningCount > 2 ? `<span style="color: #d97706; font-size: 0.75rem;">+${warningCount - 2} mais</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${recommendations.length > 0 ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed ${overallStatus.color}30;">
                        <button onclick="AssistantUI.openRecommendationModal('${vehicle.id}')" class="btn-assistant" style="
                            width: 100%;
                            padding: 0.875rem;
                            background: ${overallStatus.color};
                            color: white;
                            border: none;
                            border-radius: 0.75rem;
                            font-weight: 600;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.2s ease;
                        ">
                            <span>🔧</span>
                            ${criticalCount > 0 ? 'Ver manutenções urgentes' : warningCount > 0 ? 'Ver recomendações' : 'Ver detalhes completos'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderRecommendationsList(containerId, recommendations) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!recommendations.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                    <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Tudo em dia!</h3>
                    <p>Seu veículo está com todas as manutenções dentro dos prazos recomendados.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recommendations.map((rec, index) => `
            <div class="recommendation-item" style="
                background: white;
                border: 2px solid ${rec.status.level === 'danger' ? '#fecaca' : rec.status.level === 'warning' ? '#fde68a' : '#e2e8f0'};
                border-radius: 1rem;
                padding: 1.25rem;
                margin-bottom: 1rem;
                animation: slideIn 0.4s ease ${index * 0.1}s both;
                position: relative;
                overflow: hidden;
            ">
                ${rec.status.level === 'danger' ? '<div style="position: absolute; top: 0; right: 0; background: #dc2626; color: white; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; border-radius: 0 0 0 0.5rem;">URGENTE</div>' : ''}

                <div style="display: flex; gap: 1rem;">
                    <div style="
                        width: 48px;
                        height: 48px;
                        background: ${rec.colors[rec.status.level]}15;
                        border-radius: 0.75rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        flex-shrink: 0;
                    ">
                        ${rec.icon}
                    </div>

                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <h4 style="font-weight: 700; color: #0f172a;">${rec.name}</h4>
                            <span style="
                                font-size: 0.75rem;
                                padding: 0.125rem 0.5rem;
                                border-radius: 9999px;
                                background: ${rec.colors[rec.status.level]}20;
                                color: ${rec.colors[rec.status.level]};
                                font-weight: 600;
                            ">
                                ${rec.status.level === 'danger' ? 'Atrasado' : rec.status.level === 'warning' ? 'Em breve' : 'Em dia'}
                            </span>
                        </div>

                        <p style="font-size: 0.875rem; color: #475569; margin-bottom: 0.75rem; line-height: 1.5;">
                            ${rec.description}
                        </p>

                        <div style="
                            background: #f8fafc;
                            border-radius: 0.5rem;
                            padding: 0.75rem;
                            margin-bottom: 0.75rem;
                            font-size: 0.875rem;
                        ">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; color: #059669;">
                                <span>✓</span>
                                <span style="font-weight: 500;">${rec.benefit}</span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.875rem; color: #64748b;">
                            <span>📅</span>
                            <span>${rec.status.message}</span>
                        </div>

                        ${rec.status.level !== 'good' ? `
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="AssistantUI.quickAddMaintenance('${rec.id}')" style="
                                    flex: 1;
                                    padding: 0.75rem;
                                    background: ${rec.colors[rec.status.level]};
                                    color: white;
                                    border: none;
                                    border-radius: 0.5rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    gap: 0.5rem;
                                ">
                                    <span>${rec.action.icon}</span>
                                    ${rec.action.text}
                                </button>
                                <button onclick="AssistantUI.showMaintenanceDetails('${rec.id}')" style="
                                    padding: 0.75rem;
                                    background: white;
                                    color: #64748b;
                                    border: 2px solid #e2e8f0;
                                    border-radius: 0.5rem;
                                    font-weight: 600;
                                    cursor: pointer;
                                ">
                                    ℹ️
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderNextMaintenanceWidget(containerId, analysis) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const next = analysis.recommendations[0];
        if (!next || next.status.level === 'good') {
            container.innerHTML = `
                <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 1rem; padding: 1rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                    <div style="font-weight: 600; color: #166534;">Tudo em dia!</div>
                    <div style="font-size: 0.875rem; color: #22c55e;">Nenhuma manutenção urgente</div>
                </div>
            `;
            return;
        }

        const urgencyColor = next.status.level === 'danger' ? '#dc2626' : '#d97706';
        const bgColor = next.status.level === 'danger' ? '#fef2f2' : '#fffbeb';

        container.innerHTML = `
            <div style="
                background: ${bgColor};
                border: 2px solid ${urgencyColor}40;
                border-radius: 1rem;
                padding: 1.25rem;
                animation: pulse 2s infinite;
            ">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">${next.icon}</span>
                    <div>
                        <div style="font-size: 0.75rem; color: ${urgencyColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                            ${next.status.level === 'danger' ? 'Atenção Urgente' : 'Próxima Manutenção'}
                        </div>
                        <div style="font-weight: 700; color: #0f172a;">${next.name}</div>
                    </div>
                </div>

                <p style="font-size: 0.875rem; color: #475569; margin-bottom: 1rem; line-height: 1.5;">
                    ${next.status.message}
                </p>

                <button onclick="AssistantUI.quickAddMaintenance('${next.id}')" style="
                    width: 100%;
                    padding: 0.75rem;
                    background: ${urgencyColor};
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Agendar Agora
                </button>
            </div>
        `;
    },

    openRecommendationModal(vehicleId) {
        const vehicles = Array.isArray(window.AppState?.vehicles) ? window.AppState.vehicles : [];
        const vehicle = vehicles.find((item) => String(item.id) === String(vehicleId));
        if (!vehicle || !window.MaintenanceEngine) return;

        this.activeVehicleId = vehicle.id;

        const analysis = window.MaintenanceEngine.analyzeVehicle(vehicle);

        let modal = document.getElementById('recommendations-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'recommendations-modal';
            modal.className = 'modal-ux';
            modal.innerHTML = `
                <div class="modal-ux__content" style="max-width: 700px;">
                    <div style="padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 id="assistant-modal-title" style="font-size: 1.25rem; font-weight: 700;"></h2>
                            <p id="assistant-modal-subtitle" style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;"></p>
                        </div>
                        <button onclick="AssistantUI.closeRecommendationsModal()" class="modal-close">×</button>
                    </div>
                    <div id="recommendations-list" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const title = `${vehicle.brand} ${vehicle.model}`;
        const subtitle = `KM atual: ${Number(vehicle.km || 0).toLocaleString('pt-BR')} km`;

        const modalTitle = document.getElementById('assistant-modal-title');
        const modalSubtitle = document.getElementById('assistant-modal-subtitle');
        if (modalTitle) modalTitle.textContent = `Recomendações para ${title}`;
        if (modalSubtitle) modalSubtitle.textContent = subtitle;

        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        this.renderRecommendationsList('recommendations-list', analysis.recommendations);
    },

    closeRecommendationsModal() {
        const modal = document.getElementById('recommendations-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    quickAddMaintenance(maintenanceGuideId) {
        const guide = window.MAINTENANCE_GUIDE?.[maintenanceGuideId];
        if (!guide) return;

        this.closeRecommendationsModal();

        if (window.Navigation?.showSection) {
            window.Navigation.showSection('maintenance');
        }

        if (window.Maintenance?.openModal) {
            window.Maintenance.openModal(this.activeVehicleId || undefined);
            if (window.UI?.showToast) {
                window.UI.showToast(`Sugestão selecionada: ${guide.name}`, 'info');
            }
            return;
        }

        if (window.UI?.showToast) {
            window.UI.showToast(`Recomendado: ${guide.name}. ${guide.description}`, 'info');
        }
    },

    showMaintenanceDetails(maintenanceType) {
        const guide = window.MAINTENANCE_GUIDE?.[maintenanceType];
        if (!guide) return;

        const modal = document.createElement('div');
        modal.className = 'modal-ux active';
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        modal.innerHTML = `
            <div class="modal-ux__content" style="max-width: 500px;">
                <div style="padding: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="font-size: 3rem;">${guide.icon}</div>
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 700;">${guide.name}</h2>
                            <span style="display: inline-block; background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
                                ${guide.category === 'critica' ? '🔴 Manutenção Crítica' : guide.category === 'seguranca' ? '🛡️ Segurança' : '✅ Preventiva'}
                            </span>
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 600; color: #0f172a; margin-bottom: 0.5rem;">O que é?</h3>
                        <p style="color: #475569; line-height: 1.6;">${guide.description}</p>
                    </div>

                    <div style="background: #f0fdf4; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 600; color: #166534; margin-bottom: 0.5rem;">💡 Por que fazer?</h3>
                        <p style="color: #166534; line-height: 1.6;">${guide.benefit}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 600; color: #0f172a; margin-bottom: 0.5rem;">📅 Quando fazer?</h3>
                        <ul style="color: #475569; line-height: 1.8; padding-left: 1.25rem;">
                            ${Object.entries(guide.intervals).map(([key, value]) => {
                                const labels = {
                                    km: `A cada ${value.toLocaleString('pt-BR')} km`,
                                    months: `Ou a cada ${value} meses`,
                                    severe_km: `Uso severo: a cada ${value.toLocaleString('pt-BR')} km`,
                                    inspection_km: `Inspeção: a cada ${value.toLocaleString('pt-BR')} km`,
                                };
                                return `<li>${labels[key] || `${key}: ${value}`}</li>`;
                            }).join('')}
                        </ul>
                    </div>

                    <div style="background: #fef2f2; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 600; color: #991b1b; margin-bottom: 0.5rem;">⚠️ Sinais de alerta</h3>
                        <ul style="color: #7f1d1d; line-height: 1.8; padding-left: 1.25rem;">
                            ${guide.warningSigns.map((sign) => `<li>${sign}</li>`).join('')}
                        </ul>
                    </div>

                    <button onclick="this.closest('.modal-ux').remove(); document.body.style.overflow=''" style="
                        width: 100%;
                        padding: 0.875rem;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 0.75rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Entendi, fechar
                    </button>
                </div>
            </div>
        `;

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });

        document.body.appendChild(modal);
    },
};

window.AssistantUI = AssistantUI;
