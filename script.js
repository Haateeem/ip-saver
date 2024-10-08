document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById('loader');
    const ipDiv = document.getElementById('ip');
    const deviceInfoDiv = document.getElementById('device-info');
    const saveButton = document.getElementById('saveButton');

    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            ipDiv.textContent = data.ip;
            loader.classList.add('hidden'); // Hide loader
            ipDiv.classList.remove('hidden'); // Show IP
            saveButton.classList.remove('hidden'); // Show save button

            // Get and display simplified device information
            const deviceInfo = getDeviceInfo(navigator.userAgent);
            deviceInfoDiv.innerHTML = `Device: ${deviceInfo.device}<br>OS: ${deviceInfo.os}<br>Browser: ${deviceInfo.browser}`;
            deviceInfoDiv.classList.remove('hidden'); // Show device info
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

function addToSheet() {
    const text = document.getElementById('ip').innerText; // Get text from the div
    const appScriptUrl = 'https://script.google.com/macros/s/AKfycbwV3DR9LtiCra0WqO1ZYKqwSHKIFF6FGN70I8A-u9K5YJL4EUPhxqIoBagBfzc66El8jw/exec';

    console.log('Text to be sent:', text); // Debugging line
    fetch(appScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text }),
    })
        .then(response => {
            console.log('Response:', response);
            return response.json(); // Parse the JSON response
        })
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
}
