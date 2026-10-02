const emberAPIKey = '6f34f34b-d467-40e5-90f5-790f638d2d85'
let emberAPIUrl = 'https://api.ember-energy.org/v1/power-sector-emissions/monthly?series=Fossil&start_date=2020-01&api_key=MY_API_KEY'

//  fetch the country code function
function fetchCountryCode(){
    let countryCode = document.querySelector('#country').value;
    return countryCode;
}

//fetch interval and start date
function fetchStartDate() {
    const interval = document.querySelector('#interval').value;
    const startDateDiv = document.getElementById('start-date');
    if (interval === 'monthly') {
        // Generate year options
        let yearOptions = '';
        for (let y = 2024; y >= 1990; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }
        // Generate month options
        const months = [
            '01','02','03','04','05','06','07','08','09','10','11','12'
        ];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        let monthOptions = months.map((m, i) => `<option value="${m}">${monthNames[i]}</option>`).join('');
        startDateDiv.innerHTML = `
            <label style="font-size:1rem;" class="selectDate">Select start date</label>
            <select style=" margin-top:5px;" id="start-year" class="form-control">
            <option style="font-size=15px;" value="" disabled selected>Year</option>
            ${yearOptions}
            </select>
            <select style= " margin-top:5px;"  id="start-month" class="form-control">
            <option style="font-size=15px;"  value="" disabled selected>Month</option>
            ${monthOptions}
            </select>
        `; 
    } else if (interval === 'yearly') {
        // Only show year dropdown
        let yearOptions = '';
        for (let y = 2024; y >= 1990; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }
        startDateDiv.innerHTML = `
            <label>Select start year</label>
            <select id="start-year" class="form-control">
            <option value="" disabled selected>Year</option>
            ${yearOptions}
            </select>
        `;
       
    }
}





// Function to fetch energy mix data
function fetchEnergyMixData() {
    // Presence check using localStorage
    const countryElem = document.querySelector('#country');
    const intervalElem = document.querySelector('#interval');
    const yearElem = document.querySelector('#start-year');
    const monthElem = document.querySelector('#start-month');

    // Check if all required fields are filled
    const isCountry = countryElem && countryElem.value;
    const isInterval = intervalElem && intervalElem.value;
    const isYear = yearElem && yearElem.value;
    // Month is only required if interval is monthly
    const isMonth = intervalElem && intervalElem.value === 'monthly' ? (monthElem && monthElem.value) : true;

    if (!isCountry || !isInterval || !isYear || !isMonth) {
        if (!localStorage.getItem('traceEmissionsPresenceChecked')) {
            alert('Please make sure all dropdowns are answered');
            localStorage.setItem('traceEmissionsPresenceChecked', 'true');
        }
        return;
    }

    const countryCode = fetchCountryCode();
    const apiKey = emberAPIKey;
    const interval = intervalElem.value;
    const startYear = yearElem.value;
    const startMonthElem = monthElem;
    const startMonth = startMonthElem ? startMonthElem.value : '';

    let startDate = '';
    // Format the start date 
    if (!startMonth & interval === 'yearly') {
        startDate = startYear; // Default to January if no month selected
        console.log('startDate', startDate);
    }else if (startMonth !== '') {
        startDate = `${startYear}-${startMonth}`; // Format as YYYY-MM
        console.log('startDate', startDate);
    }



    // You can pass multiple country codes separated by commas, e.g., 'VNM,USA'
    const url = `https://api.ember-energy.org/v1/power-sector-emissions/${interval}?entity_code=${countryCode}&start_date=${startDate}&include_all_dates_value_range=false&api_key=${apiKey}`;
    fetch(url, {
        method: 'GET',
        headers: {
            'accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log( data);
        let energyMixData = data.data;
       console.log(energyMixData);

        // Assuming energyMixData is your array from the API
        const dates = energyMixData.map(item => item.date);
        

        // Get unique dates in order
        const labels = [...new Set(dates)];

        // Helper to get data for a series
        function getSeriesData(seriesName) {
            const dataByDate = {};
            energyMixData.forEach(item => {
                if (item.series === seriesName) {
                    const date = item.date ;
                    dataByDate[date] = item.emissions_mtco2;
                }
            });
            return labels.map(date => dataByDate[date] || 0); 
        }

        const datasets = [
            {
                label: 'Coal',
                data: getSeriesData('Coal'),
                fill: true,
                backgroundColor: 'rgba(200,120,60,0.7)',
                borderColor: 'rgba(200,120,60,1)'
            },
            {
                label: 'Gas',
                data: getSeriesData('Gas'),
                fill: true,
                backgroundColor: 'rgba(53, 88, 112, 0.7)',
                borderColor: 'rgba(53, 88, 112, 1)'
            },
            {
                label: 'Oil',
                data: getSeriesData('Other fossil'),
                fill: true,
                backgroundColor: 'rgba(108,117,125,0.7)',
                borderColor: 'rgba(108,117,125,1)'
            },
            {
                label: 'Clean',
                data: getSeriesData('Clean'),
                fill: true,
                backgroundColor: 'rgba(40,167,69,0.7)',
                borderColor: 'rgba(40,167,69,1)'
            }
          
        ];

        // Draw the chart
        drawStackedAreaChart({labels, datasets, countryCode});
        // Shift banner letters up
        shiftBannerLettersUp();
        // Generate options for the dropdowns
        generateOptions();
     
    })
    .catch(error => {
        console.error('Error fetching energy mix data:', error);
    });
}


// Function to draw the stacked area chart
function drawStackedAreaChart({labels, datasets, countryCode}) {
const chartContainerId = 'energy-graph';
const energyMixElem = document.getElementById("EnergyMix");
// Remove any existing chart instance if present
if (window.energyChartInstance && typeof window.energyChartInstance.destroy === 'function') {
    window.energyChartInstance.destroy();
    window.energyChartInstance = null;
}

if (energyMixElem) {
    // Only access .outerHTML if the element exists
    const EnergyMix = energyMixElem.outerHTML;
    energyMixElem.outerHTML = '';
}

let graphContainer = document.getElementById(chartContainerId);
if (!graphContainer) {
    graphContainer = document.createElement('div');
    graphContainer.id = chartContainerId;
    const main = document.querySelector('main');
    if (main) {
        main.appendChild(graphContainer);
    } else {
        document.body.appendChild(graphContainer);
    }
}
graphContainer.innerHTML =
  `<h3>Carbon Emission by Source Over Time (${countryCode})</h3>
  <canvas id="energyChart"></canvas>`;

const ctx = document.getElementById('energyChart').getContext('2d');
window.energyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            plugins: {
                title: { display: false },
            },
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            stacked: true,
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Megatons of CO₂',
                        font: { size: 16 }
                    }
                },
                x: { stacked: true }
            }
        }
    });
}

//shift banner letters up
function shiftBannerLettersUp() {
    const CarbonIQ = document.getElementsByClassName('highlight');
    const co2KWH = document.getElementsByClassName('sub-title');
    for (let el of CarbonIQ) {
        el.className = 'highlight-shift-up';
    }
    for (let el of co2KWH) {
        el.className = 'sub-title-shift-up';
    }
    
}


//function to generate options menu during graph generation
function generateOptions() {
    // Generate year options
        let yearOptions = '';
        for (let y = 2024; y >= 1990; y--) {
            yearOptions += `<option value="${y}">${y}</option>`;
        }
        // Generate month options
        const months = [
            '01','02','03','04','05','06','07','08','09','10','11','12'
        ];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        let monthOptions = months.map((m, i) => `<option value="${m}">${monthNames[i]}</option>`).join('');
    

    const optionContainer = document.getElementById('optionContainer');
    if (optionContainer) {
        optionContainer.id = 'optionContainerNew';
    }

    document.getElementById('optionContainerNew').innerHTML = `
        <h3 style="width:fit-content; margin:auto; text-align:center; margin-bottom: 10px; ">Change Region</h3>
        <div id="smallerContainerOption">
            <div id="select-year" class="options">
                <select id="start-year" required>
                  <option value="" disabled selected>Select start year</option>
                  ${yearOptions}
                </select>
            </div>
            <div id="select-month" class="options">
                <select id="start-month" required>
                  <option value="" disabled selected>Select start month</option>
                    ${monthOptions}
                </select>
            </div>
            <div id="select-interval" class="options">
                <select id="interval" required>
                  <option value="" disabled selected>Select granularity</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
            </div>
            <div id="s-country" class="options">
                <select id="country" required>
                  <option value="" disabled selected>Select country</option>
                  <option value="AFG">Afghanistan</option>
                  <option value="ALB">Albania</option>
                  <option value="DZA">Algeria</option>
                  <option value="AND">Andorra</option>
                  <option value="AGO">Angola</option>
                  <option value="ATG">Antigua and Barbuda</option>
                  <option value="ARG">Argentina</option>
                  <option value="ARM">Armenia</option>
                  <option value="AUS">Australia</option>
                  <option value="AUT">Austria</option>
                  <option value="AZE">Azerbaijan</option>
                  <option value="BHS">Bahamas</option>
                  <option value="BHR">Bahrain</option>
                  <option value="BGD">Bangladesh</option>
                  <option value="BRB">Barbados</option>
                  <option value="BLR">Belarus</option>
                  <option value="BEL">Belgium</option>
                  <option value="BLZ">Belize</option>
                  <option value="BEN">Benin</option>
                  <option value="BTN">Bhutan</option>
                  <option value="BOL">Bolivia</option>
                  <option value="BIH">Bosnia and Herzegovina</option>
                  <option value="BWA">Botswana</option>
                  <option value="BRA">Brazil</option>
                  <option value="BRN">Brunei</option>
                  <option value="BGR">Bulgaria</option>
                  <option value="BFA">Burkina Faso</option>
                  <option value="BDI">Burundi</option>
                  <option value="KHM">Cambodia</option>
                  <option value="CMR">Cameroon</option>
                  <option value="CAN">Canada</option>
                  <option value="CPV">Cape Verde</option>
                  <option value="CAF">Central African Republic</option>
                  <option value="TCD">Chad</option>
                  <option value="CHL">Chile</option>
                  <option value="CHN">China</option>
                  <option value="COL">Colombia</option>
                  <option value="COM">Comoros</option>
                  <option value="COG">Congo</option>
                  <option value="COD">Congo (Democratic Republic)</option>
                  <option value="CRI">Costa Rica</option>
                  <option value="CIV">Côte d'Ivoire</option>
                  <option value="HRV">Croatia</option>
                  <option value="CUB">Cuba</option>
                  <option value="CYP">Cyprus</option>
                  <option value="CZE">Czechia</option>
                  <option value="DNK">Denmark</option>
                  <option value="DJI">Djibouti</option>
                  <option value="DMA">Dominica</option>
                  <option value="DOM">Dominican Republic</option>
                  <option value="ECU">Ecuador</option>
                  <option value="EGY">Egypt</option>
                  <option value="SLV">El Salvador</option>
                  <option value="GNQ">Equatorial Guinea</option>
                  <option value="ERI">Eritrea</option>
                  <option value="EST">Estonia</option>
                  <option value="SWZ">Eswatini</option>
                  <option value="ETH">Ethiopia</option>
                  <option value="FJI">Fiji</option>
                  <option value="FIN">Finland</option>
                  <option value="FRA">France</option>
                  <option value="GAB">Gabon</option>
                  <option value="GMB">Gambia</option>
                  <option value="GEO">Georgia</option>
                  <option value="DEU">Germany</option>
                  <option value="GHA">Ghana</option>
                  <option value="GRC">Greece</option>
                  <option value="GRD">Grenada</option>
                  <option value="GTM">Guatemala</option>
                  <option value="GIN">Guinea</option>
                  <option value="GNB">Guinea-Bissau</option>
                  <option value="GUY">Guyana</option>
                  <option value="HTI">Haiti</option>
                  <option value="HND">Honduras</option>
                  <option value="HUN">Hungary</option>
                  <option value="ISL">Iceland</option>
                  <option value="IND">India</option>
                  <option value="IDN">Indonesia</option>
                  <option value="IRN">Iran</option>
                  <option value="IRQ">Iraq</option>
                  <option value="IRL">Ireland</option>
                  <option value="ISR">Israel</option>
                  <option value="ITA">Italy</option>
                  <option value="JAM">Jamaica</option>
                  <option value="JPN">Japan</option>
                  <option value="JOR">Jordan</option>
                  <option value="KAZ">Kazakhstan</option>
                  <option value="KEN">Kenya</option>
                  <option value="KIR">Kiribati</option>
                  <option value="KWT">Kuwait</option>
                  <option value="KGZ">Kyrgyzstan</option>
                  <option value="LAO">Laos</option>
                  <option value="LVA">Latvia</option>
                  <option value="LBN">Lebanon</option>
                  <option value="LSO">Lesotho</option>
                  <option value="LBR">Liberia</option>
                  <option value="LBY">Libya</option>
                  <option value="LIE">Liechtenstein</option>
                  <option value="LTU">Lithuania</option>
                  <option value="LUX">Luxembourg</option>
                  <option value="MDG">Madagascar</option>
                  <option value="MWI">Malawi</option>
                  <option value="MYS">Malaysia</option>
                  <option value="MDV">Maldives</option>
                  <option value="MLI">Mali</option>
                  <option value="MLT">Malta</option>
                  <option value="MHL">Marshall Islands</option>
                  <option value="MRT">Mauritania</option>
                  <option value="MUS">Mauritius</option>
                  <option value="MEX">Mexico</option>
                  <option value="FSM">Micronesia</option>
                  <option value="MDA">Moldova</option>
                  <option value="MCO">Monaco</option>
                  <option value="MNG">Mongolia</option>
                  <option value="MNE">Montenegro</option>
                  <option value="MAR">Morocco</option>
                  <option value="MOZ">Mozambique</option>
                  <option value="MMR">Myanmar</option>
                  <option value="NAM">Namibia</option>
                  <option value="NRU">Nauru</option>
                  <option value="NPL">Nepal</option>
                  <option value="NLD">Netherlands</option>
                  <option value="NZL">New Zealand</option>
                  <option value="NIC">Nicaragua</option>
                  <option value="NER">Niger</option>
                  <option value="NGA">Nigeria</option>
                  <option value="MKD">North Macedonia</option>
                  <option value="NOR">Norway</option>
                  <option value="OMN">Oman</option>
                  <option value="PAK">Pakistan</option>
                  <option value="PLW">Palau</option>
                  <option value="PSE">Palestine</option>
                  <option value="PAN">Panama</option>
                  <option value="PNG">Papua New Guinea</option>
                  <option value="PRY">Paraguay</option>
                  <option value="PER">Peru</option>
                  <option value="PHL">Philippines</option>
                  <option value="POL">Poland</option>
                  <option value="PRT">Portugal</option>
                  <option value="QAT">Qatar</option>
                  <option value="ROU">Romania</option>
                  <option value="RUS">Russia</option>
                  <option value="RWA">Rwanda</option>
                  <option value="KNA">Saint Kitts and Nevis</option>
                  <option value="LCA">Saint Lucia</option>
                  <option value="VCT">Saint Vincent and the Grenadines</option>
                  <option value="WSM">Samoa</option>
                  <option value="SMR">San Marino</option>
                  <option value="STP">Sao Tome and Principe</option>
                  <option value="SAU">Saudi Arabia</option>
                  <option value="SEN">Senegal</option>
                  <option value="SRB">Serbia</option>
                  <option value="SYC">Seychelles</option>
                  <option value="SLE">Sierra Leone</option>
                  <option value="SGP">Singapore</option>
                  <option value="SVK">Slovakia</option>
                  <option value="SVN">Slovenia</option>
                  <option value="SLB">Solomon Islands</option>
                  <option value="SOM">Somalia</option>
                  <option value="ZAF">South Africa</option>
                  <option value="KOR">South Korea</option>
                  <option value="SSD">South Sudan</option>
                  <option value="ESP">Spain</option>
                  <option value="LKA">Sri Lanka</option>
                  <option value="SDN">Sudan</option>
                  <option value="SUR">Suriname</option>
                  <option value="SWE">Sweden</option>
                  <option value="CHE">Switzerland</option>
                  <option value="SYR">Syria</option>
                  <option value="TWN">Taiwan</option>
                  <option value="TJK">Tajikistan</option>
                  <option value="TZA">Tanzania</option>
                  <option value="THA">Thailand</option>
                  <option value="TLS">Timor-Leste</option>
                  <option value="TGO">Togo</option>
                  <option value="TON">Tonga</option>
                  <option value="TTO">Trinidad and Tobago</option>
                  <option value="TUN">Tunisia</option>
                  <option value="TUR">Turkey</option>
                  <option value="TKM">Turkmenistan</option>
                  <option value="TUV">Tuvalu</option>
                  <option value="UGA">Uganda</option>
                  <option value="UKR">Ukraine</option>
                  <option value="ARE">United Arab Emirates</option>
                  <option value="GBR">United Kingdom</option>
                  <option value="USA">United States</option>
                  <option value="URY">Uruguay</option>
                  <option value="UZB">Uzbekistan</option>
                  <option value="VUT">Vanuatu</option>
                  <option value="VEN">Venezuela</option>
                  <option value="VNM">Vietnam</option>
                  <option value="YEM">Yemen</option>
                  <option value="ZMB">Zambia</option>
                  <option value="ZWE">Zimbabwe</option>
                </select>
                <button onclick="fetchEnergyMixData()" id="explore-btn">
                  Graph
                </button>
            </div>
        </div>
    `
}


