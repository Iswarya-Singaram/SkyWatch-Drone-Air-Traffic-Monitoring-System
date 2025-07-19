document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    const map = L.map('map', {
        zoomControl: false
    }).setView([20, 0], 2);

    // Add zoom control with position
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Marker cluster group
    const markers = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 60
    });
    map.addLayer(markers);

    // India bounds
    const indiaBounds = L.latLngBounds(
        L.latLng(6.755, 68.162),
        L.latLng(35.674, 97.395)
    );

    // India states and zones
    const indiaStates = {
        'Delhi': { zone: 'red', center: [28.6139, 77.2090], radius: 2 },
        'Maharashtra': { zone: 'red', center: [19.7515, 75.7139], radius: 4 },
        'Karnataka': { zone: 'red', center: [15.3173, 75.7139], radius: 4 },
        'Tamil Nadu': { zone: 'yellow', center: [11.1271, 78.6569], radius: 4 },
        'West Bengal': { zone: 'yellow', center: [22.9868, 87.8550], radius: 4 },
        'Uttar Pradesh': { zone: 'yellow', center: [26.8467, 80.9462], radius: 5 },
        'Rajasthan': { zone: 'green', center: [27.0238, 74.2179], radius: 5 },
        'Gujarat': { zone: 'green', center: [22.2587, 71.1924], radius: 4 },
        'Kerala': { zone: 'green', center: [10.8505, 76.2711], radius: 3 }
    };

    // Create India zones based on states
    const indiaZones = {
        'red': [],
        'yellow': [],
        'green': []
    };

    Object.entries(indiaStates).forEach(([state, data]) => {
        const bounds = L.latLngBounds(
            [data.center[0] - data.radius, data.center[1] - data.radius],
            [data.center[0] + data.radius, data.center[1] + data.radius]
        );
        indiaZones[data.zone].push({ bounds, state });
    });

    // Store zone layers
    const zoneLayers = {
        red: [],
        yellow: [],
        green: []
    };

    // Country data with colors
    const countries = {
        'USA': { color: '#1f77b4', frequencyBand: [900, 928] },
        'India': { color: '#ff7f0e', frequencyBand: [2400, 2483] },
        'UK': { color: '#2ca02c', frequencyBand: [5725, 5850] },
        'Japan': { color: '#d62728', frequencyBand: [400, 406] },
        'Germany': { color: '#9467bd', frequencyBand: [2400, 2483] },
        'Australia': { color: '#8c564b', frequencyBand: [2400, 2483] },
        'China': { color: '#e377c2', frequencyBand: [2400, 2483] },
        'Brazil': { color: '#7f7f7f', frequencyBand: [2400, 2483] },
        'Canada': { color: '#bcbd22', frequencyBand: [2400, 2483] }
    };

    // Store drone data
    let droneData = [];
    let currentView = 'world';

    // Add zone polygons to map
    function addZonePolygons() {
        // Clear existing zones
        Object.values(zoneLayers).flat().forEach(layer => map.removeLayer(layer));
        Object.keys(zoneLayers).forEach(key => zoneLayers[key] = []);

        // Add new zones based on current filters
        const activeFilters = Array.from(document.querySelectorAll('.zone-filter:checked')).map(el => el.value);

        activeFilters.forEach(zone => {
            indiaZones[zone].forEach(({ bounds, state }) => {
                const color = zone === 'red' ? '#ff0000' : zone === 'yellow' ? '#ffcc00' : '#4CAF50';
                const opacity = zone === 'red' ? 0.25 : zone === 'yellow' ? 0.2 : 0.15;

                const zoneLayer = L.rectangle(bounds, {
                    color: color,
                    fillColor: color,
                    fillOpacity: opacity,
                    weight: 2,
                    dashArray: zone === 'green' ? '5,5' : null
                }).addTo(map);

                zoneLayer.bindPopup(`<b>${state} (${zone.toUpperCase()} ZONE)</b>`);
                zoneLayers[zone].push(zoneLayer);
            });
        });
    }

    // View toggle buttons
    document.getElementById('worldViewBtn').addEventListener('click', function () {
        currentView = 'world';
        this.classList.add('active');
        document.getElementById('indiaViewBtn').classList.remove('active');
        document.getElementById('indiaZoneFilters').style.display = 'none';
        map.setView([20, 0], 2);
        updateDroneDisplay();
    });

    document.getElementById('indiaViewBtn').addEventListener('click', function () {
        currentView = 'india';
        this.classList.add('active');
        document.getElementById('worldViewBtn').classList.remove('active');
        document.getElementById('indiaZoneFilters').style.display = 'block';
        map.fitBounds(indiaBounds);
        addZonePolygons();
        updateDroneDisplay();
    });

    // Zone filter checkboxes
    document.querySelectorAll('.zone-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (currentView === 'india') {
                addZonePolygons();
                updateDroneDisplay();
            }
        });
    });

    // Monitor Air Traffic Button
    document.getElementById('monitorBtn').addEventListener('click', function () {
        fetch('/get_drones')
            .then(response => response.json())
            .then(newDrones => {
                droneData = [...droneData, ...newDrones];
                updateDroneDisplay();
                updateDroneCount();
            });
    });

    // Clear All Button
    document.getElementById('clearBtn').addEventListener('click', function () {
        clearDrones();
    });

    // Run Frequency Scan Button
    document.getElementById('frequencyBtn').addEventListener('click', function () {
        if (droneData.length === 0) {
            alert('Please monitor air traffic first!');
            return;
        }

        let displayData = droneData;
        if (currentView === 'india') {
            displayData = droneData.filter(drone => drone.country === 'India');
            const activeFilters = Array.from(document.querySelectorAll('.zone-filter:checked')).map(el => el.value);
            displayData = displayData.filter(drone => {
                const droneLatLng = L.latLng(drone.latitude, drone.longitude);
                return activeFilters.some(zone => {
                    return indiaZones[zone].some(({ bounds }) => bounds.contains(droneLatLng));
                });
            });
        }

        const frequencies = [];
        const signalStrengths = [];
        const colors = [];
        const labels = [];

        displayData.forEach(drone => {
            frequencies.push(drone.frequency);
            signalStrengths.push(Math.random() * 0.5 + 0.5);
            colors.push(countries[drone.country].color);

            if (currentView === 'india' && drone.country === 'India') {
                const droneLatLng = L.latLng(drone.latitude, drone.longitude);
                let state = 'Unknown';
                Object.entries(indiaZones).forEach(([zone, zoneData]) => {
                    zoneData.forEach(({ bounds, state: s }) => {
                        if (bounds.contains(droneLatLng)) {
                            state = s;
                        }
                    });
                });
                labels.push(`${state} (${drone.zone || 'Unknown'} zone)`);
            } else {
                labels.push(drone.country);
            }
        });

        const trace = {
            x: frequencies,
            y: signalStrengths,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: colors,
                size: 12
            },
            text: labels,
            hoverinfo: 'text+x+y'
        };

        const shapes = [];
        const annotations = [];

        if (currentView === 'india') {
            // Only show India's frequency band
            const band = countries['India'].frequencyBand;
            shapes.push({
                type: 'rect',
                x0: band[0],
                x1: band[1],
                y0: 0,
                y1: 1,
                fillcolor: countries['India'].color,
                opacity: 0.1,
                line: {
                    width: 0
                }
            });

            annotations.push({
                x: (band[0] + band[1]) / 2,
                y: 0.95,
                text: 'India',
                showarrow: false,
                font: {
                    color: countries['India'].color
                }
            });
        } else {
            // Show all countries' frequency bands
            Object.entries(countries).forEach(([country, data]) => {
                const band = data.frequencyBand;
                shapes.push({
                    type: 'rect',
                    x0: band[0],
                    x1: band[1],
                    y0: 0,
                    y1: 1,
                    fillcolor: data.color,
                    opacity: 0.1,
                    line: {
                        width: 0
                    }
                });

                annotations.push({
                    x: (band[0] + band[1]) / 2,
                    y: 0.95,
                    text: country,
                    showarrow: false,
                    font: {
                        color: data.color
                    }
                });
            });
        }

        const layout = {
            title: currentView === 'india' ? 'India Drone Frequency Scan by State' : 'Drone Frequency Scan by Country',
            xaxis: {
                title: 'Frequency (MHz)',
                range: [currentView === 'india' ? 2300 : 300, currentView === 'india' ? 2500 : 6000]
            },
            yaxis: {
                title: 'Signal Strength',
                range: [0, 1.1]
            },
            shapes: shapes,
            annotations: annotations,
            showlegend: false,
            height: 450,
            margin: { t: 40, b: 60, l: 60, r: 40 }
        };

        Plotly.newPlot('frequencyPlot', [trace], layout);
    });

    // Detect Violations Button
    document.getElementById('violationBtn').addEventListener('click', function () {
        if (droneData.length === 0) {
            alert('Please monitor air traffic first!');
            return;
        }

        let violationCount = 0;
        const tableBody = document.querySelector('#violationTable tbody');
        tableBody.innerHTML = '';

        const activeFilters = currentView === 'india' ?
            Array.from(document.querySelectorAll('.zone-filter:checked')).map(el => el.value) :
            null;

        droneData.forEach(drone => {
            const countryInfo = countries[drone.country];
            let status = 'Normal';
            let zone = '';
            let state = '';

            // Check frequency violation
            if (drone.frequency < countryInfo.frequencyBand[0] ||
                drone.frequency > countryInfo.frequencyBand[1]) {
                status = 'Frequency Violation';
                violationCount++;
            }

            // Check zone and state for Indian drones
            if (drone.country === 'India') {
                const droneLatLng = L.latLng(drone.latitude, drone.longitude);

                Object.entries(indiaZones).forEach(([zoneType, zoneData]) => {
                    zoneData.forEach(({ bounds, state: s }) => {
                        if (bounds.contains(droneLatLng)) {
                            zone = zoneType;
                            state = s;
                        }
                    });
                });

                if (zone === 'red' && Math.random() < 0.7) {
                    status = 'Red Zone Violation';
                    violationCount++;
                }
            }

            // Skip if in India view and not in active filters
            if (currentView === 'india' && drone.country === 'India') {
                if (!zone || !activeFilters.includes(zone)) return;
            }

            const row = document.createElement('tr');
            row.className = zone ? `zone-${zone}` : '';
            row.innerHTML = `
                <td>${drone.id}</td>
                <td>${drone.latitude.toFixed(4)}</td>
                <td>${drone.longitude.toFixed(4)}</td>
                <td>${drone.country}</td>
                <td>${drone.country === 'India' ? (state || 'Unknown') + (zone ? ` (${zone} zone)` : '') : 'N/A'}</td>
                <td class="${status !== 'Normal' ? 'violation' : ''}">${status}</td>
                <td>${drone.frequency} MHz</td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById('totalViolations').textContent = violationCount;
        document.getElementById('activeZone').textContent =
            currentView === 'india' ? activeFilters.join(', ') : 'All';
    });

    // Helper functions
    function clearDrones() {
        markers.clearLayers();
        droneData = [];
        updateDroneCount();
        document.querySelector('#violationTable tbody').innerHTML = '';
        document.getElementById('totalViolations').textContent = '0';
    }

    function updateDroneDisplay() {
        markers.clearLayers();

        droneData.forEach(drone => {
            if (currentView === 'india' && drone.country !== 'India') return;

            if (currentView === 'india' && drone.country === 'India') {
                const activeFilters = Array.from(document.querySelectorAll('.zone-filter:checked')).map(el => el.value);
                const droneLatLng = L.latLng(drone.latitude, drone.longitude);
                const inActiveZone = activeFilters.some(zone => {
                    return indiaZones[zone].some(({ bounds }) => bounds.contains(droneLatLng));
                });
                if (!inActiveZone) return;
            }

            const marker = L.circleMarker([drone.latitude, drone.longitude], {
                radius: 8,
                fillColor: countries[drone.country].color,
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            let popupContent = `
                <b>Drone ID:</b> ${drone.id}<br>
                <b>Country:</b> ${drone.country}<br>
                <b>Location:</b> ${drone.latitude.toFixed(4)}, ${drone.longitude.toFixed(4)}<br>
                <b>Frequency:</b> ${drone.frequency} MHz
            `;

            if (drone.country === 'India') {
                const droneLatLng = L.latLng(drone.latitude, drone.longitude);
                let state = 'Unknown';
                let zone = 'Unknown';
                Object.entries(indiaZones).forEach(([zoneType, zoneData]) => {
                    zoneData.forEach(({ bounds, state: s }) => {
                        if (bounds.contains(droneLatLng)) {
                            state = s;
                            zone = zoneType;
                        }
                    });
                });
                popupContent += `<br><b>State:</b> ${state}<br><b>Zone:</b> ${zone}`;
            }

            marker.bindPopup(popupContent);
            markers.addLayer(marker);
        });

        map.addLayer(markers);
    }

    function updateDroneCount() {
        let count = droneData.length;

        if (currentView === 'india') {
            count = droneData.filter(drone => drone.country === 'India').length;
            const activeFilters = Array.from(document.querySelectorAll('.zone-filter:checked')).map(el => el.value);
            count = droneData.filter(drone => {
                if (drone.country !== 'India') return false;
                const droneLatLng = L.latLng(drone.latitude, drone.longitude);
                return activeFilters.some(zone => {
                    return indiaZones[zone].some(({ bounds }) => bounds.contains(droneLatLng));
                });
            }).length;
        }

        document.getElementById('totalDrones').textContent = count;
        document.getElementById('activeZone').textContent = currentView === 'india' ?
            Array.from(document.querySelectorAll('.zone-filter:checked')).map(el => el.value).join(', ') :
            'All';
    }

    // Initialize India view if URL has #india
    if (window.location.hash === '#india') {
        document.getElementById('indiaViewBtn').click();
    }
});