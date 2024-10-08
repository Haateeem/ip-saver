import requests

def get_location(ip_address):
    # URL to fetch the location from ipinfo.io
    url = f"https://ipinfo.io/{ip_address}/json"
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses
        
        # Parse the JSON response
        location_data = response.json()
        return {
            "IP Address": location_data.get("ip"),
            "City": location_data.get("city"),
            "Region": location_data.get("region"),
            "Country": location_data.get("country"),
            "Location": location_data.get("loc"),
            "Organization": location_data.get("org"),
        }
    except requests.RequestException as e:
        print(f"Error fetching location: {e}")
        return None

if __name__ == "__main__":
    ip_input = input("Enter a public IP address: ")
    location_info = get_location(ip_input)

    if location_info:
        print("\nLocation Information:")
        for key, value in location_info.items():
            print(f"{key}: {value}")
