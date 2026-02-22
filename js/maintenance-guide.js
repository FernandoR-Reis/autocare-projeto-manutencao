/**
 * KNOWLEDGE BASE - Manutenções Veiculares para Leigos
 * Regras baseadas em boas práticas automotivas brasileiras
 */

const MAINTENANCE_GUIDE = {
    oil_change: {
        id: 'oil_change',
        name: 'Troca de Óleo e Filtro',
        category: 'essencial',
        icon: '🛢️',
        description: 'O óleo é o "sangue" do motor. Ele lubrifica todas as peças em movimento, evitando atrito e superaquecimento. Com o tempo, fica sujo e perde a eficiência.',
        benefit: 'Motor mais silencioso, economia de combustível e evita quebras caras no futuro.',
        intervals: {
            km: 5000,
            months: 6,
            severe_km: 3000,
        },
        warningSigns: [
            'Luz de pressão de óleo acesa no painel',
            'Motor fazendo barulho de "tique-tique"',
            'Fumaça escapa do escapamento',
            'Consumo de combustível aumentou',
        ],
        colors: {
            good: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
        },
        dashboardMessages: {
            good: 'Óleo trocado recentemente. Próxima troca em {distance} km ou {time}.',
            warning: '⚠️ Troca de óleo se aproximando. Recomendado em {distance} km.',
            danger: '🔴 Troca de óleo ATRASADA! Procure uma oficina urgente.',
            unknown: '❓ Não sabemos quando trocou o óleo. Que tal registrar agora?',
        },
    },

    brake_pads: {
        id: 'brake_pads',
        name: 'Pastilhas de Freio',
        category: 'seguranca',
        icon: '🛑',
        description: 'As pastilhas são as "sapatas" que apertam os discos para parar o carro. São de material que desgasta propositalmente para proteger os discos mais caros.',
        benefit: 'Freios responsivos evitam acidentes. Pastilhas gastas aumentam a distância de frenagem em até 50%!',
        intervals: {
            km: 30000,
            months: 24,
            inspection: 10000,
        },
        warningSigns: [
            'Barulho de "rangido" ou "apito" ao frear',
            'Pedal de freio "mole" ou fundo',
            'Carro puxa para um lado ao frear',
            'Luz de freio acesa no painel',
        ],
        colors: {
            good: '#10b981',
            warning: '#f59e0b',
            danger: '#dc2626',
        },
        dashboardMessages: {
            good: 'Freios em ótimo estado. Próxima revisão em {distance} km.',
            warning: '🛡️ Verifique as pastilhas em breve. Segurança em primeiro lugar!',
            danger: '🚨 FREIOS PRECISAM DE ATENÇÃO! Não deixe para depois.',
            unknown: 'Freios sem histórico. Recomendamos uma inspeção preventiva.',
        },
    },

    timing_belt: {
        id: 'timing_belt',
        name: 'Correia Dentada',
        category: 'critica',
        icon: '⛓️',
        description: 'A correia sincroniza o movimento do virabrequim com as válvulas. Se quebrar, as válvulas batem nos pistões e o motor "emperra" (danos catastróficos).',
        benefit: 'Evita uma quebra que pode custar R$ 5.000 a R$ 15.000 em conserto de motor!',
        intervals: {
            km: 60000,
            months: 48,
            max_km: 80000,
        },
        warningSigns: [
            'Barulho de "raspagem" no motor',
            'Falha na partida (motor gira mas não pega)',
            'Perda de potência subindo ladeiras',
            'Vibração anormal no motor',
        ],
        colors: {
            good: '#10b981',
            warning: '#f97316',
            danger: '#7f1d1d',
        },
        dashboardMessages: {
            good: 'Correia dentada em dia. Próxima troca em {distance} km.',
            warning: '⚠️ ATENÇÃO: Correia se aproximando do limite. Não arrisque!',
            danger: '🔴 URGENTE: Troca da correia ATRASADA! Risco de quebra.',
            unknown: '⚠️ CORREIA SEM HISTÓRICO: Verifique no manual ou com mecânico.',
        },
    },

    filters: {
        id: 'filters',
        name: 'Filtros (Ar, Combustível, Cabine)',
        category: 'preventiva',
        icon: '🌬️',
        description: 'Filtros são "máscaras" que impedem poeira e sujeira de entrar no motor e na cabine. Entupidos, sufocam o motor e aumentam consumo.',
        benefit: 'Motor respirando bem = mais força e menos gasto com combustível. Filtro de cabine evita alergias!',
        intervals: {
            air_km: 15000,
            fuel_km: 20000,
            cabin_km: 10000,
            months: 12,
        },
        warningSigns: [
            'Aceleração "pesada" ou demorada',
            'Cheiro estranho no ar-condicionado',
            'Consumo de combustível aumentou',
            'Motor "falhando" em baixa rotação',
        ],
        colors: {
            good: '#10b981',
            warning: '#eab308',
            danger: '#f59e0b',
        },
        dashboardMessages: {
            good: 'Filtros limpos. Próxima revisão em {distance} km.',
            warning: '🌬️ Filtros podem estar sujos. Considere uma verificação.',
            danger: 'Filtros provavelmente entupidos. Motor trabalhando forçado.',
            unknown: 'Filtros sem histórico. Recomendado trocar a cada 10-15 mil km.',
        },
    },

    general_inspection: {
        id: 'general_inspection',
        name: 'Revisão Geral do Veículo',
        category: 'preventiva',
        icon: '🔍',
        description: 'Uma "consulta médica" completa do carro. Mecânico verifica níveis, folgas, desgastes e itens de segurança que você não vê.',
        benefit: 'Detecta problemas pequenos antes que virem grandes. Pode salvar sua vida em uma viagem longa!',
        intervals: {
            km: 10000,
            months: 12,
        },
        warningSigns: [
            'Qualquer luz de alerta no painel',
            'Comportamento estranho do carro',
            'Vibrações ou barulhos novos',
            'Antes de viagens longas (sempre!)',
        ],
        colors: {
            good: '#10b981',
            warning: '#3b82f6',
            danger: '#dc2626',
        },
        dashboardMessages: {
            good: 'Revisão em dia. Próxima em {distance} km ou {time}.',
            warning: '📋 Revisão programada se aproximando. Agende com antecedência.',
            danger: 'Revisão ATRASADA. Itens de segurança podem estar comprometidos.',
            unknown: 'Sem histórico de revisão. Recomendamos um check-up completo.',
        },
    },

    tires: {
        id: 'tires',
        name: 'Pneus e Calibragem',
        category: 'seguranca',
        icon: '🛞',
        description: 'Único contato do carro com o chão. Pneus carecas aumentam drasticamente o risco de aquaplanagem e perda de controle.',
        benefit: 'Segurança em chuva, frenagem mais curta e economia de combustível (até 5%!).',
        intervals: {
            inspection_km: 5000,
            rotation_km: 10000,
            replacement_km: 50000,
            months: 6,
        },
        warningSigns: [
            'Sulco de desgaste atingiu os "TWI" (indicadores)',
            'Lateral do pneu rachada ou com "bolhas"',
            'Vibração no volante a 80-100 km/h',
            'Pneu perdendo ar constantemente',
        ],
        colors: {
            good: '#10b981',
            warning: '#f59e0b',
            danger: '#dc2626',
        },
        dashboardMessages: {
            good: 'Pneus OK. Próxima verificação em {distance} km.',
            warning: '🛞 Verifique a calibragem e desgaste dos pneus.',
            danger: '🚨 PNEUS EM ESTADO CRÍTICO! Troca urgente necessária.',
            unknown: 'Pneus sem inspeção registrada. Verifique a calibragem mensalmente.',
        },
    },

    battery: {
        id: 'battery',
        name: 'Bateria',
        category: 'preventiva',
        icon: '🔋',
        description: 'Fornece energia para partida, faróis, ar-condicionado e eletrônicos. Em dias frios, trabalha mais e pode falhar.',
        benefit: 'Evita aquela hora em que o carro não liga e você se atrasa para o trabalho!',
        intervals: {
            inspection_months: 6,
            replacement_months: 24,
            replacement_km: 40000,
        },
        warningSigns: [
            'Partida lenta ou "arrastada"',
            'Faróis fracos mesmo com motor ligado',
            'Luz de bateria acesa no painel',
            'Cheiro de "ovo podre" (enxofre) perto da bateria',
        ],
        colors: {
            good: '#10b981',
            warning: '#eab308',
            danger: '#dc2626',
        },
        dashboardMessages: {
            good: 'Bateria com carga boa. Próxima verificação em {time}.',
            warning: '🔋 Bateria pode estar enfraquecendo. Teste em oficina.',
            danger: 'Bateria em estado crítico. Risco de pane elétrica.',
            unknown: 'Bateria sem histórico. Recomendamos teste de carga.',
        },
    },

    suspension: {
        id: 'suspension',
        name: 'Suspensão e Amortecedores',
        category: 'seguranca',
        icon: '🔧',
        description: 'Amortecedores controlam o balanço do carro. Gastos, o veículo "navega" nas curvas e demora a parar de balançar.',
        benefit: 'Estabilidade em curvas, conforto em buracos e menor desgaste dos pneus.',
        intervals: {
            inspection_km: 20000,
            replacement_km: 60000,
            months: 24,
        },
        warningSigns: [
            'Carro "balança" muito após passar em lombada',
            'Barulho de "batida" no chassi',
            'Pneus desgastados irregularmente',
            'Direção "flutuante" em estrada',
        ],
        colors: {
            good: '#10b981',
            warning: '#f59e0b',
            danger: '#dc2626',
        },
        dashboardMessages: {
            good: 'Suspensão em bom estado. Próxima verificação em {distance} km.',
            warning: 'Suspensão pode precisar de atenção. Observe comportamento em curvas.',
            danger: 'Suspensão comprometida. Estabilidade do veículo prejudicada.',
            unknown: 'Suspensão sem inspeção. Recomendado verificar a cada 20 mil km.',
        },
    },

    fluids: {
        id: 'fluids',
        name: 'Fluidos (Freio, Direção, Arrefecimento)',
        category: 'critica',
        icon: '💧',
        description: 'Fluidos são "remédios" do carro. Freio transmite força, arrefecimento evita superaquecimento, direção hidráulica facilita esterçar.',
        benefit: 'Freios que funcionam em emergência, motor refrigerado e direção leve. Previne superaquecimento!',
        intervals: {
            brake_months: 24,
            coolant_months: 24,
            powersteering_km: 50000,
            inspection_months: 6,
        },
        warningSigns: [
            'Luz de temperatura acesa (pare imediatamente!)',
            'Pedal de freio "esponjoso"',
            'Direção pesada ou rangendo',
            'Manchas coloridas no chão (vazamentos)',
        ],
        colors: {
            good: '#10b981',
            warning: '#f97316',
            danger: '#7f1d1d',
        },
        dashboardMessages: {
            good: 'Fluidos em nível e qualidade corretos. Próxima troca em {time}.',
            warning: '⚠️ Fluidos podem precisar de atenção. Verifique níveis.',
            danger: '🔴 FLUIDOS CRÍTICOS! Risco de superaquecimento ou falha de freios.',
            unknown: 'Fluidos sem histórico. Recomendado verificação completa.',
        },
    },
};

const MAINTENANCE_TYPE_MAP = {
    oil: 'oil_change',
    brake: 'brake_pads',
    belt: 'timing_belt',
    filter: 'filters',
    review: 'general_inspection',
    tire: 'tires',
    battery: 'battery',
    suspension: 'suspension',
    fluids: 'fluids',
};

window.MAINTENANCE_GUIDE = MAINTENANCE_GUIDE;
window.getMaintenanceGuideByType = (type) => {
    const guideId = MAINTENANCE_TYPE_MAP[type] || type;
    return MAINTENANCE_GUIDE[guideId] || null;
};
