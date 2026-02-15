/**
 * Google Maps API Integration Module
 * Busca mecânicas reais com fotos, avaliações e detalhes
 */

const GoogleMapsAPI = {
    map: null,
    service: null,
    geocoder: null,
    currentLocation: null,

    // Inicialização
    async init() {
        if (!Config.USE_REAL_API) {
            console.log('⚠️ Google Maps API não configurada');
            return false;
        }

        try {
            await Config.loadGoogleMapsScript();
            this.geocoder = new google.maps.Geocoder();
            this.currentLocation = Config.DEFAULT_LOCATION;
            console.log('✅ Google Maps API inicializada');
            return true;
        } catch (error) {
            console.error('❌ Erro ao carregar Google Maps:', error);
            return false;
        }
    },

    // Obter localização atual do usuário
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                resolve(Config.DEFAULT_LOCATION);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(this.currentLocation);
                },
                (error) => {
                    console.warn('Geolocalização negada, usando padrão:', error);
                    resolve(Config.DEFAULT_LOCATION);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    },

    // Buscar mecânicas próximas
    async searchNearbyMechanics(location = null, radius = Config.SEARCH_RADIUS) {
        const searchLocation = location || this.currentLocation || Config.DEFAULT_LOCATION;

        if (!Config.USE_REAL_API || !window.google?.maps) {
            return this.getSimulatedMechanics(searchLocation);
        }

        try {
            // Criar mapa invisível para o PlacesService
            const mapDiv = document.createElement('div');
            mapDiv.style.display = 'none';
            document.body.appendChild(mapDiv);

            const map = new google.maps.Map(mapDiv, {
                center: searchLocation,
                zoom: 15
            });

            const service = new google.maps.places.PlacesService(map);

            const request = {
                location: searchLocation,
                radius: radius,
                type: ['car_repair', 'car_dealer'], // Tipos de estabelecimento automotivo
                keyword: 'mecânica auto center oficina'
            };

            return new Promise((resolve, reject) => {
                service.nearbySearch(request, (results, status) => {
                    document.body.removeChild(mapDiv);

                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        // Processar resultados e buscar detalhes adicionais
                        this.processPlacesResults(results).then(resolve).catch(reject);
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        resolve([]);
                    } else {
                        reject(new Error(`Places API error: ${status}`));
                    }
                });
            });

        } catch (error) {
            console.error('Erro na busca:', error);
            return this.getSimulatedMechanics(searchLocation);
        }
    },

    // Processar resultados e buscar detalhes completos
    async processPlacesResults(places) {
        const detailedResults = [];

        // Limitar a 10 resultados para não exceder quotas
        const limitedPlaces = places.slice(0, 10);

        for (const place of limitedPlaces) {
            try {
                const details = await this.getPlaceDetails(place.place_id);
                if (details) {
                    detailedResults.push(details);
                }
            } catch (error) {
                console.warn('Erro ao buscar detalhes:', error);
            }

            // Delay para respeitar rate limits
            await this.delay(200);
        }

        return detailedResults;
    },

    // Buscar detalhes completos de um lugar
    async getPlaceDetails(placeId) {
        if (!window.google?.maps) return null;

        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);

        const map = new google.maps.Map(mapDiv, {
            center: Config.DEFAULT_LOCATION,
            zoom: 15
        });

        const service = new google.maps.places.PlacesService(map);

        const request = {
            placeId: placeId,
            fields: [
                'place_id', 'name', 'formatted_address', 'geometry', 'photos',
                'rating', 'user_ratings_total', 'opening_hours',
                'formatted_phone_number', 'website', 'business_status',
                'price_level', 'reviews', 'types', 'vicinity'
            ]
        };

        return new Promise((resolve, reject) => {
            service.getDetails(request, (place, status) => {
                document.body.removeChild(mapDiv);

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    resolve(this.formatPlaceData(place));
                } else {
                    reject(new Error(`Details API error: ${status}`));
                }
            });
        });
    },

    // Formatar dados do Google Places para nosso formato
    formatPlaceData(place) {
        // Determinar tipo de serviço baseado nos types do Google
        const type = this.determineServiceType(place.types);

        // Calcular distância
        const distance = this.calculateDistance(place.geometry.location);

        // Processar foto principal
        let photoUrl = null;
        if (place.photos && place.photos.length > 0) {
            photoUrl = place.photos[0].getUrl({
                maxWidth: 400,
                maxHeight: 300
            });
        }

        // Processar horários de funcionamento
        let hours = 'Horário não disponível';
        let isOpen = null;
        if (place.opening_hours) {
            isOpen = place.opening_hours.isOpen();
            hours = this.formatOpeningHours(place.opening_hours);
        }

        // Formatar telefone para WhatsApp
        const phone = place.formatted_phone_number || '';
        const whatsappNumber = phone.replace(/\D/g, '');

        return {
            id: place.place_id,
            name: place.name,
            type: type,
            rating: place.rating || 0,
            reviews: place.user_ratings_total || 0,
            distance: distance,
            address: place.formatted_address || place.vicinity,
            phone: phone,
            whatsappNumber: whatsappNumber,
            website: place.website || null,
            photoUrl: photoUrl,
            hours: hours,
            isOpen: isOpen,
            businessStatus: place.business_status,
            priceLevel: place.price_level,
            location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            },
            reviews_list: (place.reviews || []).slice(0, 3).map(r => ({
                author: r.author_name,
                rating: r.rating,
                text: r.text,
                time: r.relative_time_description
            })),
            services: this.extractServices(place.types),
            partner: false, // Google Places não tem info de parceria
            source: 'google_maps'
        };
    },

    // Determinar tipo de serviço baseado nos types do Google
    determineServiceType(types = []) {
        const typeMap = {
            'car_repair': 'mechanic',
            'car_dealer': 'mechanic',
            'car_wash': 'detailing',
            'gas_station': 'mechanic',
            'store': 'electric'
        };

        for (const type of types) {
            if (typeMap[type]) return typeMap[type];
        }

        return 'mechanic'; // Default
    },

    // Extrair serviços dos types
    extractServices(types = []) {
        const serviceMap = {
            'car_repair': 'Mecânica Geral',
            'car_dealer': 'Venda de Peças',
            'car_wash': 'Lavagem',
            'gas_station': 'Combustível',
            'tire_shop': 'Pneus',
            'electrician': 'Elétrica'
        };

        const services = types
            .filter(t => serviceMap[t])
            .map(t => serviceMap[t])
            .slice(0, 3);

        return services.length ? services : ['Mecânica Geral'];
    },

    // Formatar horários de funcionamento
    formatOpeningHours(openingHours) {
        if (!openingHours?.weekday_text) return 'Consultar horário';

        const today = new Date().getDay();
        const daysMap = [6, 0, 1, 2, 3, 4, 5]; // Ajustar índice
        const todayHours = openingHours.weekday_text[daysMap[today]];

        return todayHours || 'Horário variado';
    },

    // Calcular distância da localização atual
    calculateDistance(location) {
        if (!this.currentLocation || !window.google?.maps) return 'Distância desconhecida';

        const from = new google.maps.LatLng(this.currentLocation.lat, this.currentLocation.lng);
        const to = new google.maps.LatLng(location.lat(), location.lng());

        const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(from, to);
        const distanceInKm = (distanceInMeters / 1000).toFixed(1);

        return `${distanceInKm} km`;
    },

    // Buscar texto (para quando o usuário digitar)
    async searchByText(query, location = null) {
        if (!Config.USE_REAL_API || !window.google?.maps) {
            return this.searchSimulatedByText(query);
        }

        const searchLocation = location || this.currentLocation || Config.DEFAULT_LOCATION;

        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);

        const map = new google.maps.Map(mapDiv, {
            center: searchLocation,
            zoom: 15
        });

        const service = new google.maps.places.PlacesService(map);

        const request = {
            query: query + ' mecânica auto center',
            location: searchLocation,
            radius: 10000
        };

        return new Promise((resolve, reject) => {
            service.textSearch(request, (results, status) => {
                document.body.removeChild(mapDiv);

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    this.processPlacesResults(results).then(resolve).catch(reject);
                } else {
                    resolve([]);
                }
            });
        });
    },

    // Geocoding - converter endereço em coordenadas
    async geocodeAddress(address) {
        if (!Config.USE_REAL_API || !this.geocoder) return null;

        return new Promise((resolve, reject) => {
            this.geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                        formatted: results[0].formatted_address
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    },

    // Dados simulados quando API não disponível
    getSimulatedMechanics(location) {
        console.log('📍 Usando mecânicas simuladas próximas a:', location);

        // Gerar mecânicas simuladas baseadas na localização
        const simulated = [
            {
                id: 'sim_1',
                name: 'Auto Mecânica Central',
                type: 'mechanic',
                rating: 4.5,
                reviews: 128,
                distance: '1.2 km',
                address: `Rua próxima a ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
                phone: '(11) 99999-1111',
                whatsappNumber: '11999991111',
                photoUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
                hours: 'Seg-Sex: 08:00-18:00',
                isOpen: true,
                services: ['Mecânica Geral', 'Revisão', 'Diagnóstico'],
                partner: true,
                source: 'simulated'
            },
            {
                id: 'sim_2',
                name: 'Oficina do Zé',
                type: 'mechanic',
                rating: 4.8,
                reviews: 89,
                distance: '2.5 km',
                address: 'Avenida próxima ao centro',
                phone: '(11) 98888-2222',
                whatsappNumber: '11988882222',
                photoUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
                hours: 'Seg-Sáb: 08:00-20:00',
                isOpen: true,
                services: ['Motor', 'Câmbio', 'Suspensão'],
                partner: false,
                source: 'simulated'
            },
            {
                id: 'sim_3',
                name: 'Centro Automotivo Express',
                type: 'mechanic',
                rating: 4.3,
                reviews: 256,
                distance: '3.1 km',
                address: 'Rua comercial local',
                phone: '(11) 97777-3333',
                whatsappNumber: '11977773333',
                photoUrl: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400',
                hours: 'Seg-Dom: 07:00-22:00',
                isOpen: true,
                services: ['Troca de Óleo', 'Freios', 'Alinhamento'],
                partner: true,
                source: 'simulated'
            }
        ];

        return Promise.resolve(simulated);
    },

    searchSimulatedByText(query) {
        const allSimulated = [
            'Mecânica Rápida',
            'Auto Center São Paulo',
            'Oficina Premium',
            'Mecânica do Bairro',
            'Centro Automotivo'
        ];

        const filtered = allSimulated
            .filter(name => name.toLowerCase().includes(query.toLowerCase()))
            .map((name, index) => ({
                id: `search_${index}`,
                name: name,
                type: 'mechanic',
                rating: Number((4 + Math.random()).toFixed(1)),
                reviews: Math.floor(Math.random() * 200),
                distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
                address: 'Endereço encontrado na busca',
                phone: '(11) 9' + Math.floor(Math.random() * 9000 + 1000) + '-' + Math.floor(Math.random() * 9000 + 1000),
                photoUrl: null,
                hours: 'Seg-Sex: 08:00-18:00',
                services: ['Mecânica Geral'],
                source: 'simulated'
            }));

        return Promise.resolve(filtered);
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

window.GoogleMapsAPI = GoogleMapsAPI;
