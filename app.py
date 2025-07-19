from flask import Flask, render_template, jsonify
import random
from random import uniform
import time

app = Flask(__name__)

# Country data with frequency bands and colors
COUNTRIES = {
    'USA': {
        'color': '#1f77b4',
        'frequencyBand': [900, 928],
        'boundingBox': [24.396308, -125.0, 49.384358, -66.93457]
    },
    'India': {
        'color': '#ff7f0e',
        'frequencyBand': [2400, 2483],
        'boundingBox': [6.755, 68.162, 35.674, 97.395],
        'states': {
            'Delhi': {'zone': 'red', 'center': [28.6139, 77.2090], 'radius': 1},
            'Maharashtra': {'zone': 'red', 'center': [19.7515, 75.7139], 'radius': 3},
            'Karnataka': {'zone': 'red', 'center': [15.3173, 75.7139], 'radius': 3},
            'Tamil Nadu': {'zone': 'yellow', 'center': [11.1271, 78.6569], 'radius': 3},
            'West Bengal': {'zone': 'yellow', 'center': [22.9868, 87.8550], 'radius': 3},
            'Uttar Pradesh': {'zone': 'yellow', 'center': [26.8467, 80.9462], 'radius': 4},
            'Rajasthan': {'zone': 'green', 'center': [27.0238, 74.2179], 'radius': 4},
            'Gujarat': {'zone': 'green', 'center': [22.2587, 71.1924], 'radius': 3},
            'Kerala': {'zone': 'green', 'center': [10.8505, 76.2711], 'radius': 2}
        }
    },
    'UK': {
        'color': '#2ca02c',
        'frequencyBand': [5725, 5850],
        'boundingBox': [49.9, -8.623, 60.86, 1.759]
    },
    'Japan': {
        'color': '#d62728',
        'frequencyBand': [400, 406],
        'boundingBox': [24.396308, 122.93457, 45.551483, 153.986672]
    },
    'Germany': {
        'color': '#9467bd',
        'frequencyBand': [2400, 2483],
        'boundingBox': [47.270111, 5.866315, 55.099161, 15.041930]
    },
    'Australia': {
        'color': '#8c564b',
        'frequencyBand': [2400, 2483],
        'boundingBox': [-43.634597, 112.921454, -10.668186, 153.638672]
    },
    'China': {
        'color': '#e377c2',
        'frequencyBand': [2400, 2483],
        'boundingBox': [18.1977, 73.4997, 53.5608, 134.7735]
    },
    'Brazil': {
        'color': '#7f7f7f',
        'frequencyBand': [2400, 2483],
        'boundingBox': [-33.8688, -73.9828, 5.2718, -34.7297]
    },
    'Canada': {
        'color': '#bcbd22',
        'frequencyBand': [2400, 2483],
        'boundingBox': [41.6755, -141.0019, 83.3362, -52.3232]
    }
}

def generate_random_drone(country):
    """Generate a random drone within a country's bounding box"""
    bbox = COUNTRIES[country]['boundingBox']
    freq_band = COUNTRIES[country]['frequencyBand']
    
    if country == 'India':
        # Select a random Indian state
        state = random.choice(list(COUNTRIES['India']['states'].keys()))
        state_info = COUNTRIES['India']['states'][state]
        
        # Generate position near state center
        lat = random.gauss(state_info['center'][0], state_info['radius']/2)
        lon = random.gauss(state_info['center'][1], state_info['radius']/2)
        
        # Ensure position is within India bounds
        lat = max(bbox[0], min(bbox[2], lat))
        lon = max(bbox[1], min(bbox[3], lon))
        
        return {
            'id': f'DRN-{random.randint(1000, 9999)}',
            'country': country,
            'state': state,
            'zone': state_info['zone'],
            'latitude': lat,
            'longitude': lon,
            'frequency': uniform(freq_band[0] - 100, freq_band[1] + 100),  # Some may be out of band
            'timestamp': int(time.time())
        }
    else:
        # For other countries, generate random position within bounds
        return {
            'id': f'DRN-{random.randint(1000, 9999)}',
            'country': country,
            'state': None,
            'zone': None,
            'latitude': uniform(bbox[0], bbox[2]),
            'longitude': uniform(bbox[1], bbox[3]),
            'frequency': uniform(freq_band[0], freq_band[1]),
            'timestamp': int(time.time())
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/india')
def india_view():
    return render_template('index.html', init_view='india')

@app.route('/get_drones')
def get_drones():
    # Generate 5-10 random drones with distribution favoring India
    num_drones = random.randint(5, 10)
    drones = []
    
    # Weighted country selection (40% India, 60% other countries)
    country_weights = {
        'India': 0.4,
        'USA': 0.15,
        'UK': 0.1,
        'Japan': 0.1,
        'Germany': 0.1,
        'Australia': 0.05,
        'China': 0.05,
        'Brazil': 0.03,
        'Canada': 0.02
    }
    
    countries = list(country_weights.keys())
    weights = list(country_weights.values())
    
    for _ in range(num_drones):
        country = random.choices(countries, weights=weights, k=1)[0]
        drones.append(generate_random_drone(country))
    
    return jsonify(drones)

if __name__ == '__main__':
    app.run(debug=True)
