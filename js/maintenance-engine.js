/**
 * MAINTENANCE ENGINE - Calculadora de Recomendações
 * Analisa histórico e quilometragem para sugerir ações
 */

const MaintenanceEngine = {
    analyzeVehicle(vehicle) {
        const recommendations = [];
        const history = this.getVehicleHistory(vehicle);
        const currentKm = Number(vehicle?.km || vehicle?.currentMileage || vehicle?.mileage || 0);

        Object.values(window.MAINTENANCE_GUIDE || {}).forEach((guide) => {
            const status = this.calculateStatus(guide, history, currentKm);

            if (status.priority !== 'low') {
                recommendations.push({
                    ...guide,
                    status,
                    action: this.suggestAction(status, guide),
                });
            }
        });

        const priorityOrder = { danger: 0, warning: 1, unknown: 2, good: 3 };
        recommendations.sort((a, b) => priorityOrder[a.status.level] - priorityOrder[b.status.level]);

        return {
            vehicle,
            overallStatus: this.calculateOverallStatus(recommendations),
            recommendations,
            nextAction: recommendations[0] || null,
        };
    },

    getVehicleHistory(vehicle) {
        if (!vehicle) return [];

        if (Array.isArray(vehicle.maintenanceHistory) && vehicle.maintenanceHistory.length) {
            return vehicle.maintenanceHistory;
        }

        const maintenances = Array.isArray(window.AppState?.maintenances) ? window.AppState.maintenances : [];
        return maintenances
            .filter((item) => String(item.vehicleId) === String(vehicle.id))
            .map((item) => ({
                type: this.mapMaintenanceType(item),
                mileage: Number(item.currentKm || item.km || item.mileage || vehicle.km || 0),
                date: item.date || item.createdAt || new Date().toISOString(),
                source: item,
            }));
    },

    mapMaintenanceType(item) {
        const type = String(item?.type || '').toLowerCase();
        const mapped = window.getMaintenanceGuideByType?.(type);
        return mapped?.id || type;
    },

    calculateStatus(guide, history, currentKm) {
        const lastMaintenance = history
            .filter((h) => h.type === guide.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (!lastMaintenance) {
            return {
                level: 'unknown',
                message: guide.dashboardMessages.unknown,
                urgency: 'medium',
                priority: 'medium',
                nextDueKm: null,
                nextDueDate: null,
            };
        }

        const lastKm = Number(lastMaintenance.mileage || 0);
        const lastDate = new Date(lastMaintenance.date);
        const today = new Date();

        const kmInterval = guide.intervals.km || guide.intervals.air_km || guide.intervals.inspection_km;
        const timeInterval = guide.intervals.months || guide.intervals.inspection_months;

        const kmDriven = currentKm - lastKm;
        const monthsPassed = (today - lastDate) / (1000 * 60 * 60 * 24 * 30);

        const kmPercent = kmInterval ? (kmDriven / kmInterval) : 0;
        const timePercent = timeInterval ? (monthsPassed / timeInterval) : 0;

        const wearPercent = Math.max(kmPercent, timePercent);

        let level;
        let message;
        let urgency;
        let priority;

        if (wearPercent >= 1.0) {
            level = 'danger';
            message = guide.dashboardMessages.danger;
            urgency = 'high';
            priority = 'high';
        } else if (wearPercent >= 0.8) {
            level = 'warning';
            message = guide.dashboardMessages.warning;
            urgency = 'medium';
            priority = 'medium';
        } else {
            level = 'good';
            const kmRemaining = kmInterval ? Math.round(kmInterval - kmDriven) : null;
            const monthsRemaining = timeInterval ? Math.ceil(timeInterval - monthsPassed) : null;

            message = this.formatMessage(guide.dashboardMessages.good, {
                distance: kmRemaining,
                time: monthsRemaining ? `${monthsRemaining} meses` : null,
            });
            urgency = 'low';
            priority = 'low';
        }

        return {
            level,
            message,
            urgency,
            priority,
            wearPercent: Math.round(wearPercent * 100),
            kmDriven: Math.round(kmDriven),
            monthsPassed: Math.round(monthsPassed),
            nextDueKm: kmInterval ? lastKm + kmInterval : null,
            nextDueDate: timeInterval ? this.addMonths(lastDate, timeInterval) : null,
            lastMaintenance,
        };
    },

    suggestAction(status) {
        const actions = {
            danger: {
                text: 'Agendar urgente',
                priority: 'critical',
                btnClass: 'btn-danger',
                icon: '🚨',
            },
            warning: {
                text: 'Agendar preventiva',
                priority: 'high',
                btnClass: 'btn-warning',
                icon: '⚠️',
            },
            unknown: {
                text: 'Registrar manutenção',
                priority: 'medium',
                btnClass: 'btn-info',
                icon: '❓',
            },
            good: {
                text: 'Ver detalhes',
                priority: 'low',
                btnClass: 'btn-secondary',
                icon: '✓',
            },
        };

        return actions[status.level];
    },

    calculateOverallStatus(recommendations) {
        const dangerCount = recommendations.filter((r) => r.status.level === 'danger').length;
        const warningCount = recommendations.filter((r) => r.status.level === 'warning').length;
        const unknownCount = recommendations.filter((r) => r.status.level === 'unknown').length;

        if (dangerCount > 0) {
            return {
                level: 'danger',
                icon: '🔴',
                title: 'Atenção necessária',
                subtitle: `${dangerCount} manutenção(ões) crítica(s) detectada(s)`,
                color: '#dc2626',
            };
        }

        if (warningCount > 0) {
            return {
                level: 'warning',
                icon: '🟡',
                title: 'Manutenções se aproximando',
                subtitle: `${warningCount} item(ns) precisa(m) de atenção em breve`,
                color: '#f59e0b',
            };
        }

        if (unknownCount > 0) {
            return {
                level: 'info',
                icon: '🔵',
                title: 'Histórico incompleto',
                subtitle: 'Complete o cadastro para recomendações personalizadas',
                color: '#3b82f6',
            };
        }

        return {
            level: 'good',
            icon: '🟢',
            title: 'Veículo em dia',
            subtitle: 'Todas as manutenções estão dentro dos prazos recomendados',
            color: '#10b981',
        };
    },

    formatMessage(template, values) {
        return String(template || '')
            .replace('{distance}', values.distance ? `${values.distance.toLocaleString('pt-BR')}` : 'alguns')
            .replace('{time}', values.time || 'breve');
    },

    addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    },

    getUpcomingMaintenances(vehicle, limit = 3) {
        const analysis = this.analyzeVehicle(vehicle);
        return analysis.recommendations
            .filter((recommendation) => recommendation.status.level !== 'good')
            .slice(0, limit);
    },
};

window.MaintenanceEngine = MaintenanceEngine;
