const emberAPIKey = "6f34f34b-d467-40e5-90f5-790f638d2d85";
const emberAPIUrl = "https://api.ember-energy.org/v1/carbon-intensity/yearly?entity_code=AFG,BRA,DEU,ZAF&start_date=2020&api_key=MY_API_KEY";


let Calculator = document.getElementById('calculator').innerHTML;


//select country
    function selectCountry() {
        const country = document.querySelector('#country').value;
        console.log(country);
        return country; // Return the selected country value
    }






// fetch carbon intensity
function fetchCarbonIntensity(energy1) {
  const apiKey = emberAPIKey;
  countryCode = document.querySelector("#country").value || countryCode;
  console.log(countryCode);

  const url = `https://api.ember-energy.org/v1/carbon-intensity/monthly?entity_code=${countryCode}&start_date=2025-08&api_key=${apiKey}`;
  return fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      //still dont understand how ts work
    let carbonIntensity = Array.isArray(data.data) && data.data.length > 0 ? data.data[0].emissions_intensity_gco2_per_kwh : NaN;      if (isNaN(carbonIntensity)) {
        console.log("Could not get carbon intensity from API response.");
        return "Invalid data";
      }
      return calculateFootprint(carbonIntensity, energy1);
    });
}



function output(){
  const energy1 = parseFloat(document.querySelector('#energy-kwh').value);
  fetchCarbonIntensity(energy1).then(footprint => {
    document.getElementById('calculator').innerHTML = `
      <h3>Your Carbon Footprint</h3>
      <p>Based on your energy consumption, your carbon footprint is:</p>
      <p><strong>${footprint} g CO2</strong></p>
      <button onclick="reset()" id="reset-btn" class="recalculate-btn">Recalculate</button>`;
  });
}
function reset() {
    document.getElementById('calculator').innerHTML = Calculator;
}

function calculateFootprint(carbonData,energy1) {
  
  const energy = energy1;
  if (isNaN(energy) || isNaN(carbonData)) {
    return "Invalid input";
  }
  let carbonEmission = energy * carbonData;
  console.log(carbonEmission);
  return carbonEmission.toFixed(2); // Return the carbon emission rounded to 2 decimal places
}



